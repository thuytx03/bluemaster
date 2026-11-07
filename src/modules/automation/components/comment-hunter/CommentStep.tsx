import { Heart, Play, Square } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { ImageAttachments } from "src/modules/automation/components/comment-hunter/ImageAttachments"
import { RunConsole } from "src/modules/automation/components/comment-hunter/RunConsole"
import type { CommentHunter } from "src/modules/automation/hooks/useCommentHunter"
import type { CkPost } from "src/modules/automation/types/comment-hunter.types"
import { FacebookDelayConfig } from "src/modules/facebook/components/DelayConfigPanel"
import { getDelayConfig } from "src/modules/facebook/utils/delay-config.util"
import { Button, Checkbox, Field, Textarea } from "src/modules/shared/ui"

export const COMMENT_HUNTER_DELAY_KEY = "fb_delay_comment_hunter"
const DELAY_DEFAULTS = { minDelay: 10, maxDelay: 30 }

/** Step 2 of the source Panel: comment template, options, run/stop and the console. */
export function CommentStep({
  hunter,
  selectedPosts,
  onBack
}: {
  hunter: CommentHunter
  selectedPosts: CkPost[]
  onBack: () => void
}) {
  const { t } = useTranslation()
  const { state, logs, results, progress, images, setImages, run, stop } =
    hunter

  const [commentText, setCommentText] = useState("")
  const [doReact, setDoReact] = useState(true)

  const isRunning = state === "running"
  const isDone = state === "done"
  const hasStarted = isRunning || isDone || logs.length > 0

  const handleRun = () => {
    if (!commentText.trim()) {
      toast.error(t("comment_hunter_toast_enter_comment"))
      return
    }
    const { minDelay, maxDelay } = getDelayConfig(
      COMMENT_HUNTER_DELAY_KEY,
      DELAY_DEFAULTS
    )
    void run({
      commentText,
      posts: selectedPosts,
      images,
      doReact,
      delayMin: minDelay,
      delayMax: maxDelay
    })
  }

  return (
    <div className="bm-flex bm-flex-col bm-gap-3">
      <div className="bm-flex bm-flex-wrap bm-items-center bm-justify-between bm-gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} disabled={isRunning}>
          {t("comment_hunter_button_back_to_select")}
        </Button>
        <span className="bm-text-[13px] bm-font-semibold bm-text-fg">
          {t("comment_hunter_selected_posts_count", {
            count: selectedPosts.length
          })}
        </span>
      </div>

      <Field
        label={t("comment_hunter_label_comment_content")}
        hint={
          <>
            <strong>{t("comment_hunter_hint_comment_lines_label")}</strong>{" "}
            {t("comment_hunter_hint_comment_lines_text")}
          </>
        }>
        <Textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={t("comment_hunter_placeholder_comment")}
          className="bm-min-h-[120px]"
          rows={5}
          disabled={isRunning}
        />
      </Field>

      <div className="bm-flex bm-flex-col bm-gap-3 bm-rounded-xl bm-border bm-border-line bm-bg-surface-2/40 bm-p-3">
        <ImageAttachments
          images={images}
          setImages={setImages}
          disabled={isRunning}
        />

        <Checkbox
          checked={doReact}
          onChange={setDoReact}
          disabled={isRunning}
          label={
            <span className="bm-inline-flex bm-items-center bm-gap-1.5">
              {t("comment_hunter_label_react_post")}
              <Heart size={13} fill="currentColor" className="bm-text-danger" />
            </span>
          }
        />

        <FacebookDelayConfig
          storageKey={COMMENT_HUNTER_DELAY_KEY}
          defaults={DELAY_DEFAULTS}
          showSleepConfig={false}
          showLimitsConfig={false}
        />

        <div className="bm-flex bm-gap-2">
          <Button
            variant="primary"
            block
            onClick={handleRun}
            loading={isRunning}
            icon={<Play size={14} />}>
            {isRunning
              ? t("comment_hunter_button_running")
              : t("comment_hunter_button_start_run")}
          </Button>
          {isRunning && (
            <Button
              variant="outline"
              block
              onClick={stop}
              icon={<Square size={13} />}>
              {t("comment_hunter_button_stop")}
            </Button>
          )}
        </div>
      </div>

      <RunConsole
        isRunning={isRunning}
        hasStarted={hasStarted}
        progress={progress}
        logs={logs}
        results={results}
      />
    </div>
  )
}
