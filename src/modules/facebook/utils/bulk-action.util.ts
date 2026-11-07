import { toast } from "sonner"

import type { BulkState } from "src/modules/facebook/types/bulk.types"
import { getDelayConfig } from "src/modules/facebook/utils/delay-config.util"

export type { BulkState }

export interface BulkActionOptions<T, A extends string = string> {
  targets: T[]
  actionType: A
  bulkStopRef: React.MutableRefObject<boolean> | { current: boolean }
  setBulkRunning: (state: BulkState<A> | null) => void
  executeSingle: (item: T) => Promise<boolean>
  onSuccessItem?: (item: T) => void
  onFailureItem?: (item: T) => void
  onFinished?: (successCount: number, failCount: number) => void
}

export async function runFacebookBulkAction<T, A extends string = string>({
  targets,
  actionType,
  bulkStopRef,
  setBulkRunning,
  executeSingle,
  onSuccessItem,
  onFailureItem,
  onFinished
}: BulkActionOptions<T, A>): Promise<void> {
  const delayConfig = getDelayConfig()

  // Slice targets based on Total Actions configuration
  const limitTargets = targets.slice(0, delayConfig.totalActions)

  if (limitTargets.length === 0) {
    toast.error("No targets selected or the list is empty.")
    return
  }

  bulkStopRef.current = false

  let success = 0
  let fail = 0

  setBulkRunning({
    type: actionType,
    total: limitTargets.length,
    current: 0,
    success: 0,
    fail: 0
  })

  for (let i = 0; i < limitTargets.length; i++) {
    if (bulkStopRef.current) break

    const item = limitTargets[i]

    setBulkRunning({
      type: actionType,
      total: limitTargets.length,
      current: i + 1,
      success,
      fail
    })

    let ok = false
    try {
      ok = await executeSingle(item)
    } catch (e) {
      console.error("Error while performing the action:", e)
    }

    if (ok) {
      success++
      if (onSuccessItem) onSuccessItem(item)
    } else {
      fail++
      if (onFailureItem) onFailureItem(item)
    }

    setBulkRunning({
      type: actionType,
      total: limitTargets.length,
      current: i + 1,
      success,
      fail
    })

    // Check if Max Failures limit reached
    if (fail >= delayConfig.maxFailures) {
      toast.error(
        `⚠️ The process stopped automatically after reaching the maximum failure limit (${delayConfig.maxFailures} failures).`
      )
      break
    }

    // Delay logic for next items
    if (i < limitTargets.length - 1 && !bulkStopRef.current) {
      const isSleepTime = (i + 1) % delayConfig.sleepAfter === 0
      const waitTime = isSleepTime
        ? Math.floor(
            Math.random() * (delayConfig.maxSleep - delayConfig.minSleep + 1)
          ) + delayConfig.minSleep
        : Math.floor(
            Math.random() * (delayConfig.maxDelay - delayConfig.minDelay + 1)
          ) + delayConfig.minDelay

      const toastId = toast.loading(
        isSleepTime
          ? `🛡️ Resting to avoid checkpoint. Waiting ${waitTime}s...`
          : `⏳ Applying safe delay. Waiting ${waitTime}s...`
      )

      for (let remaining = waitTime; remaining > 0; remaining--) {
        if (bulkStopRef.current) break
        await new Promise((r) => setTimeout(r, 1000))

        // Update countdown message
        toast.loading(
          isSleepTime
            ? `🛡️ Resting to avoid checkpoint. Waiting ${remaining}s...`
            : `⏳ Applying safe delay. Waiting ${remaining}s...`,
          { id: toastId }
        )
      }
      toast.dismiss(toastId)
    }
  }

  setBulkRunning(null)
  if (onFinished) {
    onFinished(success, fail)
  }
}
