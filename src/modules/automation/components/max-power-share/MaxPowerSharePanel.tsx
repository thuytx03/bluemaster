import {
  AlertCircle,
  Link2,
  MapPin,
  PenLine,
  Play,
  Plus,
  RefreshCw
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { GroupSettingsDialog } from "src/modules/automation/components/max-power-share/GroupSettingsDialog"
import { IdentityPickerDialog } from "src/modules/automation/components/max-power-share/IdentityPickerDialog"
import { IdentityRow } from "src/modules/automation/components/max-power-share/IdentityRow"
import { RunningView } from "src/modules/automation/components/max-power-share/RunningView"
import { useMaxPowerShare } from "src/modules/automation/hooks/useMaxPowerShare"
import { fetchGroupsForIdentity } from "src/modules/automation/services/max-power-share.service"
import type {
  GroupTarget,
  LinkPreview,
  MaxPowerShareConfig,
  SelectedIdentityRow,
  SyncedGroup,
  SyncedIdentity
} from "src/modules/automation/types/max-power-share.types"
import {
  DELAY_DEFAULTS,
  DELAY_STORAGE_KEY,
  delayToRunParams,
  estimateEtaSec,
  formatEta
} from "src/modules/automation/utils/max-power-share.util"
import { FacebookDelayConfig } from "src/modules/facebook/components/DelayConfigPanel"
import { useFacebook } from "src/modules/facebook/hooks/useFacebookSession"
import { getDelayConfig } from "src/modules/facebook/utils/delay-config.util"
import {
  Button,
  Callout,
  cn,
  Input,
  Spinner,
  Surface,
  Textarea
} from "src/modules/shared/ui"

const readDelay = () => getDelayConfig(DELAY_STORAGE_KEY, DELAY_DEFAULTS)

export function MaxPowerSharePanel() {
  const { t } = useTranslation()
  const { profile } = useFacebook()
  const {
    runState,
    error,
    progress,
    logs,
    countdown,
    statusMsg,
    fetchPreview,
    run,
    pause,
    resume,
    stop,
    reset
  } = useMaxPowerShare()

  const [shareUrl, setShareUrl] = useState("")
  const [urlLoading, setUrlLoading] = useState(false)
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null)
  const [previewError, setPreviewError] = useState(false)
  const [content, setContent] = useState("")

  const [pickerOpen, setPickerOpen] = useState(false)
  const [identityRows, setIdentityRows] = useState<SelectedIdentityRow[]>([])
  const [groupSettingsFor, setGroupSettingsFor] = useState<string | null>(null)
  const [delayConfig, setDelayConfig] = useState(readDelay)
  const rowsRef = useRef(identityRows)
  rowsRef.current = identityRows

  const isActive = runState === "running" || runState === "paused"
  const showRunningView = isActive || runState === "done"

  // Keep the ETA in sync with the delay config panel
  useEffect(() => {
    const handle = () => setDelayConfig(readDelay())
    window.addEventListener("fb_delay_config_changed", handle)
    return () => window.removeEventListener("fb_delay_config_changed", handle)
  }, [])

  const selectedGroups = identityRows.flatMap((r) => r.selectedGroups)
  const timelineCount = identityRows.filter((r) => r.shareToTimeline).length
  const totalGroupCount = selectedGroups.length + timelineCount
  const runParams = delayToRunParams(delayConfig)
  const eta =
    totalGroupCount > 0
      ? estimateEtaSec(
          totalGroupCount,
          delayConfig.minDelay,
          delayConfig.maxDelay,
          runParams.restAfterGroups,
          runParams.restMinutes
        )
      : 0

  const loadRowGroups = useCallback(async (uid: string) => {
    setIdentityRows((prev) =>
      prev.map((r) =>
        r.identity.uid === uid ? { ...r, loadingGroups: true } : r
      )
    )
    let groups: SyncedGroup[] = []
    try {
      groups = await fetchGroupsForIdentity(uid)
    } catch {
      groups = []
    }
    setIdentityRows((prev) =>
      prev.map((r) =>
        r.identity.uid === uid
          ? {
              ...r,
              allGroups: groups,
              selectedGroups: groups,
              loadingGroups: false
            }
          : r
      )
    )
  }, [])

  const handleSelectIdentity = useCallback(
    (identity: SyncedIdentity) => {
      if (rowsRef.current.some((r) => r.identity.uid === identity.uid)) return
      const row: SelectedIdentityRow = {
        identity,
        allGroups: [],
        selectedGroups: [],
        loadingGroups: true,
        shareToTimeline: false
      }
      rowsRef.current = [...rowsRef.current, row]
      setIdentityRows((prev) =>
        prev.some((r) => r.identity.uid === identity.uid)
          ? prev
          : [...prev, row]
      )
      void loadRowGroups(identity.uid)
    },
    [loadRowGroups]
  )

  // Auto-add the current profile on mount
  useEffect(() => {
    if (!profile?.uid) return
    handleSelectIdentity({
      uid: profile.uid,
      name: profile.name,
      avatar: profile.avatar,
      type: "profile",
      groupCount: 0
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.uid])

  const loadPreview = useCallback(
    async (url: string) => {
      setUrlLoading(true)
      setLinkPreview(null)
      setPreviewError(false)
      const result = await fetchPreview(url)
      setUrlLoading(false)
      if (result)
        setLinkPreview({
          title: result.title,
          description: result.description,
          imageUrl: result.imageUrl || undefined
        })
      else setPreviewError(true)
    },
    [fetchPreview]
  )

  // Auto-fetch the preview when the URL changes (600 ms debounce)
  useEffect(() => {
    const url = shareUrl.trim()
    if (!url || isActive) return
    setLinkPreview(null)
    setPreviewError(false)
    const timer = setTimeout(() => void loadPreview(url), 600)
    return () => clearTimeout(timer)
  }, [shareUrl, isActive, loadPreview])

  function handleRemoveIdentity(uid: string) {
    setIdentityRows((prev) => prev.filter((r) => r.identity.uid !== uid))
  }

  function handleToggleTimeline(uid: string) {
    setIdentityRows((prev) =>
      prev.map((r) =>
        r.identity.uid === uid
          ? { ...r, shareToTimeline: !r.shareToTimeline }
          : r
      )
    )
  }

  function handleApplyGroupSettings(uid: string, selected: SyncedGroup[]) {
    setIdentityRows((prev) =>
      prev.map((r) =>
        r.identity.uid === uid ? { ...r, selectedGroups: selected } : r
      )
    )
  }

  async function handleStart() {
    const groups: GroupTarget[] = identityRows.flatMap((row) =>
      row.selectedGroups.map((g) => ({
        groupId: g.groupId,
        groupName: g.groupName,
        identityName: row.identity.name,
        identityUid: row.identity.uid,
        identityType: row.identity.type
      }))
    )
    const config: MaxPowerShareConfig = {
      shareUrl: shareUrl.trim(),
      groups,
      shareToTimelines: identityRows
        .filter((r) => r.shareToTimeline)
        .map((r) => ({
          uid: r.identity.uid,
          name: r.identity.name,
          type: r.identity.type
        })),
      content: content.trim(),
      ...delayToRunParams(readDelay())
    }
    await run(config)
  }

  function handleReset() {
    reset()
    rowsRef.current = []
    setIdentityRows([])
    setShareUrl("")
    setLinkPreview(null)
    setContent("")
    // Same as a fresh mount: start again with the current profile
    if (profile?.uid) {
      handleSelectIdentity({
        uid: profile.uid,
        name: profile.name,
        avatar: profile.avatar,
        type: "profile",
        groupCount: 0
      })
    }
  }

  const selectedUids = new Set(identityRows.map((r) => r.identity.uid))
  const groupSettingsRow = groupSettingsFor
    ? identityRows.find((r) => r.identity.uid === groupSettingsFor)
    : null

  if (showRunningView) {
    return (
      <RunningView
        runState={runState}
        progress={progress}
        logs={logs}
        countdown={countdown}
        statusMsg={statusMsg}
        identityRows={identityRows}
        onPause={pause}
        onResume={resume}
        onStop={stop}
        onReset={handleReset}
      />
    )
  }

  return (
    <div className="bm-flex bm-flex-col bm-gap-3">
      {/* Link */}
      <Surface
        padding="sm"
        icon={<Link2 size={14} />}
        title={t("max_power_share_label_share_link")}>
        <div className="bm-flex bm-gap-2">
          <Input
            size="sm"
            value={shareUrl}
            onChange={(e) => setShareUrl(e.target.value)}
            placeholder={t("max_power_share_placeholder_share_link")}
            className={cn("bm-flex-1", shareUrl.trim() && "bm-border-brand")}
          />
          <Button
            size="sm"
            variant="outline"
            icon={urlLoading ? <Spinner size={13} /> : <RefreshCw size={13} />}
            onClick={() => void loadPreview(shareUrl.trim())}
            disabled={!shareUrl.trim() || urlLoading}>
            {t("max_power_share_button_reload")}
          </Button>
        </div>
        <p className="bm-mt-2 bm-text-[11.5px] bm-text-fg-muted">
          {t("max_power_share_hint_paste_url_prefix")}{" "}
          <strong>{t("max_power_share_hint_paste_url_label")}</strong>{" "}
          {t("max_power_share_hint_paste_url_suffix")}
        </p>

        {urlLoading && (
          <div className="bm-mt-2.5 bm-flex bm-items-center bm-gap-2 bm-rounded-lg bm-border bm-border-line bm-bg-surface-2 bm-px-3 bm-py-2.5 bm-text-[12px] bm-text-fg-muted">
            <Spinner size={13} />
            {t("max_power_share_loading_preview")}
          </div>
        )}
        {!urlLoading && previewError && shareUrl.trim() && (
          <Callout tone="warning" compact className="bm-mt-2.5">
            {t("max_power_share_error_preview_failed")}
          </Callout>
        )}
        {!urlLoading && linkPreview && (
          <div className="bm-mt-2.5 bm-flex bm-gap-3 bm-rounded-lg bm-border bm-border-line bm-bg-surface-2 bm-p-2.5">
            {linkPreview.imageUrl && (
              <img
                src={linkPreview.imageUrl}
                alt=""
                className="bm-h-16 bm-w-16 bm-shrink-0 bm-rounded-md bm-object-cover"
              />
            )}
            <div className="bm-min-w-0 bm-flex-1">
              {linkPreview.title && (
                <p className="bm-line-clamp-2 bm-text-[13px] bm-font-bold bm-leading-snug bm-text-fg">
                  {linkPreview.title}
                </p>
              )}
              {linkPreview.description && (
                <p className="bm-mt-1 bm-line-clamp-3 bm-text-[11.5px] bm-text-fg-muted">
                  {linkPreview.description}
                </p>
              )}
              {!linkPreview.title && !linkPreview.description && (
                <p className="bm-text-[11.5px] bm-italic bm-text-fg-muted">
                  {t("max_power_share_no_title_description")}
                </p>
              )}
            </div>
          </div>
        )}
      </Surface>

      {/* Delay + rest */}
      <FacebookDelayConfig
        storageKey={DELAY_STORAGE_KEY}
        defaults={DELAY_DEFAULTS}
        showLimitsConfig={false}
        onSaved={setDelayConfig}
      />

      {/* Content */}
      <Surface
        padding="sm"
        icon={<PenLine size={14} />}
        title={t("max_power_share_label_share_content")}>
        <p className="bm-mb-2 bm-text-[11.5px] bm-text-fg-muted">
          <strong>{t("max_power_share_hint_content_line_label")}</strong>{" "}
          {t("max_power_share_hint_content_line_prefix")}{" "}
          <strong>{t("max_power_share_hint_content_line_random")}</strong>
        </p>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("max_power_share_placeholder_content")}
          className="bm-min-h-[110px] bm-text-[13px]"
        />
      </Surface>

      {/* Destinations */}
      <Surface
        padding="sm"
        icon={<MapPin size={14} className="bm-text-danger" />}
        title={t("max_power_share_label_share_destination")}
        extra={
          <Button
            size="xs"
            variant="outline"
            icon={<Plus size={13} />}
            onClick={() => setPickerOpen(true)}>
            {t("max_power_share_button_add_identity")}
          </Button>
        }>
        {identityRows.length === 0 ? (
          <p className="bm-text-[12.5px] bm-text-fg-muted">
            {t("max_power_share_empty_identity_prefix")}{" "}
            <strong>{t("max_power_share_empty_identity_synced_label")}</strong>.{" "}
            {t("max_power_share_empty_identity_middle")}{" "}
            <strong>
              {t("max_power_share_empty_identity_timeline_label")}
            </strong>{" "}
            {t("max_power_share_empty_identity_suffix")}
          </p>
        ) : (
          <div className="bm-flex bm-flex-col bm-gap-2">
            {identityRows.map((row) => (
              <IdentityRow
                key={row.identity.uid}
                row={row}
                onRemove={() => handleRemoveIdentity(row.identity.uid)}
                onToggleTimeline={() => handleToggleTimeline(row.identity.uid)}
                onOpenGroupSettings={() =>
                  setGroupSettingsFor(row.identity.uid)
                }
              />
            ))}
          </div>
        )}
      </Surface>

      {error && (
        <Callout tone="danger" compact icon={<AlertCircle size={15} />}>
          {error}
        </Callout>
      )}

      {/* Bottom bar */}
      <div className="bm-sticky bm-bottom-0 bm-z-10 bm-flex bm-flex-col bm-gap-2 bm-rounded-xl bm-border bm-border-line bm-bg-surface bm-p-3 bm-shadow-card">
        <div className="bm-text-[12.5px] bm-text-fg-muted">
          {t("max_power_share_summary_prefix")}{" "}
          <span className="bm-font-bold bm-text-brand-ink">
            {totalGroupCount}
          </span>{" "}
          {t("max_power_share_summary_suffix")}{" "}
          <span className="bm-font-semibold bm-text-brand-ink">
            {eta > 0 ? `~${formatEta(eta, t)}` : "0s"}
          </span>
        </div>
        <Button
          block
          variant="primary"
          icon={<Play size={14} />}
          disabled={!shareUrl.trim() || totalGroupCount === 0}
          onClick={() => void handleStart()}>
          {t("max_power_share_button_start_sharing")}
        </Button>
      </div>

      <IdentityPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelectIdentity}
        onSynced={(uid) => {
          if (identityRows.some((r) => r.identity.uid === uid))
            void loadRowGroups(uid)
        }}
        selectedUids={selectedUids}
        profileUid={profile?.uid}
      />

      {groupSettingsRow && (
        <GroupSettingsDialog
          open={groupSettingsFor !== null}
          onClose={() => setGroupSettingsFor(null)}
          identity={groupSettingsRow.identity}
          allGroups={groupSettingsRow.allGroups}
          selectedGroups={groupSettingsRow.selectedGroups}
          onApply={(selected) =>
            handleApplyGroupSettings(groupSettingsRow.identity.uid, selected)
          }
        />
      )}
    </div>
  )
}
