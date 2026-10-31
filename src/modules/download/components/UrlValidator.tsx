import { ChevronDown, Link2, ScanSearch } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { SINGLE_DOWNLOAD_TYPES } from "src/constants/download.constants"
import {
  detectDownloadTypeByUrl,
  extractDisplayIdFromMatch
} from "src/modules/download/utils/url.util"
import { Badge, Callout, cn, Input } from "src/modules/shared/ui"

interface UrlValidatorProps {
  className?: string
}

/** Paste a URL to see which download type (if any) would handle it, plus examples. */
const UrlValidator = ({ className }: UrlValidatorProps) => {
  const { t } = useTranslation()
  const [url, setUrl] = useState("")
  const [showExamples, setShowExamples] = useState(false)

  const result = useMemo(() => {
    const trimmed = url.trim()
    if (!trimmed) return null
    const detected = detectDownloadTypeByUrl(trimmed)
    if (!detected) return { valid: false as const }
    return {
      valid: true as const,
      type: detected.downloadType,
      id: extractDisplayIdFromMatch({ ...detected, url: trimmed })
    }
  }, [url])

  return (
    <div className={cn("bm-flex bm-flex-col bm-gap-2", className)}>
      <Input
        size="sm"
        value={url}
        prefix={<ScanSearch size={13} />}
        placeholder={t("enter_url_to_validate")}
        onChange={(e) => setUrl(e.target.value)}
      />
      {result && (
        <Callout tone={result.valid ? "success" : "warning"} compact>
          {result.valid ? (
            <span className="bm-flex bm-flex-wrap bm-items-center bm-gap-1.5">
              {t("url_validation_valid")}
              <Badge tone="brand" size="xs">
                {t(SINGLE_DOWNLOAD_TYPES.find((m) => m.type === result.type)?.label ?? result.type)}
              </Badge>
              <span className="bm-font-mono bm-text-[11px]">{result.id}</span>
            </span>
          ) : (
            t("url_validation_invalid")
          )}
        </Callout>
      )}
      <button
        type="button"
        onClick={() => setShowExamples((s) => !s)}
        className="bm-inline-flex bm-w-fit bm-items-center bm-gap-1 bm-text-[11.5px] bm-font-medium bm-text-fg-muted hover:bm-text-fg">
        <ChevronDown
          size={13}
          className={cn("bm-transition-transform", showExamples && "bm-rotate-180")}
        />
        {t("supported_url_examples")}
      </button>
      {showExamples && (
        <div className="bm-grid bm-grid-cols-1 bm-gap-2 bm-animate-fade-in">
          {SINGLE_DOWNLOAD_TYPES.map((meta) => (
            <div
              key={meta.type}
              className="bm-rounded-lg bm-border bm-border-line bm-bg-surface-2/50 bm-px-2.5 bm-py-2">
              <div className="bm-mb-1 bm-text-[11.5px] bm-font-semibold bm-text-fg">
                {t(meta.label)}
              </div>
              <ul className="bm-flex bm-flex-col bm-gap-0.5">
                {meta.urlExamples.map((example) => (
                  <li
                    key={example}
                    className="bm-flex bm-min-w-0 bm-items-center bm-gap-1.5 bm-text-[11px] bm-text-fg-muted">
                    <Link2 size={10} className="bm-shrink-0" />
                    <span className="bm-truncate bm-font-mono" title={example}>
                      {example}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default UrlValidator
