import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"

import storage from "src/modules/automation/services/auto-bot-comment-storage.service"
import type {
  BotCommentItem,
  BotCommentPayload
} from "src/modules/automation/types/auto-bot-comment.types"

/** Saved bots (chrome.storage; replaced `/api/v1/extension/bot-comments`). */
export function useAutoBotCommentBots() {
  const { t } = useTranslation()
  const [bots, setBots] = useState<BotCommentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBots = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setBots(await storage.listBots())
    } catch {
      setError(t("auto_comment_error_load_bots"))
    } finally {
      setLoading(false)
    }
  }, [t])

  const createBot = useCallback(
    async (data: BotCommentPayload): Promise<BotCommentItem | null> => {
      try {
        const created = await storage.createBot(data)
        setBots((prev) => [created, ...prev])
        return created
      } catch {
        return null
      }
    },
    []
  )

  const updateBot = useCallback(
    async (
      id: number,
      data: Partial<BotCommentPayload>
    ): Promise<BotCommentItem | null> => {
      try {
        const updated = await storage.updateBot(id, data)
        if (updated)
          setBots((prev) => prev.map((b) => (b.id === id ? updated : b)))
        return updated
      } catch {
        return null
      }
    },
    []
  )

  const deleteBot = useCallback(async (id: number): Promise<boolean> => {
    try {
      await storage.deleteBot(id)
      setBots((prev) => prev.filter((b) => b.id !== id))
      return true
    } catch {
      return false
    }
  }, [])

  const markRun = useCallback(async (id: number): Promise<void> => {
    try {
      const at = await storage.markBotRun(id)
      setBots((prev) =>
        prev.map((b) => (b.id === id ? { ...b, last_run_at: at } : b))
      )
    } catch {
      // non-fatal
    }
  }, [])

  return {
    bots,
    loading,
    error,
    fetchBots,
    createBot,
    updateBot,
    deleteBot,
    markRun
  }
}
