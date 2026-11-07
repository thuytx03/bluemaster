import type { TFunction } from "i18next"
import { ArrowLeft, ImageIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import type { RadarPost } from "src/modules/automation/types/post-radar.types"
import { Badge, cn, IconButton } from "src/modules/shared/ui"
import type { TBadgeTone } from "src/modules/shared/ui"

export function typeLabel(
  postType: RadarPost["postType"],
  t: TFunction
): string {
  if (postType === "video") return t("post_radar_type_video")
  if (postType === "photo") return t("post_radar_type_photo")
  if (postType === "link") return t("post_radar_type_link")
  return t("post_radar_type_text")
}

const TYPE_TONE: Record<RadarPost["postType"], TBadgeTone> = {
  video: "violet",
  photo: "cyan",
  link: "amber",
  text: "neutral"
}

export function PostTypeBadge({
  postType
}: {
  postType: RadarPost["postType"]
}) {
  const { t } = useTranslation()
  return (
    <Badge size="xs" tone={TYPE_TONE[postType]}>
      {typeLabel(postType, t)}
    </Badge>
  )
}

/** Post image thumbnail with a placeholder when missing or broken. */
export function PostThumb({ src, size = 40 }: { src: string; size?: number }) {
  const [failed, setFailed] = useState(false)
  return (
    <span
      className="bm-flex bm-shrink-0 bm-items-center bm-justify-center bm-overflow-hidden bm-rounded-lg bm-border bm-border-line bm-bg-surface-2"
      style={{ width: size, height: size }}>
      {src && !failed ? (
        <img
          src={src}
          alt=""
          className="bm-h-full bm-w-full bm-object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <ImageIcon
          size={Math.round(size / 2.2)}
          className="bm-text-fg-subtle"
        />
      )}
    </span>
  )
}

export function getPostRadarSteps(t: TFunction) {
  return [
    { n: 1, label: t("post_radar_step_scan") },
    { n: 2, label: t("post_radar_step_config") },
    { n: 3, label: t("post_radar_step_progress") }
  ]
}

/** Step header (scan → config → progress) with an optional back button. */
export function PostRadarStepIndicator({
  current,
  onBack,
  backDisabled
}: {
  current: number
  onBack?: () => void
  backDisabled?: boolean
}) {
  const { t } = useTranslation()
  const steps = getPostRadarSteps(t)
  return (
    <div className="bm-flex bm-shrink-0 bm-items-center bm-gap-2 bm-rounded-xl bm-border bm-border-line bm-bg-surface bm-px-2.5 bm-py-2">
      {onBack && (
        <IconButton
          size="xs"
          label={t("back")}
          onClick={onBack}
          disabled={backDisabled}>
          <ArrowLeft size={14} />
        </IconButton>
      )}
      <div className="bm-flex bm-min-w-0 bm-flex-1 bm-items-center bm-gap-1">
        {steps.map((s, i) => {
          const done = current > s.n
          const active = current === s.n
          return (
            <div
              key={s.n}
              className="bm-flex bm-min-w-0 bm-items-center bm-gap-1">
              <span
                className={cn(
                  "bm-flex bm-h-5 bm-w-5 bm-shrink-0 bm-items-center bm-justify-center bm-rounded-full bm-text-[10px] bm-font-bold",
                  done && "bm-bg-brand bm-text-brand-fg",
                  active &&
                    "bm-border bm-border-brand bm-bg-brand-soft bm-text-brand-ink",
                  !done && !active && "bm-bg-surface-2 bm-text-fg-muted"
                )}>
                {done ? "✓" : s.n}
              </span>
              <span
                className={cn(
                  "bm-truncate bm-text-[12px]",
                  active ? "bm-font-semibold bm-text-fg" : "bm-text-fg-muted"
                )}>
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <span className="bm-mx-0.5 bm-shrink-0 bm-text-fg-subtle">
                  →
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
