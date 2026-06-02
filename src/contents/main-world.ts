/**
 * MAIN world content script — runs in the same JS context as the page.
 * Activates features that need to hook window.fetch / window.XMLHttpRequest.
 * Receives the list of enabled features from the isolated world via CustomEvent.
 */
import type { PlasmoCSConfig } from 'plasmo'

export const config: PlasmoCSConfig = {
    matches: ['<all_urls>'],
    world: 'MAIN',
    run_at: 'document_start',
}

// Import all MAIN-world feature activators (bundled together by Plasmo/esbuild)
import { activate as fbBlockSeenStory } from '../modules/auto-run/features/facebook/fb-block-seen-story'
import { activate as fbBlockSeenChat } from '../modules/auto-run/features/facebook/fb-block-seen-chat'
// import { activate as fbStopNewFeed } from '../modules/auto-run/features/facebook/fb-stop-new-feed'
import { activate as fbShowTotalReactions } from '../modules/auto-run/features/facebook/fb-show-total-reactions'
import { activate as instaBlockSeenStory } from '../modules/auto-run/features/instagram/insta-block-seen-story'
import { activate as tiktokAddDownloadBtn } from '../modules/auto-run/features/tiktok/tiktok-add-download-btn'
import { activate as blockOpenUrls } from '../modules/auto-run/features/web/block-open-urls'
import type { AutoRunFeatureId } from '../modules/auto-run/types'

const activators: Partial<Record<AutoRunFeatureId, () => (() => void)>> = {
    fb_blockSeenStory: fbBlockSeenStory,
    fb_blockSeenChat: fbBlockSeenChat,
    // fb_stopNewFeed: fbStopNewFeed,
    fb_showTotalPostReactions: fbShowTotalReactions,
    insta_blockSeenStory: instaBlockSeenStory,
    tiktok_addDownloadVideoBtn: tiktokAddDownloadBtn,
    block_open_urls: blockOpenUrls,
}

const cleanups = new Map<AutoRunFeatureId, () => void>()

function activateFeature(id: AutoRunFeatureId) {
    if (cleanups.has(id)) return  // already active
    const fn = activators[id]
    if (!fn) return
    try {
        const cleanup = fn()
        cleanups.set(id, cleanup)
        console.log(`[Xthuy] activated: ${id}`)
    } catch (e) {
        console.warn(`[Xthuy] failed to activate ${id}:`, e)
    }
}

// Listen for feature list sent by the isolated world (auto-runner.ts)
window.addEventListener('xthuy:init-features', (e) => {
    const features = ((e as CustomEvent).detail?.features ?? []) as AutoRunFeatureId[]
    features.forEach(activateFeature)
})

// Listen for block-urls config
// (auto-runner.ts dispatches this separately after reading storage)
window.addEventListener('xthuy:block-urls-config', () => {
    // Event is handled inside block-open-urls.ts feature itself
})
