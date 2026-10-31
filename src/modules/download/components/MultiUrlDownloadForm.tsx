import { Download, Layers, ListChecks, ScanSearch, Settings2 } from "lucide-react"
import { FormEvent, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { v4 as uuidv4 } from "uuid"

import {
  DEFAULT_CONCURRENCY_PROCESS_LIMIT,
  SINGLE_DOWNLOAD_TYPE_META
} from "src/constants/download.constants"
import { ESingleDownloadType, ESocialProvider } from "src/constants/enum"
import { APP_ROUTES } from "src/constants/route.constants"
import VerifyAccountNotice from "src/modules/facebook/components/VerifyAccountNotice"
import DownloadProcessTable from "src/modules/download/components/DownloadProcessTable"
import SaveModeField from "src/modules/download/components/SaveModeField"
import useSaveMode from "src/modules/download/hooks/useSaveMode"
import UrlValidator from "src/modules/download/components/UrlValidator"
import useDownloadProcesses from "src/stores/download-process.store"
import { ISingleDownloadProcess } from "src/modules/download/types/download.types"
import { SINGLE_DOWNLOAD_HANDLERS } from "src/modules/download/services/single-download.service"
import { createMediaSink, IMediaSink } from "src/modules/download/utils/media-sink.util"
import {
  detectDownloadTypeByUrl,
  extractDisplayIdFromMatch,
  splitUrlLines
} from "src/modules/download/utils/url.util"
import { Badge, Button, Field, NumberInput, Surface, Textarea } from "src/modules/shared/ui"
import { isVerifyAccount } from "src/utils/common.util"
import { isSingleDownloadProcessExist, promisePool } from "src/utils/download.util"
import { showErrorToast, showSuccessToast } from "src/utils/toast.util"

const MultiUrlDownloadForm = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const {
    singleProcesses,
    addSingleProcess,
    removeSingleProcess,
    updateSingleProcess,
    clearFinishedProcesses
  } = useDownloadProcesses()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [urlsText, setUrlsText] = useState("")
  const [concurrency, setConcurrency] = useState<number | null>(DEFAULT_CONCURRENCY_PROCESS_LIMIT)
  const [error, setError] = useState<string | undefined>(undefined)
  const [saveMode, setSaveMode] = useSaveMode()

  const lineCount = useMemo(() => splitUrlLines(urlsText).length, [urlsText])

  const runProcess = async (process: ISingleDownloadProcess, sink: IMediaSink) => {
    try {
      if (!isSingleDownloadProcessExist(process.id)) return
      const handler = SINGLE_DOWNLOAD_HANDLERS[process.downloadType]
      await handler({ processId: process.id, url: process.url, sink })
      if (isSingleDownloadProcessExist(process.id)) {
        updateSingleProcess(process.id, { status: "COMPLETED" })
      }
    } catch (err) {
      if (isSingleDownloadProcessExist(process.id)) {
        updateSingleProcess(process.id, { status: "FAILED" })
      }
      showErrorToast(`${process.username}: ${(err as Error).message}`)
    }
  }

  /** Re-run one failed URL; in zip mode it gets its own archive */
  const handleRetry = (processId: string) => {
    const process = singleProcesses.find((p) => p.id === processId)
    if (!process) return
    updateSingleProcess(processId, { status: "RUNNING", totalDownloadedItems: 0 })
    const sink = createMediaSink(process.saveMode ?? saveMode, `facebook_${process.username || "retry"}_${Date.now()}`)
    void runProcess(process, sink).then(() =>
      sink.finish().catch((zipError: Error) => showErrorToast(zipError.message))
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const urls = splitUrlLines(urlsText)
    if (urls.length === 0) {
      setError(t("enter_urls_each_line"))
      return
    }
    setError(undefined)
    try {
      setIsSubmitting(true)
      if (!isVerifyAccount(ESocialProvider.FACEBOOK)) {
        throw new Error(t("please_verify_facebook_before_download"))
      }
      const processes: ISingleDownloadProcess[] = []
      const unsupported: string[] = []
      for (const url of urls) {
        const detected = detectDownloadTypeByUrl(url)
        if (!detected) {
          unsupported.push(url)
          continue
        }
        processes.push({
          id: uuidv4(),
          url,
          username: extractDisplayIdFromMatch({ ...detected, url }),
          downloadType: detected.downloadType,
          totalItems: 0,
          totalDownloadedItems: 0,
          status: "RUNNING",
          saveMode
        })
      }
      if (processes.length === 0) {
        throw new Error(t("no_valid_single_download_url"))
      }
      if (unsupported.length > 0) {
        showErrorToast(`${t("url_validation_invalid")}: ${unsupported.length}`)
      }
      processes.forEach(addSingleProcess)
      setUrlsText(unsupported.join("\n"))
      showSuccessToast(t("download_started_count", { count: processes.length }))

      // one sink per submit: in zip mode every URL of this batch lands in a single archive
      const sink = createMediaSink(saveMode, `facebook_multi_${Date.now()}`)
      void promisePool({
        items: processes,
        concurrency: Math.max(1, concurrency ?? DEFAULT_CONCURRENCY_PROCESS_LIMIT),
        worker: (process) => runProcess(process, sink)
      }).then(() =>
        sink.finish().catch((zipError: Error) => showErrorToast(zipError.message))
      )
    } catch (err) {
      showErrorToast((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="bm-flex bm-flex-col bm-gap-4">
      <VerifyAccountNotice provider={ESocialProvider.FACEBOOK} />

      <div className="bm-grid bm-grid-cols-1 bm-gap-3 pw-md:bm-grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Surface
          padding="sm"
          title={t("url_list")}
          description={t("url_list_hint")}
          icon={<ListChecks size={14} />}
          extra={
            lineCount > 0 ? (
              <Badge tone="brand" size="xs">
                {lineCount} URL
              </Badge>
            ) : undefined
          }
          className={error ? "bm-border-danger/60" : undefined}>
          <Textarea
            rows={9}
            mono
            value={urlsText}
            invalid={!!error}
            placeholder={t("enter_urls_each_line")}
            onChange={(e) => {
              setUrlsText(e.target.value)
              setError(undefined)
            }}
          />
          {error && <div className="bm-mt-1.5 bm-text-[11.5px] bm-text-danger bm-animate-fade-in">{error}</div>}
        </Surface>

        <div className="bm-flex bm-flex-col bm-gap-3">
          <Surface padding="sm" title={t("url_validator")} icon={<ScanSearch size={14} />}>
            <UrlValidator />
          </Surface>
          <Surface padding="sm" title={t("download_options")} icon={<Settings2 size={14} />}>
            <div className="bm-flex bm-flex-col bm-gap-3">
              <SaveModeField value={saveMode} onChange={setSaveMode} />
              <Field label={t("concurrency_processing_size")} hint={t("concurrency_tooltip")}>
                <NumberInput
                  min={1}
                  max={20}
                  value={concurrency}
                  onChange={setConcurrency}
                  prefix={<Layers size={13} />}
                />
              </Field>
              <div className="bm-flex bm-items-start bm-justify-between bm-gap-2 bm-rounded-lg bm-bg-surface-2/60 bm-px-2.5 bm-py-2 bm-text-[11.5px] bm-text-fg-muted">
                <span>{t("single_file_name_config_hint")}</span>
                <Button
                  size="xs"
                  variant="link"
                  className="bm-shrink-0"
                  onClick={() => navigate(APP_ROUTES.SETTINGS)}>
                  {t("settings")}
                </Button>
              </div>
            </div>
          </Surface>
        </div>
      </div>

      <div className="bm-flex bm-items-center bm-justify-between bm-gap-3">
        <span className="bm-text-[11.5px] bm-text-fg-subtle">{t("download_root_folder_hint")}</span>
        <Button type="submit" variant="primary" loading={isSubmitting} icon={<Download size={14} />}>
          {t("download")}
        </Button>
      </div>

      <DownloadProcessTable
        processes={singleProcesses}
        onCancel={removeSingleProcess}
        onRetry={handleRetry}
        onClearFinished={clearFinishedProcesses}
        targetLabel={t("id")}
        typeLabel={(type) => t(SINGLE_DOWNLOAD_TYPE_META[type as ESingleDownloadType]?.label ?? type)}
      />
    </form>
  )
}

export default MultiUrlDownloadForm
