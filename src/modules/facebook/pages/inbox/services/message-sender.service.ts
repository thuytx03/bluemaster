import { generateRequestId, generateS, makeId } from 'src/modules/facebook/utils/payload.util'
import { ICustomer, IFbRequestConfig, ISendConfig, ISendLogEntry } from '../types/inbox.interface'
import { processMessageTemplate } from '../utils/message-template.util'

const UPLOAD_URL = 'https://upload.facebook.com/ajax/mercury/upload.php'
const SEND_URL = 'https://www.facebook.com/messaging/send'

export type TSendResult = 'success' | 'failure' | 'skipped'

export interface ISendOneResult {
  result: TSendResult
  log: ISendLogEntry
}


function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ==================== UPLOAD MEDIA ====================

export async function uploadMedia(
  pageId: string,
  files: File[],
  type: 'image' | 'video' | 'audio' | 'file',
  config: IFbRequestConfig
): Promise<Record<string, string>> {
  // All config params go in URL query string (not FormData)
  const params = new URLSearchParams({
    request_user_id: pageId,
    __a: '1',
    __dyn: config.__dyn ?? '',
    __req: generateRequestId(),
    __spin_r: String(config.__spin_r),
    __spin_b: config.__spin_b ?? '',
    __spin_t: String(Math.floor(Date.now() / 1000)),
    cquick_token: config.cquick_token ?? '',
    fb_dtsg: config.fb_dtsg,
    cquick: config.cquick ?? '',
    __ccg: config.__ccg ?? '',
    dpr: String(config.dpr ?? 1),
    jazoest: config.jazoest,
    __csr: config.__csr ?? '',
    __beoa: '0',
    hsi: config.__hsi ?? '',
    semr_host_bucket: config.semr_host_bucket ?? '',
    bl_hash_version: config.bl_hash_version ?? '',
    comet_env: String(config.comet_env ?? ''),
    wbloks_env: config.wbloks_env ?? '',
    ef_page: 'BusinessCometBizSuiteInboxAllMessagesRoute',
    compose_bootloads: config.compose_bootloads ?? '',
    spin: config.spin ?? '',
    __hsi: config.__hsi ?? '',
  })

  const formData = new FormData()
  for (let i = 0; i < files.length; i++) {
    // File field name is upload_102{i} (not image_0 / voice_clip_0 / video_0)
    formData.append(`upload_102${i}`, files[i])
  }

  const res = await fetch(`${UPLOAD_URL}?${params}`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })

  const text = await res.text()
  const json = JSON.parse(text.replace('for (;;);', ''))

  if (!json?.payload?.metadata) return {}

  const metadata = json.payload.metadata
  const result: Record<string, string> = {}

  for (const key of Object.keys(metadata)) {
    const item = metadata[key]
    if (type === 'video' && item.video_id) result[key] = item.video_id
    else if (type === 'audio' && item.audio_id) result[key] = item.audio_id
    else if (item.image_id) result[key] = item.image_id
  }

  return result
}

// ==================== DOWNLOAD IMAGE AS FILE ====================

function sendBgMessage<T = any>(message: Record<string, any>): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message))
      resolve(response)
    })
  })
}

export async function downloadImageAsFile(url: string): Promise<File | null> {
  try {
    const res = await sendBgMessage<{ success: boolean; base64?: string }>({
      action: 'INBOX_FETCH_IMAGE_BASE64',
      url,
    })
    if (!res?.success || !res.base64) return null
    // base64 is a data URL: "data:image/jpeg;base64,..."
    const [header, data] = res.base64.split(',')
    const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
    const ext = mime.split('/')[1] ?? 'jpg'
    const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0))
    const blob = new Blob([bytes], { type: mime })
    return new File([blob], `image_${Date.now()}.${ext}`, { type: mime })
  } catch {
    return null
  }
}

// ==================== BUILD BASE REQUEST BODY ====================

function buildBaseBody(customerId: string, pageId: string, config: IFbRequestConfig): URLSearchParams {
  const req = { ...config, __req: generateRequestId(), __s: generateS() }
  const messageId = Math.floor(Math.random() * 100000000000000)

  const body = new URLSearchParams()
  body.set('client', 'mercury')
  body.set('source', 'source:page_unified_inbox')
  body.set('action_type', 'ma-type:user-generated-message')
  body.set('timestamp', String(Date.now()))
  body.set('message_id', String(messageId))
  body.set('offline_threading_id', String(messageId))
  body.set('specific_to_list[0]', 'fbid: ' + customerId)
  body.set('specific_to_list[1]', 'fbid: ' + pageId)
  body.set('other_user_fbid', customerId)
  body.set('request_user_id', pageId)
  body.set('__user', req.c_user)
  body.set('__a', String(req.__a))
  body.set('__req', req.__req)
  body.set('__csr', req.__csr)
  body.set('__beoa', '0')
  body.set('__pc', req.__pc)
  body.set('__ccg', req.__ccg)
  body.set('__rev', String(req.__rev))
  body.set('__hsi', req.__hsi)
  body.set('__hs', req.__hs)
  body.set('__comet_req', String(req.__comet_req))
  body.set('__spin_r', String(req.__spin_r))
  body.set('__spin_b', req.__spin_b)
  body.set('__spin_t', String(Date.now()))
  body.set('__s', req.__s)
  body.set('__usid', req.usid)
  body.set('dpr', String(req.dpr))
  body.set('fb_dtsg', req.fb_dtsg)
  body.set('jazoest', req.jazoest)
  body.set('lsd', req.lsd)
  body.set('ephemeral_ttl_mode', '0')
  return body
}

// ==================== SEND TEXT ====================

async function sendText(
  customerId: string,
  pageId: string,
  text: string,
  config: IFbRequestConfig
): Promise<boolean> {
  const body = buildBaseBody(customerId, pageId, config)
  body.set('has_attachment', 'false')
  body.set('body', text)

  const res = await fetch(SEND_URL, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const json = JSON.parse((await res.text()).replace('for (;;);', ''))
  return !json.error && !!json.payload
}

// ==================== SEND ATTACHMENT ====================

async function sendAttachment(
  customerId: string,
  pageId: string,
  mediaIds: Record<string, string>,
  type: 'image' | 'video' | 'audio' | 'file',
  config: IFbRequestConfig
): Promise<boolean> {
  const body = buildBaseBody(customerId, pageId, config)
  body.set('has_attachment', 'true')

  // Serialize media IDs as image_ids[key]=value etc.
  const fieldPrefix = type === 'video' ? 'video_ids' : type === 'audio' ? 'audio_ids' : type === 'file' ? 'file_ids' : 'image_ids'
  for (const [key, val] of Object.entries(mediaIds)) {
    body.append(`${fieldPrefix}[${key}]`, val)
  }

  const res = await fetch(SEND_URL, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const json = JSON.parse((await res.text()).replace('for (;;);', ''))
  return !json.error && !!json.payload
}

// ==================== SEND ONE MESSAGE ====================

export async function sendOneMessage(params: {
  customer: ICustomer
  pageId: string
  category: 'fanpage' | 'profile'
  messageTemplate: string
  imageUrl?: string
  attachmentFiles?: File[]
  attachmentType?: string
  attachmentPosition?: 'before' | 'after'
  config: IFbRequestConfig
}): Promise<ISendOneResult> {
  const {
    customer, pageId, category, messageTemplate,
    imageUrl, attachmentFiles, attachmentType, attachmentPosition, config,
  } = params

  const processedMessage = processMessageTemplate(
    messageTemplate, customer.name, customer.xung ?? '', customer.goi ?? '', category
  )

  const log: ISendLogEntry = {
    id: makeId(),
    customerId: customer.id,
    customerName: customer.name,
    status: 'failure',
    message: processedMessage,
    timestamp: Date.now(),
  }

  try {
    // Collect files to upload
    let files: File[] = attachmentFiles ? [...attachmentFiles] : []

    // Download image from URL if provided (only for image type)
    if (attachmentType === 'image' && imageUrl?.startsWith('http')) {
      const downloaded = await downloadImageAsFile(imageUrl)
      if (downloaded) files.push(downloaded)
    }

    const hasFiles = files.length > 0 && !!attachmentType

    if (!hasFiles) {
      // Text-only message
      if (!processedMessage) {
        log.error = 'Không có nội dung để gửi'
        return { result: 'failure', log }
      }
      const ok = await sendText(customer.id, pageId, processedMessage, config)
      log.status = ok ? 'success' : 'failure'
      if (!ok) log.error = 'Gửi thất bại'
      return { result: ok ? 'success' : 'failure', log }
    }

    // Upload files
    const mediaIds = await uploadMedia(pageId, files, attachmentType as any, config)
    if (Object.keys(mediaIds).length === 0) {
      log.error = 'Upload đính kèm thất bại'
      return { result: 'failure', log }
    }

    // Send text + attachment as separate messages
    let textOk = true
    let attachOk = false

    if (attachmentPosition === 'before') {
      // Attachment first, then text
      attachOk = await sendAttachment(customer.id, pageId, mediaIds, attachmentType as any, config)
      if (processedMessage) {
        textOk = await sendText(customer.id, pageId, processedMessage, config)
      }
    } else {
      // Text first (if any), then attachment
      if (processedMessage) {
        textOk = await sendText(customer.id, pageId, processedMessage, config)
      }
      attachOk = await sendAttachment(customer.id, pageId, mediaIds, attachmentType as any, config)
    }

    const success = attachOk && textOk
    log.status = success ? 'success' : 'failure'
    if (!success) {
      log.error = !attachOk ? 'Gửi đính kèm thất bại' : 'Gửi text thất bại'
    }
    return { result: success ? 'success' : 'failure', log }
  } catch (e: any) {
    log.status = 'failure'
    log.error = e.message ?? 'Lỗi kết nối'
    return { result: 'failure', log }
  }
}

// ==================== BATCH SENDER ====================

export interface IBatchSendParams {
  customers: ICustomer[]
  pageId: string
  category: 'fanpage' | 'profile'
  messageTemplate: string
  imageUrl?: string
  attachmentFiles?: File[]
  attachmentType?: string
  attachmentPosition?: 'before' | 'after'
  sendConfig: ISendConfig
  config: IFbRequestConfig
  isStopped: () => boolean
  isPaused: () => boolean
  onProgress: (params: {
    currentIndex: number
    successCount: number
    failureCount: number
    skippedCount: number
    percent: number
    currentCustomer: ICustomer
    log: ISendLogEntry
  }) => void
  onRest: (restUntil: number) => void
  onFinish: () => void
}

export async function batchSendMessages(params: IBatchSendParams): Promise<void> {
  const {
    customers, pageId, category, messageTemplate,
    imageUrl, attachmentFiles, attachmentType, attachmentPosition,
    sendConfig, config, isStopped, isPaused,
    onProgress, onRest, onFinish,
  } = params

  let successCount = 0
  let failureCount = 0
  let skippedCount = 0
  const total = sendConfig.limitMessage > 0 ? Math.min(sendConfig.limitMessage, customers.length) : customers.length

  let list = [...customers]
  if (sendConfig.sendingOrder === '3') {
    list = shuffleArray(list)
  } else if (sendConfig.sendingOrder === '2') {
    list.reverse()
  }

  for (let i = 0; i < total; i++) {
    if (isStopped()) break

    while (isPaused() && !isStopped()) {
      await sleep(500)
    }
    if (isStopped()) break

    const customer = list[i]

    const result = await sendOneMessage({
      customer, pageId, category, messageTemplate,
      imageUrl, attachmentFiles, attachmentType, attachmentPosition, config,
    })

    if (result.result === 'success') successCount++
    else if (result.result === 'failure') failureCount++
    else skippedCount++

    const percent = Math.round(((i + 1) / total) * 100)
    onProgress({ currentIndex: i + 1, successCount, failureCount, skippedCount, percent, currentCustomer: customer, log: result.log })

    const needRest = sendConfig.restAfterMessages > 0 && (i + 1) % sendConfig.restAfterMessages === 0 && i + 1 < total
    if (needRest && !isStopped()) {
      const restMs = sendConfig.restDuration * 1000
      const restUntil = Date.now() + restMs
      onRest(restUntil)
      await sleep(restMs)
    }

    if (i + 1 < total && !isStopped()) {
      const delay = randomInRange(sendConfig.timeFrom, sendConfig.timeTo) * 1000
      await sleep(delay)
    }
  }

  onFinish()
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function randomInRange(min: number, max: number): number {
  if (min > max) return min
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export default {
  sendOneMessage,
  batchSendMessages,
  uploadMedia,
  downloadImageAsFile,
}
