import { GITHUB_RELEASES_URL } from "src/constants/api.constants"

/** Shape of `version.json` at the repository root (fetched from the default branch) */
export interface IVersionManifest {
  /** Newest released version, e.g. "1.2.0" (a leading "v" is tolerated) */
  latest: string
  /** Builds older than this are blocked until the user updates */
  min_supported?: string
  /** Where the "Update" buttons point; defaults to the releases page */
  download_url?: string
  /** Short human-readable summary shown next to the update prompt */
  notes?: string
}

export interface IVersionCheckResult {
  /** Version of the running build (manifest.json) */
  currentVersion: string
  latestVersion: string
  minSupportedVersion: string | null
  downloadUrl: string
  notes: string
  /** A newer build exists */
  isUpdateAvailable: boolean
  /** The running build is below `min_supported`: the UI must be blocked */
  isUpdateRequired: boolean
  checkedAt: number
}

/** "v1.2.3-beta.1" -> [1, 2, 3]; null when the string has no numeric core */
export const parseVersion = (value: unknown): number[] | null => {
  if (typeof value !== "string") return null
  const core = value.trim().replace(/^v/i, "").split(/[-+]/)[0]
  if (!/^\d+(\.\d+)*$/.test(core)) return null
  return core.split(".").map((part) => Number.parseInt(part, 10))
}

export const normalizeVersion = (value: unknown): string | null => {
  const parts = parseVersion(value)
  return parts ? parts.join(".") : null
}

/** Semver-style numeric comparison; missing segments count as 0. Unparseable input compares as equal. */
export const compareVersions = (a: unknown, b: unknown): -1 | 0 | 1 => {
  const pa = parseVersion(a)
  const pb = parseVersion(b)
  if (!pa || !pb) return 0
  const length = Math.max(pa.length, pb.length)
  for (let i = 0; i < length; i++) {
    const x = pa[i] ?? 0
    const y = pb[i] ?? 0
    if (x > y) return 1
    if (x < y) return -1
  }
  return 0
}

export const evaluateVersion = (
  currentVersion: string,
  manifest: IVersionManifest
): IVersionCheckResult => {
  const latestVersion = normalizeVersion(manifest.latest) ?? currentVersion
  const minSupportedVersion = normalizeVersion(manifest.min_supported)
  const downloadUrl =
    typeof manifest.download_url === "string" && /^https:\/\//i.test(manifest.download_url)
      ? manifest.download_url
      : GITHUB_RELEASES_URL
  return {
    currentVersion,
    latestVersion,
    minSupportedVersion,
    downloadUrl,
    notes: typeof manifest.notes === "string" ? manifest.notes.trim() : "",
    isUpdateAvailable: compareVersions(currentVersion, latestVersion) < 0,
    isUpdateRequired:
      minSupportedVersion !== null && compareVersions(currentVersion, minSupportedVersion) < 0,
    checkedAt: Date.now()
  }
}
