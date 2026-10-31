import axios from "axios"
import { create } from "zustand"

import { ESocialProvider, EStorageKey } from "src/constants/enum"
import { IAccounts } from "src/modules/facebook/types/account.types"
import facebookService from "src/modules/facebook/services/facebook.service"
import { chromeUtils } from "src/utils/chrome.util"

export interface IAuth {
  isAuthenticated: boolean
}

interface IAuthStore {
  accounts: IAccounts
  authenticate: (socialProvider: ESocialProvider) => Promise<void>
  logout: (socialProvider: ESocialProvider) => Promise<void>
  updateAccountData: (accountData: any) => void
}

const useAuthStore = create<IAuthStore>((setState, getState) => ({
  accounts: {
    [ESocialProvider.FACEBOOK]: null
  },

  authenticate: async <T extends ESocialProvider>(socialProvider: T) => {
    const authenticateFunction = {
      [ESocialProvider.FACEBOOK]: facebookService.getFacebookAccountData
    }
    const accountData = await authenticateFunction[socialProvider]()
    const accountsInStorage = await chromeUtils.getStorage<IAccounts>(
      EStorageKey.ACCOUNTS
    )
    await chromeUtils.setStorage(EStorageKey.ACCOUNTS, {
      ...accountsInStorage,
      [socialProvider]: accountData
    })

    const { data } = await axios.get(accountData?.avatar || "", {
      responseType: "blob"
    })
    URL.revokeObjectURL(getState().accounts[socialProvider]?.avatar || "")
    const avatarUrl = URL.createObjectURL(data)
    setState((state) => ({
      accounts: {
        ...state.accounts,
        [socialProvider]: { ...accountData, avatar: avatarUrl }
      }
    }))
  },

  updateAccountData: (newAccounts: IAccounts) => {
    setState((state) => ({
      accounts: { ...state.accounts, ...newAccounts }
    }))
  },

  logout: async <T extends ESocialProvider>(socialProvider: T) => {
    const accountsInStorage = await chromeUtils.getStorage<IAccounts>(
      EStorageKey.ACCOUNTS
    )
    delete accountsInStorage?.[socialProvider]
    await chromeUtils.setStorage(EStorageKey.ACCOUNTS, accountsInStorage)
    URL.revokeObjectURL(getState().accounts[socialProvider]?.avatar || "")
    setState((state) => ({
      accounts: {
        ...state.accounts,
        [socialProvider]: null
      }
    }))
  }
}))

export default useAuthStore
