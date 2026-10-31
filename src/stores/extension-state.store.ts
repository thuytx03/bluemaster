import { create } from "zustand"

import { ESingleDownloadType, EStorageKey } from "src/constants/enum"
import {
  TFileNameToken,
  TSingleFileNameConfig
} from "src/modules/download/types/download.types"
import { TLayoutMode, TPanelPosition, TTheme } from "src/modules/shared/types/common.types"
import { GITHUB_RELEASES_URL } from "src/constants/api.constants"
import { chromeUtils } from "src/utils/chrome.util"

interface IExtensionState {
  /** Newest released version according to the last update check */
  latestVersion: string
  minSupportedVersion: string | null
  isUpdateAvailable: boolean
  /** Running build is below the supported minimum: the panel is blocked */
  isUpdateRequired: boolean
  updateNotes: string
  downloadUrl: string
  theme: TTheme
  layoutMode: TLayoutMode
  /** Panel zoom factor (1 = 100%) */
  uiScale: number
  panelPosition: TPanelPosition
  /** Per-type file name format for the multi-URL downloader */
  downloadSingleFileNameConfig: TSingleFileNameConfig
}

interface IExtensionStateStore {
  extensionState: IExtensionState
  setExtensionState: (newState: Partial<IExtensionState>) => void
  setTheme: (theme: TTheme) => Promise<void> | void
  setLayoutMode: (mode: TLayoutMode) => Promise<void> | void
  setUiScale: (scale: number) => Promise<void> | void
  setPanelPosition: (position: TPanelPosition) => Promise<void> | void
  setDownloadSingleFileNameConfig: (
    type: ESingleDownloadType,
    format: TFileNameToken[]
  ) => Promise<void>
}

const useExtensionState = create<IExtensionStateStore>((set, get) => ({
  extensionState: {
    latestVersion: "",
    minSupportedVersion: null,
    isUpdateAvailable: false,
    isUpdateRequired: false,
    updateNotes: "",
    downloadUrl: GITHUB_RELEASES_URL,
    theme: "light",
    layoutMode: "push",
    uiScale: 1,
    panelPosition: "right",
    downloadSingleFileNameConfig: {}
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
  },
  setLayoutMode: async (layoutMode) => {
    set((state) => ({
      extensionState: { ...state.extensionState, layoutMode }
    }))
    await chromeUtils.setStorage(EStorageKey.LAYOUT_MODE, layoutMode)
  },
  setUiScale: async (uiScale) => {
    set((state) => ({
      extensionState: { ...state.extensionState, uiScale }
    }))
    await chromeUtils.setStorage(EStorageKey.UI_SCALE, uiScale)
  },
  setPanelPosition: async (panelPosition) => {
    set((state) => ({
      extensionState: { ...state.extensionState, panelPosition }
    }))
    await chromeUtils.setStorage(EStorageKey.PANEL_POSITION, panelPosition)
  },
  setDownloadSingleFileNameConfig: async (type, format) => {
    const next: TSingleFileNameConfig = {
      ...get().extensionState.downloadSingleFileNameConfig,
      [type]: format
    }
    set((state) => ({
      extensionState: { ...state.extensionState, downloadSingleFileNameConfig: next }
    }))
    await chromeUtils.setStorage(EStorageKey.DOWNLOAD_SINGLE_FILE_NAME_CONFIG, next)
  }
}))

export default useExtensionState
