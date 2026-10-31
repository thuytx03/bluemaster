import dayjs from "dayjs"

import { TDateRange } from "src/modules/download/types/download.types"

const toUnixDay = (timestamp: number) =>
  timestamp > 1e12 ? dayjs(timestamp) : dayjs.unix(timestamp)

export const isValidDateRange = (range: TDateRange | null | undefined): range is TDateRange =>
  !!range && range.length === 2 && !!range[0] && !!range[1]

/** "2026-01-01" and "2026-01-31" → "01/01/2026 ➡️ 31/01/2026" */
export const formatRangeDateForUIRender = (range: TDateRange | null | undefined) => {
  if (!isValidDateRange(range)) return null
  const [from, to] = range
  return `${dayjs(from).format("DD/MM/YYYY")} ➡️ ${dayjs(to).format("DD/MM/YYYY")}`
}

export const isItemBetweenRangeDate = (
  timestamp: number | undefined,
  range: TDateRange
) => {
  if (!timestamp) return true
  const [from, to] = range
  const item = toUnixDay(timestamp)
  const start = dayjs(from).startOf("day")
  const end = dayjs(to).endOf("day")
  return !item.isBefore(start) && !item.isAfter(end)
}

/** Feeds are newest-first, so once an item is older than `from` we can stop paging */
export const isItemDateBeforeStartOfRangeDate = (
  timestamp: number | undefined,
  range: TDateRange
) => {
  if (!timestamp) return false
  const [from] = range
  return toUnixDay(timestamp).isBefore(dayjs(from).startOf("day"))
}
