import packageData from "../../package.json"
import { GITHUB_LATEST_RELEASE_API, GITHUB_RELEASES_URL } from "./api.constants"
export const EXTENSION_INFO = {
    name: packageData.name,
    displayName: packageData.displayName,
    description: packageData.description,
    author: packageData.author,
    version: packageData.version,
    link_download: GITHUB_RELEASES_URL,
    link_info: GITHUB_LATEST_RELEASE_API
}
export const RUN_FUNC = "bluemaster:runFunc"
