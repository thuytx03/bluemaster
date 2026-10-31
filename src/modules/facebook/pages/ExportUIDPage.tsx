import { CheckCircle2, FileText, Pause, Pickaxe, Play, Users, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { APP_ROUTES } from "src/constants/route.constants"
import { FormatType } from "src/modules/facebook/types/facebook.types"
import PageContainer from "src/modules/shared/components/PageContainer"
import {
  Badge,
  Button,
  Callout,
  CopyButton,
  Segmented,
  Spinner,
  StatTile,
  Surface
} from "src/modules/shared/ui"
import { exportToTXT } from "src/utils/export.util"

import ExportMemberToExcel from "src/modules/facebook/components/ExportMemberToExcel"
import { useFacebookUIDScraper } from "src/modules/facebook/hooks/useFacebookUIDScraper"

const ExportUIDPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const {
    state,
    textAreaRef,
    cleanup,
    handleStop,
    handleContinue,
    fileName,
    format,
    handleFormatChange
  } = useFacebookUIDScraper()

  const isScanning = state.status === "continue"

  const handleClose = () => {
    cleanup()
    navigate(APP_ROUTES.FACEBOOK.EXTRACT_UID)
  }

  return (
    <PageContainer
      title={t("extract_uid_title")}
      description={t("nav_scan_uid_desc")}
      icon={<Pickaxe size={20} />}
      accent="bm-bg-[#1877F2]/12 bm-text-[#1877F2]"
      actions={
        <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={handleClose}>
          {t("cancel")}
        </Button>
      }>
      {/* Status */}
      <div className="bm-grid bm-grid-cols-2 bm-gap-3">
        <StatTile
          label={isScanning ? t("scanning") : t("scanned")}
          value={state.count.toLocaleString()}
          hint={t("uid").replace(":", "")}
          tone={isScanning ? "info" : "success"}
          icon={isScanning ? <Spinner size={18} /> : <Users size={18} />}
        />
        <Surface padding="sm" className="bm-flex bm-items-center bm-justify-between bm-gap-3">
          <div className="bm-min-w-0">
            <div className="bm-text-[11px] bm-font-medium bm-uppercase bm-tracking-wider bm-text-fg-subtle">
              {t("status")}
            </div>
            <div className="bm-mt-1">
              {isScanning ? (
                <Badge tone="info" dot pulse>
                  {t("scanning")}…
                </Badge>
              ) : state.success ? (
                <Badge tone="success" icon={<CheckCircle2 size={12} />}>
                  {t("completed_text")}
                </Badge>
              ) : (
                <Badge tone="warning" dot>
                  {t("pause")}
                </Badge>
              )}
            </div>
          </div>
          {isScanning ? (
            <Button variant="danger" size="sm" icon={<Pause size={14} />} onClick={handleStop}>
              {t("stop")}
            </Button>
          ) : (
            <Button variant="primary" size="sm" icon={<Play size={14} />} onClick={handleContinue}>
              {t("continue_scan")}
            </Button>
          )}
        </Surface>
      </div>

      {state.success && (
        <Callout tone="success" compact>
          {t("scan_complete")}
        </Callout>
      )}

      {/* Results */}
      <Surface
        padding="none"
        title={t("results")}
        icon={<FileText size={14} />}
        extra={
          <Segmented<FormatType>
            size="sm"
            value={format}
            onChange={handleFormatChange}
            options={[
              { value: "uid", label: t("format_uid_only") },
              { value: "uid_name", label: t("format_uid_name") }
            ]}
          />
        }>
        <textarea
          ref={textAreaRef}
          rows={16}
          spellCheck={false}
          className="bm-block bm-w-full bm-resize-y bm-bg-transparent bm-px-4 bm-py-3 bm-font-mono bm-text-[12px] bm-leading-relaxed bm-text-fg bm-outline-none placeholder:bm-text-fg-subtle"
          placeholder="uid|name"
        />
        <div className="bm-flex bm-flex-wrap bm-items-center bm-justify-end bm-gap-2 bm-border-t bm-border-line bm-bg-surface-2/50 bm-px-3 bm-py-2">
          <ExportMemberToExcel data={state.arrUID} disabled={state.arrUID.length === 0} />
          <Button
            size="sm"
            variant="primary"
            icon={<FileText size={14} />}
            disabled={state.count === 0}
            onClick={() => exportToTXT(textAreaRef.current?.value || "", fileName)}>
            {t("export_txt")}
          </Button>
          <CopyButton
            size="sm"
            getText={() => textAreaRef.current?.value || ""}
            disabled={state.count === 0}
          />
        </div>
      </Surface>
    </PageContainer>
  )
}

export default ExportUIDPage
