import { Spin } from "antd"
import axios from "axios"
import { FC, PropsWithChildren, useEffect, useState } from "react"
import { EXTENSION_INFO } from "../../../constants"
import { ESocialProvider, EStorageKey } from "../../../constants/enum"
import { IAccounts } from "../../accounts/types/account.interface"
import { TTheme } from "../types/common.interface"
import useAuthStore from "../../../store/auth"
import useExtensionState from "../../../store/extension-state"
import { chromeUtils } from "../../../utils/chrome.util"

const InitializeApp: FC<PropsWithChildren> = ({ children }) => {
  const { updateAccountData } = useAuthStore()
  const { setExtensionState } = useExtensionState()
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
      let isUpdateAvailable = false
      let extensionLatestVersion = chrome.runtime.getManifest().version

      try {
        const { data } = await axios.get(
          `${EXTENSION_INFO.link_info}?t=${new Date().getTime()}`
        )
        extensionLatestVersion = data.version
        const { version: currentVersion } = chrome.runtime.getManifest()
        isUpdateAvailable = currentVersion !== extensionLatestVersion
      } catch (e) {
        console.warn("Could not check for updates:", e)
      }
      const theme = await chromeUtils.getStorage<TTheme>(EStorageKey.THEME)
      if (accountsInStorage) {
        const updatedAccounts = { ...accountsInStorage }
        const providers = Object.keys(accountsInStorage) as ESocialProvider[]

        for (const provider of providers) {
          if (updatedAccounts[provider]) {
            updatedAccounts[provider].avatar = await getBlobFileUrl(
              updatedAccounts[provider].avatar
            )
          }
        }
        updateAccountData(updatedAccounts)
        setExtensionState({
          isUpdateAvailable,
          currentVersion: extensionLatestVersion,
          theme: theme || "light"
        })
      }
    } catch (error) {
      console.log("Đã có lỗi xảy ra khi khởi tạo extension", error)
    } finally {
      setIsInitialized(false)
    }
  }

  useEffect(() => {
    initializeApp()
  }, [])

  return isInitialized ? (
    <div className="h-screen flex items-center justify-center">
      <Spin />
    </div>
  ) : (
    children
  )
}

export default InitializeApp
