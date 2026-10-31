import { Check, Plus } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import {
  FILE_NAME_CONFIG_DEFAULT_OPTIONS,
  FILE_NAME_TOKEN_LABEL
} from "src/constants/download.constants"
import { TFileNameToken } from "src/modules/download/types/download.types"
import { cn } from "src/modules/shared/ui"
import { getFilename } from "src/utils/file.util"

interface FileNameFormatPickerProps {
  value: TFileNameToken[]
  onChange: (value: TFileNameToken[]) => void
  /** Tokens that may be picked (display order) */
  options?: TFileNameToken[]
  disabled?: boolean
  /** Extension used in the preview, e.g. "mp4" */
  previewExtension?: string
  className?: string
}

const SAMPLE = {
  order: 1,
  id: "1234567890",
  title: "Chuyến đi Đà Lạt",
  timestamp: 1767225600
}

/**
 * Ordered multi-select: clicking a token appends it, clicking again removes it.
 * The number on each chip is its position in the resulting file name.
 */
const FileNameFormatPicker = ({
  value,
  onChange,
  options = FILE_NAME_CONFIG_DEFAULT_OPTIONS,
  disabled,
  previewExtension = "jpg",
  className
}: FileNameFormatPickerProps) => {
  const { t } = useTranslation()

  const toggle = (token: TFileNameToken) => {
    if (disabled) return
    if (value.includes(token)) onChange(value.filter((v) => v !== token))
    else onChange([...value, token])
  }

  const preview = useMemo(
    () =>
      `${getFilename({
        order: SAMPLE.order,
        id: SAMPLE.id,
        title: SAMPLE.title,
        timestamp: SAMPLE.timestamp,
        format: value.filter((v) => options.includes(v))
      })}.${previewExtension}`,
    [value, options, previewExtension]
  )

  return (
    <div className={cn("bm-flex bm-flex-col bm-gap-2.5", className)}>
      <div className="bm-flex bm-flex-wrap bm-gap-1.5">
        {options.map((token) => {
          const index = value.indexOf(token)
          const active = index !== -1
          return (
            <button
              key={token}
              type="button"
              disabled={disabled}
              onClick={() => toggle(token)}
              aria-pressed={active}
              className={cn(
                "bm-group bm-inline-flex bm-h-7 bm-items-center bm-gap-1.5 bm-rounded-lg bm-border bm-pl-1 bm-pr-2.5 bm-text-[12px] bm-font-medium bm-transition-all bm-duration-150 disabled:bm-cursor-not-allowed disabled:bm-opacity-50",
                active
                  ? "bm-border-brand/60 bm-bg-brand-soft bm-text-brand-ink"
                  : "bm-border-line bm-bg-surface bm-text-fg-muted hover:bm-border-brand/50 hover:bm-text-fg"
              )}>
              <span
                className={cn(
                  "bm-inline-flex bm-h-5 bm-w-5 bm-items-center bm-justify-center bm-rounded-full bm-text-[10.5px] bm-font-semibold bm-transition-colors",
                  active
                    ? "bm-bg-brand bm-text-brand-fg"
                    : "bm-bg-surface-2 bm-text-fg-subtle group-hover:bm-bg-brand-soft group-hover:bm-text-brand-ink"
                )}>
                {active ? index + 1 : <Plus size={11} />}
              </span>
              {t(FILE_NAME_TOKEN_LABEL[token])}
              {active && <Check size={11} className="bm-text-brand-ink/80" />}
            </button>
          )
        })}
      </div>
      <div className="bm-flex bm-min-w-0 bm-items-center bm-gap-2 bm-text-[11.5px]">
        <span className="bm-shrink-0 bm-text-fg-subtle">{t("file_name_preview")}</span>
        <code
          className="bm-min-w-0 bm-truncate bm-rounded-md bm-border bm-border-line bm-bg-surface-2/70 bm-px-2 bm-py-0.5 bm-font-mono bm-text-[11px] bm-text-fg"
          title={preview}>
          {preview}
        </code>
      </div>
    </div>
  )
}

export default FileNameFormatPicker
