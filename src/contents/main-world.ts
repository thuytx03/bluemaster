/**
 * MAIN world content script — runs in the same JS context as the page.
 * Activates features that need to hook window.fetch / window.XMLHttpRequest.
 * Receives the list of enabled features from the isolated world via CustomEvent.
 */
import type { PlasmoCSConfig } from 'plasmo'

export const config: PlasmoCSConfig = {
    matches: ['https://www.facebook.com/*', 'https://www.messenger.com/*'],
    world: 'MAIN',
    run_at: 'document_start',
}

// Import all MAIN-world feature activators (bundled together by Plasmo/esbuild)
import { activate as fbBlockSeenStory } from 'src/modules/auto-run/features/facebook/block-seen-story.feature'
import { activate as fbBlockSeenChat } from 'src/modules/auto-run/features/facebook/block-seen-chat.feature'
import { activate as fbShowTotalReactions } from 'src/modules/auto-run/features/facebook/show-total-reactions.feature'
import type { AutoRunFeatureId } from 'src/modules/auto-run/auto-run.types'

const activators: Partial<Record<AutoRunFeatureId, () => (() => void)>> = {
    fb_blockSeenStory: fbBlockSeenStory,
    fb_blockSeenChat: fbBlockSeenChat,
    fb_showTotalPostReactions: fbShowTotalReactions,
}

const cleanups = new Map<AutoRunFeatureId, () => void>()

function activateFeature(id: AutoRunFeatureId) {
    if (cleanups.has(id)) return  // already active
    const fn = activators[id]
    if (!fn) return
    try {
        const cleanup = fn()
        cleanups.set(id, cleanup)
        console.log(`[Bluemaster] activated: ${id}`)
    } catch (e) {
        console.warn(`[Bluemaster] failed to activate ${id}:`, e)
    }
}

// Listen for feature list sent by the isolated world (auto-runner.ts)
window.addEventListener('bluemaster:init-features', (e) => {
    const features = ((e as CustomEvent).detail?.features ?? []) as AutoRunFeatureId[]
    features.forEach(activateFeature)
})
