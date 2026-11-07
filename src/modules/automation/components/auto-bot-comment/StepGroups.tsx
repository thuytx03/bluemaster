import { RotateCcw, Search } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { normalizeForSearch } from "src/configs/tools.config"
import GroupLibraryTab from "src/modules/automation/components/auto-bot-comment/GroupLibraryTab"
import GroupPickList from "src/modules/automation/components/auto-bot-comment/GroupPickList"
import { useAutoBotCommentSyncedGroups } from "src/modules/automation/hooks/useAutoBotCommentSyncedGroups"
import type { BotCommentGroup } from "src/modules/automation/types/auto-bot-comment.types"
import {
  fmtDate,
  parseCustomGroups
} from "src/modules/automation/utils/auto-bot-comment.util"
import { useFacebook } from "src/modules/facebook/hooks/useFacebookSession"
import {
  Button,
  Callout,
  Input,
  Segmented,
  Spinner,
  Textarea
} from "src/modules/shared/ui"

type Mode = "synced" | "library" | "custom"

export default function StepGroups({
  selected,
  onToggle,
  onAddMany
}: {
  selected: Map<string, BotCommentGroup>
  onToggle: (g: BotCommentGroup) => void
  onAddMany: (groups: BotCommentGroup[]) => void
}) {
  const { t } = useTranslation()
  const { profile } = useFacebook()
  const {
    groups,
    total,
    lastSyncedAt,
    loading,
    syncing,
    syncProgress,
    error,
    fetchGroups,
    syncFromFacebook
  } = useAutoBotCommentSyncedGroups()

  const [mode, setMode] = useState<Mode>("synced")
  const [search, setSearch] = useState("")
  const [customInput, setCustomInput] = useState("")

  useEffect(() => {
    void fetchGroups(profile?.uid)
  }, [fetchGroups, profile?.uid])

  const syncedFiltered = useMemo<BotCommentGroup[]>(() => {
    const q = normalizeForSearch(search)
    return groups
      .filter(
        (g) =>
          !search ||
          normalizeForSearch(g.groupName).includes(q) ||
          g.groupId.includes(search)
      )
      .map((g) => ({
        groupId: g.groupId,
        groupName: g.groupName,
        avatarUrl: g.avatarUrl
      }))
  }, [groups, search])
  const customGroups = useMemo(
    () => parseCustomGroups(customInput),
    [customInput]
  )
  const isSelected = (id: string) => selected.has(id)

  return (
    <div className="bm-flex bm-flex-col bm-gap-3">
      <Segmented<Mode>
        block
        size="sm"
        value={mode}
        onChange={(v) => {
          setMode(v)
          setSearch("")
        }}
        options={[
          { value: "synced", label: t("auto_comment_mode_synced") },
          { value: "library", label: t("auto_comment_mode_library") },
          { value: "custom", label: t("auto_comment_mode_custom") }
        ]}
      />

      {mode === "synced" && (
        <div className="bm-flex bm-flex-col bm-gap-2">
          <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-2">
            <Button
              size="sm"
              variant="outline"
              icon={
                <RotateCcw
                  size={13}
                  className={syncing ? "bm-animate-spin" : undefined}
                />
              }
              onClick={() => void syncFromFacebook()}
              disabled={syncing || loading}>
              {syncing
                ? t("auto_comment_syncing")
                : t("auto_comment_sync_groups")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAddMany(syncedFiltered)}
              disabled={!syncedFiltered.length}>
              {t("auto_comment_select_all")}
            </Button>
            <Input
              size="sm"
              className="bm-min-w-[140px] bm-flex-1"
              prefix={<Search size={13} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("auto_comment_search_group_placeholder")}
            />
          </div>
          {syncProgress && (
            <p className="bm-text-[12px] bm-text-fg-muted">{syncProgress}</p>
          )}
          {!syncProgress && lastSyncedAt && total > 0 && (
            <p className="bm-text-[11.5px] bm-text-fg-subtle">
              {t("auto_comment_groups_count", { count: total })} ·{" "}
              {t("auto_comment_last_synced", { date: fmtDate(lastSyncedAt) })}
            </p>
          )}
          {error && (
            <Callout tone="danger" compact>
              {error}
            </Callout>
          )}
          {loading ? (
            <div className="bm-flex bm-items-center bm-justify-center bm-gap-2 bm-py-10 bm-text-[12.5px] bm-text-fg-muted">
              <Spinner size={14} /> {t("auto_comment_loading")}
            </div>
          ) : total === 0 ? (
            <p className="bm-rounded-xl2 bm-border bm-border-dashed bm-border-line bm-py-10 bm-text-center bm-text-[12.5px] bm-text-fg-muted">
              {t("auto_comment_no_group_data_prefix")}{" "}
              <strong>{t("auto_comment_sync_groups")}</strong>{" "}
              {t("auto_comment_no_group_data_suffix")}
            </p>
          ) : (
            <GroupPickList
              groups={syncedFiltered}
              isSelected={isSelected}
              onToggle={onToggle}
            />
          )}
        </div>
      )}

      {mode === "library" && (
        <GroupLibraryTab
          isSelected={isSelected}
          onToggle={onToggle}
          onAddMany={onAddMany}
        />
      )}

      {mode === "custom" && (
        <div className="bm-flex bm-flex-col bm-gap-2">
          <p className="bm-text-[12.5px] bm-text-fg-muted">
            {t("auto_comment_custom_group_format_prefix")}{" "}
            <code className="bm-rounded bm-bg-surface-2 bm-px-1">
              {t("auto_comment_custom_group_format_code")}
            </code>{" "}
            {t("auto_comment_custom_group_format_suffix")}
          </p>
          <Textarea
            mono
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder={t("auto_comment_custom_group_placeholder")}
            className="bm-min-h-[180px]"
          />
          {customGroups.length > 0 && (
            <Button
              size="sm"
              variant="primary"
              className="bm-self-start"
              onClick={() => onAddMany(customGroups)}>
              {t("auto_comment_confirm_groups_count", {
                count: customGroups.length
              })}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
