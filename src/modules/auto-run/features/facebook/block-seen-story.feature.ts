import { hookFetch, hookXHR } from 'src/modules/auto-run/utils/ajax-hook.util'
import { notify } from 'src/modules/auto-run/utils/dom.util'

const SEEN_MUTATION = 'storiesUpdateSeenStateMutation'

const isSeenRequest = (body: unknown) =>
    typeof body === 'string'
        ? body.includes(SEEN_MUTATION)
        : body instanceof URLSearchParams
          ? body.toString().includes(SEEN_MUTATION)
          : !!(body as { toString?: () => string })?.toString?.()?.includes?.(SEEN_MUTATION)

export function activate() {
    const unhookXhr = hookXHR({
        onBeforeSend({ method }, dataSend) {
            if (method === 'POST' && isSeenRequest(dataSend)) {
                notify({ msg: '👀 Bluemaster: Facebook story seen BLOCKED' })
                return null
            }
        },
    })
    const unhookFetch = hookFetch({
        onBefore(url, options) {
            if ((options?.method ?? 'GET').toUpperCase() === 'POST' && isSeenRequest(options?.body)) {
                notify({ msg: '👀 Bluemaster: Facebook story seen BLOCKED' })
                return null
            }
            return undefined
        },
    })
    return () => {
        unhookXhr()
        unhookFetch()
    }
}
