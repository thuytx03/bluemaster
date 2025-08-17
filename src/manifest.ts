import { defineManifest } from '@crxjs/vite-plugin'
import packageData from '../package.json'

//@ts-ignore
const isDev = process.env.NODE_ENV == 'development'

export default defineManifest({
  name: `${ packageData.name}${isDev ? `` : ''}`,
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
    // default_popup: 'popup.html',
    default_icon: 'logo-rounded.png',
  },
  options_page: 'options.html',
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      js: isDev
        ? ['src/contentScript/index.dev.tsx']
        : ['src/contentScript/index.prod.tsx'],
      // matches: ['<all_urls>'],
      matches: ['https://www.facebook.com/*'],
    },
  ],
  side_panel: {
    default_path: 'sidepanel.html',
  },
  web_accessible_resources: [
    {
      resources: ['*.js', '*.css', 'public/*'],
      matches: ['<all_urls>'],
    },
  ],
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
