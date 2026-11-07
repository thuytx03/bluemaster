import { ExternalLink, Play, RefreshCw, Search, Users } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { normalizeForSearch } from "src/configs/tools.config"
import {
  PostRadarStepIndicator,
  PostThumb,
  PostTypeBadge
} from "src/modules/automation/components/post-radar/PostRadarParts"
import type { PostRadarController } from "src/modules/automation/hooks/usePostRadar"
import { usePostRadarGroups } from "src/modules/automation/hooks/usePostRadarGroups"
import type {
  RadarPost,
  RadarPostMode,
  RadarRunOptions,
  RadarTargetGroup
} from "src/modules/automation/types/post-radar.types"
import {
  POST_RADAR_DELAY_DEFAULTS,
  POST_RADAR_DELAY_KEY
} from "src/modules/automation/utils/post-radar.util"
import { getDelayConfig } from "src/modules/facebook/utils/delay-config.util"
import {
  Avatar,
  Button,
  Callout,
  Checkbox,
  cn,
  EmptyState,
  IconButton,
  Input,
  RadioGroup,
  Spinner,
  Surface,
  Textarea
} from "src/modules/shared/ui"

/** Step 2: pick target groups, review the selected posts and the post mode. */
export default function PostRadarLeech({
  scanner,
  onBack,
  onStartRun
}: {
  scanner: PostRadarController
  onBack: () => void
  onStartRun: (
    selectedPosts: RadarPost[],
    targetGroups: RadarTargetGroup[],
    options: RadarRunOptions
  ) => void
}) {
  const { t } = useTranslation()
  const { posts, selected, toggleSelect, clearSelection } = scanner
  const {
    groups: allGroups,
    loading: groupsLoading,
    syncing,
    syncCount,
    fetchGroups,
    syncFromFacebook
  } = usePostRadarGroups()
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [postMode, setPostMode] = useState<RadarPostMode>("share")
  const [cloneCaption, setCloneCaption] = useState("")
  const [groupSearch, setGroupSearch] = useState("")

  useEffect(() => {
    void fetchGroups()
  }, [fetchGroups])

  const selectedPosts = Array.from(selected)
    .map((i) => posts[i])
    .filter(Boolean)
  const targetGroups = allGroups.filter((g) => selectedGroups.has(g.groupId))

  const filteredGroups = useMemo(() => {
    const q = normalizeForSearch(groupSearch.trim())
    if (!q) return allGroups
    return allGroups.filter(
      (g) =>
        normalizeForSearch(g.groupName).includes(q) ||
        g.groupId.includes(groupSearch.trim())
    )
  }, [allGroups, groupSearch])
  const allFilteredChecked =
    filteredGroups.length > 0 &&
    filteredGroups.every((g) => selectedGroups.has(g.groupId))
  const someFilteredChecked =
    !allFilteredChecked &&
    filteredGroups.some((g) => selectedGroups.has(g.groupId))

  const toggleGroup = (groupId: string) => {
    setSelectedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  const setFilteredChecked = (checked: boolean) => {
    setSelectedGroups((prev) => {
      const next = new Set(prev)
      filteredGroups.forEach((g) =>
        checked ? next.add(g.groupId) : next.delete(g.groupId)
      )
      return next
    })
  }

  const handleStart = () => {
    if (!selectedPosts.length) {
      toast.error(t("post_radar_toast_no_posts_selected"))
      return
    }
    if (!targetGroups.length) {
      toast.error(t("post_radar_toast_no_groups_selected"))
      return
    }
    const { minDelay, maxDelay } = getDelayConfig(
      POST_RADAR_DELAY_KEY,
      POST_RADAR_DELAY_DEFAULTS
    )
    onStartRun(selectedPosts, targetGroups, {
      delayMin: minDelay,
      delayMax: maxDelay,
      isAnonymous,
      postMode,
      cloneCaption
    })
  }

  return (
    <div className="bm-flex bm-flex-col bm-gap-3">
      <PostRadarStepIndicator current={2} onBack={onBack} />

      {/* Target groups */}
      <Surface
        padding="none"
        title={t("post_radar_admin_groups")}
        icon={<Users size={14} />}
        extra={
          <>
            <Checkbox
              size="sm"
              checked={allFilteredChecked}
              indeterminate={someFilteredChecked}
              onChange={setFilteredChecked}
              disabled={!filteredGroups.length}
              label={
                <span className="bm-text-[12px] bm-text-fg-muted">
                  {t("post_radar_select_all")}
                </span>
              }
            />
            <IconButton
              size="xs"
              variant="outline"
              label={t("post_radar_sync_groups")}
              disabled={syncing}
              onClick={() => void syncFromFacebook()}>
              {syncing ? <Spinner size={12} /> : <RefreshCw size={13} />}
            </IconButton>
          </>
        }>
        <div className="bm-border-b bm-border-line bm-px-3 bm-py-2">
          <Input
            size="sm"
            value={groupSearch}
            onChange={(e) => setGroupSearch(e.target.value)}
            placeholder={t("post_radar_search_group_placeholder")}
            prefix={<Search size={13} />}
          />
        </div>
        {groupsLoading || syncing ? (
          <div className="bm-flex bm-items-center bm-justify-center bm-gap-2 bm-py-8 bm-text-[12px] bm-text-fg-muted">
            <Spinner size={14} />
            {syncing
              ? t("post_radar_syncing_groups", { count: syncCount })
              : t("post_radar_loading")}
          </div>
        ) : allGroups.length === 0 ? (
          <EmptyState
            compact
            icon={<Users size={20} />}
            title={t("post_radar_no_groups_title")}
            description={t("post_radar_no_groups_desc")}
            action={
              <Button
                size="sm"
                variant="primary"
                icon={<RefreshCw size={13} />}
                onClick={() => void syncFromFacebook()}>
                {t("post_radar_sync_groups")}
              </Button>
            }
          />
        ) : (
          <>
            <p className="bm-px-3 bm-py-1.5 bm-text-[11.5px] bm-text-fg-muted">
              {groupSearch.trim()
                ? t("post_radar_groups_filtered_count", {
                    filtered: filteredGroups.length,
                    total: allGroups.length
                  })
                : t("post_radar_groups_admin_count", {
                    count: allGroups.length
                  })}
              {selectedGroups.size > 0 &&
                ` · ${t("post_radar_groups_selected_count", { count: selectedGroups.size })}`}
            </p>
            <div className="bm-max-h-[260px] bm-overflow-y-auto">
              {filteredGroups.map((g) => {
                const isSel = selectedGroups.has(g.groupId)
                return (
                  <div
                    key={g.groupId}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest("a,label")) return
                      toggleGroup(g.groupId)
                    }}
                    className={cn(
                      "bm-flex bm-cursor-pointer bm-items-center bm-gap-2.5 bm-px-3 bm-py-1.5 bm-transition-colors hover:bm-bg-surface-2/60",
                      isSel && "bm-bg-brand-soft/40"
                    )}>
                    <Checkbox
                      size="sm"
                      checked={isSel}
                      onChange={() => toggleGroup(g.groupId)}
                    />
                    <Avatar src={g.avatarUrl} name={g.groupName} size={28} />
                    <div className="bm-min-w-0 bm-flex-1">
                      <a
                        href={`https://www.facebook.com/groups/${g.groupId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bm-block bm-truncate bm-text-[12px] bm-font-medium bm-text-fg hover:bm-text-brand-ink hover:bm-underline">
                        {g.groupName}
                      </a>
                      <p className="bm-truncate bm-font-mono bm-text-[10px] bm-text-fg-subtle">
                        {g.groupId}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </Surface>

      {/* Selected posts */}
      <Surface
        padding="none"
        title={`${t("post_radar_posts_to_publish")} (${selectedPosts.length})`}
        extra={
          <Checkbox
            size="sm"
            checked={selectedPosts.length > 0}
            disabled={!selectedPosts.length}
            onChange={(v) => {
              if (!v) clearSelection()
            }}
            label={
              <span className="bm-text-[12px] bm-text-fg-muted">
                {t("post_radar_select_all")}
              </span>
            }
          />
        }>
        <div className="bm-flex bm-max-h-[300px] bm-flex-col bm-gap-1.5 bm-overflow-y-auto bm-p-2">
          {selectedPosts.map((p) => (
            <div
              key={p.postId}
              className="bm-flex bm-gap-2.5 bm-rounded-lg bm-border bm-border-brand/25 bm-bg-brand-soft/30 bm-p-2">
              <Checkbox
                size="sm"
                checked
                onChange={() => {
                  const idx = posts.findIndex((pp) => pp.postId === p.postId)
                  if (idx !== -1) toggleSelect(idx)
                }}
              />
              <PostThumb src={p.imageUrl} size={40} />
              <div className="bm-min-w-0 bm-flex-1">
                <div className="bm-mb-0.5 bm-flex bm-items-center bm-gap-1.5">
                  <PostTypeBadge postType={p.postType} />
                  <span className="bm-truncate bm-font-mono bm-text-[10px] bm-text-fg-subtle">
                    ID: {p.postId}
                  </span>
                </div>
                <a
                  href={p.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bm-line-clamp-2 bm-text-[12px] bm-font-medium bm-text-brand-ink hover:bm-underline">
                  {p.message
                    ? p.message.slice(0, 100) +
                      (p.message.length > 100 ? "…" : "")
                    : p.postId}
                </a>
              </div>
              <a
                href={p.permalink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("post_radar_open_post")}
                title={t("post_radar_open_post")}
                className="bm-inline-flex bm-h-7 bm-w-7 bm-shrink-0 bm-items-center bm-justify-center bm-rounded-lg bm-text-fg-muted hover:bm-bg-surface-2 hover:bm-text-brand-ink">
                <ExternalLink size={13} />
              </a>
            </div>
          ))}
          {selectedPosts.length === 0 && (
            <p className="bm-py-6 bm-text-center bm-text-[12px] bm-text-fg-muted">
              {t("post_radar_no_posts_selected")}
            </p>
          )}
        </div>
      </Surface>

      {/* Config */}
      <Surface
        title={t("post_radar_post_config")}
        bodyClassName="bm-flex bm-flex-col bm-gap-3">
        <div className="bm-flex bm-flex-col bm-gap-2">
          <span className="bm-text-[12px] bm-font-medium bm-text-fg-muted">
            {t("post_radar_post_mode")}
          </span>
          <RadioGroup<RadarPostMode>
            variant="cards"
            columns={2}
            value={postMode}
            onChange={setPostMode}
            options={[
              {
                value: "share",
                label: t("post_radar_mode_share_title"),
                description: t("post_radar_mode_share_desc")
              },
              {
                value: "clone",
                label: t("post_radar_mode_clone_title"),
                description: t("post_radar_mode_clone_desc")
              }
            ]}
          />
          {postMode === "clone" && (
            <div className="bm-flex bm-flex-col bm-gap-1">
              <label className="bm-text-[11.5px] bm-font-medium bm-text-fg-muted">
                {t("post_radar_clone_caption_label")}
              </label>
              <Textarea
                value={cloneCaption}
                onChange={(e) => setCloneCaption(e.target.value)}
                placeholder={t("post_radar_clone_caption_placeholder")}
                rows={2}
              />
            </div>
          )}
        </div>

        <Checkbox
          size="sm"
          checked={isAnonymous}
          onChange={setIsAnonymous}
          label={
            <span className="bm-text-[12px] bm-text-fg-muted">
              {t("post_radar_post_anonymous")}
            </span>
          }
        />

        <Button
          variant="primary"
          block
          icon={<Play size={14} />}
          onClick={handleStart}>
          {t("post_radar_start_posting")}
        </Button>
      </Surface>

      <Callout tone="info" compact title={t("post_radar_track_hint_title")}>
        {t("post_radar_track_hint_desc")}
      </Callout>
    </div>
  )
}
