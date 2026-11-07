import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { fetchMessageThreads, fetchThreadMessages } from "src/modules/content/services/download-messages.service"
import type {
  DownloadMessagesState,
  FetchThreadMessagesOptions,
  MessageThread,
  RawMessage
} from "src/modules/content/types/download-messages.types"
import { CACHE_TIME, getMyUid } from "src/modules/facebook/services/fb-graphql.service"
import { getFromLocalStorageWithExpiry, saveToLocalStorageWithExpiry } from "src/utils/storage.util"

export const useDownloadMessages = () => {
  const { t } = useTranslation()
  const [threads, setThreads] = useState<MessageThread[]>([])
  const [threadsState, setThreadsState] = useState<DownloadMessagesState>("idle")
  const [error, setError] = useState<string | null>(null)

  const loadThreads = useCallback(
    async (options?: { forceRefresh?: boolean }) => {
      setThreadsState("loading")
      setError(null)

      try {
        const uid = getMyUid()
        if (!uid) throw new Error(t("download_messages_tool_error_not_logged_in"))

        const cacheKey = `fb_download_messages_threads_${uid}`
        if (!options?.forceRefresh) {
          const cached = getFromLocalStorageWithExpiry<MessageThread[]>(cacheKey)
          if (cached) {
            setThreads(cached)
            setThreadsState("success")
            return
          }
        }

        const formatted = await fetchMessageThreads(uid, {
          participant: t("download_messages_tool_default_participant_name"),
          oneToOne: t("download_messages_tool_default_thread_name_one_to_one"),
          group: t("download_messages_tool_default_thread_name_group")
        })

        setThreads(formatted)
        saveToLocalStorageWithExpiry<MessageThread[]>(cacheKey, formatted, CACHE_TIME.ONE_DAY)
        setThreadsState("success")
      } catch (e: unknown) {
        console.error("Failed to load messenger threads:", e)
        const msg = e instanceof Error ? e.message : t("download_messages_tool_error_load_threads_failed")
        setError(msg)
        setThreadsState("error")
        toast.error(msg)
      }
    },
    [t]
  )

  const downloadMessages = useCallback(
    async (options: FetchThreadMessagesOptions): Promise<RawMessage[]> => {
      const uid = getMyUid()
      if (!uid) throw new Error(t("download_messages_tool_error_not_logged_in"))
      return fetchThreadMessages(uid, options)
    },
    [t]
  )

  return { threads, threadsState, error, loadThreads, downloadMessages }
}
