# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

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
