/**
 * Bulk-messaging campaign runner. Runs inside the MV3 service worker.
 *
 * The campaign record lives in chrome.storage.local, so it survives the worker
 * being stopped, a page reload or the panel being closed. Short pauses between
 * messages use setTimeout (with a keep-alive ping); anything of 30 s or more,
 * including the scheduled start, goes through chrome.alarms, which wakes the
 * worker again. The UI never runs the loop: it sends commands and mirrors the
 * stored record.
 */
import { EStorageKey } from "src/constants/enum"
import { ensureInboxConfig, getInboxRequestConfig } from "src/modules/inbox/services/inbox-background.service"
import { sendOneMessage } from "src/modules/inbox/services/message-sender.service"
import { IFbRequestConfig, IInboxCampaignJob, TSendStatus } from "src/modules/inbox/types/inbox.types"
import { isCampaignDone, randomInRange, storedAttachmentToFile } from "src/modules/inbox/utils/campaign.util"

const JOB_KEY = EStorageKey.INBOX_CAMPAIGN
const ALARM_NAME = "bm-inbox-campaign"
/** Waits at least this long are handed to chrome.alarms (its minimum granularity) */
const ALARM_MIN_WAIT_MS = 30_000
const KEEP_ALIVE_INTERVAL_MS = 20_000
const MAX_LOGS = 200

let loopActive = false
let keepAliveTimer: ReturnType<typeof setInterval> | null = null

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

// ==================== STORAGE ====================

export async function getCampaign(): Promise<IInboxCampaignJob | null> {
  const result = await chrome.storage.local.get(JOB_KEY)
  return (result[JOB_KEY] as IInboxCampaignJob | undefined) ?? null
}

const saveCampaign = (job: IInboxCampaignJob) => chrome.storage.local.set({ [JOB_KEY]: job })

async function patchCampaign(patch: Partial<IInboxCampaignJob>): Promise<IInboxCampaignJob | null> {
  const job = await getCampaign()
  if (!job) return null
  const next = { ...job, ...patch }
  await saveCampaign(next)
  return next
}

const finishWith = (status: TSendStatus, error?: string) =>
  patchCampaign({ status, currentCustomer: null, restUntil: 0, finishedAt: Date.now(), ...(error ? { error } : {}) })

// ==================== KEEP-ALIVE ====================

function startKeepAlive() {
  if (keepAliveTimer) return
  // Any extension API call resets the worker's idle timer
  keepAliveTimer = setInterval(() => chrome.runtime.getPlatformInfo(() => {}), KEEP_ALIVE_INTERVAL_MS)
}

function stopKeepAlive() {
  if (keepAliveTimer) clearInterval(keepAliveTimer)
  keepAliveTimer = null
}

// ==================== COMMANDS ====================

export async function startCampaign(job: IInboxCampaignJob): Promise<{ success: boolean; error?: string }> {
  const existing = await getCampaign()
  if (existing && !isCampaignDone(existing.status)) {
    return { success: false, error: "Đang có một chiến dịch khác chạy. Hãy dừng nó trước." }
  }
  await chrome.alarms.clear(ALARM_NAME)
  const now = Date.now()
  if (job.scheduledEndAt && job.scheduledEndAt <= now) return { success: false, error: "Giờ kết thúc đã qua" }

  if (job.scheduledStartAt && job.scheduledStartAt > now) {
    await saveCampaign({ ...job, status: "scheduled" })
    await chrome.alarms.create(ALARM_NAME, { when: job.scheduledStartAt })
    return { success: true }
  }
  await saveCampaign({ ...job, status: "running", startedAt: now })
  void runLoop()
  return { success: true }
}

export async function pauseCampaign() {
  const job = await getCampaign()
  if (!job || (job.status !== "running" && job.status !== "resting")) return
  await chrome.alarms.clear(ALARM_NAME)
  await patchCampaign({ status: "paused", restUntil: 0 })
}

export async function resumeCampaign() {
  const job = await getCampaign()
  if (job?.status !== "paused") return
  await patchCampaign({ status: "running" })
  void runLoop()
}

/** Skip the scheduled wait and send now */
export async function sendCampaignNow() {
  const job = await getCampaign()
  if (job?.status !== "scheduled") return
  await chrome.alarms.clear(ALARM_NAME)
  await patchCampaign({ status: "running", startedAt: Date.now() })
  void runLoop()
}

export async function stopCampaign() {
  await chrome.alarms.clear(ALARM_NAME)
  const job = await getCampaign()
  if (job && !isCampaignDone(job.status)) await finishWith("stopped")
}

export async function clearCampaign() {
  await chrome.alarms.clear(ALARM_NAME)
  await chrome.storage.local.remove(JOB_KEY)
}

// ==================== WAKE-UPS ====================

/** Called when the worker starts: pick up whatever was in flight */
export async function resumeCampaignAfterRestart() {
  const job = await getCampaign()
  if (!job) return
  const now = Date.now()

  if (job.status === "scheduled") {
    if (!job.scheduledStartAt || job.scheduledStartAt <= now) {
      await patchCampaign({ status: "running", startedAt: now })
      void runLoop()
    } else if (!(await chrome.alarms.get(ALARM_NAME))) {
      await chrome.alarms.create(ALARM_NAME, { when: job.scheduledStartAt })
    }
    return
  }

  if (job.status === "running" || job.status === "resting") {
    if (job.restUntil > now + 1000) {
      if (!(await chrome.alarms.get(ALARM_NAME))) await chrome.alarms.create(ALARM_NAME, { when: job.restUntil })
    } else {
      await patchCampaign({ status: "running", restUntil: 0 })
      void runLoop()
    }
  }
}

export async function handleCampaignAlarm(alarm: chrome.alarms.Alarm) {
  if (alarm.name !== ALARM_NAME) return
  const job = await getCampaign()
  if (!job) return
  if (job.status === "scheduled" || job.status === "resting" || job.status === "running") {
    await patchCampaign({ status: "running", restUntil: 0, startedAt: job.startedAt ?? Date.now() })
    void runLoop()
  }
}

// ==================== THE LOOP ====================

async function refreshConfig(): Promise<IFbRequestConfig | null> {
  const ok = await ensureInboxConfig(true)
  return ok ? (getInboxRequestConfig() as IFbRequestConfig) : null
}

async function runLoop() {
  if (loopActive) return
  loopActive = true
  startKeepAlive()

  try {
    for (;;) {
      let job = await getCampaign()
      if (!job || job.status !== "running") return

      const now = Date.now()
      if (job.scheduledEndAt && now >= job.scheduledEndAt) {
        await finishWith("expired")
        return
      }
      const total = job.customers.length
      if (job.currentIndex >= total) {
        await finishWith("finished")
        return
      }

      const customer = job.customers[job.currentIndex]
      await patchCampaign({ currentCustomer: customer })

      if (!(await ensureInboxConfig())) {
        await finishWith("stopped", "Không lấy được cấu hình Facebook. Hãy đăng nhập lại facebook.com rồi chạy lại.")
        return
      }

      const result = await sendOneMessage({
        customer,
        pageId: job.pageId,
        category: job.category,
        messageTemplate: job.messageTemplate,
        imageUrl: job.imageUrl,
        attachmentFiles: job.attachment ? [storedAttachmentToFile(job.attachment)] : undefined,
        attachmentType: job.attachmentType || undefined,
        attachmentPosition: job.attachmentPosition,
        config: getInboxRequestConfig() as IFbRequestConfig,
        refreshConfig
      })

      // Re-read: the user may have paused or stopped while the message was in flight
      job = await getCampaign()
      if (!job) return
      const index = job.currentIndex + 1
      const counts = {
        successCount: job.successCount + (result.result === "success" ? 1 : 0),
        failureCount: job.failureCount + (result.result === "failure" ? 1 : 0),
        skippedCount: job.skippedCount + (result.result === "skipped" ? 1 : 0)
      }
      const logs = [...job.logs, result.log].slice(-MAX_LOGS)

      if (job.status !== "running") {
        await patchCampaign({ currentIndex: index, ...counts, logs, currentCustomer: null })
        return
      }
      if (index >= total) {
        await patchCampaign({ currentIndex: index, ...counts, logs })
        await finishWith("finished")
        return
      }

      const { restAfterMessages, restDuration, timeFrom, timeTo } = job.sendConfig
      const needRest = restAfterMessages > 0 && index % restAfterMessages === 0
      const waitMs = needRest ? restDuration * 1000 : randomInRange(timeFrom, timeTo) * 1000
      const restUntil = Date.now() + waitMs
      await patchCampaign({
        currentIndex: index,
        ...counts,
        logs,
        currentCustomer: null,
        status: needRest ? "resting" : "running",
        restUntil
      })

      if (waitMs >= ALARM_MIN_WAIT_MS) {
        // Let the worker sleep; the alarm brings us back
        await chrome.alarms.create(ALARM_NAME, { when: restUntil })
        return
      }
      await sleep(waitMs)

      job = await getCampaign()
      if (!job || (job.status !== "running" && job.status !== "resting")) return
      if (job.status === "resting") await patchCampaign({ status: "running", restUntil: 0 })
    }
  } catch (e: any) {
    await finishWith("stopped", e?.message ?? String(e))
  } finally {
    loopActive = false
    stopKeepAlive()
  }
}
