import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button, Field, Input, Modal } from "src/modules/shared/ui"

/** Create / rename a library topic. */
export default function LibraryTopicModal({
  open,
  initialName,
  onClose,
  onSubmit
}: {
  open: boolean
  initialName?: string
  onClose: () => void
  onSubmit: (name: string) => Promise<unknown>
}) {
  const { t } = useTranslation()
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setName(initialName ?? "")
  }, [open, initialName])

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      await onSubmit(name)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      closeLabel={t("auto_comment_cancel")}
      open={open}
      onClose={onClose}
      title={
        initialName
          ? t("auto_comment_library_rename_topic")
          : t("auto_comment_library_new_topic")
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
            disabled={!name.trim()}
            onClick={handleSave}>
            {t("auto_comment_save_changes")}
          </Button>
        </>
      }>
      <Field label={t("auto_comment_library_topic_name_label")}>
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void handleSave()}
        />
      </Field>
    </Modal>
  )
}
