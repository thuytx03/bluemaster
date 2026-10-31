/**
 * Runs from the `version` lifecycle script (`pnpm version <patch|minor|major>`).
 * npm has already bumped package.json; this keeps the other version-bearing
 * files in step so a release is one command:
 *   - version.json  `latest` <- package.json version (min_supported, notes, download_url untouched)
 *   - CHANGELOG.md  "[Unreleased]" becomes "[x.y.z] - YYYY-MM-DD" with a fresh empty Unreleased
 *                   section above it and a compare link at the bottom
 * The files are staged so npm includes them in the version commit.
 */
import { execFileSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "..")
const read = (name) => readFileSync(resolve(root, name), "utf8")
const write = (name, text) => writeFileSync(resolve(root, name), text)

const pkg = JSON.parse(read("package.json"))
const version = pkg.version
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`sync-version: package.json version "${version}" is not x.y.z`)
  process.exit(1)
}
const repoUrl = pkg.homepage ?? `https://github.com/${pkg.name}`
const staged = []

// version.json
const manifest = JSON.parse(read("version.json"))
if (manifest.latest !== version) {
  manifest.latest = version
  write("version.json", JSON.stringify(manifest, null, 2) + "\n")
  staged.push("version.json")
  console.log(`sync-version: version.json latest -> ${version}`)
}

// CHANGELOG.md
const changelog = read("CHANGELOG.md")
if (changelog.includes(`## [${version}]`)) {
  console.log(`sync-version: CHANGELOG.md already has a [${version}] section, left as is`)
} else if (!changelog.includes("## [Unreleased]")) {
  console.warn("sync-version: CHANGELOG.md has no [Unreleased] section, left as is")
} else {
  const date = new Date().toISOString().slice(0, 10)
  const previous = changelog.match(/^## \[(\d+\.\d+\.\d+)\]/m)?.[1]
  let next = changelog.replace(
    "## [Unreleased]",
    `## [Unreleased]\n\n## [${version}] - ${date}`
  )
  const compare = previous
    ? `${repoUrl}/compare/v${previous}...v${version}`
    : `${repoUrl}/releases/tag/v${version}`
  next = next.trimEnd() + `\n[${version}]: ${compare}\n`
  write("CHANGELOG.md", next)
  staged.push("CHANGELOG.md")
  console.log(`sync-version: CHANGELOG.md [Unreleased] -> [${version}] - ${date}`)
}

if (staged.length) execFileSync("git", ["add", ...staged], { cwd: root, stdio: "inherit" })
