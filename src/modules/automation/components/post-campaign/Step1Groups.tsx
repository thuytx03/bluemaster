import {
  ChevronRight,
  ExternalLink,
  RotateCcw,
  Search,
  Trash2,
  Users
} from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { normalizeForSearch } from "src/configs/tools.config"
import { usePostCampaignStore } from "src/modules/automation/hooks/usePostCampaignStore"
import type { PostGroup } from "src/modules/automation/types/post-campaign.types"
import { formatSyncedAt } from "src/modules/automation/utils/post-campaign.util"
import { TableFacebookPagination } from "src/modules/facebook/components/TablePagination"
import {
  Avatar,
  Button,
  Callout,
  Checkbox,
  cn,
  ConfirmDialog,
  EmptyState,
  IconButton,
  Input,
  Spinner
} from "src/modules/shared/ui"

interface Props {
  groups: PostGroup[]
  loading: boolean
  syncing: boolean
  syncProgress: string
  error: string | null
  lastSyncedAt: string | null
  onSync: () => void
  onClearData: () => void
}

export function Step1Groups({
  groups,
  loading,
  syncing,
  syncProgress,
  error,
  lastSyncedAt,
  onSync,
  onClearData
}: Props) {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const [confirmClear, setConfirmClear] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const { selectedGroups, toggleGroup, selectAllGroups, clearGroups, setStep } =
    usePostCampaignStore()

  const selectedIds = useMemo(
    () => new Set(selectedGroups.map((g) => g.groupId)),
    [selectedGroups]
  )
  const filtered = useMemo(() => {
    const q = normalizeForSearch(search.trim())
    if (!q) return groups
    return groups.filter(
      (g) =>
        normalizeForSearch(g.groupName).includes(q) ||
        g.groupId.includes(search.trim())
    )
  }, [groups, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )
  const allSelected = selectedIds.size === groups.length && groups.length > 0

  return (
    <div className="bm-flex bm-flex-col bm-gap-3">
      {/* Top bar: last sync + sync / clear */}
      <div className="bm-flex bm-flex-wrap bm-items-center bm-justify-between bm-gap-2">
        <div className="bm-flex bm-min-w-0 bm-items-center bm-gap-1.5 bm-text-[12.5px] bm-text-fg-muted">
          <RotateCcw size={13} className="bm-shrink-0" />
          {lastSyncedAt ? (
            <span className="bm-truncate">
              {t("campaign_manager_last_synced_prefix")}{" "}
              <span className="bm-font-medium bm-text-fg">
                {formatSyncedAt(lastSyncedAt)}
              </span>
            </span>
          ) : (
            <span className="bm-italic">
              {t("campaign_manager_no_data_yet")}
            </span>
          )}
        </div>
        <div className="bm-flex bm-items-center bm-gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={onSync}
            disabled={syncing || loading}
            icon={
              <RotateCcw
                size={13}
                className={cn(syncing && "bm-animate-spin")}
              />
            }>
            {syncing
              ? t("campaign_manager_syncing")
              : t("campaign_manager_sync_data")}
          </Button>
          <IconButton
            label={t("campaign_manager_clear_data")}
            variant="outline"
            className="bm-text-danger"
            onClick={() => setConfirmClear(true)}
            disabled={syncing || loading || groups.length === 0}>
            <Trash2 size={14} />
          </IconButton>
        </div>
      </div>

      {syncing && syncProgress && (
        <div className="bm-flex bm-items-center bm-gap-2 bm-text-[12px] bm-text-fg-muted">
          <Spinner size={12} /> {syncProgress}
        </div>
      )}
      {error && (
        <Callout tone="danger" compact>
          {error}
        </Callout>
      )}

      {/* Select all + count + search */}
      <div className="bm-flex bm-items-center bm-gap-2">
        <Checkbox
          size="sm"
          checked={allSelected}
          indeterminate={!allSelected && selectedIds.size > 0}
          disabled={groups.length === 0}
          onChange={() =>
            allSelected ? clearGroups() : selectAllGroups(groups)
          }
          label={
            <span className="bm-whitespace-nowrap">
              {t("campaign_manager_select_all")}
            </span>
          }
        />
        <span className="bm-whitespace-nowrap bm-text-[12px] bm-text-fg-muted">
          {t("campaign_manager_all_count", { count: groups.length })}
        </span>
        <Input
          size="sm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          prefix={<Search size={12} />}
          placeholder={t("campaign_manager_search_group_placeholder")}
          className="bm-min-w-0 bm-flex-1"
        />
      </div>

      {/* Group list */}
      {loading ? (
        <div className="bm-flex bm-items-center bm-justify-center bm-gap-2 bm-py-10 bm-text-[13px] bm-text-fg-muted">
          <Spinner size={14} /> {t("campaign_manager_loading_groups")}
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          compact
          icon={<Users size={18} />}
          title={t("campaign_manager_no_data_yet")}
          description={
            <>
              {t("campaign_manager_no_group_data_prefix")}{" "}
              <strong>{t("campaign_manager_sync_data")}</strong>{" "}
              {t("campaign_manager_no_group_data_suffix")}
            </>
          }
        />
      ) : filtered.length === 0 ? (
        <p className="bm-py-6 bm-text-center bm-text-[13px] bm-italic bm-text-fg-muted">
          {t("campaign_manager_no_groups_found")}
        </p>
      ) : (
        <>
          <div className="bm-flex bm-flex-col bm-gap-1.5">
            {pageItems.map((g) => {
              const checked = selectedIds.has(g.groupId)
              return (
                <div
                  key={g.groupId}
                  onClick={() => toggleGroup(g)}
                  className={cn(
                    "bm-flex bm-cursor-pointer bm-items-center bm-gap-2.5 bm-rounded-lg bm-border bm-p-2 bm-transition-colors",
                    checked
                      ? "bm-border-brand/50 bm-bg-brand-soft/60"
                      : "bm-border-line bm-bg-surface hover:bm-bg-surface-2"
                  )}>
                  <Checkbox
                    size="sm"
                    checked={checked}
                    onChange={() => toggleGroup(g)}
                  />
                  <Avatar
                    src={g.avatarUrl}
                    name={g.groupName}
                    size={34}
                    rounded="xl"
                  />
                  <div className="bm-min-w-0 bm-flex-1">
                    <p className="bm-truncate bm-text-[13px] bm-font-medium bm-leading-tight bm-text-fg">
                      {g.groupName}
                    </p>
                    <span className="bm-block bm-truncate bm-font-mono bm-text-[11px] bm-text-fg-subtle">
                      {g.groupId}
                    </span>
                  </div>
                  <IconButton
                    label={t("campaign_manager_open_group_on_facebook")}
                    size="xs"
                    tooltipPlacement="top-end"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(
                        `https://www.facebook.com/groups/${g.groupId}`,
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }}>
                    <ExternalLink size={13} />
                  </IconButton>
                </div>
              )
            })}
          </div>
          {filtered.length > pageSize && (
            <TableFacebookPagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setPage(1)
              }}
              pageSizeOptions={[20, 50, 100]}
            />
          )}
        </>
      )}

      {/* Footer */}
      <div className="bm-flex bm-items-center bm-justify-between bm-gap-2 bm-border-t bm-border-line bm-pt-3">
        <span className="bm-text-[13px] bm-font-medium bm-text-brand-ink">
          {t("campaign_manager_groups_selected_count", {
            count: selectedGroups.length
          })}
        </span>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setStep(2)}
          disabled={selectedGroups.length === 0}
          iconRight={<ChevronRight size={14} />}>
          {t("campaign_manager_next_step")}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title={t("campaign_manager_clear_data")}
        description={t("campaign_manager_clear_data_confirm")}
        destructive
        onConfirm={() => {
          clearGroups()
          onClearData()
        }}
      />
    </div>
  )
}
