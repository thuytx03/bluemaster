/**
 * localStorage helpers with a TTL (ported from xthuy-social `helpers/handleStorage`).
 * The sidebar runs as a content script on facebook.com, so keys are prefixed
 * to stay clear of Facebook's own localStorage entries.
 */
const PREFIX = "bm_"

interface StorageItemWithExpiry<T> {
  value: T
  created_at: number
  expiry: number
}

export function saveToLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch (error) {
    console.error("Error saving to localStorage:", error)
  }
}

export function getFromLocalStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function removeFromLocalStorage(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    /* ignore */
  }
}

export function saveToLocalStorageWithExpiry<T>(key: string, value: T, ttlMs: number): void {
  const now = Date.now()
  saveToLocalStorage<StorageItemWithExpiry<T>>(key, { value, created_at: now, expiry: now + ttlMs })
}

export function getFromLocalStorageWithExpiry<T>(key: string): T | null {
  const item = getFromLocalStorage<StorageItemWithExpiry<T>>(key)
  if (!item) return null
  if (Date.now() > item.expiry) {
    removeFromLocalStorage(key)
    return null
  }
  return item.value
}
