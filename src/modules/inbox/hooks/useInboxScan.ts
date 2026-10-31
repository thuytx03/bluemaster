import { useCallback, useState } from 'react'
import { EStorageKey } from 'src/constants/enum'
import { chromeUtils } from 'src/utils/chrome.util'
import inboxService from 'src/modules/inbox/services/inbox.service'
import useInboxStore from 'src/modules/inbox/stores/inbox.store'
import { ICustomer, IFanpage } from 'src/modules/inbox/types/inbox.types'

export interface IUseInboxScanReturn {
  loadingPages: boolean
  scanningInbox: boolean
  scanProgress: number
  scanTotal: number
  pageLoadError: string | null
  scanError: string | null
  /** `force` skips the 15-minute cache */
  fetchPages: (force?: boolean) => Promise<void>
  /** Unix ms of the list currently shown, null when unknown */
  pagesFetchedAt: number | null
  startScan: (fanpage: IFanpage) => Promise<void>
  stopScan: () => void
}

const PAGES_CACHE_TTL_MS = 15 * 60 * 1000

interface IPagesCache {
  pages: IFanpage[]
  fetchedAt: number
}

export function useInboxScan(): IUseInboxScanReturn {
  const { setPages, selectPage, setCustomers, setTotalCustomers } = useInboxStore()

  const [loadingPages, setLoadingPages] = useState(false)
  const [scanningInbox, setScanningInbox] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanTotal, setScanTotal] = useState(0)
  const [pageLoadError, setPageLoadError] = useState<string | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [, setStopRequested] = useState(false)
  const [pagesFetchedAt, setPagesFetchedAt] = useState<number | null>(null)

  const fetchPages = useCallback(async (force = false) => {
    setLoadingPages(true)
    setPageLoadError(null)

    try {
      if (!force) {
        const cached = await chromeUtils.getStorage<IPagesCache>(EStorageKey.INBOX_PAGES_CACHE)
        if (cached?.pages?.length && Date.now() - cached.fetchedAt < PAGES_CACHE_TTL_MS) {
          setPages(cached.pages)
          setPagesFetchedAt(cached.fetchedAt)
          return
        }
      }

      const userId = await inboxService.getCUserFromCookie()
      if (!userId) {
        setPageLoadError('Không tìm thấy tài khoản Facebook. Vui lòng đăng nhập.')
        return
      }

      const result = await inboxService.getPageList(userId, (count, isComplete) => {
        if (isComplete) {
          setScanProgress(count)
          setScanTotal(count)
        }
      })

      if (!result.success || !result.data) {
        setPageLoadError(typeof result.error === 'string' ? result.error : 'Không tải được danh sách Fanpage')
        return
      }
      setPages(result.data.pages)
      const fetchedAt = Date.now()
      setPagesFetchedAt(fetchedAt)
      await chromeUtils.setStorage<IPagesCache>(EStorageKey.INBOX_PAGES_CACHE, {
        pages: result.data.pages,
        fetchedAt
      })
    } catch (e: any) {
      console.log("useInboxScan -> fetchPages -> error: ", e)
      setPageLoadError(e.message ?? 'Đã xảy ra lỗi')
    } finally {
      setLoadingPages(false)
    }
  }, [setPages])

  const startScan = useCallback(
    async (fanpage: IFanpage) => {
      setScanningInbox(true)
      setScanError(null)
      setScanProgress(0)
      setScanTotal(0)
      setStopRequested(false)
      selectPage(fanpage)

      try {
        const result = await inboxService.scanInboxThreads(fanpage.id, (customers: ICustomer[], total: number) => {
          setScanProgress(total)
          setScanTotal(total)
        })

        if (!result.success || !result.data) {
          const errMsg = typeof result.error === 'string' ? result.error : JSON.stringify(result.error)
          setScanError(errMsg ?? 'Không quét được inbox')
          return
        }
        setCustomers(result.data.customers)
        setTotalCustomers(result.data.total)
        setScanTotal(result.data.total)
        setScanProgress(result.data.total)
      } catch (e: any) {
        setScanError(e.message ?? 'Đã xảy ra lỗi khi quét')
      } finally {
        setScanningInbox(false)
      }
    },
    [selectPage, setCustomers, setTotalCustomers]
  )

  const stopScan = useCallback(() => {
    setStopRequested(true)
    setScanningInbox(false)
  }, [])

  return {
    loadingPages,
    scanningInbox,
    scanProgress,
    scanTotal,
    pageLoadError,
    scanError,
    fetchPages,
    pagesFetchedAt,
    startScan,
    stopScan,
  }
}

export default useInboxScan
