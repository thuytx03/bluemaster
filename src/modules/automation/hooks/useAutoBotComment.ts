import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import {
  commentOnPost,
  fetchFreshGroupPosts,
  getAdsAccessTokenCached,
  reactPost,
  uploadCommentImage
} from "src/modules/automation/services/auto-bot-comment.service"
import type {
  BotCommentConfig,
  BotCommentLog,
  BotRunProgress,
  BotRunState
} from "src/modules/automation/types/auto-bot-comment.types"
import {
  nowTs,
  previewText
} from "src/modules/automation/utils/auto-bot-comment.util"
import { useFacebook } from "src/modules/facebook/hooks/useFacebookSession"
import { spinBraces } from "src/utils/spin-text.util"

type LogInput = Omit<BotCommentLog, "id" | "ts">

const EMPTY_PROGRESS: BotRunProgress = {
  current: 0,
  total: 0,
  success: 0,
  fail: 0
}
const EMPTY_FEED_PAUSE_MS = 3000

/** The bot runner: picks a group, a fresh post, a template and comments, forever until stopped. */
export function useAutoBotComment() {
  const { t } = useTranslation()
  const { profile } = useFacebook()

  const [runState, setRunState] = useState<BotRunState>("idle")
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<BotRunProgress>(EMPTY_PROGRESS)
  const [logs, setLogs] = useState<BotCommentLog[]>([])
  const [countdown, setCountdown] = useState<number | null>(null)
  const [statusMsg, setStatusMsg] = useState("")

  const pausedRef = useRef(false)
  const abortRef = useRef(false)
  /** Bumped on every run / reset so a stale loop never keeps running */
  const runIdRef = useRef(0)
  const logIdRef = useRef(0)

  useEffect(
    () => () => {
      abortRef.current = true
      runIdRef.current++
    },
    []
  )

  const addLog = useCallback((entry: LogInput): number => {
    const id = ++logIdRef.current
    setLogs((prev) => [...prev, { ...entry, id, ts: nowTs() }])
    return id
  }, [])

  const updateLog = useCallback((id: number, msg: string) => {
    setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, msg } : l)))
  }, [])

  const run = useCallback(
    async (config: BotCommentConfig) => {
      const myRun = ++runIdRef.current
      const aborted = () => abortRef.current || runIdRef.current !== myRun
      // Logs of a stale loop (after reset / a newer run) are dropped
      const log = (entry: LogInput): number =>
        runIdRef.current === myRun ? addLog(entry) : -1

      if (!profile?.uid || !profile?.fb_dtsg) {
        setError(t("auto_comment_error_not_logged_in"))
        setRunState("error")
        return
      }
      if (!config.groups.length) {
        setError(t("auto_comment_error_select_group"))
        setRunState("error")
        return
      }
      if (!config.templates.length) {
        setError(t("auto_comment_error_select_content"))
        setRunState("error")
        return
      }

      const accessToken = await getAdsAccessTokenCached()
      if (!accessToken) {
        setError(t("auto_comment_error_access_token"))
        setRunState("error")
        return
      }

      const sleepWithCountdown = async (
        ms: number,
        label: string,
        opts?: { isChild?: boolean; cycleIndex?: number }
      ): Promise<boolean> => {
        const totalSec = Math.ceil(ms / 1000)
        const logId = log({
          kind: "system",
          msg: t("auto_comment_log_countdown_remaining", {
            label,
            seconds: totalSec
          }),
          isChild: opts?.isChild,
          cycleIndex: opts?.cycleIndex
        })
        for (let s = totalSec; s >= 0; s--) {
          while (pausedRef.current && !aborted()) {
            setCountdown(null)
            updateLog(logId, t("auto_comment_log_countdown_paused", { label }))
            await new Promise((r) => setTimeout(r, 200))
          }
          if (aborted()) {
            setCountdown(null)
            updateLog(logId, t("auto_comment_log_countdown_stopped", { label }))
            return false
          }
          setCountdown(s)
          updateLog(
            logId,
            t("auto_comment_log_countdown_remaining", { label, seconds: s })
          )
          if (s === 0) break
          await new Promise((r) => setTimeout(r, 1000))
        }
        setCountdown(null)
        return true
      }

      /** Silent wait that honours pause / stop; false when stopped. */
      const pauseBriefly = async (ms: number): Promise<boolean> => {
        for (let waited = 0; waited < ms && !aborted(); waited += 200) {
          await new Promise((r) => setTimeout(r, 200))
        }
        return waitIfPaused()
      }

      const waitIfPaused = async (): Promise<boolean> => {
        while (pausedRef.current && !aborted()) {
          await new Promise((r) => setTimeout(r, 200))
        }
        return !aborted()
      }

      pausedRef.current = false
      abortRef.current = false
      setRunState("running")
      setError(null)
      setLogs([])
      setStatusMsg("")

      const identityLabel = config.identities.length
        ? config.identities.map((i) => i.name).join(", ")
        : t("auto_comment_default_identity_label")
      log({
        kind: "system",
        msg: t("auto_comment_log_runner_started", {
          groups: config.groups.length,
          templates: config.templates.length,
          delayMin: config.delayMin,
          delayMax: config.delayMax,
          identity: identityLabel
        }),
        isRoot: false
      })

      let cycleIndex = 0
      let groupPtr = 0
      let success = 0
      let fail = 0
      let consecutiveErrors = 0
      const processedKeys = new Set<string>()
      const failedGroups = new Set<string>()
      const emptyLabel = t("auto_comment_log_empty_placeholder")

      const shuffled = [...config.groups].sort(() => Math.random() - 0.5)
      setProgress({ current: 0, total: shuffled.length, success: 0, fail: 0 })

      const stopForErrors = () => {
        log({
          kind: "error",
          msg: t("auto_comment_log_stopped_consecutive_errors", {
            count: config.skipAfterErrors
          }),
          isRoot: false
        })
      }

      while (!aborted()) {
        if (!(await waitIfPaused())) break

        // "Skip failed groups": move past groups where commenting already failed
        if (config.skipFailedGroups && failedGroups.size > 0) {
          if (failedGroups.size >= shuffled.length) {
            log({
              kind: "error",
              msg: t("auto_comment_log_all_groups_failed"),
              isRoot: false
            })
            break
          }
          while (failedGroups.has(shuffled[groupPtr % shuffled.length].groupId))
            groupPtr++
        }
        const group = shuffled[groupPtr % shuffled.length]
        groupPtr++
        cycleIndex++
        const cycleN = cycleIndex
        const groupInfo = {
          groupName: group.groupName,
          groupId: group.groupId,
          cycleIndex: cycleN
        }

        log({
          kind: "info",
          msg: t("auto_comment_log_turn_group", {
            cycle: cycleN,
            groupName: group.groupName
          }),
          ...groupInfo,
          isRoot: true
        })
        setStatusMsg(
          t("auto_comment_status_fetching_posts", {
            cycle: cycleN,
            groupName: group.groupName
          })
        )

        const posts = await fetchFreshGroupPosts(group.groupId, processedKeys)
        if (aborted()) break

        if (!posts.length) {
          log({
            kind: "error",
            msg: t("auto_comment_log_no_posts"),
            ...groupInfo,
            isChild: true
          })
          consecutiveErrors++
          if (
            config.skipAfterErrors > 0 &&
            consecutiveErrors >= config.skipAfterErrors
          ) {
            stopForErrors()
            break
          }
          // Source looped straight to the next group: a short pause avoids hammering the feed API
          if (!(await pauseBriefly(EMPTY_FEED_PAUSE_MS))) break
          continue
        }

        log({
          kind: "info",
          msg: t("auto_comment_log_posts_fetched", { count: posts.length }),
          ...groupInfo,
          isChild: true
        })

        const post = posts[Math.floor(Math.random() * posts.length)]
        processedKeys.add(`${group.groupId}_${post.postId}`)
        const purl = `https://www.facebook.com/groups/${group.groupId}/posts/${post.postId}/`
        const msgPreview = post.message
          ? previewText(post.message, emptyLabel)
          : `(ID: ${post.postId})`

        log({
          kind: "info",
          msg: t("auto_comment_log_post_picked", {
            preview: msgPreview,
            postId: post.postId
          }),
          ...groupInfo,
          postId: post.postId,
          permalink: purl,
          isChild: true
        })
        setStatusMsg(
          t("auto_comment_status_commenting", {
            cycle: cycleN,
            postId: post.postId,
            groupName: group.groupName
          })
        )

        // Identities rotate per turn
        const identity = config.identities.length
          ? config.identities[cycleIndex % config.identities.length]
          : null
        const pageId = identity?.type === "page" ? identity.id : null
        log({
          kind: "info",
          msg: t("auto_comment_log_identity_used", {
            identity: identity
              ? identity.name
              : t("auto_comment_default_identity_short")
          }),
          isChild: true,
          cycleIndex: cycleN
        })

        // Random template per turn
        const tpl =
          config.templates[Math.floor(Math.random() * config.templates.length)]

        let photoId: string | null = null
        if (tpl.images.length > 0) {
          const picked =
            tpl.images[Math.floor(Math.random() * tpl.images.length)]
          photoId = await uploadCommentImage(picked, pageId)
          if (photoId) {
            log({
              kind: "info",
              msg: t("auto_comment_log_image_uploaded", { photoId }),
              isChild: true,
              cycleIndex: cycleN
            })
          }
        }

        const text = spinBraces(tpl.content)
        const commentPrev = previewText(text, emptyLabel, 40)
        let ok = false
        let commentErr = ""

        log({
          kind: "info",
          msg: photoId
            ? t("auto_comment_log_commenting_with_image", {
                preview: commentPrev
              })
            : t("auto_comment_log_commenting", { preview: commentPrev }),
          ...groupInfo,
          postId: post.postId,
          permalink: purl,
          commentPreview: commentPrev,
          isChild: true
        })

        try {
          await commentOnPost(post.postId, group.groupId, text, photoId, pageId)
          ok = true
        } catch (e) {
          commentErr =
            e instanceof Error ? e.message : t("auto_comment_error_unknown")
          if (photoId) {
            try {
              log({
                kind: "info",
                msg: t("auto_comment_log_retry_without_image"),
                isChild: true,
                cycleIndex: cycleN
              })
              await commentOnPost(
                post.postId,
                group.groupId,
                text,
                null,
                pageId
              )
              ok = true
              commentErr = ""
            } catch (e2) {
              commentErr = e2 instanceof Error ? e2.message : commentErr
            }
          }
        }

        if (ok && config.likePost) {
          try {
            await reactPost(post.postId, group.groupId)
            log({
              kind: "info",
              msg: t("auto_comment_log_post_liked"),
              isChild: true,
              cycleIndex: cycleN
            })
          } catch {
            /* non-fatal */
          }
        }

        const resultInfo = {
          ...groupInfo,
          postId: post.postId,
          permalink: purl,
          commentPreview: commentPrev,
          isChild: true
        }
        if (ok) {
          success++
          consecutiveErrors = 0
          log({
            kind: "success",
            msg: t("auto_comment_log_comment_success", {
              preview: msgPreview,
              groupName: group.groupName
            }),
            ...resultInfo
          })
        } else {
          fail++
          consecutiveErrors++
          if (config.skipFailedGroups) failedGroups.add(group.groupId)
          log({
            kind: "fail",
            msg: t("auto_comment_log_comment_failed", {
              preview: msgPreview,
              error: commentErr || t("auto_comment_error_unknown")
            }),
            ...resultInfo
          })
        }

        setProgress({
          current: cycleIndex,
          total: shuffled.length,
          success,
          fail
        })

        if (
          config.skipAfterErrors > 0 &&
          consecutiveErrors >= config.skipAfterErrors
        ) {
          stopForErrors()
          break
        }

        // Delay / batch rest
        if (config.batchCount > 0 && cycleIndex % config.batchCount === 0) {
          const restMs = config.batchRestMinutes * 60 * 1000
          setStatusMsg(
            t("auto_comment_status_resting", {
              minutes: config.batchRestMinutes
            })
          )
          const cont = await sleepWithCountdown(
            restMs,
            t("auto_comment_countdown_batch_rest_label", {
              minutes: config.batchRestMinutes,
              count: cycleIndex
            })
          )
          if (!cont) break
        } else {
          const lo = Math.max(5, config.delayMin)
          const hi = Math.max(lo, config.delayMax)
          const delaySec = lo + Math.floor(Math.random() * (hi - lo + 1))
          setStatusMsg(t("auto_comment_status_waiting", { seconds: delaySec }))
          const cont = await sleepWithCountdown(
            delaySec * 1000,
            t("auto_comment_countdown_next_turn_label"),
            { isChild: true, cycleIndex: cycleN }
          )
          if (!cont) break
        }

        if (cycleIndex % shuffled.length === 0) {
          processedKeys.clear()
          log({
            kind: "system",
            msg: t("auto_comment_log_round_completed", {
              count: shuffled.length
            }),
            isRoot: false
          })
        }
      }

      // A newer run / reset owns the state now
      if (runIdRef.current !== myRun) return
      const reason = abortRef.current
        ? t("auto_comment_log_reason_stopped")
        : t("auto_comment_log_reason_completed")
      log({
        kind: "system",
        msg: t("auto_comment_log_runner_finished", { reason, success, fail }),
        isRoot: false
      })
      setRunState(abortRef.current ? "idle" : "done")
      setStatusMsg("")
      setCountdown(null)
    },
    [profile, t, addLog, updateLog]
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
    abortRef.current = true
    pausedRef.current = false
    setRunState("idle")
    setCountdown(null)
    setStatusMsg("")
  }, [])
  const reset = useCallback(() => {
    runIdRef.current++
    abortRef.current = false
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
    run,
    pause,
    resume,
    stop,
    reset
  }
}
