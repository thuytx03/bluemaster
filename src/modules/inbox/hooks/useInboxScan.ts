import { useCallback, useEffect, useRef, useState } from 'react'
import { EStorageKey } from 'src/constants/enum'
import { chromeUtils } from 'src/utils/chrome.util'
import inboxService from 'src/modules/inbox/services/inbox.service'
import useInboxStore from 'src/modules/inbox/stores/inbox.store'
import { ICustomer, IFanpage, IInboxScanCache } from 'src/modules/inbox/types/inbox.types'

export type TScanMode = 'auto' | 'full'

export interface IScanInfo {
  /** Unix ms when the shown list was last scanned */
  scannedAt: number
  /** Every thread was visited */
  complete: boolean
  /** Customers added or updated by the last scan */
  changed: number
  elapsedMs: number
  requests: number
  /** Loaded from the cache without hitting Facebook */
  fromCache: boolean
  warning?: string
}

export interface IUseInboxScanReturn {
  loadingPages: boolean
  scanningInbox: boolean
  /** Customers found so far (cached + new) */
  scanProgress: number
  /** Unix ms when the running scan started, 0 when idle */
  scanStartedAt: number
  pageLoadError: string | null
  scanError: string | null
  scanInfo: IScanInfo | null
  concurrency: number
  setConcurrency: (value: number) => void
  /** `force` skips the 15-minute cache */
  fetchPages: (force?: boolean) => Promise<void>
  /** Unix ms of the list currently shown, null when unknown */
  pagesFetchedAt: number | null
  /** `auto` reuses the cached result and only fetches newer threads; `full` starts over */
  startScan: (fanpage: IFanpage, mode?: TScanMode) => Promise<void>
  /** Ends the running scan and keeps what was found */
  stopScan: () => void
}

const PAGES_CACHE_TTL_MS = 15 * 60 * 1000
const SCAN_CACHE_TTL_DAYS = 7
const DEFAULT_CONCURRENCY = 3

interface IPagesCache {
  pages: IFanpage[]
  fetchedAt: number
}

const scanCacheKey = (pageId: string) => `${EStorageKey.INBOX_SCAN_CACHE}:${pageId}`

export function useInboxScan(): IUseInboxScanReturn {
  const { setPages, selectPage, setCustomers, setTotalCustomers } = useInboxStore()

  const [loadingPages, setLoadingPages] = useState(false)
  const [scanningInbox, setScanningInbox] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanStartedAt, setScanStartedAt] = useState(0)
  const [pageLoadError, setPageLoadError] = useState<string | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [scanInfo, setScanInfo] = useState<IScanInfo | null>(null)
  const [pagesFetchedAt, setPagesFetchedAt] = useState<number | null>(null)
  const [concurrency, setConcurrencyState] = useState(DEFAULT_CONCURRENCY)
  const stopRequested = useRef(false)

  useEffect(() => {
    chromeUtils.getStorage<number>(EStorageKey.INBOX_SCAN_CONCURRENCY).then((v) => {
      if (v && v >= 1 && v <= 4) setConcurrencyState(v)
    })
  }, [])

  const setConcurrency = useCallback((value: number) => {
    const v = Math.min(4, Math.max(1, Math.round(value)))
    setConcurrencyState(v)
    chromeUtils.setStorage(EStorageKey.INBOX_SCAN_CONCURRENCY, v)
  }, [])

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

      const result = await inboxService.getPageList(userId)

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
    async (fanpage: IFanpage, mode: TScanMode = 'auto') => {
      const startedAt = Date.now()
      stopRequested.current = false
      setScanningInbox(true)
      setScanError(null)
      setScanInfo(null)
      setScanProgress(0)
      setScanStartedAt(startedAt)
      selectPage(fanpage)

      try {
        // Show the previous result at once; the scan then only fetches what changed since
        let cache: IInboxScanCache | null = null
        if (mode === 'auto') {
          cache = await chromeUtils.getStorage<IInboxScanCache>(scanCacheKey(fanpage.id))
          if (cache?.customers?.length) {
            setCustomers(cache.customers)
            setTotalCustomers(cache.customers.length)
            setScanProgress(cache.customers.length)
          } else {
            cache = null
          }
        }
        const incremental = !!cache && cache.complete && cache.newestUpdatedAt > 0
        const known = new Map<string, ICustomer>((cache?.customers ?? []).map((c) => [c.id, c]))
        const baseCount = known.size

        const result = await inboxService.scanInboxThreads(fanpage.id, {
          concurrency,
          since: incremental && cache ? cache.newestUpdatedAt : undefined,
          shouldStop: () => stopRequested.current,
          onProgress: (found) => setScanProgress(incremental ? baseCount + found : Math.max(found, baseCount))
        })

        if (!result.success || !result.data) {
          const errMsg = typeof result.error === 'string' ? result.error : JSON.stringify(result.error)
          setScanError(errMsg ?? 'Không quét được inbox')
          return
        }

        const { customers: scanned, complete, newestUpdatedAt, requests, warning } = result.data

        // An incremental scan adds to the cache; a full scan replaces it unless it stopped early,
        // in which case the cached entries fill in what was not reached yet.
        const merged = new Map<string, ICustomer>(incremental || !complete ? known : [])
        for (const c of scanned) merged.set(c.id, c)
        const customers = Array.from(merged.values()).sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))

        setCustomers(customers)
        setTotalCustomers(customers.length)
        setScanProgress(customers.length)

        const scannedAt = Date.now()
        await chromeUtils.setStorage<IInboxScanCache>(
          scanCacheKey(fanpage.id),
          {
            pageId: fanpage.id,
            customers,
            newestUpdatedAt: Math.max(newestUpdatedAt, cache?.newestUpdatedAt ?? 0),
            complete,
            scannedAt
          },
          { expireInDays: SCAN_CACHE_TTL_DAYS }
        )

        setScanInfo({
          scannedAt,
          complete,
          changed: scanned.length,
          elapsedMs: scannedAt - startedAt,
          requests,
          fromCache: incremental,
          warning
        })
      } catch (e: any) {
        setScanError(e.message ?? 'Đã xảy ra lỗi khi quét')
      } finally {
        setScanningInbox(false)
        setScanStartedAt(0)
      }
    },
    [concurrency, selectPage, setCustomers, setTotalCustomers]
  )

  const stopScan = useCallback(() => {
    stopRequested.current = true
  }, [])

  return {
    loadingPages,
    scanningInbox,
    scanProgress,
    scanStartedAt,
    pageLoadError,
    scanError,
    scanInfo,
    concurrency,
    setConcurrency,
    fetchPages,
    pagesFetchedAt,
    startScan,
    stopScan,
  }
}

export default useInboxScan
