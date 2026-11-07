import { ChevronLeft, Send } from "lucide-react"
import { useTranslation } from "react-i18next"

import { usePostCampaignStore } from "src/modules/automation/hooks/usePostCampaignStore"
import {
  getTypeLabel,
  POST_CAMPAIGN_DELAY_DEFAULTS,
  POST_CAMPAIGN_DELAY_KEY
} from "src/modules/automation/utils/post-campaign.util"
import { getDelayConfig } from "src/modules/facebook/utils/delay-config.util"
import { Badge, Button, DescList, Surface } from "src/modules/shared/ui"

interface Props {
  onStart: () => void
}

export function Step3Confirm({ onStart }: Props) {
  const { t } = useTranslation()
  const {
    posts,
    selectedGroups,
    campaignName,
    groupOrder,
    maxGroups,
    requestAdminPermission,
    requestAdminPermissionTone,
    setStep,
    switchPost
  } = usePostCampaignStore()
  const dc = getDelayConfig(
    POST_CAMPAIGN_DELAY_KEY,
    POST_CAMPAIGN_DELAY_DEFAULTS
  )

  const validPosts = posts
    .map((p, idx) => ({ p, idx }))
    .filter(({ p }) => p.content.trim())
  const groupCount =
    maxGroups > 0
      ? Math.min(maxGroups, selectedGroups.length)
      : selectedGroups.length

  const value = (v: string) => (
    <span className="bm-font-medium bm-text-brand-ink">{v}</span>
  )

  return (
    <div className="bm-flex bm-flex-col bm-gap-3">
      <div>
        <p className="bm-mb-2 bm-text-[13px] bm-font-semibold bm-text-fg">
          {t("campaign_manager_post_summary_title")}
        </p>
        <div className="bm-flex bm-flex-col bm-gap-2">
          {validPosts.map(({ p, idx }, i) => (
            <Surface key={idx} padding="sm">
              <div className="bm-mb-1 bm-flex bm-items-center bm-justify-between bm-gap-2">
                <span className="bm-text-[12px] bm-font-medium bm-text-fg">
                  {t("campaign_manager_post_tab", { index: i + 1 })}
                </span>
                <Badge tone="outline" size="xs">
                  {getTypeLabel(t, p)}
                </Badge>
              </div>
              <p className="bm-line-clamp-3 bm-whitespace-pre-wrap bm-break-words bm-text-[12px] bm-text-fg-muted">
                {p.content.slice(0, 120)}
                {p.content.length > 120 ? "…" : ""}
              </p>
              <Button
                variant="link"
                size="xs"
                className="bm-mt-1"
                onClick={() => {
                  switchPost(idx)
                  setStep(2)
                }}>
                {t("campaign_manager_click_to_view_details")}
              </Button>
            </Surface>
          ))}
        </div>
      </div>

      <div>
        <p className="bm-mb-2 bm-text-[13px] bm-font-semibold bm-text-fg">
          {t("campaign_manager_campaign_settings_title")}
        </p>
        <DescList
          items={[
            {
              label: t("campaign_manager_campaign_name_label"),
              value: value(campaignName || "—")
            },
            {
              label: t("campaign_manager_groups_to_post_label"),
              value: value(
                t("campaign_manager_groups_count", {
                  count: groupCount
                })
              )
            },
            {
              label: t("campaign_manager_delay_time_label"),
              value: value(
                t("campaign_manager_delay_seconds_range", {
                  min: dc.minDelay,
                  max: dc.maxDelay
                })
              )
            },
            {
              label: t("campaign_manager_group_order_label"),
              value: value(
                groupOrder === "random"
                  ? t("campaign_manager_order_random")
                  : t("campaign_manager_order_top_down")
              )
            },
            {
              label: t("campaign_manager_batch_rest_label"),
              value: value(
                dc.sleepAfter > 0
                  ? t("campaign_manager_rest_after_groups", {
                      count: dc.sleepAfter,
                      minutes: Math.round(dc.minSleep / 60)
                    })
                  : t("campaign_manager_off")
              )
            },
            {
              label: t("campaign_manager_request_admin_permission_label"),
              value: value(
                requestAdminPermission
                  ? requestAdminPermissionTone === "warm"
                    ? t("campaign_manager_tone_warm")
                    : t("campaign_manager_tone_polite")
                  : t("campaign_manager_off")
              )
            }
          ]}
        />
      </div>

      <div className="bm-flex bm-items-center bm-justify-between bm-gap-2 bm-border-t bm-border-line bm-pt-3">
        <Button
          variant="outline"
          size="sm"
          icon={<ChevronLeft size={14} />}
          onClick={() => setStep(2)}>
          {t("campaign_manager_back_to_step2")}
        </Button>
        <Button
          variant="primary"
          size="sm"
          icon={<Send size={13} />}
          onClick={onStart}>
          {t("campaign_manager_start_posting")}
        </Button>
      </div>
    </div>
  )
}
