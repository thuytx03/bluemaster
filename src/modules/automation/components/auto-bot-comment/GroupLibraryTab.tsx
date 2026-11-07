import {
  Edit2,
  ListPlus,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  X
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import GroupPickList from "src/modules/automation/components/auto-bot-comment/GroupPickList"
import LibraryAddGroupsModal from "src/modules/automation/components/auto-bot-comment/LibraryAddGroupsModal"
import LibraryTopicModal from "src/modules/automation/components/auto-bot-comment/LibraryTopicModal"
import { useAutoBotCommentGroupLibrary } from "src/modules/automation/hooks/useAutoBotCommentGroupLibrary"
import type {
  BotCommentGroup,
  GroupLibraryTopic
} from "src/modules/automation/types/auto-bot-comment.types"
import {
  Badge,
  Button,
  Callout,
  Checkbox,
  cn,
  ConfirmDialog,
  Dropdown,
  IconButton,
  Input,
  SectionLabel,
  Spinner
} from "src/modules/shared/ui"

/**
 * "Library" mode of the group step. The source loaded a server-curated
 * catalogue; here the user builds topics and fills them from synced groups or
 * pasted lists (all stored locally).
 */
export default function GroupLibraryTab({
  isSelected,
  onToggle,
  onAddMany
}: {
  isSelected: (groupId: string) => boolean
  onToggle: (g: BotCommentGroup) => void
  onAddMany: (groups: BotCommentGroup[]) => void
}) {
  const { t } = useTranslation()
  const lib = useAutoBotCommentGroupLibrary()
  const {
    topics,
    items,
    loadingTopics,
    loadingItems,
    error,
    fetchTopics,
    fetchItems
  } = lib

  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<number>>(
    new Set()
  )
  const [allTopicsSelected, setAllTopicsSelected] = useState(false)
  const [search, setSearch] = useState("")
  const [topicModal, setTopicModal] = useState<{
    topic?: GroupLibraryTopic
  } | null>(null)
  const [addTo, setAddTo] = useState<GroupLibraryTopic | null>(null)
  const [deleting, setDeleting] = useState<GroupLibraryTopic | null>(null)

  useEffect(() => {
    void fetchTopics()
  }, [fetchTopics])

  const activeIds = useMemo(
    () => (allTopicsSelected ? topics.map((x) => x.id) : [...selectedTopicIds]),
    [allTopicsSelected, topics, selectedTopicIds]
  )
  const countsKey = topics.map((x) => `${x.id}:${x.count}`).join(",")

  useEffect(() => {
    if (activeIds.length > 0) void fetchItems(activeIds, search || undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIds.join(","), search, countsKey, fetchItems])

  function toggleTopic(id: number) {
    setAllTopicsSelected(false)
    setSelectedTopicIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAllTopics() {
    const next = !allTopicsSelected
    setAllTopicsSelected(next)
    setSelectedTopicIds(next ? new Set(topics.map((x) => x.id)) : new Set())
  }

  const totalCount = topics.reduce((s, x) => s + x.count, 0)
  const hasTopicSelection = activeIds.length > 0
  const groups: BotCommentGroup[] = items.map((g) => ({
    groupId: g.group_id,
    groupName: g.group_name,
    avatarUrl: g.avatar_url ?? undefined
  }))

  return (
    <div className="bm-flex bm-flex-col bm-gap-3">
      {error && (
        <Callout tone="danger" compact>
          {error}
        </Callout>
      )}

      <div className="bm-flex bm-flex-col bm-gap-2 bm-rounded-xl2 bm-border bm-border-line bm-p-3">
        <div className="bm-flex bm-items-center bm-justify-between">
          <SectionLabel className="!bm-mb-0">
            {t("auto_comment_group_library_topics_title")}
          </SectionLabel>
          <Button
            size="xs"
            variant="outline"
            icon={<Plus size={12} />}
            onClick={() => setTopicModal({})}>
            {t("auto_comment_library_new_topic")}
          </Button>
        </div>
        {loadingTopics ? (
          <div className="bm-flex bm-items-center bm-gap-2 bm-py-3 bm-text-[12.5px] bm-text-fg-muted">
            <Spinner size={13} /> {t("auto_comment_loading")}
          </div>
        ) : topics.length === 0 ? (
          <p className="bm-py-3 bm-text-center bm-text-[12px] bm-text-fg-muted">
            {t("auto_comment_library_empty")}
          </p>
        ) : (
          <div className="bm-flex bm-max-h-[220px] bm-flex-col bm-gap-1 bm-overflow-y-auto">
            <div
              onClick={toggleAllTopics}
              className={cn(
                "bm-flex bm-cursor-pointer bm-items-center bm-justify-between bm-gap-2 bm-rounded-xl bm-border bm-px-2.5 bm-py-1.5",
                allTopicsSelected
                  ? "bm-border-brand/50 bm-bg-brand-soft/50"
                  : "bm-border-line hover:bm-bg-surface-2"
              )}>
              <div className="bm-flex bm-items-center bm-gap-2">
                <Checkbox
                  size="sm"
                  checked={allTopicsSelected}
                  onChange={toggleAllTopics}
                />
                <span className="bm-text-[12.5px] bm-font-semibold bm-text-fg">
                  {t("auto_comment_all")}
                </span>
              </div>
              <Badge size="xs">{totalCount.toLocaleString("vi-VN")}</Badge>
            </div>
            {topics.map((topic) => {
              const checked = selectedTopicIds.has(topic.id)
              return (
                <div
                  key={topic.id}
                  onClick={() => toggleTopic(topic.id)}
                  className={cn(
                    "bm-flex bm-cursor-pointer bm-items-center bm-justify-between bm-gap-2 bm-rounded-xl bm-border bm-px-2.5 bm-py-1.5",
                    checked
                      ? "bm-border-brand/50 bm-bg-brand-soft/50"
                      : "bm-border-line hover:bm-bg-surface-2"
                  )}>
                  <div className="bm-flex bm-min-w-0 bm-items-center bm-gap-2">
                    <Checkbox
                      size="sm"
                      checked={checked}
                      onChange={() => toggleTopic(topic.id)}
                    />
                    <span className="bm-truncate bm-text-[12.5px] bm-text-fg">
                      {topic.name}
                    </span>
                  </div>
                  <div
                    className="bm-flex bm-shrink-0 bm-items-center bm-gap-1"
                    onClick={(e) => e.stopPropagation()}>
                    <Badge size="xs">
                      {topic.count.toLocaleString("vi-VN")}
                    </Badge>
                    <IconButton
                      size="xs"
                      label={t("auto_comment_library_add_groups")}
                      onClick={() => setAddTo(topic)}>
                      <ListPlus size={13} />
                    </IconButton>
                    <Dropdown
                      placement="bottom-end"
                      minWidth={160}
                      items={[
                        {
                          key: "rename",
                          label: t("auto_comment_library_rename_topic"),
                          icon: <Edit2 size={13} />,
                          onClick: () => setTopicModal({ topic })
                        },
                        {
                          key: "delete",
                          label: t("auto_comment_library_delete_topic"),
                          icon: <Trash2 size={13} />,
                          danger: true,
                          divider: true,
                          onClick: () => setDeleting(topic)
                        }
                      ]}>
                      <IconButton
                        size="xs"
                        label={t("auto_comment_more_actions")}>
                        <MoreHorizontal size={14} />
                      </IconButton>
                    </Dropdown>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="bm-flex bm-flex-col bm-gap-2">
        <div className="bm-flex bm-items-center bm-justify-between bm-gap-2">
          <p className="bm-text-[12.5px] bm-text-fg-muted">
            {hasTopicSelection
              ? t("auto_comment_groups_count", { count: items.length })
              : t("auto_comment_select_topic_hint")}
          </p>
          {items.length > 0 && (
            <Button
              size="xs"
              variant="outline"
              onClick={() => onAddMany(groups)}>
              {t("auto_comment_select_all_count", { count: items.length })}
            </Button>
          )}
        </div>
        {hasTopicSelection && (
          <Input
            size="sm"
            prefix={<Search size={13} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("auto_comment_search_group_placeholder")}
          />
        )}
        {loadingItems && items.length === 0 ? (
          <div className="bm-flex bm-items-center bm-justify-center bm-gap-2 bm-py-8 bm-text-[12.5px] bm-text-fg-muted">
            <Spinner size={14} /> {t("auto_comment_loading")}
          </div>
        ) : hasTopicSelection && items.length === 0 ? (
          <p className="bm-rounded-xl2 bm-border bm-border-dashed bm-border-line bm-py-8 bm-text-center bm-text-[12.5px] bm-text-fg-muted">
            {t("auto_comment_no_groups_in_topic")}
          </p>
        ) : hasTopicSelection ? (
          <GroupPickList
            groups={groups}
            isSelected={isSelected}
            onToggle={onToggle}
            renderAction={(g) => (
              <IconButton
                size="xs"
                className="hover:bm-bg-danger-soft hover:bm-text-danger"
                label={t("auto_comment_library_remove_group")}
                onClick={() => void lib.removeGroups(activeIds, [g.groupId])}>
                <X size={13} />
              </IconButton>
            )}
          />
        ) : null}
      </div>

      <LibraryTopicModal
        open={!!topicModal}
        initialName={topicModal?.topic?.name}
        onClose={() => setTopicModal(null)}
        onSubmit={async (name) => {
          if (topicModal?.topic)
            return lib.renameTopic(topicModal.topic.id, name)
          const created = await lib.createTopic(name)
          if (created) setAddTo(created)
        }}
      />
      <LibraryAddGroupsModal
        topic={addTo}
        onClose={() => setAddTo(null)}
        onAdd={lib.addGroups}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        destructive
        title={t("auto_comment_library_delete_topic")}
        description={
          deleting
            ? t("auto_comment_library_delete_topic_confirm", {
                name: deleting.name
              })
            : undefined
        }
        onConfirm={() => {
          if (!deleting) return
          setSelectedTopicIds((prev) => {
            const next = new Set(prev)
            next.delete(deleting.id)
            return next
          })
          void lib.deleteTopic(deleting.id)
        }}
      />
    </div>
  )
}
