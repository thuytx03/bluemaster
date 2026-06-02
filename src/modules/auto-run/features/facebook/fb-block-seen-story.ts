import { hookXHR } from '../../utils/ajax-hook'
import { notify } from '../../utils/dom-helper'

export function activate() {
    return hookXHR({
        onBeforeSend({ method }, dataSend) {
            if (method === 'POST' && dataSend?.toString?.()?.includes?.('storiesUpdateSeenStateMutation')) {
                notify({ msg: '👀 Xthuy: Facebook story seen BLOCKED' })
                return null
            }
        },
    })
}
