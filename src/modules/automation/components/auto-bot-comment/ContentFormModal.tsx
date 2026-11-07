import { Upload } from "lucide-react"
import { ChangeEvent, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import type {
  CommentTemplate,
  CommentTemplateInput
} from "src/modules/automation/types/auto-bot-comment.types"
import { readImageFiles } from "src/modules/automation/utils/auto-bot-comment.util"
import { Button, Field, Input, Modal, Textarea } from "src/modules/shared/ui"

const MAX_IMAGES = 10

/** Create (no `template`) or edit a comment template. */
export default function ContentFormModal({
  open,
  template,
  onClose,
  onSubmit
}: {
  open: boolean
  template?: CommentTemplate | null
  onClose: () => void
  onSubmit: (data: CommentTemplateInput) => Promise<boolean>
}) {
  const { t } = useTranslation()
  const [name, setName] = useState("")
  const [content, setContent] = useState("")
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setName(
      template?.name ??
        `${t("auto_comment_default_content_name_prefix")} ${new Date().toLocaleString("vi-VN")}`
    )
    setContent(template?.content ?? "")
    setImageUrls(template?.image_urls ?? [])
  }, [open, template, t])

  async function handleSave() {
    if (!content.trim()) return
    setSaving(true)
    const ok = await onSubmit({
      name,
      content,
      image_urls: imageUrls.length ? imageUrls : null
    })
    setSaving(false)
    if (ok) onClose()
  }

  function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ""
    readImageFiles(files, MAX_IMAGES)
      .then((urls) => setImageUrls((p) => [...p, ...urls].slice(0, MAX_IMAGES)))
      .catch(() => {})
  }

  return (
    <Modal
      closeLabel={t("auto_comment_cancel")}
      open={open}
      onClose={onClose}
      title={
        template
          ? t("auto_comment_edit_content_modal_title")
          : t("auto_comment_add_content_modal_title")
      }
      footer={
        <>
          <Button size="sm" variant="outline" onClick={onClose}>
            {t("auto_comment_cancel")}
          </Button>
          <Button
            size="sm"
            variant="primary"
            loading={saving}
            disabled={!content.trim()}
            onClick={handleSave}>
            {template
              ? t("auto_comment_save_changes")
              : t("auto_comment_save_content")}
          </Button>
        </>
      }>
      <div className="bm-flex bm-flex-col bm-gap-3">
        <Field label={t("auto_comment_content_name_label")}>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field
          label={t("auto_comment_comment_content_label")}
          hint={t("auto_comment_spin_hint")}>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("auto_comment_comment_content_placeholder")}
            className="bm-min-h-[96px]"
          />
        </Field>
        <Field
          label={t("auto_comment_attached_images_label")}
          extra={
            imageUrls.length > 0 && (
              <Button
                size="xs"
                variant="link"
                className="!bm-text-danger"
                onClick={() => setImageUrls([])}>
                {t("auto_comment_remove_all")}
              </Button>
            )
          }>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="bm-hidden"
            onChange={handleFiles}
          />
          <Button
            size="sm"
            variant="outline"
            icon={<Upload size={13} />}
            disabled={imageUrls.length >= MAX_IMAGES}
            onClick={() => fileRef.current?.click()}>
            {t("auto_comment_choose_images")}
          </Button>
          {imageUrls.length > 0 && (
            <div className="bm-mt-2 bm-flex bm-flex-wrap bm-gap-1.5">
              {imageUrls.map((url, i) => (
                <div key={i} className="bm-relative">
                  <img
                    src={url}
                    className="bm-h-14 bm-w-14 bm-rounded-lg bm-border bm-border-line bm-object-cover"
                    alt=""
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setImageUrls((p) => p.filter((_, j) => j !== i))
                    }
                    className="bm-absolute -bm-right-1 -bm-top-1 bm-flex bm-h-4 bm-w-4 bm-items-center bm-justify-center bm-rounded-full bm-bg-danger bm-text-[11px] bm-text-white">
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </Field>
      </div>
    </Modal>
  )
}
