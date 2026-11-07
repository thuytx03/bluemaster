import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"

import storage from "src/modules/automation/services/auto-bot-comment-storage.service"
import type {
  CommentTemplate,
  CommentTemplateInput
} from "src/modules/automation/types/auto-bot-comment.types"

/** Comment templates (chrome.storage; replaced `/api/v1/extension/comment-templates`). */
export function useAutoBotCommentTemplates() {
  const { t } = useTranslation()
  const [templates, setTemplates] = useState<CommentTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setTemplates(await storage.listTemplates())
    } catch {
      setError(t("auto_comment_error_load_content"))
    } finally {
      setLoading(false)
    }
  }, [t])

  const createTemplate = useCallback(
    async (data: CommentTemplateInput): Promise<CommentTemplate | null> => {
      try {
        const created = await storage.createTemplate(data)
        setTemplates((prev) => [...prev, created])
        return created
      } catch {
        return null
      }
    },
    []
  )

  const updateTemplate = useCallback(
    async (
      id: number,
      data: Partial<CommentTemplateInput>
    ): Promise<boolean> => {
      try {
        const updated = await storage.updateTemplate(id, data)
        if (!updated) return false
        setTemplates((prev) => prev.map((x) => (x.id === id ? updated : x)))
        return true
      } catch {
        return false
      }
    },
    []
  )

  const deleteTemplate = useCallback(async (id: number): Promise<boolean> => {
    try {
      await storage.deleteTemplate(id)
      setTemplates((prev) => prev.filter((x) => x.id !== id))
      return true
    } catch {
      return false
    }
  }, [])

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate
  }
}
