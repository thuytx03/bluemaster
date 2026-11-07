import { RotateCcw, Search, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { normalizeForSearch } from "src/configs/tools.config"
import { useAutoBotCommentIdentities } from "src/modules/automation/hooks/useAutoBotCommentIdentities"
import type { BotCommentIdentity } from "src/modules/automation/types/auto-bot-comment.types"
import { useFacebook } from "src/modules/facebook/hooks/useFacebookSession"
import {
  Avatar,
  Badge,
  Button,
  Callout,
  Checkbox,
  cn,
  IconButton,
  Input,
  SectionLabel,
  Spinner
} from "src/modules/shared/ui"

export default function StepIdentities({
  selected,
  selectedMap,
  onToggle
}: {
  selected: Set<string>
  selectedMap: Map<string, BotCommentIdentity>
  onToggle: (id: BotCommentIdentity) => void
}) {
  const { t } = useTranslation()
  const { isLoggedIn } = useFacebook()
  const { identities, loading, error, fetchedAt, fetchIdentities } =
    useAutoBotCommentIdentities()
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (isLoggedIn) void fetchIdentities()
  }, [isLoggedIn, fetchIdentities])

  const filtered = useMemo(() => {
    const q = normalizeForSearch(search)
    return identities.filter(
      (i) => normalizeForSearch(i.name).includes(q) || i.id.includes(search)
    )
  }, [identities, search])

  // Keep identities saved on the bot visible even if they are not in the fresh list
  const selectedList = [...selected]
    .map((id) => identities.find((i) => i.id === id) ?? selectedMap.get(id))
    .filter((x): x is BotCommentIdentity => !!x)

  const typeLabel = (i: BotCommentIdentity) =>
    i.type === "profile"
      ? t("auto_comment_personal_account")
      : t("auto_comment_fanpage")

  return (
    <div className="bm-flex bm-flex-col bm-gap-3">
      <p className="bm-text-[12.5px] bm-text-fg-muted">
        {t("auto_comment_select_identity_hint")}
      </p>
      {error && (
        <Callout tone="danger" compact>
          {error}
        </Callout>
      )}

      <div className="bm-flex bm-flex-col bm-gap-2 bm-rounded-xl2 bm-border bm-border-line bm-p-3">
        <div className="bm-flex bm-items-center bm-justify-between bm-gap-2">
          <SectionLabel
            className="!bm-mb-0"
            hint={
              fetchedAt && !loading
                ? t("auto_comment_minutes_ago", {
                    minutes: Math.round((Date.now() - fetchedAt) / 60000)
                  })
                : undefined
            }>
            {t("auto_comment_identity_list_title")}
          </SectionLabel>
          <Button
            size="xs"
            variant="ghost"
            icon={
              <RotateCcw
                size={12}
                className={loading ? "bm-animate-spin" : undefined}
              />
            }
            disabled={loading}
            onClick={() => void fetchIdentities(true)}>
            {t("auto_comment_refresh")}
          </Button>
        </div>
        <Input
          size="sm"
          prefix={<Search size={13} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("auto_comment_search_identity_placeholder")}
        />
        <div className="bm-flex bm-max-h-[280px] bm-flex-col bm-gap-1 bm-overflow-y-auto">
          {loading && (
            <div className="bm-flex bm-items-center bm-justify-center bm-gap-2 bm-py-6 bm-text-[12.5px] bm-text-fg-muted">
              <Spinner size={14} /> {t("auto_comment_loading")}
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <p className="bm-py-5 bm-text-center bm-text-[12px] bm-italic bm-text-fg-muted">
              {isLoggedIn
                ? t("auto_comment_no_identity_found")
                : t("auto_comment_not_logged_in")}
            </p>
          )}
          {!loading &&
            filtered.map((id) => {
              const checked = selected.has(id.id)
              return (
                <div
                  key={id.id}
                  onClick={() => onToggle(id)}
                  className={cn(
                    "bm-flex bm-cursor-pointer bm-items-center bm-gap-2.5 bm-rounded-xl bm-border bm-p-2 bm-transition-colors",
                    checked
                      ? "bm-border-brand/50 bm-bg-brand-soft/50"
                      : "bm-border-line hover:bm-bg-surface-2"
                  )}>
                  <Checkbox
                    size="sm"
                    checked={checked}
                    onChange={() => onToggle(id)}
                  />
                  <Avatar src={id.avatar} name={id.name} size={30} />
                  <div className="bm-min-w-0 bm-flex-1">
                    <p className="bm-truncate bm-text-[13px] bm-font-medium bm-text-fg">
                      {id.name}
                    </p>
                    <p className="bm-truncate bm-text-[11.5px] bm-text-fg-muted">
                      {typeLabel(id)} · {id.id}
                    </p>
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      <div className="bm-flex bm-flex-col bm-gap-2 bm-rounded-xl2 bm-border bm-border-line bm-p-3">
        <div className="bm-flex bm-items-center bm-justify-between">
          <SectionLabel className="!bm-mb-0">
            {t("auto_comment_selected_title")}
          </SectionLabel>
          <Badge tone={selectedList.length > 0 ? "brand" : "neutral"}>
            {selectedList.length}
          </Badge>
        </div>
        {selectedList.length === 0 ? (
          <p className="bm-rounded-xl bm-border bm-border-dashed bm-border-line bm-py-4 bm-text-center bm-text-[12px] bm-italic bm-text-fg-muted">
            {t("auto_comment_no_identity_selected")}
          </p>
        ) : (
          <div className="bm-flex bm-flex-col bm-gap-1">
            {selectedList.map((id) => (
              <div
                key={id.id}
                className="bm-flex bm-items-center bm-gap-2.5 bm-rounded-xl bm-border bm-border-brand/30 bm-bg-brand-soft/40 bm-p-2">
                <Avatar src={id.avatar} name={id.name} size={26} />
                <div className="bm-min-w-0 bm-flex-1">
                  <p className="bm-truncate bm-text-[12.5px] bm-font-medium bm-text-fg">
                    {id.name}
                  </p>
                  <p className="bm-truncate bm-text-[11px] bm-text-fg-muted">
                    {typeLabel(id)} · {id.id}
                  </p>
                </div>
                <IconButton
                  size="xs"
                  label={t("auto_comment_remove")}
                  onClick={() => onToggle(id)}>
                  <X size={13} />
                </IconButton>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
