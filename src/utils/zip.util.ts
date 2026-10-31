/**
 * Minimal ZIP writer (STORE method, no compression) with UTF-8 file names.
 * Media files are already compressed, so storing them keeps this fast and
 * dependency-free. Limits: < 4 GB total and < 65535 entries (no ZIP64).
 */

export interface IZipEntry {
  /** Path inside the archive, forward slashes */
  name: string
  data: Uint8Array
  mtime?: Date
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

export const crc32 = (bytes: Uint8Array) => {
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

const MAX_ZIP_BYTES = 0xffffffff
const MAX_ZIP_ENTRIES = 0xffff

/** MS-DOS date/time fields used by the ZIP format */
const dosDateTime = (date: Date) => {
  const year = Math.max(1980, date.getFullYear())
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1)
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  return { dosTime, dosDate }
}

const u16 = (view: DataView, offset: number, value: number) => view.setUint16(offset, value, true)
const u32 = (view: DataView, offset: number, value: number) => view.setUint32(offset, value >>> 0, true)

/** Build a ZIP archive from in-memory entries. */
export const createZipBlob = (entries: IZipEntry[]): Blob => {
  if (entries.length > MAX_ZIP_ENTRIES) {
    throw new Error(`ZIP supports at most ${MAX_ZIP_ENTRIES} files`)
  }
  const encoder = new TextEncoder()
  const parts: BlobPart[] = []
  const central: Uint8Array[] = []
  let offset = 0

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name.replace(/\\/g, "/").replace(/^\/+/, ""))
    const crc = crc32(entry.data)
    const size = entry.data.length
    const { dosTime, dosDate } = dosDateTime(entry.mtime ?? new Date())

    // Local file header
    const local = new Uint8Array(30 + nameBytes.length)
    const lv = new DataView(local.buffer)
    u32(lv, 0, 0x04034b50)
    u16(lv, 4, 20) // version needed
    u16(lv, 6, 0x0800) // flags: UTF-8 names
    u16(lv, 8, 0) // STORE
    u16(lv, 10, dosTime)
    u16(lv, 12, dosDate)
    u32(lv, 14, crc)
    u32(lv, 18, size)
    u32(lv, 22, size)
    u16(lv, 26, nameBytes.length)
    u16(lv, 28, 0)
    local.set(nameBytes, 30)

    // Central directory header
    const cd = new Uint8Array(46 + nameBytes.length)
    const cv = new DataView(cd.buffer)
    u32(cv, 0, 0x02014b50)
    u16(cv, 4, 20) // version made by
    u16(cv, 6, 20) // version needed
    u16(cv, 8, 0x0800)
    u16(cv, 10, 0)
    u16(cv, 12, dosTime)
    u16(cv, 14, dosDate)
    u32(cv, 16, crc)
    u32(cv, 20, size)
    u32(cv, 24, size)
    u16(cv, 28, nameBytes.length)
    u16(cv, 30, 0) // extra
    u16(cv, 32, 0) // comment
    u16(cv, 34, 0) // disk
    u16(cv, 36, 0) // internal attrs
    u32(cv, 38, 0) // external attrs
    u32(cv, 42, offset)
    cd.set(nameBytes, 46)
    central.push(cd)

    // Cast: newer TS types Uint8Array<ArrayBufferLike>, which is not assignable to BlobPart
    parts.push(local as BlobPart, entry.data as BlobPart)
    offset += local.length + size
    if (offset > MAX_ZIP_BYTES) {
      throw new Error("ZIP would exceed 4 GB")
    }
  }

  const centralSize = central.reduce((sum, c) => sum + c.length, 0)
  const eocd = new Uint8Array(22)
  const ev = new DataView(eocd.buffer)
  u32(ev, 0, 0x06054b50)
  u16(ev, 4, 0)
  u16(ev, 6, 0)
  u16(ev, 8, entries.length)
  u16(ev, 10, entries.length)
  u32(ev, 12, centralSize)
  u32(ev, 16, offset)
  u16(ev, 20, 0)

  return new Blob([...parts, ...(central as BlobPart[]), eocd as BlobPart], { type: "application/zip" })
}
