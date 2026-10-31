# Privacy Policy

**Bluemaster for Facebook** is a browser extension that runs entirely on your device.

## What the extension accesses

- Your logged-in Facebook session (cookies and the `fb_dtsg` token) in order to call Facebook's own GraphQL endpoints on your behalf. This is required for every feature.
- Pages on `facebook.com` and `messenger.com`, where the sidebar and page helpers are injected.
- Your browser's download folder, through the `downloads` permission, to save media.

## What is stored

Settings (theme, language, file-name presets, save mode), download history, cached UIDs and scraper progress are stored in `chrome.storage.local` on your device. Nothing is synced to any server operated by this project.

## What is sent where

- Requests to **facebook.com** to fetch the media, UIDs and conversations you ask for.
- One request to **api.github.com** when the sidebar opens, to check whether a newer release exists. No identifiers are sent.

There is no analytics, telemetry, advertising or third-party SDK. The source code is public so you can verify this.

## Your responsibilities

The extension automates actions on your account. You are responsible for complying with Facebook's Terms of Service and applicable law for content you download and people you message.

## Contact

Questions about this policy: open an issue at https://github.com/thuytx03/bluemaster/issues.
