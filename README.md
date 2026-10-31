<p align="center">
  <img src="assets/icon.png" width="120" alt="Bluemaster logo" style="border-radius:24px" />
</p>

<h1 align="center">Bluemaster for Facebook</h1>

<p align="center">
  An open-source browser extension that adds a power-user toolkit on top of Facebook:<br/>
  bulk media downloads, multi-URL downloads, UID scraping, bulk inbox messaging, token and cookie utilities.
</p>

<p align="center">
  <a href="https://github.com/thuytx03/bluemaster/actions/workflows/ci.yml"><img src="https://github.com/thuytx03/bluemaster/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/thuytx03/bluemaster/releases/latest"><img src="https://img.shields.io/github/v/release/thuytx03/bluemaster?label=release" alt="Release" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <img src="https://img.shields.io/badge/manifest-v3-green" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/built%20with-Plasmo-7c3aed" alt="Plasmo" />
</p>

<p align="center">
  <a href="https://github.com/thuytx03/bluemaster/releases/latest/download/bluemaster-latest.zip"><img src="https://img.shields.io/badge/Download-Chrome%20%2F%20Edge%20%2F%20Brave-1877F2?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Download for Chrome, Edge, Brave" /></a>
  &nbsp;
  <a href="https://github.com/thuytx03/bluemaster/releases"><img src="https://img.shields.io/badge/All%20releases-changelog-555?style=for-the-badge&logo=github&logoColor=white" alt="All releases" /></a>
  &nbsp;
  <a href="#install"><img src="https://img.shields.io/badge/Install%20guide-3%20steps-0B5ED7?style=for-the-badge&logo=bookstack&logoColor=white" alt="Install guide" /></a>
</p>

> Bluemaster is an independent project. It is not affiliated with, endorsed by, or sponsored by Meta Platforms, Inc. "Facebook" is a trademark of Meta Platforms, Inc.

---

## Features

All tools run inside a sidebar injected on `facebook.com`, so you work on the page you already have open.

| Tool | What it does |
|---|---|
| **Bulk download** | Download every photo, video, reel, highlighted story or active story of a profile or group. Configurable file-name format (order, id, title, timestamp), date-range filter, concurrency, delay, per-highlight folders, and an optional single-ZIP mode so the browser asks where to save only once. |
| **Multi-URL download** | Paste many links (posts, videos/reels/watch, stories, albums, comment videos), one per line. The content type is detected automatically; each URL becomes a trackable job with retry. |
| **UID scraper** | Collect user IDs from groups, posts, reactions or friend lists and export them as TXT, JSON or Excel. |
| **Auto inbox** | Scan a page's inbox, filter customers, compose templated messages and send in bulk with pacing, rest periods and scheduling. |
| **Access token** | Retrieve EAAB / EAAGNO tokens from the logged-in session. |
| **Cookies** | Export the current cookies or import a cookie set for any URL. |
| **Auto-run helpers** | Block "seen" for stories and chats, show hidden reaction totals, add download and native-controls buttons to videos. |

Download history, file-name presets and UI preferences persist across sessions. Light and dark themes, Vietnamese and English.

<a id="install"></a>
## Install

### From a release

1. Click the **Download** button above (or grab `bluemaster-<version>.zip` from the [releases page](https://github.com/thuytx03/bluemaster/releases/latest)) and unzip it.
2. Open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked** and select the unzipped folder.
3. Open `facebook.com`. The floating button on the right edge opens the sidebar.

### From source

```bash
git clone https://github.com/thuytx03/bluemaster.git
cd bluemaster
pnpm install          # or: corepack enable && pnpm install
pnpm dev              # development build with hot reload -> build/chrome-mv3-dev
pnpm build            # production build + zip        -> build/chrome-mv3-prod
```

Load `build/chrome-mv3-dev` (or `-prod`) as an unpacked extension.

## Development

| Command | Purpose |
|---|---|
| `pnpm dev` | Plasmo dev server with hot reload |
| `pnpm build` | Production build and `.zip` package |
| `pnpm type-check` | `tsc --noEmit` |
| `pnpm lint` / `pnpm lint:fix` | oxlint (TypeScript, React, React Hooks rules) |
| `pnpm check` | type-check + lint |

Stack: [Plasmo](https://www.plasmo.com/) (Manifest V3), React 18, TypeScript, Tailwind CSS (prefixed `bm-` and scoped to the sidebar's shadow DOM so Facebook's styles never leak in or out), Zustand, i18next, Lucide icons.

### Project layout

```
src/
  background.ts            service worker: downloads, fetch proxy, declarativeNetRequest rules
  contents/                content scripts: sidebar UI, auto-run (isolated + MAIN world)
  configs/                 axios client, sidebar tool registry
  constants/               enums, routes, regex patterns, download settings
  modules/
    download/              bulk + multi-URL downloader (components, hooks, services, utils)
    facebook/              Facebook GraphQL service, UID scraper, token page
    inbox/                 bulk messaging wizard
    auto-run/              page-level helpers (block seen, reaction totals, video buttons)
    cookies/ settings/ shared/
  stores/                  Zustand stores (auth, extension state, download history)
  utils/                   chrome API wrappers, download core (retry/resume), ZIP writer, file naming
```

Naming rules: React components and pages are `PascalCase.tsx`, hooks are `useThing.ts`, everything else is `kebab-name.<kind>.ts` (`service`, `util`, `store`, `types`, `constants`, `config`, `feature`). Internal imports use the `src/` alias.

### How downloads work

Media URLs come from Facebook's own GraphQL endpoints using your logged-in session (no third-party servers). Files are saved through `chrome.downloads` with retry and resume handling; in ZIP mode the files are fetched into memory and written as one archive with a dependency-free ZIP writer. Everything lands under `Downloads/bluemaster/`.

## Privacy

Bluemaster talks only to `facebook.com` and to GitHub (to check for a newer release). Cookies, tokens and downloaded media never leave your browser. There is no analytics or telemetry.

## Responsible use

This extension automates actions on your own Facebook account. You are responsible for complying with Facebook's Terms of Service and with the law in your jurisdiction, including copyright and privacy rules for any content you download or any people you message. Use reasonable rate limits; aggressive automation can get an account restricted.

## Releasing

CI runs type-check, lint and build on every push and pull request. To publish a version: bump `version` in `package.json`, commit, then push a matching tag. The release workflow builds the extension, attaches `bluemaster-<version>.zip` (plus a SHA-256 checksum) to a GitHub Release, and the extension's update check picks it up.

```bash
git tag v1.0.0 && git push origin v1.0.0
```

## Contributing

Issues and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) for setup, conventions and the PR checklist, and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community rules. Security issues go through [SECURITY.md](SECURITY.md); the data handling is described in [PRIVACY.md](PRIVACY.md). Changes per version are in [CHANGELOG.md](CHANGELOG.md). Keep the naming rules above and the single 8 px border radius used across the UI kit in `src/modules/shared/ui`.

## License

[MIT](LICENSE) © 2026 Trịnh Xuân Thuỷ

---

<details>
<summary><strong>Tiếng Việt</strong></summary>

**Bluemaster for Facebook** là tiện ích mở rộng mã nguồn mở, thêm một thanh công cụ bên cạnh Facebook: tải hàng loạt ảnh/video/reels/story của trang cá nhân hoặc nhóm, tải nhiều URL cùng lúc, quét UID, gửi tin nhắn hàng loạt qua inbox, lấy access token và quản lý cookies.

**Cài đặt**: tải file zip ở trang [Releases](https://github.com/thuytx03/bluemaster/releases/latest), giải nén, vào `chrome://extensions`, bật *Chế độ nhà phát triển*, chọn *Tải tiện ích đã giải nén* và trỏ tới thư mục vừa giải nén. Mở facebook.com, bấm nút nổi ở mép phải để mở thanh công cụ.

**Phát triển**: `pnpm install` rồi `pnpm dev` (bản dev) hoặc `pnpm build` (bản phát hành). `pnpm check` chạy kiểm tra kiểu và lint.

Dự án không liên quan tới Meta. Bạn tự chịu trách nhiệm tuân thủ điều khoản Facebook và pháp luật khi dùng các tính năng tự động.

</details>
