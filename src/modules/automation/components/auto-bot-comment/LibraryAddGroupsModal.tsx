import { Search } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { normalizeForSearch } from "src/configs/tools.config"
import GroupPickList from "src/modules/automation/components/auto-bot-comment/GroupPickList"
import { useAutoBotCommentSyncedGroups } from "src/modules/automation/hooks/useAutoBotCommentSyncedGroups"
import type {
  BotCommentGroup,
  GroupLibraryTopic
} from "src/modules/automation/types/auto-bot-comment.types"
import { parseCustomGroups } from "src/modules/automation/utils/auto-bot-comment.util"
import {
  Button,
  Field,
  Input,
  Modal,
  Segmented,
  Select,
  Spinner,
  Textarea
} from "src/modules/shared/ui"

const ALL = "__all__"

/** Adds groups to a library topic: picked from synced groups or pasted. */
export default function LibraryAddGroupsModal({
  topic,
  onClose,
  onAdd
}: {
  topic: GroupLibraryTopic | null
  onClose: () => void
  onAdd: (
    topicId: number,
    groups: (BotCommentGroup & { memberCount?: string })[]
  ) => Promise<unknown>
}) {
  const { t } = useTranslation()
  const { groups, identities, loading, fetchGroups, fetchIdentities } =
    useAutoBotCommentSyncedGroups()
  const [mode, setMode] = useState<"synced" | "paste">("synced")
  const [identity, setIdentity] = useState<string>(ALL)
  const [search, setSearch] = useState("")
  const [picked, setPicked] = useState<
    Map<string, BotCommentGroup & { memberCount?: string }>
  >(new Map())
  const [pasted, setPasted] = useState("")
  const [saving, setSaving] = useState(false)
  const open = !!topic

  useEffect(() => {
    if (!open) return
    setPicked(new Map())
    setPasted("")
    setSearch("")
    void fetchIdentities()
  }, [open, fetchIdentities])

  useEffect(() => {
    if (open) void fetchGroups(identity === ALL ? undefined : identity)
  }, [open, identity, fetchGroups])

  const filtered = useMemo(() => {
    const q = normalizeForSearch(search)
    return groups.filter(
      (g) =>
        !q ||
        normalizeForSearch(g.groupName).includes(q) ||
        g.groupId.includes(search)
    )
  }, [groups, search])
  const pastedGroups = useMemo(() => parseCustomGroups(pasted), [pasted])
  const toAdd = mode === "synced" ? [...picked.values()] : pastedGroups

  const toggle = (g: BotCommentGroup) =>
    setPicked((prev) => {
      const next = new Map(prev)
      if (next.has(g.groupId)) next.delete(g.groupId)
      else next.set(g.groupId, groups.find((x) => x.groupId === g.groupId) ?? g)
      return next
    })

  async function handleAdd() {
    if (!topic || !toAdd.length) return
    setSaving(true)
    try {
      await onAdd(topic.id, toAdd)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      closeLabel={t("auto_comment_cancel")}
      open={open}
      onClose={onClose}
      title={t("auto_comment_library_add_groups_title", {
        topic: topic?.name ?? ""
      })}
      footer={
        <>
          <Button size="sm" variant="outline" onClick={onClose}>
            {t("auto_comment_cancel")}
          </Button>
          <Button
            size="sm"
            variant="primary"
            loading={saving}
            disabled={!toAdd.length}
            onClick={handleAdd}>
            {t("auto_comment_library_add_groups_submit", {
              count: toAdd.length
            })}
          </Button>
        </>
      }>
      <div className="bm-flex bm-flex-col bm-gap-3">
        <Segmented
          block
          size="sm"
          value={mode}
          onChange={setMode}
          options={[
            { value: "synced", label: t("auto_comment_library_source_synced") },
            { value: "paste", label: t("auto_comment_mode_custom") }
          ]}
        />
        {mode === "synced" ? (
          <>
            <div className="bm-flex bm-items-center bm-gap-2">
              <Select
                size="sm"
                className="bm-w-[45%]"
                value={identity}
                onChange={setIdentity}
                options={[
                  { value: ALL, label: t("auto_comment_all") },
                  ...identities.map((i) => ({
                    value: i.uid,
                    label: `${i.name} (${i.groupCount})`
                  }))
                ]}
              />
              <Input
                size="sm"
                className="bm-flex-1"
                prefix={<Search size={13} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("auto_comment_search_group_placeholder")}
              />
            </div>
            <div className="bm-flex bm-items-center bm-justify-between bm-text-[12px] bm-text-fg-muted">
              <span>
                {t("auto_comment_groups_selected_count", {
                  count: picked.size
                })}
              </span>
              <Button
                size="xs"
                variant="ghost"
                disabled={!filtered.length}
                onClick={() =>
                  setPicked((prev) => {
                    const next = new Map(prev)
                    filtered.forEach((g) => next.set(g.groupId, g))
                    return next
                  })
                }>
                {t("auto_comment_select_all_count", { count: filtered.length })}
              </Button>
            </div>
            {loading ? (
              <div className="bm-flex bm-justify-center bm-py-6">
                <Spinner size={16} />
              </div>
            ) : groups.length === 0 ? (
              <p className="bm-rounded-xl bm-border bm-border-dashed bm-border-line bm-py-6 bm-text-center bm-text-[12px] bm-text-fg-muted">
                {t("auto_comment_library_no_synced_groups")}
              </p>
            ) : (
              <GroupPickList
                groups={filtered}
                isSelected={(id) => picked.has(id)}
                onToggle={toggle}
              />
            )}
          </>
        ) : (
          <Field
            label={
              <>
                {t("auto_comment_custom_group_format_prefix")}{" "}
                <code className="bm-rounded bm-bg-surface-2 bm-px-1">
                  {t("auto_comment_custom_group_format_code")}
                </code>{" "}
                {t("auto_comment_custom_group_format_suffix")}
              </>
            }>
            <Textarea
              mono
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder={t("auto_comment_custom_group_placeholder")}
              className="bm-min-h-[160px]"
            />
          </Field>
        )}
      </div>
    </Modal>
  )
}
