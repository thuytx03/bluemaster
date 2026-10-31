export type AutoRunFeatureId =
    | 'fb_blockSeenStory'
    | 'fb_blockSeenChat'
    | 'fb_showTotalPostReactions'
    | 'fb_addDownloadVideoBtn'
    | 'fb_addVideoControlBtn'

/** 'main' features run in MAIN world; 'isolated' features run in isolated content script */
export type AutoRunWorld = 'main' | 'isolated'

export interface AutoRunFeatureMeta {
    id: AutoRunFeatureId
    name: string
    description: string
    platform: 'facebook'
    world: AutoRunWorld
    /** URL patterns this feature applies to (used for UI display only; runtime checks location.hostname) */
    urlPatterns: string[]
}

export type AutoRunFeatureActivator = () => (() => void)
