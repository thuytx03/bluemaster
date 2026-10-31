import { create } from "zustand"

import { EStorageKey } from "src/constants/enum"
import {
  DEFAULT_PINNED,
  MAX_PINNED,
  TToolKey
} from "src/configs/tools.config"
import { chromeUtils } from "src/utils/chrome.util"

interface IPinnedToolsStore {
  pinned: TToolKey[]
  loaded: boolean
  load: () => Promise<void>
  toggle: (key: TToolKey) => Promise<void>
  /** Replace the pinned list (used for drag-and-drop reordering) */
  setPinned: (keys: TToolKey[]) => Promise<void>
  isPinned: (key: TToolKey) => boolean
}

const usePinnedTools = create<IPinnedToolsStore>((set, get) => ({
  pinned: DEFAULT_PINNED,
  loaded: false,
  load: async () => {
    if (get().loaded) return
    try {
      const stored = await chromeUtils.getStorage<TToolKey[]>(EStorageKey.PINNED_TOOLS)
      if (Array.isArray(stored)) set({ pinned: stored })
    } catch (e) {
      console.warn("Could not load pinned tools", e)
    } finally {
      set({ loaded: true })
    }
  },
  toggle: async (key) => {
    const current = get().pinned
    const next = current.includes(key)
      ? current.filter((k) => k !== key)
      : [...current, key].slice(-MAX_PINNED)
    set({ pinned: next })
    await chromeUtils.setStorage(EStorageKey.PINNED_TOOLS, next)
  },
  setPinned: async (keys) => {
    const next = keys.slice(0, MAX_PINNED)
    set({ pinned: next })
    await chromeUtils.setStorage(EStorageKey.PINNED_TOOLS, next)
  },
  isPinned: (key) => get().pinned.includes(key)
}))

export default usePinnedTools
