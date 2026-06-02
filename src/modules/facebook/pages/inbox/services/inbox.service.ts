import { delay } from "src/utils/common.util"

import {
  IApiResponse,
  ICustomer,
  IFanpage,
  IFbRequestConfig,
  IUserInfo
} from "../types/inbox.interface"

const SCAN_RETRY_CONFIG = {
  requestError: { maxAttempts: 5, delayMs: 30000 },
  emptyThreads: { maxAttempts: 3, delayMs: 10000 }
}

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

export async function scanInboxThreads(
  pageId: string,
  onProgress?: (customers: ICustomer[], total: number) => void
): Promise<IApiResponse<{ customers: ICustomer[]; total: number }>> {
  const allCustomers: ICustomer[] = []
  const processedIds = new Set<string>()

  let beforeCall: string | null = null
  let requestErrorAttempts = 0
  let emptyThreadAttempts = 0

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await sendBgMessage<{
      success: boolean
      data?: any
      error?: any
    }>({
      action: "INBOX_GET_THREADS",
      payload: { page_id: pageId, before_call: beforeCall }
    })
    if (!res.success) {
      requestErrorAttempts++
      if (requestErrorAttempts >= SCAN_RETRY_CONFIG.requestError.maxAttempts) {
        if (allCustomers.length > 0) break
        return {
          success: false,
          error:
            typeof res.error === "string"
              ? res.error
              : JSON.stringify(res.error)
        }
      }
      await delay(SCAN_RETRY_CONFIG.requestError.delayMs)
      continue
    }

    requestErrorAttempts = 0

    const threads = extractThreads(res.data)
    if (!threads || threads.length === 0) {
      emptyThreadAttempts++
      if (emptyThreadAttempts >= SCAN_RETRY_CONFIG.emptyThreads.maxAttempts)
        break
      await delay(SCAN_RETRY_CONFIG.emptyThreads.delayMs)
      continue
    }

    emptyThreadAttempts = 0

    threads.forEach((thread: any) => {
      const customer = parseCustomerFromThread(thread, pageId)
      if (customer && !processedIds.has(customer.id)) {
        processedIds.add(customer.id)
        allCustomers.push(customer)
      }
    })

    if (onProgress) onProgress([...allCustomers], allCustomers.length)

    const cursor = extractCursor(threads)
    if (!cursor) break
    beforeCall = cursor
  }

  return {
    success: true,
    data: { customers: allCustomers, total: allCustomers.length }
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

function extractCursor(threads: any[]): string | null {
  try {
    if (!threads || threads.length === 0) return null
    const lastUpdated = parseInt(
      threads[threads.length - 1]?.updated_time_precise
    )
    const cursor = lastUpdated - 1
    return isNaN(cursor) || cursor <= 0 ? null : String(cursor)
  } catch {
    return null
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
    const lastMsgTime = lastMsg?.timestamp_precise
      ? new Date(Number(lastMsg.timestamp_precise)).toISOString()
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
