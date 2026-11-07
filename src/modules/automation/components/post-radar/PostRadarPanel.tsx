import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import PostRadarLeech from "src/modules/automation/components/post-radar/PostRadarLeech"
import PostRadarRunning from "src/modules/automation/components/post-radar/PostRadarRunning"
import PostRadarScanner from "src/modules/automation/components/post-radar/PostRadarScanner"
import { usePostRadar } from "src/modules/automation/hooks/usePostRadar"
import type {
  RadarPost,
  RadarRunOptions,
  RadarTargetGroup
} from "src/modules/automation/types/post-radar.types"

/** Post Radar: scan → configure → run (source `post-radar/Panel.tsx`). */
export default function PostRadarPanel() {
  const { t } = useTranslation()
  const scanner = usePostRadar()
  const { selected, state, run } = scanner

  const [view, setView] = useState<"scanner" | "leech" | "running">("scanner")

  const handleLeech = () => {
    if (!selected.size) {
      toast.error(t("post_radar_toast_no_post_selected"))
      return
    }
    setView("leech")
  }

  const handleStartRun = useCallback(
    (
      selectedPosts: RadarPost[],
      targetGroups: RadarTargetGroup[],
      options: RadarRunOptions
    ) => {
      setView("running")
      void run(selectedPosts, targetGroups, options)
    },
    [run]
  )

  return (
    <div className="bm-flex bm-flex-col bm-gap-3">
      {view === "scanner" && (
        <PostRadarScanner scanner={scanner} onLeech={handleLeech} />
      )}
      {view === "leech" && (
        <PostRadarLeech
          scanner={scanner}
          onBack={() => setView("scanner")}
          onStartRun={handleStartRun}
        />
      )}
      {view === "running" && (
        <PostRadarRunning
          scanner={scanner}
          onBack={() => {
            if (state === "running") {
              toast.error(t("post_radar_toast_stop_first"))
              return
            }
            setView("leech")
          }}
        />
      )}
    </div>
  )
}
