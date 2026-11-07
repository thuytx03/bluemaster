import {
  Download,
  Heart,
  MessageCircle,
  Newspaper,
  Radar,
  Repeat2,
  Search,
  Send,
  Upload
} from "lucide-react"
import { ChangeEvent, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { typeLabel } from "src/modules/automation/components/post-radar/PostRadarParts"
import PostRadarPostTable from "src/modules/automation/components/post-radar/PostRadarPostTable"
import {
  filterRadarPosts,
  radarStats,
  type PostRadarController
} from "src/modules/automation/hooks/usePostRadar"
import type { RadarTypeFilter } from "src/modules/automation/types/post-radar.types"
import {
  formatNumber,
  parseCsvText,
  RADAR_CSV_HEADERS,
  radarPostsFromCsv,
  radarPostsToCsvRows
} from "src/modules/automation/utils/post-radar.util"
import {
  Button,
  Callout,
  Dropdown,
  EmptyState,
  Input,
  NumberInput,
  Segmented,
  Spinner,
  StatTile,
  Surface
} from "src/modules/shared/ui"
import { exportToCSV } from "src/utils/export.util"

const TYPE_FILTERS: RadarTypeFilter[] = [
  "all",
  "video",
  "text",
  "photo",
  "link"
]

/** Step 1: scan a group / page (or import a file), filter, export and pick posts. */
export default function PostRadarScanner({
  scanner,
  onLeech
}: {
  scanner: PostRadarController
  onLeech: () => void
}) {
  const {
    state,
    scanStatus,
    posts,
    selected,
    typeFilter,
    setTypeFilter,
    scan,
    loadPosts,
    toggleSelect,
    selectAll
  } = scanner
  const { t } = useTranslation()

  const [sourceInput, setSourceInput] = useState("")
  const [limit, setLimit] = useState(50)
  const importInputRef = useRef<HTMLInputElement>(null)

  const isScanning = state === "scanning"
  const rows = useMemo(
    () => filterRadarPosts(posts, typeFilter),
    [posts, typeFilter]
  )
  const st = useMemo(() => radarStats(posts), [posts])

  const postTypeCounts: Record<RadarTypeFilter, number> = {
    all: posts.length,
    video: posts.filter((p) => p.postType === "video").length,
    text: posts.filter((p) => p.postType === "text").length,
    photo: posts.filter((p) => p.postType === "photo").length,
    link: posts.filter((p) => p.postType === "link").length
  }

  const handleScan = () => {
    if (!sourceInput.trim()) {
      toast.error(t("post_radar_toast_enter_source"))
      return
    }
    void scan(sourceInput.trim(), limit)
  }

  const exportTarget = () =>
    selected.size > 0 ? Array.from(selected).map((i) => posts[i]) : posts

  const handleExportIds = () => {
    const target = exportTarget()
    if (!target.length) {
      toast.error(t("post_radar_toast_no_posts"))
      return
    }
    const ids = target.map((p) => p.postId).join("\n")
    navigator.clipboard
      .writeText(ids)
      .then(() =>
        toast.success(
          t("post_radar_toast_copied_ids", { count: target.length })
        )
      )
      .catch((e) => toast.error(e instanceof Error ? e.message : String(e)))
  }

  const handleExportCsv = () => {
    const target = exportTarget()
    if (!target.length) {
      toast.error(t("post_radar_toast_no_posts"))
      return
    }
    exportToCSV(
      RADAR_CSV_HEADERS,
      radarPostsToCsvRows(target),
      `post_radar_${Date.now()}.csv`
    )
    toast.success(t("post_radar_toast_exported", { count: target.length }))
  }

  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const imported = radarPostsFromCsv(
        parseCsvText(String(ev.target?.result ?? ""))
      )
      if (!imported) {
        toast.error(t("post_radar_toast_file_empty"))
        return
      }
      if (!imported.length) {
        toast.error(t("post_radar_toast_import_failed"))
        return
      }
      loadPosts(imported)
      toast.success(t("post_radar_toast_imported", { count: imported.length }))
    }
    reader.readAsText(file, "utf-8")
    e.target.value = ""
  }

  return (
    <div className="bm-flex bm-flex-col bm-gap-3">
      {/* Input bar */}
      <Surface padding="sm" bodyClassName="bm-flex bm-flex-col bm-gap-2">
        <label className="bm-text-[12px] bm-font-medium bm-text-fg-muted">
          {t("post_radar_source_label")}
        </label>
        <Input
          value={sourceInput}
          onChange={(e) => setSourceInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleScan()
            }
          }}
          placeholder={t("post_radar_source_placeholder")}
          disabled={isScanning}
          prefix={<Search size={14} />}
        />
        <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-2">
          <NumberInput
            className="bm-w-[120px]"
            value={limit}
            min={1}
            max={200}
            onChange={(v) => setLimit(v ?? 1)}
            disabled={isScanning}
            prefix={
              <span className="bm-text-[11px] bm-text-fg-subtle">
                {t("post_radar_limit_label")}
              </span>
            }
          />
          <Button
            variant="primary"
            onClick={handleScan}
            loading={isScanning}
            icon={<Radar size={14} />}
            className="bm-flex-1">
            {isScanning
              ? t("post_radar_scanning")
              : t("post_radar_scan_button")}
          </Button>
          <input
            ref={importInputRef}
            type="file"
            accept=".csv,.txt"
            className="bm-hidden"
            onChange={handleImport}
          />
          <Button
            variant="outline"
            disabled={isScanning}
            icon={<Upload size={14} />}
            onClick={() => importInputRef.current?.click()}>
            {t("post_radar_import_file")}
          </Button>
        </div>
      </Surface>

      {isScanning && (
        <Surface padding="none">
          <EmptyState
            icon={<Spinner size={22} className="bm-text-brand" />}
            title={scanStatus || t("post_radar_scanning_posts")}
            description={t("post_radar_please_wait")}
          />
        </Surface>
      )}

      {!isScanning && posts.length === 0 && (
        <>
          {scanStatus && (
            <Callout tone="warning" compact>
              {scanStatus}
            </Callout>
          )}
          <Surface padding="none">
            <EmptyState
              icon={<Radar size={22} />}
              title={t("post_radar_empty_state_title")}
              description={t("post_radar_empty_state_desc")}
            />
          </Surface>
        </>
      )}

      {posts.length > 0 && (
        <div className="bm-flex bm-flex-col bm-gap-2.5">
          <div className="bm-grid bm-grid-cols-2 bm-gap-2">
            <StatTile
              size="sm"
              icon={<Newspaper size={15} />}
              label={t("post_radar_stat_post_count")}
              value={posts.length}
            />
            <StatTile
              size="sm"
              tone="danger"
              icon={<Heart size={15} />}
              label={t("post_radar_stat_total_like")}
              value={formatNumber(st.totalLike)}
            />
            <StatTile
              size="sm"
              tone="info"
              icon={<MessageCircle size={15} />}
              label={t("post_radar_stat_total_comment")}
              value={formatNumber(st.totalComment)}
            />
            <StatTile
              size="sm"
              tone="success"
              icon={<Repeat2 size={15} />}
              label={t("post_radar_stat_total_share")}
              value={formatNumber(st.totalShare)}
            />
          </div>

          <div className="bm-overflow-x-auto x-no-scrollbar">
            <Segmented<RadarTypeFilter>
              size="sm"
              value={typeFilter}
              onChange={setTypeFilter}
              options={TYPE_FILTERS.map((f) => ({
                value: f,
                label: `${f === "all" ? t("post_radar_type_all") : typeLabel(f, t)} (${postTypeCounts[f]})`
              }))}
            />
          </div>

          <div className="bm-flex bm-flex-wrap bm-items-center bm-justify-between bm-gap-2">
            <p className="bm-text-[12px] bm-text-fg-muted">
              {t("post_radar_toolbar_summary", {
                showing: rows.length,
                selected: selected.size,
                total: posts.length
              })}
            </p>
            <div className="bm-flex bm-items-center bm-gap-1.5">
              <Dropdown
                minWidth={170}
                items={[
                  {
                    key: "ids",
                    label: t("post_radar_export_ids"),
                    onClick: handleExportIds
                  },
                  {
                    key: "csv",
                    label: t("post_radar_export_csv"),
                    onClick: handleExportCsv
                  }
                ]}>
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Download size={13} />}>
                  {t("post_radar_export")}
                </Button>
              </Dropdown>
              <Button
                size="sm"
                variant="primary"
                disabled={!selected.size}
                onClick={onLeech}
                icon={<Send size={13} />}>
                {t("post_radar_post_to_my_groups")}
              </Button>
            </div>
          </div>

          <PostRadarPostTable
            rows={rows}
            selected={selected}
            onToggle={toggleSelect}
            onSelectAll={(checked) => selectAll(posts, typeFilter, checked)}
          />
        </div>
      )}
    </div>
  )
}
