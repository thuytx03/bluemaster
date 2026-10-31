import { hookFetch, hookWSSend, hookXHR, wsFrameToString } from 'src/modules/auto-run/utils/ajax-hook.util'
import { notify } from 'src/modules/auto-run/utils/dom.util'

// GraphQL mutation names Facebook has used to mark messages as read/seen
const SEEN_MUTATIONS = [
    'MessengerReadReceiptsMutation',
    'MarkThreadReadMutation',
    'MarkMessageSeenMutation',
    'MarkAllThreadsAsReadMutation',
    'MWMessengerMarkThreadReadMutation',
    'MarkThreadAsSeen',
]

/**
 * Modern Messenger sends read receipts over MQTT (WebSocket) as LightSpeed tasks.
 * Task label 21 = "mark thread read"; the JSON is nested and backslash-escaped,
 * so strip the escapes before matching.
 */
const LS_MARK_READ_TASK = /"label":"21"/

const looksLikeSeenRequest = (raw: string) => {
    if (!raw) return false
    const plain = raw.replace(/\\/g, '')
    return SEEN_MUTATIONS.some(m => plain.includes(m)) || LS_MARK_READ_TASK.test(plain)
}

const bodyToString = (body: unknown): string => {
    if (!body) return ''
    if (typeof body === 'string') return body
    if (body instanceof URLSearchParams) return body.toString()
    if (body instanceof FormData) {
        const parts: string[] = []
        body.forEach((v, k) => parts.push(`${k}=${typeof v === 'string' ? v : ''}`))
        return parts.join('&')
    }
    return wsFrameToString(body)
}

let lastNotify = 0
const announce = () => {
    const now = Date.now()
    if (now - lastNotify < 1500) return // one toast per burst
    lastNotify = now
    notify({ msg: '💬 Bluemaster: Chat seen BLOCKED' })
}

export function activate() {
    const unhookXhr = hookXHR({
        onBeforeSend({ method }, dataSend) {
            if (method === 'POST' && looksLikeSeenRequest(bodyToString(dataSend))) {
                announce()
                return null
            }
        },
    })
    const unhookFetch = hookFetch({
        onBefore(url, options) {
            if ((options?.method ?? 'GET').toUpperCase() === 'POST' && looksLikeSeenRequest(bodyToString(options?.body))) {
                announce()
                return null
            }
            return undefined
        },
    })
    const unhookWs = hookWSSend((data) => {
        if (looksLikeSeenRequest(wsFrameToString(data))) {
            announce()
            return null
        }
        return undefined
    })
    return () => {
        unhookXhr()
        unhookFetch()
        unhookWs()
    }
}
