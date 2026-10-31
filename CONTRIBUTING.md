# Contributing to Bluemaster

Thanks for taking the time to contribute. This document explains how to set up the project, what we expect in a pull request, and the conventions the codebase follows.

## Getting started

```bash
git clone https://github.com/thuytx03/bluemaster.git
cd bluemaster
corepack enable        # pnpm is pinned in package.json ("packageManager")
pnpm install
pnpm dev               # hot-reload build in build/chrome-mv3-dev
```

Load `build/chrome-mv3-dev` as an unpacked extension in `chrome://extensions` (Developer mode), then open facebook.com.

## Before you open a pull request

1. Run `pnpm check` (type-check + lint) and `pnpm build`. CI runs exactly the same commands.
2. Test the change in the browser on a real Facebook page. Facebook's GraphQL doc IDs and DOM change often, so a passing build does not prove a feature works.
3. Keep the PR focused: one feature or fix per PR.
4. Describe how to reproduce or verify the change in the PR template.

## Conventions

- **File names**: React components and pages are `PascalCase.tsx` (pages end with `Page`); hooks are `useThing.ts`; everything else is `kebab-name.<kind>.ts` where kind is `service`, `util`, `store`, `types`, `constants`, `config` or `feature`. Folders are kebab-case and plural.
- **Imports**: use the `src/` alias for anything outside the current folder.
- **Styling**: Tailwind with the `bm-` prefix only, inside the sidebar's shadow DOM. One 8 px radius everywhere (`bm-rounded-lg`); `bm-rounded-full` only for real circles. Use the kit in `src/modules/shared/ui`, do not add a UI library.
- **i18n**: every user-visible string goes through `t("key")` with entries in both `src/assets/languages/vi.json` and `en.json`.
- **Facebook requests**: put GraphQL calls in `src/modules/facebook/services/facebook.service.ts`. When adding a doc ID, keep the previous one as a fallback via `firstSuccessful` so a Facebook rollout does not break everyone at once.
- **Commits**: imperative, present tense, with a type prefix (`feat:`, `fix:`, `ci:`, `docs:`, `refactor:`, `chore:`).

## Reporting bugs and requesting features

Use the issue templates. For bugs, include the extension version, browser version, the console output filtered by `Bluemaster`, and the kind of URL you used (never paste cookies or tokens).

## Releasing (maintainers)

Bump `version` in `package.json`, update `CHANGELOG.md`, commit, then push a tag `vX.Y.Z`. The release workflow builds, signs the checksum and publishes the zip.
