import { AlertCircle, ChevronDown, Download, FileSpreadsheet, FileText, MessageSquare, RotateCw, Search } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { ThreadDownloadOptions } from "src/modules/content/components/download-messages/ThreadDownloadOptions"
import { ThreadList } from "src/modules/content/components/download-messages/ThreadList"
import { useDownloadMessages } from "src/modules/content/hooks/useDownloadMessages"
import type {
  DownloadMessagesFormat,
  DownloadProgress,
  MessageThread,
  ThreadTypeFilter
} from "src/modules/content/types/download-messages.types"
import {
  exportThreadListCsv,
  exportThreadListExcel,
  filterThreads,
  saveConversationFile
} from "src/modules/content/utils/download-messages.util"
import { TableFacebookPagination } from "src/modules/facebook/components/TablePagination"
import { useFacebook } from "src/modules/facebook/hooks/useFacebookSession"
import { Button, Dropdown, EmptyState, Input, Select, Spinner } from "src/modules/shared/ui"

export function DownloadMessagesPanel() {
  const { t } = useTranslation()
  const { profile } = useFacebook()
  const { threads, threadsState, error, loadThreads, downloadMessages } = useDownloadMessages()

  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<ThreadTypeFilter>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [activeThread, setActiveThread] = useState<MessageThread | null>(null)
  const [limit, setLimit] = useState<number>(200)
  const [format, setFormat] = useState<DownloadMessagesFormat>("html")

  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({ current: 0, total: 0 })
  const isStoppedRef = useRef(false)
  const optionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (profile?.uid) loadThreads()
  }, [profile?.uid, loadThreads])

  const handleReload = () => loadThreads({ forceRefresh: true })

  const filteredThreads = useMemo(
    () => filterThreads(threads, searchQuery, typeFilter),
    [threads, searchQuery, typeFilter]
  )

  const paginatedThreads = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredThreads.slice(startIndex, startIndex + pageSize)
  }, [filteredThreads, currentPage, pageSize])

  const totalPages = Math.ceil(filteredThreads.length / pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, typeFilter, pageSize])

  // The sidebar scrolls inside its own container, so bring the options card into view instead of window.scrollTo
  useEffect(() => {
    if (activeThread) optionsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [activeThread])

  const handleSelectThread = (thread: MessageThread) => {
    setActiveThread(thread)
    setLimit(Math.min(thread.messagesCount || 100, 200))
  }

  const handleDownload = async () => {
    if (!activeThread) return
    const safeLimit = Math.max(1, limit)
    setDownloading(true)
    isStoppedRef.current = false
    setDownloadProgress({ current: 0, total: safeLimit })

    try {
      const messages = await downloadMessages({
        threadId: activeThread.id,
        limit: safeLimit,
        onProgress: (downloaded) => setDownloadProgress({ current: downloaded, total: safeLimit }),
        shouldStop: () => isStoppedRef.current
      })

      if (isStoppedRef.current) {
        toast.error(t("download_messages_tool_toast_stopped"))
        return
      }
      if (messages.length === 0) {
        toast.error(t("download_messages_tool_toast_no_messages_found"))
        return
      }

      saveConversationFile(activeThread, messages, format, { uid: profile?.uid ?? "", name: profile?.name }, t)
      toast.success(t("download_messages_tool_toast_download_success", { count: messages.length }))
      setActiveThread(null)
    } catch (e: unknown) {
      console.error("Download failed:", e)
      toast.error(e instanceof Error ? e.message : t("download_messages_tool_toast_download_error"))
    } finally {
      setDownloading(false)
    }
  }

  const handleStopDownload = () => {
    isStoppedRef.current = true
  }

  const exportDisabled = threadsState === "loading" || downloading || filteredThreads.length === 0

  return (
    <div className="bm-flex bm-w-full bm-flex-col bm-gap-3">
      {activeThread && (
        <ThreadDownloadOptions
          ref={optionsRef}
          thread={activeThread}
          limit={limit}
          onLimitChange={setLimit}
          format={format}
          onFormatChange={setFormat}
          downloading={downloading}
          progress={downloadProgress}
          onClose={() => setActiveThread(null)}
          onStart={handleDownload}
          onStop={handleStopDownload}
        />
      )}

      <div>
        <div className="bm-text-[13.5px] bm-font-semibold bm-text-fg">{t("download_messages_tool_list_title")}</div>
        <p className="bm-text-[11.5px] bm-text-fg-muted">{t("download_messages_tool_list_description")}</p>
      </div>

      {/* Toolbar */}
      <div className="bm-flex bm-flex-col bm-gap-2 bm-rounded-xl bm-border bm-border-line bm-bg-surface-2/60 bm-p-2.5">
        <Input
          size="sm"
          type="text"
          placeholder={t("download_messages_tool_search_placeholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          suffix={<Search size={14} className="bm-text-fg-subtle" />}
        />
        <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-1.5">
          <Select<ThreadTypeFilter>
            size="sm"
            className="bm-w-[150px]"
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: "all", label: t("download_messages_tool_filter_all_types") },
              { value: "ONE_TO_ONE", label: t("download_messages_tool_type_personal") },
              { value: "PAGE", label: t("download_messages_tool_type_fanpage") },
              { value: "GROUP", label: t("download_messages_tool_type_group") }
            ]}
          />
          <div className="bm-ml-auto bm-flex bm-items-center bm-gap-1.5">
            <Dropdown
              items={[
                {
                  key: "excel",
                  icon: <FileSpreadsheet size={14} />,
                  label: t("download_messages_tool_export_excel"),
                  disabled: exportDisabled,
                  onClick: () => exportThreadListExcel(filteredThreads, t)
                },
                {
                  key: "csv",
                  icon: <FileText size={14} />,
                  label: t("download_messages_tool_export_csv"),
                  disabled: exportDisabled,
                  onClick: () => exportThreadListCsv(filteredThreads, t)
                }
              ]}>
              <Button
                size="xs"
                variant="success"
                disabled={exportDisabled}
                icon={<Download size={13} />}
                iconRight={<ChevronDown size={12} />}>
                {t("download_messages_tool_action_download")}
              </Button>
            </Dropdown>
            <Button
              size="xs"
              variant="outline"
              onClick={handleReload}
              disabled={threadsState === "loading" || downloading}
              icon={<RotateCw size={13} className={threadsState === "loading" ? "bm-animate-spin" : ""} />}>
              {t("download_messages_tool_action_reload")}
            </Button>
          </div>
        </div>
      </div>

      {threadsState === "loading" ? (
        <div className="bm-flex bm-flex-col bm-items-center bm-justify-center bm-gap-2 bm-py-12">
          <Spinner />
          <p className="bm-text-[12px] bm-text-fg-muted">{t("download_messages_tool_loading_threads")}</p>
        </div>
      ) : threadsState === "error" ? (
        <EmptyState
          icon={<AlertCircle size={22} className="bm-text-danger" />}
          title={t("download_messages_tool_error_title")}
          description={error || t("download_messages_tool_error_default_message")}
          action={
            <Button size="sm" variant="primary" onClick={handleReload}>
              {t("download_messages_tool_action_retry")}
            </Button>
          }
        />
      ) : filteredThreads.length === 0 ? (
        <EmptyState
          compact
          icon={<MessageSquare size={22} />}
          title={t("download_messages_tool_empty_threads")}
        />
      ) : (
        <>
          <ThreadList
            threads={paginatedThreads}
            activeThreadId={activeThread?.id}
            disabled={downloading}
            onSelect={handleSelectThread}
          />
          {totalPages > 1 && (
            <TableFacebookPagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filteredThreads.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </>
      )}
    </div>
  )
}
