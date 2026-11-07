export interface DelayConfig {
  minDelay: number
  maxDelay: number
  sleepAfter: number
  minSleep: number
  maxSleep: number
  totalActions: number
  maxFailures: number
}

export const DEFAULT_DELAY_CONFIG: DelayConfig = {
  minDelay: 5,
  maxDelay: 10,
  sleepAfter: 10,
  minSleep: 30,
  maxSleep: 60,
  totalActions: 100,
  maxFailures: 3
}

export function getDelayConfig(
  storageKey = "bm_fb_delay_config",
  defaults: Partial<DelayConfig> = {}
): DelayConfig {
  const base = { ...DEFAULT_DELAY_CONFIG, ...defaults }
  try {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        minDelay: Number(parsed.minDelay ?? base.minDelay),
        maxDelay: Number(parsed.maxDelay ?? base.maxDelay),
        sleepAfter: Number(parsed.sleepAfter ?? base.sleepAfter),
        minSleep: Number(parsed.minSleep ?? base.minSleep),
        maxSleep: Number(parsed.maxSleep ?? base.maxSleep),
        totalActions: Number(parsed.totalActions ?? base.totalActions),
        maxFailures: Number(parsed.maxFailures ?? base.maxFailures)
      }
    }
  } catch (e) {
    console.error("Error reading delay config", e)
  }
  return base
}

export function saveDelayConfig(
  config: Partial<DelayConfig>,
  storageKey = "bm_fb_delay_config"
): void {
  try {
    const current = getDelayConfig(storageKey)
    const updated = { ...current, ...config }
    localStorage.setItem(storageKey, JSON.stringify(updated))
    window.dispatchEvent(
      new CustomEvent("fb_delay_config_changed", {
        detail: { storageKey, config: updated }
      })
    )
  } catch (e) {
    console.error("Error saving delay config", e)
  }
}
