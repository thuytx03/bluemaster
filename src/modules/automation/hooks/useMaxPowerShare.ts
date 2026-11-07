import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import {
  previewLink,
  shareToGroup,
  shareToTimeline
} from "src/modules/automation/services/max-power-share.service"
import type {
  MaxPowerShareConfig,
  MaxPowerShareProgress,
  MaxPowerShareRunState,
  ShareLog
} from "src/modules/automation/types/max-power-share.types"
import {
  nowTs,
  randInt
} from "src/modules/automation/utils/max-power-share.util"
import { useFacebook } from "src/modules/facebook/hooks/useFacebookSession"
import { spinBare } from "src/utils/spin-text.util"

const EMPTY_PROGRESS: MaxPowerShareProgress = {
  current: 0,
  total: 0,
  success: 0,
  fail: 0
}
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Run controller of one share job; a new run gets a new token so a stopped loop can never resume. */
interface RunToken {
  aborted: boolean
}

export function useMaxPowerShare() {
  const { t } = useTranslation()
  const { profile } = useFacebook()

  const [runState, setRunState] = useState<MaxPowerShareRunState>("idle")
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] =
    useState<MaxPowerShareProgress>(EMPTY_PROGRESS)
  const [logs, setLogs] = useState<ShareLog[]>([])
  const [countdown, setCountdown] = useState<number | null>(null)
  const [statusMsg, setStatusMsg] = useState("")

  const pausedRef = useRef(false)
  const runRef = useRef<RunToken>({ aborted: true })

  // Leaving the page stops the job
  useEffect(() => () => void (runRef.current.aborted = true), [])

  const fetchPreview = useCallback((url: string) => previewLink(url), [])

  const run = useCallback(
    async (config: MaxPowerShareConfig) => {
      if (!config.shareUrl.trim()) {
        setError(t("max_power_share_error_enter_link"))
        setRunState("error")
        return
      }
      if (!config.groups.length && !config.shareToTimelines.length) {
        setError(t("max_power_share_error_add_group"))
        setRunState("error")
        return
      }
      if (!profile?.fb_dtsg) {
        setError(t("max_power_share_error_not_logged_in"))
        setRunState("error")
        return
      }

      runRef.current.aborted = true
      const token: RunToken = { aborted: false }
      runRef.current = token
      pausedRef.current = false

      const waitIfPaused = async () => {
        while (pausedRef.current && !token.aborted) await wait(200)
        return !token.aborted
      }

      const sleepWithCountdown = async (ms: number, label?: string) => {
        const totalSec = Math.ceil(ms / 1000)
        for (let s = totalSec; s >= 0; s--) {
          while (pausedRef.current && !token.aborted) {
            setCountdown(null)
            await wait(200)
          }
          if (token.aborted) {
            setCountdown(null)
            return false
          }
          setCountdown(s)
          if (label)
            setStatusMsg(
              t("max_power_share_status_label_countdown", { label, seconds: s })
            )
          if (s === 0) break
          await wait(1000)
        }
        setCountdown(null)
        return true
      }

      const spacingDelay = () => {
        const lo = Math.max(1, config.delayMin)
        const hi = Math.max(lo, config.delayMax)
        return sleepWithCountdown(
          randInt(lo, hi) * 1000,
          t("max_power_share_label_spacing_delay")
        )
      }

      let groupsSinceRest = 0
      setRunState("running")
      setError(null)
      setLogs([])
      const totalTasks = config.groups.length + config.shareToTimelines.length
      setProgress({ current: 0, total: totalTasks, success: 0, fail: 0 })
      setStatusMsg(t("max_power_share_status_loading_preview"))

      // One preview for the whole run: its scrape data is reused for every share
      const previewResult = await previewLink(config.shareUrl)
      const scrapeData = previewResult?.shareScrapeData ?? null

      let success = 0
      let fail = 0

      for (let i = 0; i < config.groups.length; i++) {
        if (!(await waitIfPaused())) break

        const group = config.groups[i]
        const ts = nowTs()
        setStatusMsg(
          t("max_power_share_status_turn_group", {
            current: i + 1,
            total: config.groups.length,
            group: group.groupName || group.groupId
          })
        )

        const result = await shareToGroup(
          group.groupId,
          spinBare(config.content),
          config.shareUrl,
          scrapeData,
          group.identityType === "page" ? group.identityUid : null
        )
        if (token.aborted) break
        if (result.ok) success++
        else fail++

        setLogs((prev) => [
          ...prev,
          {
            groupId: group.groupId,
            groupName: group.groupName,
            identityName: group.identityName ?? "",
            ok: result.ok,
            msg: result.ok
              ? t("max_power_share_log_share_success")
              : result.error ?? t("max_power_share_log_share_failed"),
            postUrl: result.postUrl,
            ts
          }
        ])
        setProgress({ current: i + 1, total: totalTasks, success, fail })

        if (result.ok) groupsSinceRest++

        // Periodic rest
        if (
          config.restAfterGroups > 0 &&
          config.restMinutes > 0 &&
          groupsSinceRest >= config.restAfterGroups &&
          i < config.groups.length - 1
        ) {
          groupsSinceRest = 0
          setStatusMsg(
            t("max_power_share_status_resting", { minutes: config.restMinutes })
          )
          const cont = await sleepWithCountdown(
            config.restMinutes * 60 * 1000,
            t("max_power_share_label_rest_session")
          )
          if (!cont) break
        }

        // Delay before the next group (or before the timeline shares)
        const hasMoreAfterGroup =
          i < config.groups.length - 1 || config.shareToTimelines.length > 0
        if (hasMoreAfterGroup && !token.aborted && !(await spacingDelay()))
          break
      }

      // Timeline shares for every identity with "share to timeline" enabled
      for (let i = 0; i < config.shareToTimelines.length; i++) {
        if (!(await waitIfPaused())) break

        const timeline = config.shareToTimelines[i]
        const ts = nowTs()
        const taskIdx = config.groups.length + i
        setStatusMsg(
          t("max_power_share_status_sharing_timeline", {
            current: i + 1,
            total: config.shareToTimelines.length,
            uid: timeline.name || timeline.uid
          })
        )

        const result = await shareToTimeline(
          spinBare(config.content),
          config.shareUrl,
          scrapeData,
          timeline.type === "page" ? timeline.uid : null
        )
        if (token.aborted) break
        if (result.ok) success++
        else fail++

        setLogs((prev) => [
          ...prev,
          {
            groupId: timeline.uid,
            groupName: t("max_power_share_label_personal_timeline"),
            identityName: timeline.name || timeline.uid,
            ok: result.ok,
            msg: result.ok
              ? t("max_power_share_log_timeline_share_success")
              : result.error ?? t("max_power_share_log_share_failed"),
            postUrl: result.postUrl,
            ts
          }
        ])
        setProgress({ current: taskIdx + 1, total: totalTasks, success, fail })

        if (
          taskIdx + 1 < totalTasks &&
          !token.aborted &&
          !(await spacingDelay())
        )
          break
      }

      if (runRef.current !== token) return
      setStatusMsg("")
      setCountdown(null)
      setRunState(token.aborted ? "idle" : "done")
    },
    [profile, t]
  )

  const pause = useCallback(() => {
    pausedRef.current = true
    setRunState("paused")
  }, [])

  const resume = useCallback(() => {
    pausedRef.current = false
    setRunState("running")
  }, [])

  const stop = useCallback(() => {
    runRef.current.aborted = true
    pausedRef.current = false
    setRunState("idle")
    setCountdown(null)
    setStatusMsg("")
  }, [])

  const reset = useCallback(() => {
    runRef.current.aborted = true
    pausedRef.current = false
    setRunState("idle")
    setError(null)
    setLogs([])
    setProgress(EMPTY_PROGRESS)
    setCountdown(null)
    setStatusMsg("")
  }, [])

  return {
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
  }
}
