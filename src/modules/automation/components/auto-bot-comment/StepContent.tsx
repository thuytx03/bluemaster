import { Edit2, Image, Plus, Search, Trash2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { normalizeForSearch } from "src/configs/tools.config"
import ContentFormModal from "src/modules/automation/components/auto-bot-comment/ContentFormModal"
import type { useAutoBotCommentTemplates } from "src/modules/automation/hooks/useAutoBotCommentTemplates"
import type { CommentTemplate } from "src/modules/automation/types/auto-bot-comment.types"
import { countSpin } from "src/modules/automation/utils/auto-bot-comment.util"
import {
  Badge,
  Button,
  Callout,
  Checkbox,
  cn,
  ConfirmDialog,
  IconButton,
  Input,
  Spinner
} from "src/modules/shared/ui"

type TemplatesApi = ReturnType<typeof useAutoBotCommentTemplates>

export default function StepContent({
  templatesApi,
  selected,
  onToggle
}: {
  templatesApi: TemplatesApi
  selected: Set<number>
  onToggle: (tpl: CommentTemplate) => void
}) {
  const { t } = useTranslation()
  const {
    templates,
    loading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate
  } = templatesApi
  const [search, setSearch] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<CommentTemplate | null>(null)
  const [deleting, setDeleting] = useState<CommentTemplate | null>(null)

  useEffect(() => {
    void fetchTemplates()
  }, [fetchTemplates])

  const filtered = useMemo(() => {
    const q = normalizeForSearch(search)
    return templates.filter(
      (x) =>
        normalizeForSearch(x.name).includes(q) ||
        normalizeForSearch(x.content).includes(q)
    )
  }, [templates, search])

  return (
    <div className="bm-flex bm-flex-col bm-gap-3">
      <div className="bm-flex bm-items-center bm-gap-2">
        <Input
          size="sm"
          className="bm-flex-1"
          prefix={<Search size={13} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("auto_comment_search_content_placeholder")}
        />
        <Button
          size="sm"
          variant="outline"
          icon={<Plus size={13} />}
          onClick={() => setShowCreate(true)}>
          {t("auto_comment_add_content")}
        </Button>
      </div>

      <p className="bm-text-[12.5px] bm-text-fg-muted">
        {t("auto_comment_select_content_prefix")}{" "}
        <strong className="bm-text-fg">{selected.size}</strong>{" "}
        {t("auto_comment_select_content_suffix")}
      </p>

      {loading && (
        <div className="bm-flex bm-items-center bm-justify-center bm-gap-2 bm-py-8 bm-text-[12.5px] bm-text-fg-muted">
          <Spinner size={14} /> {t("auto_comment_loading")}
        </div>
      )}
      {error && (
        <Callout tone="danger" compact>
          {error}
        </Callout>
      )}
      {!loading && filtered.length === 0 && (
        <div className="bm-rounded-xl2 bm-border bm-border-dashed bm-border-line bm-py-8 bm-text-center bm-text-[12.5px] bm-text-fg-muted">
          {t("auto_comment_no_content_prefix")}{" "}
          <strong>{t("auto_comment_add_content")}</strong>{" "}
          {t("auto_comment_no_content_suffix")}
        </div>
      )}

      <div className="bm-flex bm-flex-col bm-gap-1.5">
        {filtered.map((tpl) => {
          const checked = selected.has(tpl.id)
          const spinCount = countSpin(tpl.content)
          return (
            <div
              key={tpl.id}
              onClick={() => onToggle(tpl)}
              className={cn(
                "bm-flex bm-cursor-pointer bm-items-center bm-gap-2.5 bm-rounded-xl bm-border bm-p-2.5 bm-transition-colors",
                checked
                  ? "bm-border-brand/50 bm-bg-brand-soft/50"
                  : "bm-border-line bm-bg-surface hover:bm-bg-surface-2"
              )}>
              <Checkbox
                size="sm"
                checked={checked}
                onChange={() => onToggle(tpl)}
              />
              <div className="bm-flex bm-h-10 bm-w-10 bm-shrink-0 bm-items-center bm-justify-center bm-overflow-hidden bm-rounded-lg bm-border bm-border-line bm-bg-surface-2">
                {tpl.image_urls?.length ? (
                  <img
                    src={tpl.image_urls[0]}
                    className="bm-h-10 bm-w-10 bm-object-cover"
                    alt=""
                  />
                ) : (
                  <Image size={15} className="bm-text-fg-subtle" />
                )}
              </div>
              <div className="bm-min-w-0 bm-flex-1">
                <p className="bm-truncate bm-text-[13px] bm-font-medium bm-text-fg">
                  {tpl.name}
                </p>
                <p className="bm-truncate bm-text-[11.5px] bm-text-fg-muted">
                  {tpl.content.slice(0, 80)}
                  {tpl.content.length > 80 ? "…" : ""}
                </p>
                <div className="bm-mt-0.5 bm-flex bm-flex-wrap bm-items-center bm-gap-1">
                  {(tpl.image_urls?.length ?? 0) > 0 && (
                    <Badge size="xs">
                      {tpl.image_urls!.length} {t("auto_comment_image_unit")}
                    </Badge>
                  )}
                  <Badge size="xs" tone={spinCount > 1 ? "brand" : "neutral"}>
                    {spinCount} SPIN
                  </Badge>
                </div>
              </div>
              <div
                className="bm-flex bm-shrink-0 bm-items-center"
                onClick={(e) => e.stopPropagation()}>
                <IconButton
                  size="xs"
                  label={t("auto_comment_edit")}
                  onClick={() => setEditing(tpl)}>
                  <Edit2 size={13} />
                </IconButton>
                <IconButton
                  size="xs"
                  className="hover:bm-bg-danger-soft hover:bm-text-danger"
                  label={t("auto_comment_delete_title")}
                  onClick={() => setDeleting(tpl)}>
                  <Trash2 size={13} />
                </IconButton>
              </div>
            </div>
          )
        })}
      </div>

      <ContentFormModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={async (data) => {
          const created = await createTemplate(data)
          if (created) onToggle(created)
          return !!created
        }}
      />
      <ContentFormModal
        open={!!editing}
        template={editing}
        onClose={() => setEditing(null)}
        onSubmit={(data) =>
          editing ? updateTemplate(editing.id, data) : Promise.resolve(false)
        }
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        destructive
        title={t("auto_comment_delete_title")}
        description={
          deleting
            ? t("auto_comment_delete_content_confirm", { name: deleting.name })
            : undefined
        }
        onConfirm={() => {
          if (!deleting) return
          if (selected.has(deleting.id)) onToggle(deleting)
          void deleteTemplate(deleting.id)
        }}
      />
    </div>
  )
}
