import { X } from "lucide-react"
import { ReactNode } from "react"
import { createPortal } from "react-dom"

import { IconButton } from "./Button"
import { cn } from "./cn"
import { useEscape, useLayer } from "./layer"

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  /** Right-aligned action row under the body */
  footer?: ReactNode
  children?: ReactNode
  /** Accessible label of the close (×) button; the button is hidden when omitted */
  closeLabel?: string
  role?: "dialog" | "alertdialog"
  className?: string
  bodyClassName?: string
}

/**
 * Overlay dialog portaled into the sidebar layer, so it stays inside the
 * shadow DOM and above the panel. Closes on Escape and on backdrop click.
 */
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  footer,
  children,
  closeLabel,
  role = "dialog",
  className,
  bodyClassName
}: ModalProps) {
  const layer = useLayer()
  useEscape(onClose, open)
  if (!open) return null

  const node = (
    <div
      className="bm-pointer-events-auto bm-absolute bm-inset-0 bm-z-[60] bm-flex bm-items-center bm-justify-center bm-bg-black/40 bm-p-3"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}>
      <div
        role={role}
        className={cn(
          "bm-flex bm-max-h-full bm-w-full bm-max-w-[480px] bm-flex-col bm-overflow-hidden bm-rounded-xl2 bm-border bm-border-line bm-bg-surface bm-shadow-pop",
          className
        )}>
        <div className="bm-flex bm-items-start bm-gap-2 bm-px-4 bm-pt-4">
          <div className="bm-min-w-0 bm-flex-1">
            <h2 className="bm-text-[14px] bm-font-semibold bm-text-fg">
              {title}
            </h2>
            {subtitle && (
              <div className="bm-mt-1 bm-text-[12.5px] bm-leading-relaxed bm-text-fg-muted">
                {subtitle}
              </div>
            )}
          </div>
          {closeLabel && (
            <IconButton
              size="xs"
              label={closeLabel}
              tooltip={false}
              onClick={onClose}>
              <X size={14} />
            </IconButton>
          )}
        </div>
        {children && (
          <div
            className={cn(
              "bm-flex bm-min-h-0 bm-flex-1 bm-flex-col bm-gap-3 bm-overflow-y-auto bm-px-4 bm-pt-3",
              bodyClassName
            )}>
            {children}
          </div>
        )}
        <div className="bm-h-4 bm-shrink-0" />
        {footer && (
          <div className="bm-flex bm-flex-wrap bm-justify-end bm-gap-2 bm-border-t bm-border-line bm-px-4 bm-py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )

  return layer ? createPortal(node, layer) : node
}
