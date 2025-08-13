import { defineManifest } from '@crxjs/vite-plugin'
import packageData from '../package.json'

//@ts-ignore
const isDev = process.env.NODE_ENV == 'development'

export default defineManifest({
  name: `${packageData.name}${isDev ? ` 🛠 Dev` : ''}`,
  description: packageData.description,
  version: packageData.version,
  manifest_version: 3,
  icons: {
    16: 'logo-rounded.png',
    32: 'logo-rounded.png',
    48: 'logo-rounded.png',
    128: 'logo-rounded.png',
  },
  action: {
    default_icon: 'logo-rounded.png',
  },
  options_page: 'options.html',
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['https://www.facebook.com/*'],
      js: ['src/contentScript/index.ts'],
    },
  ],

  // web_accessible_resources: [
  //   {
  //     resources: ['icon.png', "src/assets/data/emoji.json"],
  //     matches: ["<all_urls>"],
  //   },
  // ],
  host_permissions: ["<all_urls>"],
  permissions: [
    "bookmarks",
    "identity",
    "cookies",
    "tabs",
    "storage",
    "activeTab",
    "webRequest",
    "notifications",
    "clipboardWrite",
    "declarativeNetRequest",
  ],
  content_security_policy: {
    extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"
  }
})
