import type { AutoRunFeatureMeta } from './types'

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
        id: 'fb_stopNewFeed',
        name: 'Stop Facebook New Feed',
        description: 'Blocks Facebook feed, stories, and video tab from loading new content',
        platform: 'facebook',
        world: 'main',
        urlPatterns: ['*://www.facebook.com/*'],
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
    },
    {
        id: 'insta_blockSeenStory',
        name: 'Block Instagram Story Seen',
        description: 'Prevents Instagram from marking stories as seen',
        platform: 'instagram',
        world: 'main',
        urlPatterns: ['*://www.instagram.com/*'],
    },
    {
        id: 'tiktok_addDownloadVideoBtn',
        name: 'TikTok Video Download Button',
        description: 'Adds download buttons to TikTok videos (no watermark when available)',
        platform: 'tiktok',
        world: 'main',
        urlPatterns: ['*://www.tiktok.com/*'],
    },
    {
        id: 'threads_addDownloadVideoBtn',
        name: 'Threads Video Download Button',
        description: 'Adds a download button to Threads videos',
        platform: 'threads',
        world: 'isolated',
        urlPatterns: ['*://www.threads.net/*', '*://threads.net/*'],
    },
    {
        id: 'block_open_urls',
        name: 'Block Suspicious URLs',
        description: 'Warns before opening blacklisted URLs (configurable regex patterns)',
        platform: 'web',
        world: 'main',
        urlPatterns: ['<all_urls>'],
    },
    {
        id: 'web_timer',
        name: 'Web Timer',
        description: 'Tracks active time spent on websites and optionally shows it in the page title',
        platform: 'web',
        world: 'isolated',
        urlPatterns: ['<all_urls>'],
    },
]

export const ALL_FEATURE_IDS = AUTO_RUN_FEATURES_META.map(f => f.id)
export const MAIN_WORLD_FEATURE_IDS = AUTO_RUN_FEATURES_META.filter(f => f.world === 'main').map(f => f.id)
export const ISOLATED_FEATURE_IDS = AUTO_RUN_FEATURES_META.filter(f => f.world === 'isolated').map(f => f.id)
