import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  MapPin,
  Palette,
  Plus,
  Smile,
  Video,
  X
} from "lucide-react"
import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { CheckinSearch } from "src/modules/automation/components/post-campaign/CheckinSearch"
import { PostConfigForm } from "src/modules/automation/components/post-campaign/PostConfigForm"
import { PostPreview } from "src/modules/automation/components/post-campaign/PostPreview"
import { StatusBgPicker } from "src/modules/automation/components/post-campaign/StatusBgPicker"
import { usePostCampaignStore } from "src/modules/automation/hooks/usePostCampaignStore"
import type {
  AttachKind,
  PostGroup,
  PostSlot,
  StatusBgCategory,
  StatusBgPreset
} from "src/modules/automation/types/post-campaign.types"
import {
  emptySlot,
  POST_CAMPAIGN_MAX_POSTS,
  readFileAsDataUrl
} from "src/modules/automation/utils/post-campaign.util"
import {
  Button,
  cn,
  Field,
  IconButton,
  Input,
  Select,
  Textarea
} from "src/modules/shared/ui"

interface Props {
  allGroups: PostGroup[]
  bgCategories: StatusBgCategory[]
}

export function Step2Compose({ allGroups, bgCategories }: Props) {
  const { t } = useTranslation()
  const {
    posts,
    currentPostIdx,
    updateSlot,
    addPost,
    removePost,
    switchPost,
    setStep
  } = usePostCampaignStore()

  const imgRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)
  const [showBgPicker, setShowBgPicker] = useState(false)
  const [showCheckin, setShowCheckin] = useState(false)

  const slot = posts[currentPostIdx] ?? emptySlot()

  const attachOptions: { value: AttachKind; label: string }[] = [
    { value: "none", label: t("campaign_manager_attach_none") },
    { value: "status", label: t("campaign_manager_attach_status") },
    {
      value: "status_images",
      label: t("campaign_manager_attach_status_images")
    },
    { value: "image", label: t("campaign_manager_attach_image") },
    { value: "video", label: t("campaign_manager_attach_video") },
    {
      value: "video_link",
      label: t("campaign_manager_attach_video_link")
    },
    { value: "link", label: t("campaign_manager_attach_link") }
  ]

  // Always patch the latest slot (file readers resolve after later edits)
  function patch(p: Partial<PostSlot>, idx = currentPostIdx) {
    const latest = usePostCampaignStore.getState().posts[idx] ?? emptySlot()
    updateSlot(idx, { ...latest, ...p })
  }

  function handleAttachChange(k: AttachKind) {
    patch({
      attachKind: k,
      images: k === "image" || k === "status_images" ? slot.images : [],
      video: k === "video" ? slot.video : null,
      videoLinkUrl: k === "video_link" ? slot.videoLinkUrl : "",
      shareLinkUrl: k === "link" ? slot.shareLinkUrl : "",
      statusBgIds:
        k === "status" || k === "status_images" ? slot.statusBgIds : []
    })
    if (k === "image" || k === "status_images") imgRef.current?.click()
    if (k === "video") videoRef.current?.click()
    if (k === "status" || k === "status_images") setShowBgPicker(true)
  }

  function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith("image/")
    )
    e.target.value = ""
    if (!files.length) return
    const idx = currentPostIdx
    Promise.all(files.slice(0, 10).map(readFileAsDataUrl))
      .then((imgs) => {
        // "+" adds to the current images (the source replaced them); still max 10
        const current = usePostCampaignStore.getState().posts[idx]?.images ?? []
        patch({ images: [...current, ...imgs].slice(0, 10) }, idx)
      })
      .catch(() => undefined)
  }

  function handleVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    const idx = currentPostIdx
    readFileAsDataUrl(file)
      .then((video) => patch({ video }, idx))
      .catch(() => undefined)
  }

  const selectedBgPresets = slot.statusBgIds
    .map((id) =>
      bgCategories.flatMap((c) => c.presets).find((p) => p.id === id)
    )
    .filter(Boolean) as StatusBgPreset[]

  const canNext = posts.some((p) => p.content.trim())
  const isStatusMode =
    slot.attachKind === "status" || slot.attachKind === "status_images"
  const isImageMode =
    slot.attachKind === "image" || slot.attachKind === "status_images"

  const chip = (active: boolean) =>
    cn(
      "bm-flex bm-items-center bm-gap-1 bm-rounded-lg bm-border bm-px-2 bm-py-1 bm-text-[12.5px] bm-transition-colors",
      active
        ? "bm-border-brand/50 bm-bg-brand-soft bm-text-brand-ink"
        : "bm-border-line bm-text-fg-muted hover:bm-border-brand/50 hover:bm-text-brand-ink"
    )

  return (
    <div className="bm-flex bm-flex-col bm-gap-3">
      {/* Post tabs */}
      <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-1">
        {posts.map((_, i) => (
          <div
            key={i}
            className={cn(
              "bm-flex bm-items-center bm-border-b-2",
              i === currentPostIdx ? "bm-border-brand" : "bm-border-transparent"
            )}>
            <button
              type="button"
              onClick={() => switchPost(i)}
              className={cn(
                "bm-px-2.5 bm-py-1 bm-text-[12.5px] bm-font-medium",
                i === currentPostIdx
                  ? "bm-text-brand-ink"
                  : "bm-text-fg-muted hover:bm-text-fg"
              )}>
              {t("campaign_manager_post_tab", { index: i + 1 })}
            </button>
            {posts.length > 1 && (
              <button
                type="button"
                onClick={() => removePost(i)}
                aria-label={t("campaign_manager_delete_this_post")}
                className="bm-pr-1 bm-text-fg-subtle hover:bm-text-danger">
                <X size={12} />
              </button>
            )}
          </div>
        ))}
        {posts.length < POST_CAMPAIGN_MAX_POSTS && (
          <Button
            variant="ghost"
            size="xs"
            icon={<Plus size={12} />}
            onClick={addPost}>
            {t("campaign_manager_add_post")}
          </Button>
        )}
      </div>
      <p className="bm-text-[12px] bm-text-fg-muted">
        {t("campaign_manager_multi_post_hint")}
      </p>

      {/* Content */}
      <Field label={t("campaign_manager_write_content_label")}>
        <Textarea
          rows={5}
          value={slot.content}
          onChange={(e) => patch({ content: e.target.value })}
          placeholder={t("campaign_manager_content_placeholder")}
        />
        <p className="bm-mt-1 bm-whitespace-pre-wrap bm-rounded-lg bm-bg-surface-2 bm-px-2 bm-py-1.5 bm-text-[12px] bm-text-fg-muted">
          {t("campaign_manager_spin_hint")}
        </p>
      </Field>

      {/* Attachment */}
      <Field label={t("campaign_manager_attachment_label")}>
        <div className="bm-flex bm-items-center bm-gap-2">
          <Select<AttachKind>
            size="sm"
            className="bm-flex-1"
            value={slot.attachKind}
            onChange={handleAttachChange}
            options={attachOptions}
          />
          {slot.attachKind !== "none" && (
            <Button
              variant="link"
              size="xs"
              className="bm-text-danger"
              onClick={() =>
                patch({
                  attachKind: "none",
                  images: [],
                  video: null,
                  videoLinkUrl: "",
                  shareLinkUrl: "",
                  statusBgIds: []
                })
              }>
              {t("campaign_manager_remove_attachment")}
            </Button>
          )}
        </div>

        <input
          ref={imgRef}
          type="file"
          accept="image/*"
          multiple
          className="bm-hidden"
          onChange={handleImages}
        />
        <input
          ref={videoRef}
          type="file"
          accept="video/*"
          className="bm-hidden"
          onChange={handleVideo}
        />

        {isStatusMode && (
          <div className="bm-mt-2 bm-flex bm-flex-wrap bm-items-center bm-gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Palette size={13} />}
              onClick={() => setShowBgPicker(true)}>
              {slot.statusBgIds.length > 0
                ? t("campaign_manager_backgrounds_selected_count", {
                    count: slot.statusBgIds.length
                  })
                : t("campaign_manager_choose_background")}
            </Button>
            {selectedBgPresets.length > 0 && (
              <div className="bm-flex bm-gap-1">
                {selectedBgPresets.slice(0, 6).map((p) => (
                  <div
                    key={p.id}
                    className="bm-h-6 bm-w-6 bm-overflow-hidden bm-rounded bm-border bm-border-line"
                    style={{ backgroundColor: p.bgColor }}
                    title={p.desc}>
                    {p.thumbUrl && (
                      <img
                        src={p.thumbUrl}
                        alt=""
                        className="bm-h-full bm-w-full bm-object-cover"
                      />
                    )}
                  </div>
                ))}
                {selectedBgPresets.length > 6 && (
                  <span className="bm-self-center bm-text-[12px] bm-text-fg-muted">
                    +{selectedBgPresets.length - 6}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {isImageMode && slot.images.length > 0 && (
          <div className="bm-mt-2 bm-flex bm-flex-wrap bm-items-center bm-gap-1.5">
            {slot.images.map((img, i) => (
              <div key={i} className="bm-relative">
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  className="bm-h-14 bm-w-14 bm-rounded-lg bm-border bm-border-line bm-object-cover"
                />
                <button
                  type="button"
                  aria-label={t("campaign_manager_remove")}
                  onClick={() =>
                    patch({ images: slot.images.filter((_, j) => j !== i) })
                  }
                  className="bm-absolute -bm-right-1 -bm-top-1 bm-flex bm-h-4 bm-w-4 bm-items-center bm-justify-center bm-rounded-full bm-bg-danger bm-text-white">
                  <X size={10} />
                </button>
              </div>
            ))}
            <button
              type="button"
              aria-label={t("campaign_manager_choose_images")}
              onClick={() => imgRef.current?.click()}
              className="bm-flex bm-h-14 bm-w-14 bm-items-center bm-justify-center bm-rounded-lg bm-border bm-border-dashed bm-border-line bm-text-fg-muted hover:bm-border-brand/50 hover:bm-text-brand-ink">
              <Plus size={16} />
            </button>
            <span className="bm-text-[12px] bm-text-fg-muted">
              {t("campaign_manager_images_count", {
                count: slot.images.length
              })}
            </span>
          </div>
        )}
        {isImageMode && slot.images.length === 0 && (
          <Button
            variant="outline"
            size="sm"
            block
            className="bm-mt-2 bm-border-dashed"
            icon={<ImagePlus size={13} />}
            onClick={() => imgRef.current?.click()}>
            {t("campaign_manager_choose_images")}
          </Button>
        )}

        {slot.attachKind === "video" && slot.video && (
          <div className="bm-mt-2 bm-flex bm-items-center bm-gap-2">
            <p className="bm-min-w-0 bm-truncate bm-text-[12.5px] bm-text-fg-muted">
              📹 {slot.video.name}
            </p>
            <Button
              variant="link"
              size="xs"
              className="bm-text-danger"
              onClick={() => patch({ video: null })}>
              {t("campaign_manager_remove")}
            </Button>
          </div>
        )}
        {slot.attachKind === "video" && !slot.video && (
          <Button
            variant="outline"
            size="sm"
            block
            className="bm-mt-2 bm-border-dashed"
            icon={<Video size={13} />}
            onClick={() => videoRef.current?.click()}>
            {t("campaign_manager_choose_video")}
          </Button>
        )}

        {slot.attachKind === "video_link" && (
          <Input
            size="sm"
            className="bm-mt-2"
            value={slot.videoLinkUrl}
            onChange={(e) => patch({ videoLinkUrl: e.target.value })}
            placeholder="https://www.facebook.com/watch?v=..."
          />
        )}

        {slot.attachKind === "link" && (
          <div className="bm-mt-2 bm-flex bm-flex-col bm-gap-1">
            <Input
              size="sm"
              value={slot.shareLinkUrl}
              onChange={(e) => patch({ shareLinkUrl: e.target.value })}
              placeholder="https://www.facebook.com/..."
            />
            <p className="bm-text-[12px] bm-text-fg-muted">
              {t("campaign_manager_share_link_hint")}
            </p>
          </div>
        )}
      </Field>

      {/* Feeling + check-in */}
      <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-2">
        <span className="bm-text-[12.5px] bm-text-fg-muted">
          {t("campaign_manager_options_label")}
        </span>
        <button
          type="button"
          onClick={() =>
            patch({
              feeling: slot.feeling
                ? null
                : {
                    emoji: "😊",
                    name: t("campaign_manager_feeling_happy")
                  }
            })
          }
          className={chip(!!slot.feeling)}>
          <Smile size={12} />
          {slot.feeling
            ? `${slot.feeling.emoji} ${slot.feeling.name}`
            : t("campaign_manager_attach_feeling")}
        </button>
        <button
          type="button"
          onClick={() => setShowCheckin(true)}
          className={chip(!!slot.checkin)}>
          <MapPin size={12} />
          <span className="bm-max-w-[180px] bm-truncate">
            {slot.checkin ? slot.checkin.name : t("campaign_manager_check_in")}
          </span>
        </button>
        {slot.checkin && (
          <IconButton
            label={t("campaign_manager_remove")}
            size="xs"
            onClick={() => patch({ checkin: null })}>
            <X size={12} />
          </IconButton>
        )}
      </div>

      <PostPreview slot={slot} bgCategories={bgCategories} />

      <PostConfigForm allGroups={allGroups} />

      {/* Nav */}
      <div className="bm-flex bm-items-center bm-justify-between bm-gap-2 bm-border-t bm-border-line bm-pt-3">
        <Button
          variant="outline"
          size="sm"
          icon={<ChevronLeft size={14} />}
          onClick={() => setStep(1)}>
          {t("campaign_manager_back")}
        </Button>
        <Button
          variant="primary"
          size="sm"
          iconRight={<ChevronRight size={14} />}
          disabled={!canNext}
          onClick={() => setStep(3)}>
          {t("campaign_manager_confirm_campaign")}
        </Button>
      </div>

      {showBgPicker && isStatusMode && (
        <StatusBgPicker
          selected={slot.statusBgIds}
          multiSelect={slot.attachKind === "status_images"}
          onSelect={(ids) => patch({ statusBgIds: ids })}
          onClose={() => setShowBgPicker(false)}
          categories={bgCategories}
        />
      )}
      {showCheckin && (
        <CheckinSearch
          selected={slot.checkin}
          onSelect={(place) => patch({ checkin: place })}
          onClose={() => setShowCheckin(false)}
        />
      )}
    </div>
  )
}
