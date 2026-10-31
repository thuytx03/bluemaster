import { delay } from "src/utils/common.util"

import {
  IApiResponse,
  ICustomer,
  IFanpage,
  IFbApiError,
  IFbRequestConfig,
  IInboxScanOptions,
  IInboxScanResult,
  IUserInfo
} from "src/modules/inbox/types/inbox.types"

function sendBgMessage<T = any>(message: Record<string, any>): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError)
        return reject(new Error(chrome.runtime.lastError.message))
      resolve(response)
    })
  })
}

// ==================== PAGE LIST ====================

export async function getPageList(
  userId: string,
  onProgress?: (count: number, isComplete: boolean) => void
): Promise<
  IApiResponse<{
    pages: IFanpage[]
    config: IFbRequestConfig
    userInfo: IUserInfo
  }>
> {
  const progressListener = (msg: any) => {
    if (msg.action === "INBOX_PAGE_LIST_PROGRESS" && onProgress) {
      onProgress(msg.payload.count, msg.payload.isComplete)
    }
  }
  chrome.runtime.onMessage.addListener(progressListener)

  try {
    const userInfoRes = await sendBgMessage<IApiResponse<IUserInfo>>({
      action: "GET_FB_USER_INFO",
      payload: { c_user: userId }
    })
    const userInfo: IUserInfo = userInfoRes.data ?? {
      id: userId,
      name: "Tài khoản cá nhân",
      avatar: ""
    }

    const pageRes = await sendBgMessage<{
      success: boolean
      data?: any[]
      request_config?: IFbRequestConfig
      error?: string
    }>({
      action: "INBOX_GET_PAGE_LIST",
      payload: { c_user: userId }
    })

    if (!pageRes.success || !pageRes.data) {
      return {
        success: false,
        error: pageRes.error ?? "Không tải được danh sách Fanpage"
      }
    }

    const pages: IFanpage[] = pageRes.data.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar ?? "",
      type: "page" as const
    }))

    // Thêm Profile vào đầu danh sách
    pages.unshift({
      id: userId,
      name: userInfo.name,
      avatar: userInfo.avatar,
      type: "profile"
    })

    return {
      success: true,
      data: {
        pages,
        config: pageRes.request_config as IFbRequestConfig,
        userInfo
      }
    }
  } catch (e: any) {
    return { success: false, error: e.message }
  } finally {
    chrome.runtime.onMessage.removeListener(progressListener)
  }
}

// ==================== INBOX THREADS ====================

/** Threads per request. Facebook silently caps this, so a larger ask costs nothing. */
const PREFERRED_PAGE_SIZE = 200
/** Used when a large page is rejected */
const FALLBACK_PAGE_SIZE = 50
const MAX_REQUEST_ATTEMPTS = 5
const RETRY_BASE_DELAY_MS = 5000
/** Do not split a lane whose remaining time range is shorter than this */
const MIN_SPLIT_SPAN_MS = 60 * 60 * 1000
/** No Facebook thread can be older than this; keeps the first splits useful */
const EARLIEST_THREAD_TIME = Date.UTC(2008, 0, 1)
const DEFAULT_CONCURRENCY = 3

/**
 * A lane walks the thread list backwards in time and covers `(floor, before]`.
 * `before === null` means "start from the newest thread".
 */
interface ILane {
  before: number | null
  floor: number
}

const describeError = (error: unknown): string => {
  if (!error) return "Không quét được inbox"
  if (typeof error === "string") return error
  const e = error as IFbApiError
  return e.errorDescription || e.errorSummary || JSON.stringify(error)
}

/**
 * Collect every customer that has a thread with `pageId`.
 *
 * Facebook pages the thread list by `updated_time`, so the range can be cut into
 * time slices that are fetched in parallel. A lane that still has work splits its
 * remaining range whenever another worker is idle (work stealing), so all lanes
 * stay busy regardless of how threads are distributed over time.
 */
export async function scanInboxThreads(
  pageId: string,
  options: IInboxScanOptions = {}
): Promise<IApiResponse<IInboxScanResult>> {
  const concurrency = Math.min(4, Math.max(1, options.concurrency ?? DEFAULT_CONCURRENCY))
  const shouldStop = options.shouldStop ?? (() => false)
  const baseFloor = Math.max(options.since ?? 0, EARLIEST_THREAD_TIME)

  const customers = new Map<string, ICustomer>()
  const queue: ILane[] = [{ before: null, floor: baseFloor }]
  let active = 0
  // Shared between lanes; mutated from async callbacks
  const state = { pageSize: PREFERRED_PAGE_SIZE, stopped: false, failure: null as string | null }
  let newestUpdatedAt = 0
  let requests = 0
  let finish: () => void = () => {}

  const addCustomer = (customer: ICustomer) => {
    const existing = customers.get(customer.id)
    if (!existing || (customer.updatedAt ?? 0) >= (existing.updatedAt ?? 0)) {
      customers.set(customer.id, customer)
    }
  }

  /** One page of threads, with page-size fallback and backoff on errors. `null` = stop requested. */
  const fetchPage = async (before: number | null): Promise<any[] | null> => {
    let attempts = 0
    for (;;) {
      if (state.stopped || shouldStop()) return null
      requests++
      const res = await sendBgMessage<{ success: boolean; data?: any; error?: any }>({
        action: "INBOX_GET_THREADS",
        payload: {
          page_id: pageId,
          before_call: before === null ? null : String(before),
          limit: state.pageSize
        }
      })
      if (res.success) return extractThreads(res.data)

      if (state.pageSize !== FALLBACK_PAGE_SIZE) {
        // The large page may be the problem; drop to the known-good size at once
        state.pageSize = FALLBACK_PAGE_SIZE
        continue
      }
      attempts++
      if (attempts >= MAX_REQUEST_ATTEMPTS) throw new Error(describeError(res.error))
      await delay(RETRY_BASE_DELAY_MS * attempts)
    }
  }

  const runLane = async (lane: ILane) => {
    let { before, floor } = lane
    let retriedEmpty = false

    while (!state.stopped && !state.failure) {
      const threads = await fetchPage(before)
      if (threads === null) {
        state.stopped = true
        return
      }
      if (threads.length === 0) {
        // The head of the list is occasionally empty on a transient glitch; one quick retry
        if (before === null && !retriedEmpty) {
          retriedEmpty = true
          await delay(1500)
          continue
        }
        return
      }

      let reachedFloor = false
      for (const thread of threads) {
        const updatedAt = Number(thread?.updated_time_precise)
        if (Number.isFinite(updatedAt)) {
          if (updatedAt <= floor) {
            reachedFloor = true
            continue
          }
          if (updatedAt > newestUpdatedAt) newestUpdatedAt = updatedAt
        }
        const customer = parseCustomerFromThread(thread, pageId)
        if (customer) addCustomer(customer)
      }
      options.onProgress?.(customers.size)

      const lastUpdatedAt = Number(threads[threads.length - 1]?.updated_time_precise)
      if (reachedFloor || !Number.isFinite(lastUpdatedAt) || lastUpdatedAt - 1 <= floor) return
      before = lastUpdatedAt - 1

      // Hand half of what is left to an idle worker
      if (queue.length === 0 && active < concurrency && before - floor > MIN_SPLIT_SPAN_MS) {
        const mid = Math.floor((before + floor) / 2)
        queue.push({ before: mid, floor })
        floor = mid
        pump()
      }
    }
  }

  const pump = () => {
    while (queue.length > 0 && active < concurrency && !state.stopped && !state.failure) {
      const lane = queue.shift() as ILane
      active++
      runLane(lane)
        .catch((e: any) => {
          state.failure = e?.message ?? String(e)
        })
        .finally(() => {
          active--
          if (queue.length > 0 && !state.stopped && !state.failure) pump()
          if (active === 0) finish()
        })
    }
    if (active === 0 && queue.length === 0) finish()
  }

  await new Promise<void>((resolve) => {
    finish = resolve
    pump()
  })

  const list = Array.from(customers.values()).sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))

  const { stopped, failure } = state
  if (failure && list.length === 0) return { success: false, error: failure }

  return {
    success: true,
    data: {
      customers: list,
      total: list.length,
      complete: !stopped && !failure,
      stopped,
      newestUpdatedAt,
      requests,
      warning: failure ? `Dừng sớm vì lỗi: ${failure}` : undefined
    }
  }
}

// ==================== USER INFO ====================

export async function getUserInfo(
  userId: string
): Promise<IApiResponse<IUserInfo>> {
  try {
    const res = await sendBgMessage<IApiResponse<IUserInfo>>({
      action: "GET_FB_USER_INFO",
      payload: { c_user: userId }
    })
    return res
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// ==================== GET CURRENT FB CONFIG ====================

export async function getFbRequestConfig(): Promise<IFbRequestConfig | null> {
  try {
    const res = await sendBgMessage<{
      success: boolean
      config?: IFbRequestConfig
    }>({ action: "INBOX_GET_REQUEST_CONFIG" })
    return res.success ? res.config ?? null : null
  } catch {
    return null
  }
}

// ==================== GET C_USER FROM COOKIE ====================

export async function getCUserFromCookie(): Promise<string | null> {
  try {
    const res = await sendBgMessage<{ value: string | null }>({
      action: "INBOX_GET_C_USER"
    })
    return res?.value ?? null
  } catch {
    return null
  }
}

// ==================== HELPERS ====================

function extractThreads(data: any): any[] {
  if (!data) return []
  try {
    // graphqlbatch response: {"__q0__": {"data": {"viewer": {"message_threads": {"nodes": [...]}}}}}
    const nodes = data?.["__q0__"]?.data?.viewer?.message_threads?.nodes
    return Array.isArray(nodes) ? nodes : []
  } catch {
    return []
  }
}

function parseCustomerFromThread(
  thread: any,
  pageId: string
): ICustomer | null {
  try {
    const actor = thread?.all_participants?.edges?.[0]?.node?.messaging_actor
    if (!actor) return null

    const id = String(actor.id ?? "")
    if (!id || id.length > 16 || id === pageId) return null

    const name: string = actor.name ?? ""
    const lowerName = name.toLowerCase()
    if (
      !name ||
      lowerName === "facebook user" ||
      lowerName === "người dùng facebook"
    )
      return null

    const lastMsg = thread?.last_message?.nodes?.[0]
    const updatedAt = Number(thread?.updated_time_precise)
    const lastMsgTime = lastMsg?.timestamp_precise
      ? new Date(Number(lastMsg.timestamp_precise)).toISOString()
      : Number.isFinite(updatedAt)
        ? new Date(updatedAt).toISOString()
        : ""

    const senderType: "customer" | "page" =
      actor.__typename === "Page" || actor.__isMessagingActor === "Page"
        ? "page"
        : "customer"

    const tags: string[] =
      thread?.related_page_thread?.custom_thread_labels?.nodes
        ?.map((n: any) => n.name)
        .filter(Boolean) ?? []

    return {
      id,
      name,
      time: lastMsgTime,
      updatedAt: Number.isFinite(updatedAt) ? updatedAt : undefined,
      gender: normalizeGender(actor.gender),
      hasPhone: !!actor.all_phones?.length,
      isFriend: actor.is_viewer_friend ?? false,
      senderType,
      tags,
      isBlocked: false
    }
  } catch {
    return null
  }
}

function normalizeGender(gender: any): "male" | "female" | "unknown" {
  if (!gender) return "unknown"
  const g = String(gender).toUpperCase()
  if (g === "MALE" || g === "1") return "male"
  if (g === "FEMALE" || g === "2") return "female"
  return "unknown"
}

export default {
  getPageList,
  scanInboxThreads,
  getUserInfo,
  getFbRequestConfig,
  getCUserFromCookie
}
