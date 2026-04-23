import packageData from "../../package.json"
import { API_BASE_URL } from "./api"
export const EXTENSION_INFO = {
    name: packageData.name,
    displayName: packageData.displayName,
    description: packageData.description,
    author: packageData.author,
    version: packageData.version,
    link_download: API_BASE_URL + '/download',
    link_info: API_BASE_URL + '/extension.json'
}
export const COOKIE_DOMAIN_FCHAT = 'https://fchat.ai'