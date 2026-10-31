# Security Policy

## Supported versions

Only the latest release on the [releases page](https://github.com/thuytx03/bluemaster/releases) receives fixes.

## Reporting a vulnerability

Please do **not** open a public issue for security problems. Use GitHub's private reporting instead: go to the repository's **Security** tab and click **Report a vulnerability**. You will get an acknowledgement within 7 days.

Things we consider security-relevant for a browser extension:

- Any way for a web page (including facebook.com) to read cookies, tokens or downloaded data handled by the extension
- Any way for a page to trigger extension actions (downloads, messages, network requests) without the user's intent
- Leaking data to third-party servers (the extension should only talk to facebook.com and api.github.com)

## Scope notes

Bluemaster uses your own logged-in Facebook session. Reports about Facebook's own rate limits, CAPTCHAs or account restrictions are not security issues of this project.
