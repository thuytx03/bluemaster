import packageData from "../../package.json"
export const EXTENSION_INFO = {
    name: packageData.name,
    displayName: packageData.displayName,
    description: packageData.description,
    author: packageData.author,
    version: packageData.version
}
export const COOKIE_DOMAIN_FCHAT = 'https://fchat.ai'