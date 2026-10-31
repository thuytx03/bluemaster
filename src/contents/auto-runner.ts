/**
 * Isolated world content script — reads settings from chrome.storage and:
 * 1. Dispatches bluemaster:init-features → MAIN world activates XHR/fetch-dependent features.
 * 2. Directly activates isolated-world-safe DOM features.
 */
import type { PlasmoCSConfig } from 'plasmo'

export const config: PlasmoCSConfig = {
    matches: ['https://www.facebook.com/*', 'https://www.messenger.com/*'],
    run_at: 'document_start',
}

import { EStorageKey } from 'src/constants/enum'
import { chromeUtils } from 'src/utils/chrome.util'
import { ALL_FEATURE_IDS } from 'src/modules/auto-run/registry'
import type { AutoRunFeatureId } from 'src/modules/auto-run/auto-run.types'

// Isolated-world features (DOM only, or need chrome.*)
import { activate as fbAddDownloadVideoBtn } from 'src/modules/auto-run/features/facebook/add-download-video-btn.feature'
import { activate as fbAddVideoControlBtn } from 'src/modules/auto-run/features/facebook/add-video-control-btn.feature'

const isolatedActivators: Partial<Record<AutoRunFeatureId, () => (() => void)>> = {
    fb_addDownloadVideoBtn: fbAddDownloadVideoBtn,
    fb_addVideoControlBtn: fbAddVideoControlBtn,
}

async function init() {
    // Read which features are disabled (empty array = all enabled by default)
    const disabled = (await chromeUtils.getStorage<AutoRunFeatureId[]>(EStorageKey.AUTO_RUN_FEATURES_DISABLED)) ?? []
    const enabled = ALL_FEATURE_IDS.filter(id => !disabled.includes(id))

    // 1. Notify MAIN world which features to activate
    window.dispatchEvent(new CustomEvent('bluemaster:init-features', { detail: { features: enabled } }))

    // 2. Activate isolated-world features directly
    for (const id of enabled) {
        const fn = isolatedActivators[id]
        if (!fn) continue
        try {
            fn()
            console.log(`[Bluemaster] isolated activated: ${id}`)
        } catch (e) {
            console.warn(`[Bluemaster] isolated failed to activate ${id}:`, e)
        }
    }
}

init()
