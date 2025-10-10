import cssText2 from "data-text:~/contents/websites/facebook/facebook.css"
import type { PlasmoCSConfig, PlasmoGetShadowHostId } from "plasmo"
import cssText from "data-text:~style.css"
import ExportUIDPage from "./websites/facebook/pages/ExportUIDPage"

export const config: PlasmoCSConfig = {
  matches: ["https://www.facebook.com/*"]
}

// Style
export const getStyle = (): HTMLStyleElement => {
  const styleElement = document.createElement("style")
  const baseFontSize = 16

  let updatedCssText = cssText.replaceAll(":root", ":host(plasmo-csui)")
  updatedCssText = updatedCssText.replace(/([\d.]+)rem/g, (_, remValue) => {
    return `${parseFloat(remValue) * baseFontSize}px`
  })

  styleElement.textContent = updatedCssText + "\n" + cssText2
  return styleElement
}

// ⚡ Gắn shadow-root host vào body
export const getShadowHostId: PlasmoGetShadowHostId = () => "plasmo-overlay-host"

const PlasmoOverlay = () => {
  return <ExportUIDPage />
}

export default PlasmoOverlay
