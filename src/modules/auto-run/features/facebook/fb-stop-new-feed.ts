// import { hookXHR } from '../../utils/ajax-hook'
// import { notify } from '../../utils/dom-helper'

// const blackList: Record<string, string[]> = {
//     story: ['StoriesTrayRectangularQuery', 'useStoriesViewerBucketsPaginationQuery'],
//     'video tab': ['CometVideoHomeFeedRootQuery', 'CometVideoHomeFeedSectionPaginationQuery'],
//     'home tab': ['CometModernHomeFeedQuery', 'CometNewsFeedPaginationQuery'],
//     'group tab': ['GroupsCometCrossGroupFeedPaginationQuery', 'GroupsCometCrossGroupFeedContainerQuery'],
//     'group feed': ['GroupsCometFeedRegularStoriesPaginationQuery'],
//     'marketplace tab': ['MarketplaceBannerContainerQuery', 'CometMarketplaceLeftRailNavigationContainerQuery'],
// }

// export function activate() {
//     return hookXHR({
//         onBeforeSend(_, dataSend) {
//             const s = dataSend?.toString?.() ?? ''
//             for (const [key, values] of Object.entries(blackList)) {
//                 if (values.some(v => s.includes(v))) {
//                     notify({ msg: `🚫 Xthuy: Blocked new feed '${key}'` })
//                     return null
//                 }
//             }
//         },
//     })
// }
