import { hookXHR } from '../../utils/ajax-hook'
import { notify } from '../../utils/dom-helper'

export function activate() {
    return hookXHR({
        onBeforeSend({ method }, dataSend) {
            const s = dataSend?.toString?.() ?? ''
            if (method === 'POST' && (s.includes('viewSeenAt') || s.includes('SeenMutation'))) {
                notify({ msg: '👀 Xthuy: Instagram story seen BLOCKED' })
                return null
            }
        },
    })
}
