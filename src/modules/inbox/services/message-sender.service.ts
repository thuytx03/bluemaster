import { generateRequestId, generateS, makeId } from 'src/modules/facebook/utils/payload.util'
import { ICustomer, IFbRequestConfig, ISendLogEntry } from 'src/modules/inbox/types/inbox.types'
import { processMessageTemplate } from 'src/modules/inbox/utils/message-template.util'

const UPLOAD_URL = 'https://upload.facebook.com/ajax/mercury/upload.php'
const SEND_URL = 'https://www.facebook.com/messaging/send'

/** Facebook answers with these when fb_dtsg / session tokens are stale */
const STALE_CONFIG_ERROR_CODES = new Set([1357001, 1357004, 1357005, 1348020])

interface ISendResponse {
  ok: boolean
  code?: number
}

async function postMessage(body: URLSearchParams): Promise<ISendResponse> {
  const res = await fetch(SEND_URL, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const json = JSON.parse((await res.text()).replace('for (;;);', ''))
  if (json.error) return { ok: false, code: Number(json.error) || undefined }
  return { ok: !!json.payload }
}

export type TSendResult = 'success' | 'failure' | 'skipped'

export interface ISendOneResult {
  result: TSendResult
  log: ISendLogEntry
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

/** Fetch a remote image into a File. Runs in the service worker, so no CORS limits apply. */
export async function downloadImageAsFile(url: string): Promise<File | null> {
  const candidates = [url]
  if (url.includes('scontent')) {
    const large = url.replace(/\/s\d+x\d+\//g, '/s200x200/').replace(/\/p\d+x\d+\//g, '/p200x200/')
    if (large !== url) candidates.unshift(large)
  }
  for (const u of candidates) {
    try {
      const res = await fetch(u, { redirect: 'follow' })
      if (!res.ok) continue
      const mime = res.headers.get('Content-Type') ?? ''
      if (!mime.includes('image')) continue
      const blob = await res.blob()
      if (blob.size < 100) continue
      const ext = mime.split('/')[1]?.split(';')[0] ?? 'jpg'
      return new File([blob], `image_${Date.now()}.${ext}`, { type: mime })
    } catch {
      continue
    }
  }
  return null
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
): Promise<ISendResponse> {
  const body = buildBaseBody(customerId, pageId, config)
  body.set('has_attachment', 'false')
  body.set('body', text)
  return postMessage(body)
}

// ==================== SEND ATTACHMENT ====================

async function sendAttachment(
  customerId: string,
  pageId: string,
  mediaIds: Record<string, string>,
  type: 'image' | 'video' | 'audio' | 'file',
  config: IFbRequestConfig
): Promise<ISendResponse> {
  const body = buildBaseBody(customerId, pageId, config)
  body.set('has_attachment', 'true')

  // Serialize media IDs as image_ids[key]=value etc.
  const fieldPrefix = type === 'video' ? 'video_ids' : type === 'audio' ? 'audio_ids' : type === 'file' ? 'file_ids' : 'image_ids'
  for (const [key, val] of Object.entries(mediaIds)) {
    body.append(`${fieldPrefix}[${key}]`, val)
  }
  return postMessage(body)
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
  /** Called once when Facebook rejects the session tokens; return a fresh config to retry with */
  refreshConfig?: () => Promise<IFbRequestConfig | null>
}): Promise<ISendOneResult> {
  const {
    customer, pageId, category, messageTemplate,
    imageUrl, attachmentFiles, attachmentType, attachmentPosition, refreshConfig,
  } = params
  let config = params.config
  let refreshed = false

  /** Run a send step; on a stale-token error reload the config and try once more */
  const withFreshConfig = async (step: (cfg: IFbRequestConfig) => Promise<ISendResponse>): Promise<boolean> => {
    const first = await step(config)
    if (first.ok || refreshed || !refreshConfig || !first.code || !STALE_CONFIG_ERROR_CODES.has(first.code)) {
      return first.ok
    }
    refreshed = true
    const fresh = await refreshConfig()
    if (!fresh) return false
    config = fresh
    return (await step(config)).ok
  }

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
      const ok = await withFreshConfig((cfg) => sendText(customer.id, pageId, processedMessage, cfg))
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
      attachOk = await withFreshConfig((cfg) => sendAttachment(customer.id, pageId, mediaIds, attachmentType as any, cfg))
      if (processedMessage) {
        textOk = await withFreshConfig((cfg) => sendText(customer.id, pageId, processedMessage, cfg))
      }
    } else {
      // Text first (if any), then attachment
      if (processedMessage) {
        textOk = await withFreshConfig((cfg) => sendText(customer.id, pageId, processedMessage, cfg))
      }
      attachOk = await withFreshConfig((cfg) => sendAttachment(customer.id, pageId, mediaIds, attachmentType as any, cfg))
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

export default {
  sendOneMessage,
  uploadMedia,
  downloadImageAsFile,
}
