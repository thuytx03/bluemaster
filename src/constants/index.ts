import packageData from "../../package.json"
export const EXTENSION_INFO = {
    name: packageData.name,
    displayName: packageData.displayName,
    description: packageData.description,
    author: packageData.author,
    version: packageData.version
}