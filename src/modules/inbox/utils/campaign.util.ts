import {
  ICustomer,
  IInboxCampaignJob,
  ISendConfig,
  ISendProgress,
  IStoredAttachment
} from "src/modules/inbox/types/inbox.types"

/** Statuses in which the service worker still owns the campaign */
export const ACTIVE_CAMPAIGN_STATUSES = new Set(["scheduled", "running", "paused", "resting"])

export const isCampaignDone = (status: string) =>
  status === "finished" || status === "stopped" || status === "expired"

export function randomInRange(min: number, max: number): number {
  if (min > max) return min
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Apply the sending order and the message limit from the config */
export function orderCustomers(customers: ICustomer[], config: ISendConfig): ICustomer[] {
  let list = [...customers]
  if (config.sendingOrder === "3") list = shuffle(list)
  else if (config.sendingOrder === "2") list.reverse()
  return config.limitMessage > 0 ? list.slice(0, config.limitMessage) : list
}

/** "DD/MM/YYYY" + "HH" + "mm" in local time -> unix ms, null when incomplete */
export function scheduleToTimestamp(day: string | null, hour: string | null, minute: string | null): number | null {
  if (!day) return null
  const [d, m, y] = day.split("/").map((v) => parseInt(v, 10))
  if (!d || !m || !y) return null
  const ts = new Date(y, m - 1, d, parseInt(hour ?? "0", 10) || 0, parseInt(minute ?? "0", 10) || 0).getTime()
  return Number.isFinite(ts) ? ts : null
}

export interface IResolvedSchedule {
  startAt: number | null
  endAt: number | null
  error: string | null
}

/** Turn the schedule fields into timestamps and validate them */
export function resolveSchedule(config: ISendConfig, now = Date.now()): IResolvedSchedule {
  if (!config.scheduleEnabled) return { startAt: null, endAt: null, error: null }
  const startAt = scheduleToTimestamp(config.scheduleStartDay, config.scheduleStartHour, config.scheduleStartMinute)
  const endAt = scheduleToTimestamp(config.scheduleEndDay, config.scheduleEndHour, config.scheduleEndMinute)
  if (!startAt && !endAt) return { startAt, endAt, error: "Hẹn giờ đang bật nhưng chưa chọn thời gian bắt đầu" }
  if (endAt && endAt <= now) return { startAt, endAt, error: "Giờ kết thúc đã qua" }
  if (startAt && endAt && endAt <= startAt) return { startAt, endAt, error: "Giờ kết thúc phải sau giờ bắt đầu" }
  return { startAt, endAt, error: null }
}

export function fileToStoredAttachment(file: File): Promise<IStoredAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ name: file.name, type: file.type, dataUrl: String(reader.result) })
    reader.onerror = () => reject(reader.error ?? new Error("Không đọc được file đính kèm"))
    reader.readAsDataURL(file)
  })
}

export function storedAttachmentToFile(att: IStoredAttachment): File {
  const [header, data] = att.dataUrl.split(",")
  const mime = att.type || header.match(/:(.*?);/)?.[1] || "application/octet-stream"
  const bytes = Uint8Array.from(atob(data ?? ""), (c) => c.charCodeAt(0))
  return new File([bytes], att.name, { type: mime })
}

/** The slice of a job the step-6 UI renders */
export function jobToProgress(job: IInboxCampaignJob): ISendProgress {
  const total = job.customers.length
  return {
    status: job.status,
    currentIndex: job.currentIndex,
    total,
    successCount: job.successCount,
    failureCount: job.failureCount,
    skippedCount: job.skippedCount,
    percent: total > 0 ? Math.round((job.currentIndex / total) * 100) : 0,
    currentCustomer: job.currentCustomer,
    restUntil: job.restUntil,
    logs: job.logs,
    scheduledStartAt: job.scheduledStartAt,
    scheduledEndAt: job.scheduledEndAt,
    error: job.error
  }
}
