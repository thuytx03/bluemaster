import packageData from "package.json"
export const extensionInfo = {
  name: packageData.name,
  description: packageData.description,
  author: packageData.author,
  version: packageData.version,
};
