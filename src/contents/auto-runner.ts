/**
 * Isolated world content script — reads settings from chrome.storage and:
 * 1. Dispatches xthuy:init-features → MAIN world activates XHR/fetch-dependent features.
 * 2. Directly activates isolated-world-safe DOM features.
 */
import type { PlasmoCSConfig } from 'plasmo'

export const config: PlasmoCSConfig = {
    matches: ['<all_urls>'],
    run_at: 'document_start',
}

import { EStorageKey } from '../constants/enum'
import { chromeUtils } from '../utils/chrome.util'
import { ALL_FEATURE_IDS } from '../modules/auto-run/registry'
import type { AutoRunFeatureId } from '../modules/auto-run/types'

// Isolated-world features (DOM only, or need chrome.*)
import { activate as fbAddDownloadVideoBtn } from '../modules/auto-run/features/facebook/fb-add-download-video-btn'
import { activate as fbAddVideoControlBtn } from '../modules/auto-run/features/facebook/fb-add-video-control-btn'
import { activate as threadsAddDownloadBtn } from '../modules/auto-run/features/threads/threads-add-download-btn'
import { activate as webTimer } from '../modules/auto-run/features/web/web-timer'

const isolatedActivators: Partial<Record<AutoRunFeatureId, () => (() => void)>> = {
    fb_addDownloadVideoBtn: fbAddDownloadVideoBtn,
    fb_addVideoControlBtn: fbAddVideoControlBtn,
    threads_addDownloadVideoBtn: threadsAddDownloadBtn,
    web_timer: webTimer,
}

async function init() {
    // Read which features are disabled (empty array = all enabled by default)
    const disabled = (await chromeUtils.getStorage<AutoRunFeatureId[]>(EStorageKey.AUTO_RUN_FEATURES_DISABLED)) ?? []
    const enabled = ALL_FEATURE_IDS.filter(id => !disabled.includes(id))

    // 1. Notify MAIN world which features to activate
    window.dispatchEvent(new CustomEvent('xthuy:init-features', { detail: { features: enabled } }))

    // 2. Send block-urls config to MAIN world
    const blockUrlPatterns = (await chromeUtils.getStorage<string[]>(EStorageKey.BLOCK_OPEN_URLS_REGEXS)) ?? []
    window.dispatchEvent(new CustomEvent('xthuy:block-urls-config', { detail: { patterns: blockUrlPatterns } }))

    // 3. Activate isolated-world features directly
    for (const id of enabled) {
        const fn = isolatedActivators[id]
        if (!fn) continue
        try {
            fn()
            console.log(`[Xthuy] isolated activated: ${id}`)
        } catch (e) {
            console.warn(`[Xthuy] isolated failed to activate ${id}:`, e)
        }
    }
}

init()
