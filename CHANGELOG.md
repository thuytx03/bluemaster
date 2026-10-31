# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.2] - 2026-10-31

### Added
- Auto inbox: scheduled sending now works. The campaign runs in the service worker, is persisted in extension storage and is driven by `chrome.alarms`, so it starts at the chosen time and keeps going after the panel is closed, the page is reloaded or Chrome stops the worker. Optional end time stops it ("Hết giờ gửi"); "Gửi ngay" skips the wait. Reopening Auto Inbox shows the running campaign.

## [1.0.1] - 2026-10-31

### Fixed
- Auto inbox: the request config was lost whenever the service worker restarted, so scans and sends failed with "đóng và mở lại cửa sổ trình duyệt"; it is now reloaded on demand and refreshed once on stale-token errors.
- Sidebar: no more white flash on page load when the saved panel position is "center" or "full".

### Changed
- Auto inbox: customer scan runs up to 4 parallel time-sliced lanes with work stealing, asks for larger pages, drops the fixed 20-second wait at the end of every scan and backs off faster on errors.
- Auto inbox: scan results are cached per page for 7 days; re-scanning only fetches threads updated since, with a "Quét lại từ đầu" option for a full pass.
- Auto inbox: the stop button now ends the scan and keeps what was found; progress shows elapsed time and rate instead of a fixed 100%.
- Auto inbox: page list cached for 15 minutes with a refresh button; readable template tokens (`{name}`, `{me}`, `{you}`, `{emoji}`); native emoji picker.
- Manifest: `unlimitedStorage` so large inboxes and download history fit in extension storage.
- Update check: reads `version.json` from the repository (6-hour alarm, 1-hour cache) instead of the rate-limited GitHub API; proper semver comparison; builds below `min_supported` are blocked with an update screen; system notification fixed for MV3 (bundled icon, click handler registered at worker start). Needs the `alarms` permission.

## [1.0.0] - 2026-10-31

First public release under the Bluemaster name.

### Added
- Bulk download of photos, videos, reels, highlighted stories and active stories for profiles and groups, with file-name format presets, date-range filter, concurrency and delay controls, per-highlight folders.
- Multi-URL downloader with automatic type detection (post, video/reel/watch, story, album, comment video).
- Single-ZIP save mode so the browser asks where to save only once.
- Download core with retry and resume; persisted download history with per-job retry.
- Settings page with per-type file-name presets, theme, language and layout.
- Auto-run helpers for Facebook: block story/chat "seen" (XHR, fetch and WebSocket), show hidden reaction totals, video download and native-controls buttons.
- UID scraper, bulk inbox messaging, access-token and cookie tools carried over from the previous project.
- GitHub Actions CI (type-check, lint, build) and tag-driven releases.

### Changed
- Rebranded from "Xthuy Social" / "Facebook Master Tool"; Tailwind prefix is now `bm-`, downloads go to `Downloads/bluemaster`.
- Facebook service uses current GraphQL document IDs with legacy fallbacks.

### Removed
- Instagram, Threads, X, TikTok and Zalo features; the extension is Facebook-only.

[1.0.0]: https://github.com/thuytx03/bluemaster/releases/tag/v1.0.0
[1.0.1]: https://github.com/thuytx03/bluemaster/compare/v1.0.0...v1.0.1
[1.0.2]: https://github.com/thuytx03/bluemaster/compare/v1.0.1...v1.0.2
