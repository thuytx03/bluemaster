import axios from "axios"
import { FC, PropsWithChildren, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import iconUrl from "url:assets/icon.png"

import { EXTENSION_INFO } from "src/constants"
import { ESocialProvider, EStorageKey } from "src/constants/enum"
import UpdateRequiredScreen from "src/modules/shared/components/UpdateRequiredScreen"
import { requestVersionCheck } from "src/modules/shared/services/version-check.service"
import { IAccounts } from "src/modules/facebook/types/account.types"
import useDownloadProcesses from "src/stores/download-process.store"
import { TSingleFileNameConfig } from "src/modules/download/types/download.types"
import { TLayoutMode, TPanelPosition, TTheme } from "src/modules/shared/types/common.types"
import useAuthStore from "src/stores/auth.store"
import useExtensionState from "src/stores/extension-state.store"
import { chromeUtils } from "src/utils/chrome.util"

const InitializeApp: FC<PropsWithChildren> = ({ children }) => {
  const { t } = useTranslation()
  const { updateAccountData, authenticate } = useAuthStore()
  const { extensionState, setExtensionState } = useExtensionState()
  const hydrateDownloadHistory = useDownloadProcesses((s) => s.hydrate)
  const [isInitialized, setIsInitialized] = useState(true)

  const getBlobFileUrl = async (url: string) => {
    const { data } = await axios.get(url, {
      responseType: "blob"
    })
    return URL.createObjectURL(data)
  }

  const initializeApp = async () => {
    try {
      const accountsInStorage = await chromeUtils.getStorage<IAccounts>(
        EStorageKey.ACCOUNTS
      )
      // The background owns the update check (cache + alarm); null means offline
      // or no answer yet, in which case the panel simply does not nag.
      const versionCheck = await requestVersionCheck()
      const theme = await chromeUtils.getStorage<TTheme>(EStorageKey.THEME)
      const layoutMode = await chromeUtils.getStorage<TLayoutMode>(EStorageKey.LAYOUT_MODE)
      const uiScale = await chromeUtils.getStorage<number>(EStorageKey.UI_SCALE)
      const panelPosition = await chromeUtils.getStorage<TPanelPosition>(EStorageKey.PANEL_POSITION)
      const downloadSingleFileNameConfig =
        await chromeUtils.getStorage<TSingleFileNameConfig>(
          EStorageKey.DOWNLOAD_SINGLE_FILE_NAME_CONFIG
        )
      await hydrateDownloadHistory()
      setExtensionState({
        ...(versionCheck
          ? {
              latestVersion: versionCheck.latestVersion,
              minSupportedVersion: versionCheck.minSupportedVersion,
              isUpdateAvailable: versionCheck.isUpdateAvailable,
              isUpdateRequired: versionCheck.isUpdateRequired,
              updateNotes: versionCheck.notes,
              downloadUrl: versionCheck.downloadUrl
            }
          : {}),
        theme: theme || "light",
        layoutMode: layoutMode === "overlay" ? "overlay" : "push",
        uiScale: typeof uiScale === "number" && uiScale >= 0.8 && uiScale <= 1.5 ? uiScale : 1,
        panelPosition: ["right", "left", "center", "full"].includes(panelPosition as string) ? (panelPosition as TPanelPosition) : "right",
        downloadSingleFileNameConfig: downloadSingleFileNameConfig || {}
      })
      if (accountsInStorage) {
        const updatedAccounts = { ...accountsInStorage }
        const providers = Object.keys(accountsInStorage) as ESocialProvider[]

        for (const provider of providers) {
          const account = updatedAccounts[provider]
          if (account) {
            account.avatar = await getBlobFileUrl(account.avatar)
          }
        }
        updateAccountData(updatedAccounts)
      }
      // Only one Facebook account lives in the browser: verify it silently on start.
      if (!accountsInStorage?.[ESocialProvider.FACEBOOK]) {
        try {
          await authenticate(ESocialProvider.FACEBOOK)
        } catch (e) {
          console.warn("Facebook auto-authenticate failed:", e)
        }
      }
    } catch (error) {
      console.log("Đã có lỗi xảy ra khi khởi tạo extension", error)
    } finally {
      setIsInitialized(false)
    }
  }

  useEffect(() => {
    initializeApp()
    // Mount-only bootstrap: reads storage, verifies the account, loads history
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!isInitialized && extensionState.isUpdateRequired) {
    return <UpdateRequiredScreen />
  }

  return isInitialized ? (
    <div className="bm-flex bm-h-full bm-w-full bm-flex-col bm-items-center bm-justify-center bm-gap-4 bm-bg-app x-dots">
      <span className="bm-relative bm-inline-flex bm-h-14 bm-w-14 bm-items-center bm-justify-center">
        <span className="bm-absolute bm-inset-0 bm-rounded-2xl x-gradient bm-opacity-50 bm-animate-pulse-ring" />
        <span className="bm-relative bm-inline-flex bm-h-14 bm-w-14 bm-items-center bm-justify-center bm-rounded-2xl x-gradient bm-p-[2px] bm-shadow-glow">
          <span className="bm-inline-flex bm-h-full bm-w-full bm-items-center bm-justify-center bm-overflow-hidden bm-rounded-lg bm-bg-surface">
            <img src={iconUrl} alt="logo" className="bm-h-8 bm-w-8 bm-object-contain" />
          </span>
        </span>
      </span>
      <div className="bm-text-center">
        <div className="bm-text-[13px] bm-font-semibold x-gradient-text">
          {EXTENSION_INFO.displayName}
        </div>
        <div className="bm-mt-0.5 bm-text-[11.5px] bm-text-fg-muted">{t("initializing")}</div>
      </div>
      <div className="bm-h-1 bm-w-32 bm-overflow-hidden bm-rounded-full bm-bg-surface-3">
        <div className="bm-h-full bm-w-1/2 bm-rounded-full x-gradient bm-animate-shimmer" style={{ backgroundSize: "200% 100%" }} />
      </div>
    </div>
  ) : (
    children
  )
}

export default InitializeApp
