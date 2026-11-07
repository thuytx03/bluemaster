import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { normalizeForSearch } from "src/configs/tools.config"
import storage from "src/modules/automation/services/auto-bot-comment-storage.service"
import type {
  BotCommentGroup,
  GroupLibraryItem,
  GroupLibraryTopic
} from "src/modules/automation/types/auto-bot-comment.types"

/**
 * Group library: topics + groups the user curates locally (chrome.storage).
 * Replaces the server-curated `/api/v1/extension/group-library/topics|items`.
 */
export function useAutoBotCommentGroupLibrary() {
  const { t } = useTranslation()
  const [topics, setTopics] = useState<GroupLibraryTopic[]>([])
  const [items, setItems] = useState<GroupLibraryItem[]>([])
  const [loadingTopics, setLoadingTopics] = useState(false)
  const [loadingItems, setLoadingItems] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTopics = useCallback(async () => {
    setLoadingTopics(true)
    setError(null)
    try {
      setTopics(await storage.listLibraryTopics())
    } catch {
      setError(t("auto_comment_error_load_topics"))
    } finally {
      setLoadingTopics(false)
    }
  }, [t])

  const fetchItems = useCallback(
    async (topicIds: number[], q?: string) => {
      setLoadingItems(true)
      setError(null)
      try {
        setItems(
          await storage.listLibraryItems(topicIds, q, normalizeForSearch)
        )
      } catch {
        setError(t("auto_comment_error_load_groups"))
      } finally {
        setLoadingItems(false)
      }
    },
    [t]
  )

  const createTopic = useCallback(
    async (name: string): Promise<GroupLibraryTopic | null> => {
      if (!name.trim()) return null
      const topic = await storage.createLibraryTopic(name)
      setTopics((prev) => [...prev, topic])
      return topic
    },
    []
  )

  const renameTopic = useCallback(async (id: number, name: string) => {
    if (!name.trim()) return
    await storage.renameLibraryTopic(id, name)
    setTopics((prev) =>
      prev.map((x) => (x.id === id ? { ...x, name: name.trim() } : x))
    )
  }, [])

  const deleteTopic = useCallback(
    async (id: number) => {
      await storage.deleteLibraryTopic(id)
      setTopics((prev) => prev.filter((x) => x.id !== id))
      setItems((prev) => prev.filter((x) => x.topic_id !== id))
      toast.success(t("auto_comment_library_topic_deleted"))
    },
    [t]
  )

  /** Adds groups to a topic and refreshes the counts. */
  const addGroups = useCallback(
    async (
      topicId: number,
      groups: (BotCommentGroup & { memberCount?: string })[]
    ) => {
      const added = await storage.addLibraryItems(topicId, groups)
      setTopics(await storage.listLibraryTopics())
      toast.success(t("auto_comment_library_groups_added", { count: added }))
      return added
    },
    [t]
  )

  const removeGroups = useCallback(
    async (topicIds: number[], groupIds: string[]) => {
      await storage.removeLibraryItems(topicIds, groupIds)
      const removed = new Set(groupIds)
      setItems((prev) => prev.filter((x) => !removed.has(x.group_id)))
      setTopics(await storage.listLibraryTopics())
    },
    []
  )

  return {
    topics,
    items,
    total: items.length,
    loadingTopics,
    loadingItems,
    error,
    fetchTopics,
    fetchItems,
    createTopic,
    renameTopic,
    deleteTopic,
    addGroups,
    removeGroups
  }
}
