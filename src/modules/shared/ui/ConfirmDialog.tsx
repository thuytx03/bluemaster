import { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import Button from "./Button"
import Modal from "./Modal"

/** Confirm / cancel dialog (replaces shadcn AlertDialog) built on the shared Modal. */
export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  confirmText?: ReactNode
  cancelText?: ReactNode
  onConfirm: () => void
  destructive?: boolean
  loading?: boolean
  children?: ReactNode
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  destructive,
  loading,
  children
}: ConfirmDialogProps) {
  const { t } = useTranslation()
  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      role="alertdialog"
      className="bm-max-w-[420px]"
      title={title}
      subtitle={
        description && (
          <span className="bm-whitespace-pre-line">{description}</span>
        )
      }
      footer={
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}>
            {cancelText ?? t("shared_cancel")}
          </Button>
          <Button
            size="sm"
            variant={destructive ? "danger" : "primary"}
            loading={loading}
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}>
            {confirmText ?? t("shared_confirm")}
          </Button>
        </>
      }>
      {children}
    </Modal>
  )
}
