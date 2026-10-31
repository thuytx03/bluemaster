import type { AutoRunFeatureMeta } from './auto-run.types'

// Feature metadata (used for settings UI)
export const AUTO_RUN_FEATURES_META: AutoRunFeatureMeta[] = [
    {
        id: 'fb_blockSeenStory',
        name: 'Block Facebook Story Seen',
        description: 'Prevents Facebook from marking stories as seen',
        platform: 'facebook',
        world: 'main',
        urlPatterns: ['*://www.facebook.com/*'],
    },

    {
        id: 'fb_blockSeenChat',
        name: 'Block Facebook Chat Seen',
        description: 'Prevents Facebook Messenger from sending read receipts',
        platform: 'facebook',
        world: 'main',
        urlPatterns: ['*://www.facebook.com/*', '*://www.messenger.com/*'],
    },

    {
        id: 'fb_showTotalPostReactions',
        name: 'Show Total Post Reactions',
        description: 'Shows exact reaction counts when Facebook hides them',
        platform: 'facebook',
        world: 'main',
        urlPatterns: ['*://www.facebook.com/*'],
    },

    {
        id: 'fb_addDownloadVideoBtn',
        name: 'Facebook Video Download Button',
        description: 'Adds a download button to Facebook videos',
        platform: 'facebook',
        world: 'isolated',
        urlPatterns: ['*://www.facebook.com/*'],
    },

    {
        id: 'fb_addVideoControlBtn',
        name: 'Facebook Video Controls Button',
        description: 'Adds a button to toggle native video controls on Facebook videos',
        platform: 'facebook',
        world: 'isolated',
        urlPatterns: ['*://www.facebook.com/*'],
    }
]

export const ALL_FEATURE_IDS = AUTO_RUN_FEATURES_META.map(f => f.id)
export const MAIN_WORLD_FEATURE_IDS = AUTO_RUN_FEATURES_META.filter(f => f.world === 'main').map(f => f.id)
export const ISOLATED_FEATURE_IDS = AUTO_RUN_FEATURES_META.filter(f => f.world === 'isolated').map(f => f.id)
