import { create } from "zustand"

import { ESocialProvider, EStorageKey } from "src/constants/enum"
import { chromeUtils } from "src/utils/chrome.util"
import {
  IBulkDownloadProcess,
  ISingleDownloadProcess
} from "src/modules/download/types/download.types"

type TBulkProcessState = Record<ESocialProvider, IBulkDownloadProcess[]>

interface IPersistedHistory {
  bulkProcesses: TBulkProcessState
  singleProcesses: ISingleDownloadProcess[]
}

/** Keep the history bounded so storage never grows unbounded */
const MAX_HISTORY_PER_LIST = 100

interface IDownloadProcessStore {
  bulkProcesses: TBulkProcessState
  singleProcesses: ISingleDownloadProcess[]

  addBulkProcess: (provider: ESocialProvider, process: IBulkDownloadProcess) => void
  removeBulkProcess: (provider: ESocialProvider, processId: string) => void
  updateBulkProcess: (
    provider: ESocialProvider,
    processId: string,
    payload: Partial<IBulkDownloadProcess>
  ) => void
  getBulkProcessesBySocial: (provider: ESocialProvider) => IBulkDownloadProcess[]

  addSingleProcess: (process: ISingleDownloadProcess) => void
  removeSingleProcess: (processId: string) => void
  updateSingleProcess: (processId: string, payload: Partial<ISingleDownloadProcess>) => void
  clearFinishedProcesses: () => void
  /** Load the persisted history (once, at startup) */
  hydrate: () => Promise<void>
  hydrated: boolean
}

const useDownloadProcesses = create<IDownloadProcessStore>((set, get) => ({
  bulkProcesses: {
    [ESocialProvider.FACEBOOK]: []
  },
  singleProcesses: [],
  hydrated: false,

  addBulkProcess: (provider, process) =>
    set((state) => ({
      bulkProcesses: {
        ...state.bulkProcesses,
        [provider]: [process, ...state.bulkProcesses[provider]]
      }
    })),
  removeBulkProcess: (provider, processId) =>
    set((state) => ({
      bulkProcesses: {
        ...state.bulkProcesses,
        [provider]: state.bulkProcesses[provider].filter((p) => p.id !== processId)
      }
    })),
  updateBulkProcess: (provider, processId, payload) =>
    set((state) => ({
      bulkProcesses: {
        ...state.bulkProcesses,
        [provider]: state.bulkProcesses[provider].map((p) =>
          p.id === processId ? { ...p, ...payload } : p
        )
      }
    })),
  getBulkProcessesBySocial: (provider) => get().bulkProcesses[provider],

  addSingleProcess: (process) =>
    set((state) => ({ singleProcesses: [process, ...state.singleProcesses] })),
  removeSingleProcess: (processId) =>
    set((state) => ({
      singleProcesses: state.singleProcesses.filter((p) => p.id !== processId)
    })),
  updateSingleProcess: (processId, payload) =>
    set((state) => ({
      singleProcesses: state.singleProcesses.map((p) =>
        p.id === processId ? { ...p, ...payload } : p
      )
    })),
  hydrate: async () => {
    if (get().hydrated) return
    try {
      const stored = await chromeUtils.getStorage<IPersistedHistory>(EStorageKey.DOWNLOAD_HISTORY)
      if (stored) {
        // Jobs that were running when the page unloaded cannot resume: mark them for retry
        const settle = <T extends { status: string }>(list: T[]): T[] =>
          list.map((p) => (p.status === "RUNNING" ? { ...p, status: "FAILED" } : p))
        set({
          bulkProcesses: {
            ...get().bulkProcesses,
            ...Object.fromEntries(
              Object.entries(stored.bulkProcesses ?? {}).map(([k, list]) => [k, settle(list ?? [])])
            )
          },
          singleProcesses: settle(stored.singleProcesses ?? [])
        })
      }
    } catch (error) {
      console.warn("[Bluemaster] could not load download history", error)
    } finally {
      set({ hydrated: true })
    }
  },
  clearFinishedProcesses: () =>
    set((state) => ({
      singleProcesses: state.singleProcesses.filter((p) => p.status === "RUNNING"),
      bulkProcesses: Object.fromEntries(
        Object.entries(state.bulkProcesses).map(([k, list]) => [
          k,
          list.filter((p) => p.status === "RUNNING")
        ])
      ) as TBulkProcessState
    }))
}))

/** Persist every change (debounced) so the history survives reloads */
let persistTimer: ReturnType<typeof setTimeout> | undefined
useDownloadProcesses.subscribe((state, prev) => {
  if (!state.hydrated) return
  if (state.bulkProcesses === prev.bulkProcesses && state.singleProcesses === prev.singleProcesses) return
  clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    const payload: IPersistedHistory = {
      bulkProcesses: Object.fromEntries(
        Object.entries(state.bulkProcesses).map(([k, list]) => [k, list.slice(0, MAX_HISTORY_PER_LIST)])
      ) as TBulkProcessState,
      singleProcesses: state.singleProcesses.slice(0, MAX_HISTORY_PER_LIST)
    }
    void chromeUtils.setStorage(EStorageKey.DOWNLOAD_HISTORY, payload)
  }, 300)
})

export default useDownloadProcesses
