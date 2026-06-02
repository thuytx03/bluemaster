import { useCallback, useState } from 'react'
import inboxService from '../services/inbox.service'
import useInboxStore from '../store/inbox.store'
import { ICustomer, IFanpage } from '../types/inbox.interface'

export interface IUseInboxScanReturn {
  loadingPages: boolean
  scanningInbox: boolean
  scanProgress: number
  scanTotal: number
  pageLoadError: string | null
  scanError: string | null
  fetchPages: () => Promise<void>
  startScan: (fanpage: IFanpage) => Promise<void>
  stopScan: () => void
}

export function useInboxScan(): IUseInboxScanReturn {
  const { setPages, selectPage, setCustomers, setTotalCustomers } = useInboxStore()

  const [loadingPages, setLoadingPages] = useState(false)
  const [scanningInbox, setScanningInbox] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanTotal, setScanTotal] = useState(0)
  const [pageLoadError, setPageLoadError] = useState<string | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [stopRequested, setStopRequested] = useState(false)

  const fetchPages = useCallback(async () => {
    setLoadingPages(true)
    setPageLoadError(null)

    try {
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
    startScan,
    stopScan,
  }
}

export default useInboxScan
