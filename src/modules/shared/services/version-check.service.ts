/**
 * Update check. The background service worker owns the network call and the
 * cache; UI surfaces (content-script panel, options page) ask it via
 * `requestVersionCheck` so there is a single code path and no CORS concerns.
 */
import {
  GITHUB_LATEST_RELEASE_API,
  GITHUB_RELEASES_URL,
  VERSION_MANIFEST_URL
} from "src/constants/api.constants"
import { ERemoteMessageType, EStorageKey } from "src/constants/enum"
import { EXTENSION_INFO } from "src/constants"
import { chromeUtils } from "src/utils/chrome.util"
import {
  evaluateVersion,
  IVersionCheckResult,
  IVersionManifest,
  normalizeVersion
} from "src/utils/version.util"

export const VERSION_CHECK_ALARM = "bluemaster:version-check"
/** Background re-checks this often while the browser is running */
const VERSION_CHECK_PERIOD_MINUTES = 6 * 60
/** A cached result younger than this is reused when the panel opens */
const VERSION_CHECK_TTL_MS = 60 * 60 * 1000
const UPDATE_NOTIFICATION_ID = "bluemaster:update-available"

const fetchJson = async <T>(url: string): Promise<T | null> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)
  try {
    const res = await fetch(url, { cache: "no-store", signal: controller.signal })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** `version.json` on the default branch; falls back to the latest GitHub release tag */
const fetchVersionManifest = async (): Promise<IVersionManifest | null> => {
  const manifest = await fetchJson<IVersionManifest>(VERSION_MANIFEST_URL)
  if (manifest && normalizeVersion(manifest.latest)) return manifest

  const release = await fetchJson<{ tag_name?: string }>(GITHUB_LATEST_RELEASE_API)
  const latest = normalizeVersion(release?.tag_name)
  return latest ? { latest, download_url: GITHUB_RELEASES_URL } : null
}

export const getCachedVersionCheck = () =>
  chromeUtils.getStorage<IVersionCheckResult>(EStorageKey.VERSION_CHECK)

const extensionIconUrl = () => {
  const icons = chrome.runtime.getManifest().icons ?? {}
  const path = icons["128"] ?? icons["64"] ?? icons["48"] ?? Object.values(icons)[0]
  return path ? chrome.runtime.getURL(path) : undefined
}

/** One system notification per newer version; a required update is worded more firmly */
const notifyIfNeeded = async (result: IVersionCheckResult) => {
  if (!result.isUpdateAvailable || !chrome.notifications) return
  const notified = await chromeUtils.getStorage<string>(
    EStorageKey.NOTIFY_LATEST_EXTENSION_VERSION
  )
  if (notified === result.latestVersion) return
  await chromeUtils.setStorage(EStorageKey.NOTIFY_LATEST_EXTENSION_VERSION, result.latestVersion)

  const name = EXTENSION_INFO.displayName
  // Chrome requires a bundled icon for basic notifications (remote URLs fail in MV3)
  const iconUrl = extensionIconUrl()
  if (!iconUrl) return
  chrome.notifications.create(UPDATE_NOTIFICATION_ID, {
    type: "basic",
    iconUrl,
    title: result.isUpdateRequired
      ? `${name}: bắt buộc cập nhật lên v${result.latestVersion}`
      : `${name} đã có phiên bản v${result.latestVersion}`,
    message: result.isUpdateRequired
      ? "Phiên bản bạn đang dùng không còn được hỗ trợ. Bấm để tải bản mới."
      : result.notes || "Bấm để tải bản mới nhất.",
    priority: result.isUpdateRequired ? 2 : 0,
    requireInteraction: result.isUpdateRequired
  })
}

/**
 * Background only. Returns the cached result when it is fresh and belongs to the
 * running build; otherwise fetches, stores and (once per version) notifies.
 * Keeps the previous result when offline.
 */
export const runVersionCheck = async (
  options: { force?: boolean } = {}
): Promise<IVersionCheckResult | null> => {
  const currentVersion = chrome.runtime.getManifest().version
  const cached = await getCachedVersionCheck()
  const isFresh =
    cached &&
    cached.currentVersion === currentVersion &&
    Date.now() - cached.checkedAt < VERSION_CHECK_TTL_MS
  if (!options.force && isFresh) return cached

  const manifest = await fetchVersionManifest()
  if (!manifest) return cached ?? null
  const result = evaluateVersion(currentVersion, manifest)
  await chromeUtils.setStorage(EStorageKey.VERSION_CHECK, result)
  await notifyIfNeeded(result)
  return result
}

export const isUpdateNotification = (notificationId: string) =>
  notificationId === UPDATE_NOTIFICATION_ID

export const openDownloadPage = async () => {
  const cached = await getCachedVersionCheck()
  await chrome.tabs.create({ url: cached?.downloadUrl || GITHUB_RELEASES_URL })
}

/** Idempotent: keeps the existing alarm so the schedule is not reset on every worker start */
export const scheduleVersionCheckAlarm = async () => {
  if (!chrome.alarms) return
  const existing = await chrome.alarms.get(VERSION_CHECK_ALARM)
  if (existing) return
  await chrome.alarms.create(VERSION_CHECK_ALARM, {
    delayInMinutes: 1,
    periodInMinutes: VERSION_CHECK_PERIOD_MINUTES
  })
}

/** Any UI context: ask the background for the (cached or fresh) result */
export const requestVersionCheck = (options: { force?: boolean } = {}) =>
  new Promise<IVersionCheckResult | null>((resolve) => {
    try {
      chrome.runtime.sendMessage(
        { type: ERemoteMessageType.VERSION_CHECK, force: !!options.force },
        (response) => {
          if (chrome.runtime.lastError) {
            resolve(null)
            return
          }
          resolve((response as IVersionCheckResult | null) ?? null)
        }
      )
    } catch {
      resolve(null)
    }
  })
