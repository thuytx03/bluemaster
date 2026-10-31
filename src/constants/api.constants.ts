/** Public repository: the releases page is the download link, the latest release tag is the update manifest */
export const GITHUB_REPO = "thuytx03/bluemaster"
export const GITHUB_REPO_URL = `https://github.com/${GITHUB_REPO}`
export const GITHUB_RELEASES_URL = `${GITHUB_REPO_URL}/releases/latest`
/** GitHub API: `tag_name` of the latest published release (e.g. "v1.2.0"); 404 while no release exists */
export const GITHUB_LATEST_RELEASE_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`
export const GITHUB_ICON_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}/HEAD/assets/icon.png`

/** "v1.2.0" -> "1.2.0" */
export const versionFromTag = (tag: unknown) =>
  typeof tag === "string" ? tag.replace(/^v/i, "").trim() : ""
