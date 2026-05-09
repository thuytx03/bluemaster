import { create } from "zustand"

import { EStorageKey } from "src/constants/enum"
import { TTheme } from "src/modules/shared/types/common.interface"
import { chromeUtils } from "src/utils/chrome.util"

interface IExtensionState {
  currentVersion: string
  isUpdateAvailable: boolean
  theme: TTheme
}

interface IExtensionStateStore {
  extensionState: IExtensionState
  setExtensionState: (newState: Partial<IExtensionState>) => void
  setTheme: (theme: TTheme) => Promise<void> | void
}

const useExtensionState = create<IExtensionStateStore>((set) => ({
  extensionState: {
    currentVersion: "",
    isUpdateAvailable: false,
    theme: "light"
  },
  setExtensionState: (newState) => {
    set((state) => ({
      extensionState: { ...state.extensionState, ...newState }
    }))
  },
  setTheme: async (theme) => {
    set((state) => ({
      extensionState: { ...state.extensionState, theme }
    }))
    await chromeUtils.setStorage(EStorageKey.THEME, theme)
    
    // Apply theme to the extension root if in content script
    const extensionRoot = document.querySelector(".xthuy-social-root")
    if (extensionRoot) {
      extensionRoot.className = `xthuy-social-root ${theme}`
    } else {
      // Fallback for options page or if root not found
      document.documentElement.setAttribute("class", theme)
    }
  }
}))

export default useExtensionState
