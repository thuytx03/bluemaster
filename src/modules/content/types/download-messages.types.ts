export type DownloadMessagesState = "idle" | "loading" | "success" | "error"

export type DownloadMessagesFormat = "html" | "txt"

/** Thread type filter: "all", the raw `thread_type` values, or "PAGE" (1-1 thread with a Page). */
export type ThreadTypeFilter = "all" | "ONE_TO_ONE" | "PAGE" | "GROUP"

export interface Participant {
  id: string
  name: string
  avatar: string
  type?: string
}

export interface MessageThread {
  id: string
  name: string | null
  messagesCount: number
  threadType: string
  image: string | null
  participants: Participant[]
}

export interface ChatMessage {
  id: string
  text: string
  senderId: string
  senderName: string
  timestamp: number
}

export interface RawParticipant {
  id?: string
  name?: string
  __typename?: string
  messaging_actor?: {
    id?: string
    name?: string
    big_image_src?: { uri?: string }
    profile_picture?: { uri?: string } | string
    __typename?: string
  }
  big_image_src?: { uri?: string }
  profile_picture?: { uri?: string } | string
}

export interface RawThread {
  id?: string
  name?: string | null
  thread_type?: string
  image?: { uri?: string } | string | null
  thread_key?: { thread_fbid?: string; other_user_id?: string }
  messages_count?: number
  unread_count?: number
  all_participants?: {
    nodes?: RawParticipant[]
    edges?: Array<{ node: RawParticipant }>
  }
}

export interface RawMessage {
  id?: string
  __typename?: string
  snippet?: string
  timestamp_precise?: string
  message?: { text?: string }
  message_sender?: {
    id?: string
    name?: string
    messaging_actor?: { name?: string }
  }
  blob_attachments?: Array<{
    large_preview?: { uri?: string }
    preview?: { uri?: string }
  }>
  sticker?: { url?: string; label?: string }
}

export interface ThreadsQueryResult {
  data?: {
    viewer?: {
      message_threads?: {
        nodes?: RawThread[]
        edges?: Array<{ node: RawThread }>
      }
    }
  }
}

export interface MessagesQueryResult {
  data?: {
    message_thread?: {
      messages?: {
        nodes?: RawMessage[]
        page_info?: { has_previous_page?: boolean }
      }
    }
  }
}

/** Translated fallback names the service uses while formatting threads (services have no i18n). */
export interface ThreadNameFallbacks {
  participant: string
  oneToOne: string
  group: string
}

export interface FetchThreadMessagesOptions {
  threadId: string
  limit: number
  onProgress?: (downloaded: number, total: number) => void
  shouldStop?: () => boolean
}

export interface DownloadProgress {
  current: number
  total: number
}
