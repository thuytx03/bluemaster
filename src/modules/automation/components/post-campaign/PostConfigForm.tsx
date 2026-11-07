import { Upload, X } from "lucide-react"
import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { GroupMultiSelect } from "src/modules/automation/components/post-campaign/GroupMultiSelect"
import { usePostCampaignStore } from "src/modules/automation/hooks/usePostCampaignStore"
import type {
  AdminPermissionTone,
  GroupOrder,
  PostGroup
} from "src/modules/automation/types/post-campaign.types"
import { readFileAsDataUrl } from "src/modules/automation/utils/post-campaign.util"
import {
  Button,
  Checkbox,
  Field,
  IconButton,
  Input,
  NumberInput,
  RadioGroup,
  Segmented,
  Select,
  Surface,
  Textarea
} from "src/modules/shared/ui"

interface Props {
  allGroups: PostGroup[]
}

/** Step 2 right column: target groups + campaign options (basic / advanced). */
export function PostConfigForm({ allGroups }: Props) {
  const { t } = useTranslation()
  const [configTab, setConfigTab] = useState<"basic" | "advanced">("basic")
  const commentImgRef = useRef<HTMLInputElement>(null)

  const s = usePostCampaignStore()

  function handleCommentImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    void readFileAsDataUrl(file)
      .then(s.setCommentImage)
      .catch(() => undefined)
  }

  return (
    <div className="bm-flex bm-flex-col bm-gap-3">
      <Surface padding="sm" tone="muted">
        <p className="bm-mb-1.5 bm-text-[12.5px] bm-font-semibold bm-text-brand-ink">
          {t("campaign_manager_group_list_title", {
            count: s.selectedGroups.length
          })}
        </p>
        <GroupMultiSelect
          groups={allGroups}
          selected={s.selectedGroups}
          onChange={s.setSelectedGroups}
          placeholder={t("campaign_manager_select_post_groups_placeholder")}
          searchPlaceholder={t("campaign_manager_search_group_placeholder")}
        />
      </Surface>

      <Surface padding="sm">
        <div className="bm-mb-2 bm-flex bm-items-center bm-justify-between bm-gap-2">
          <p className="bm-text-[13px] bm-font-semibold bm-text-fg">
            {t("campaign_manager_post_config_title")}
          </p>
          <Segmented
            size="sm"
            value={configTab}
            onChange={setConfigTab}
            options={[
              {
                value: "basic",
                label: t("campaign_manager_tab_basic")
              },
              {
                value: "advanced",
                label: t("campaign_manager_tab_advanced")
              }
            ]}
          />
        </div>

        {configTab === "basic" && (
          <div className="bm-flex bm-flex-col bm-gap-2.5">
            <Field label={t("campaign_manager_campaign_name_label")}>
              <Input
                size="sm"
                value={s.campaignName}
                onChange={(e) => s.setCampaignName(e.target.value)}
                placeholder={t("campaign_manager_campaign_name_placeholder")}
              />
            </Field>

            <div className="bm-grid bm-grid-cols-2 bm-gap-2">
              <Field
                label={t("campaign_manager_stop_on_error_label")}
                hint={t("campaign_manager_consecutive_groups")}>
                <NumberInput
                  size="sm"
                  min={0}
                  value={s.skipAfterErrors}
                  onChange={(v) => s.setSkipAfterErrors(v ?? 0)}
                />
              </Field>
              <Field
                label={t("campaign_manager_group_limit_label")}
                hint={t("campaign_manager_zero_means_unlimited")}>
                <NumberInput
                  size="sm"
                  min={0}
                  value={s.maxGroups}
                  onChange={(v) => s.setMaxGroups(v ?? 0)}
                />
              </Field>
            </div>

            <Field label={t("campaign_manager_group_send_order_label")}>
              <Select<GroupOrder>
                size="sm"
                value={s.groupOrder}
                onChange={s.setGroupOrder}
                options={[
                  {
                    value: "top_down",
                    label: t("campaign_manager_order_top_down")
                  },
                  {
                    value: "random",
                    label: t("campaign_manager_order_random")
                  }
                ]}
              />
            </Field>

            <div className="bm-flex bm-flex-col bm-gap-1.5 bm-border-t bm-border-line bm-pt-2">
              <Checkbox
                size="sm"
                checked={s.anonymous}
                onChange={s.setAnonymous}
                label={t("campaign_manager_post_anonymously")}
              />
              <Checkbox
                size="sm"
                checked={s.skipFailed}
                onChange={s.setSkipFailed}
                label={t("campaign_manager_skip_failed_groups")}
              />
            </div>
          </div>
        )}

        {configTab === "advanced" && (
          <div className="bm-flex bm-flex-col bm-gap-2.5">
            <Field label={t("campaign_manager_auto_signature_label")}>
              <Textarea
                rows={2}
                value={s.signature}
                onChange={(e) => s.setSignature(e.target.value)}
                placeholder={t("campaign_manager_auto_signature_placeholder")}
              />
            </Field>
            <Field label={t("campaign_manager_comment_after_post_label")}>
              <Textarea
                rows={2}
                value={s.commentAfterPost}
                onChange={(e) => s.setCommentAfterPost(e.target.value)}
                placeholder={t(
                  "campaign_manager_comment_after_post_placeholder"
                )}
              />
            </Field>
            <Field label={t("campaign_manager_comment_image_label")}>
              <div className="bm-flex bm-items-center bm-gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Upload size={13} />}
                  onClick={() => commentImgRef.current?.click()}>
                  {t("campaign_manager_choose_images")}
                </Button>
                {s.commentImage && (
                  <div className="bm-flex bm-items-center bm-gap-1">
                    <img
                      src={s.commentImage.dataUrl}
                      alt=""
                      className="bm-h-8 bm-w-8 bm-rounded-lg bm-object-cover"
                    />
                    <IconButton
                      label={t("campaign_manager_remove")}
                      size="xs"
                      variant="danger"
                      onClick={() => s.setCommentImage(null)}>
                      <X size={12} />
                    </IconButton>
                  </div>
                )}
              </div>
              <input
                ref={commentImgRef}
                type="file"
                accept="image/*"
                className="bm-hidden"
                onChange={handleCommentImage}
              />
            </Field>
            <Checkbox
              size="sm"
              checked={s.reactAfterPost}
              onChange={s.setReactAfterPost}
              label={t("campaign_manager_react_after_post")}
            />
            <Checkbox
              size="sm"
              checked={s.randomPickOneImage}
              onChange={s.setRandomPickOneImage}
              label={t("campaign_manager_random_pick_one_image")}
            />
            <div className="bm-flex bm-flex-col bm-gap-1.5">
              <Checkbox
                size="sm"
                checked={s.requestAdminPermission}
                onChange={s.setRequestAdminPermission}
                label={t("campaign_manager_request_admin_permission")}
              />
              {s.requestAdminPermission && (
                <RadioGroup<AdminPermissionTone>
                  variant="inline"
                  className="bm-ml-6"
                  value={s.requestAdminPermissionTone}
                  onChange={s.setRequestAdminPermissionTone}
                  options={[
                    {
                      value: "quick",
                      label: t("campaign_manager_tone_polite")
                    },
                    {
                      value: "warm",
                      label: t("campaign_manager_tone_warm")
                    }
                  ]}
                />
              )}
            </div>
          </div>
        )}
      </Surface>
    </div>
  )
}
