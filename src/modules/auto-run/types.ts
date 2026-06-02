export type AutoRunFeatureId =
    | 'fb_blockSeenStory'
    | 'fb_blockSeenChat'
    | 'fb_stopNewFeed'
    | 'fb_showTotalPostReactions'
    | 'fb_addDownloadVideoBtn'
    | 'fb_addVideoControlBtn'
    | 'insta_blockSeenStory'
    | 'tiktok_addDownloadVideoBtn'
    | 'threads_addDownloadVideoBtn'
    | 'block_open_urls'
    | 'web_timer'

/** 'main' features run in MAIN world; 'isolated' features run in isolated content script */
export type AutoRunWorld = 'main' | 'isolated'

export interface AutoRunFeatureMeta {
    id: AutoRunFeatureId
    name: string
    description: string
    platform: string
    world: AutoRunWorld
    /** URL patterns this feature applies to (used for UI display only; runtime checks location.hostname) */
    urlPatterns: string[]
}

export type AutoRunFeatureActivator = () => (() => void)
