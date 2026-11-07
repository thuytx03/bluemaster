import { delay, fetchGraphQl, parseSafe } from "src/modules/facebook/services/fb-graphql.service"
import type {
  FetchThreadMessagesOptions,
  MessageThread,
  MessagesQueryResult,
  Participant,
  RawMessage,
  RawParticipant,
  RawThread,
  ThreadNameFallbacks,
  ThreadsQueryResult
} from "src/modules/content/types/download-messages.types"

const DATA_GRAPHQL = {
  THREADS: {
    name: "MessagesDownloaderThreadsQuery",
    docId: "1475048592613093",
    limit: 50
  },
  MESSAGES: {
    name: "MessagesDownloaderMessagesQuery",
    docId: "1526314457427586",
    pageSize: 500,
    /** Pause between pages to avoid spamming Facebook */
    pageDelayMs: 800
  }
}

/** Normalizes one raw Messenger thread (participants without the viewer, name/image/type fallbacks). */
export function formatThread(node: RawThread, uid: string, fallbacks: ThreadNameFallbacks): MessageThread {
  let rawParticipants: RawParticipant[] = node?.all_participants?.nodes ?? []
  if (node?.all_participants?.edges) {
    rawParticipants = node.all_participants.edges.map((e) => e.node)
  }

  const participants: Participant[] = rawParticipants
    .map((p) => {
      const actor = p?.messaging_actor ?? p
      const pic = actor?.profile_picture
      const profilePicUri = typeof pic === "object" ? pic?.uri : pic
      const avatarUrl = actor?.big_image_src?.uri ?? profilePicUri ?? ""
      return {
        id: actor?.id ?? "",
        name: actor?.name ?? fallbacks.participant,
        avatar: avatarUrl,
        type: actor?.__typename ?? ""
      }
    })
    .filter((p) => Boolean(p.id) && p.id !== uid)

  const threadId = node?.id ?? node?.thread_key?.thread_fbid ?? node?.thread_key?.other_user_id ?? ""

  let threadName: string | null = node?.name ?? null
  if (!threadName && node?.thread_type === "ONE_TO_ONE") {
    threadName = participants.map((p) => p.name).join(", ") || fallbacks.oneToOne
  } else if (!threadName) {
    threadName = fallbacks.group
  }

  const rawImg = node?.image
  let threadImage: string | null = typeof rawImg === "object" ? (rawImg?.uri ?? null) : (rawImg ?? null)
  if (!threadImage && node?.thread_type === "ONE_TO_ONE") {
    threadImage = participants[0]?.avatar ?? null
  }

  let threadType = node?.thread_type ?? "ONE_TO_ONE"
  const hasPageParticipant = participants.some((p) => p.type === "Page")
  if (threadType === "ONE_TO_ONE" && hasPageParticipant) {
    threadType = "PAGE"
  }

  return {
    id: threadId,
    name: threadName,
    messagesCount: node?.messages_count ?? node?.unread_count ?? 0,
    threadType,
    image: threadImage,
    participants
  }
}

/** Latest 50 INBOX threads of the viewer. */
export async function fetchMessageThreads(uid: string, fallbacks: ThreadNameFallbacks): Promise<MessageThread[]> {
  const response = await fetchGraphQl({
    fb_api_req_friendly_name: DATA_GRAPHQL.THREADS.name,
    fb_api_caller_class: "RelayModern",
    av: uid,
    doc_id: DATA_GRAPHQL.THREADS.docId,
    variables: {
      limit: DATA_GRAPHQL.THREADS.limit,
      before: null,
      tags: ["INBOX"],
      includeDeliveryReceipts: true,
      includeSeqID: false
    }
  })

  const parsed = parseSafe(response?.data?.body) as ThreadsQueryResult | null
  const rawThreads: RawThread[] =
    parsed?.data?.viewer?.message_threads?.nodes ??
    parsed?.data?.viewer?.message_threads?.edges?.map((e) => e.node) ??
    []

  return rawThreads.map((node) => formatThread(node, uid, fallbacks))
}

/**
 * Pages backwards through a thread (newest first, 500 per request) until
 * `limit` messages are collected, Facebook reports no previous page, or
 * `shouldStop` returns true. Messages come back oldest → newest.
 */
export async function fetchThreadMessages(
  uid: string,
  { threadId, limit, onProgress, shouldStop }: FetchThreadMessagesOptions
): Promise<RawMessage[]> {
  const allMessages: RawMessage[] = []
  let beforeTimestamp: number = Date.now()
  let hasPreviousPage = true

  while (allMessages.length < limit && hasPreviousPage) {
    if (shouldStop?.()) break

    const response = await fetchGraphQl({
      fb_api_req_friendly_name: DATA_GRAPHQL.MESSAGES.name,
      fb_api_caller_class: "RelayModern",
      av: uid,
      doc_id: DATA_GRAPHQL.MESSAGES.docId,
      variables: {
        id: threadId,
        message_limit: Math.min(limit - allMessages.length, DATA_GRAPHQL.MESSAGES.pageSize),
        load_messages: true,
        load_read_receipts: true,
        before: beforeTimestamp
      }
    })

    const parsed = parseSafe(response?.data?.body) as MessagesQueryResult | null
    const messagesConnection = parsed?.data?.message_thread?.messages
    const nodes: RawMessage[] = messagesConnection?.nodes ?? []

    if (nodes.length === 0) break

    allMessages.unshift(...nodes)

    hasPreviousPage = messagesConnection?.page_info?.has_previous_page ?? false

    if (hasPreviousPage) {
      const nextBefore = parseInt(nodes[0]?.timestamp_precise ?? "0", 10)
      // Guard: a cursor that does not move back in time would refetch the same page forever.
      if (!nextBefore || nextBefore >= beforeTimestamp) {
        hasPreviousPage = false
      } else {
        beforeTimestamp = nextBefore
      }
    }

    onProgress?.(allMessages.length, limit)

    await delay(DATA_GRAPHQL.MESSAGES.pageDelayMs)
  }

  return allMessages
}

const downloadMessagesService = {
  formatThread,
  fetchMessageThreads,
  fetchThreadMessages
}

export default downloadMessagesService
