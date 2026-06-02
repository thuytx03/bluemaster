import { hookXHR } from '../../utils/ajax-hook'
import { notify } from '../../utils/dom-helper'

// Known GraphQL mutation names for marking messages as read/seen
const SEEN_MUTATIONS = [
    'MessengerReadReceiptsMutation',
    'MarkThreadReadMutation',
    'MarkMessageSeenMutation',
    'MarkAllThreadsAsReadMutation',
    'MWMessengerMarkThreadReadMutation',
    'MarkThreadAsSeen',
]

export function activate() {
    return hookXHR({
        onBeforeSend({ method }, dataSend) {
            const s = dataSend?.toString?.() ?? ''
            if (method === 'POST' && SEEN_MUTATIONS.some(m => s.includes(m))) {
                notify({ msg: '💬 Xthuy: Chat seen BLOCKED' })
                return null
            }
        },
    })
}
