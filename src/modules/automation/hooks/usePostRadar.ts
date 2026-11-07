import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import {
  parseSourceFromInput,
  publishRadarPost,
  scanSourcePosts
} from "src/modules/automation/services/post-radar.service"
import type {
  RadarLogEntry,
  RadarPost,
  RadarProgress,
  RadarResult,
  RadarRunOptions,
  RadarState,
  RadarTargetGroup,
  RadarTypeFilter
} from "src/modules/automation/types/post-radar.types"

const EMPTY_PROGRESS: RadarProgress = { done: 0, fail: 0, total: 0, current: 0 }

/** Rows of `allPosts` matching `filter`, keeping their index in `allPosts`. */
export function filterRadarPosts(
  allPosts: RadarPost[],
  filter: RadarTypeFilter
) {
  return allPosts
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => filter === "all" || p.postType === filter)
}

export function radarStats(allPosts: RadarPost[]) {
  const totalLike = allPosts.reduce((s, p) => s + p.likeCount, 0)
  const totalComment = allPosts.reduce((s, p) => s + p.commentCount, 0)
  const totalShare = allPosts.reduce((s, p) => s + p.shareCount, 0)
  return { totalLike, totalComment, totalShare }
}

/**
 * State of the Post Radar tool: scanned posts, selection, and the
 * share / clone run with its log, results and progress.
 */
export const usePostRadar = () => {
  const { t } = useTranslation()
  const [state, setState] = useState<RadarState>("idle")
  const [scanStatus, setScanStatus] = useState("")
  const [posts, setPosts] = useState<RadarPost[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [typeFilter, setTypeFilter] = useState<RadarTypeFilter>("all")
  const [logs, setLogs] = useState<RadarLogEntry[]>([])
  const [results, setResults] = useState<RadarResult[]>([])
  const [progress, setProgress] = useState<RadarProgress>(EMPTY_PROGRESS)

  const abortRef = useRef(false)
  const logIdRef = useRef(0)

  // Leaving the tool stops a running job instead of posting in the background
  useEffect(
    () => () => {
      abortRef.current = true
    },
    []
  )

  // ─── log helpers ──────────────────────────────────────────────────────────

  const addLog = useCallback(
    (
      text: string,
      type: RadarLogEntry["type"] = "info",
      linkUrl?: string
    ): number => {
      const id = ++logIdRef.current
      setLogs((prev) => [...prev, { id, text, type, linkUrl }])
      return id
    },
    []
  )

  const updateLog = useCallback((id: number, text: string) => {
    setLogs((prev) => prev.map((e) => (e.id === id ? { ...e, text } : e)))
  }, [])

  const removeLog = useCallback((id: number) => {
    setLogs((prev) => prev.filter((e) => e.id !== id))
  }, [])

  // ─── scan ─────────────────────────────────────────────────────────────────

  const scan = useCallback(
    async (sourceInput: string, limit: number) => {
      const source = parseSourceFromInput(sourceInput)
      if (!source.id) return

      setState("scanning")
      setScanStatus("")
      setPosts([])
      setSelected(new Set())
      setTypeFilter("all")

      try {
        const mapped = await scanSourcePosts(source, limit)
        setPosts(mapped)
        setScanStatus(
          mapped.length
            ? t("post_radar_scan_found", { count: mapped.length })
            : t("post_radar_scan_not_found")
        )
      } catch (e) {
        setScanStatus(
          t("post_radar_scan_error", {
            message: e instanceof Error ? e.message : "Unknown error"
          })
        )
      } finally {
        setState("idle")
      }
    },
    [t]
  )

  // ─── selection ────────────────────────────────────────────────────────────

  const toggleSelect = useCallback((idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }, [])

  const selectAll = useCallback(
    (allPosts: RadarPost[], filter: RadarTypeFilter, checked: boolean) => {
      setSelected((prev) => {
        const next = new Set(prev)
        const rows = filterRadarPosts(allPosts, filter).map(({ i }) => i)
        if (checked) rows.forEach((i) => next.add(i))
        else rows.forEach((i) => next.delete(i))
        return next
      })
    },
    []
  )

  const clearSelection = useCallback(() => setSelected(new Set()), [])

  // ─── delay with countdown ─────────────────────────────────────────────────

  const delayWithCountdown = useCallback(
    async (delayMs: number) => {
      if (delayMs < 2000) {
        await new Promise<void>((r) => setTimeout(r, delayMs))
        return
      }
      let remaining = Math.ceil(delayMs / 1000)
      const rowId = addLog(
        t("post_radar_log_countdown", { seconds: remaining }),
        "countdown"
      )

      await new Promise<void>((resolve) => {
        let done = false
        const finish = () => {
          if (done) return
          done = true
          clearInterval(tickId)
          clearInterval(abortCheck)
          clearTimeout(mainId)
          removeLog(rowId)
          resolve()
        }
        const tickId = setInterval(() => {
          remaining--
          if (remaining >= 0)
            updateLog(
              rowId,
              t("post_radar_log_countdown", { seconds: remaining })
            )
          if (remaining <= 0) finish()
        }, 1000)
        const mainId = setTimeout(finish, delayMs)
        const abortCheck = setInterval(() => {
          if (abortRef.current) finish()
        }, 400)
      })
    },
    [addLog, updateLog, removeLog, t]
  )

  // ─── run (share / clone to groups) ────────────────────────────────────────

  const run = useCallback(
    async (
      selectedPosts: RadarPost[],
      targetGroups: RadarTargetGroup[],
      {
        delayMin,
        delayMax,
        isAnonymous,
        postMode,
        cloneCaption
      }: RadarRunOptions
    ) => {
      if (!selectedPosts.length || !targetGroups.length) return

      const total = selectedPosts.length * targetGroups.length
      setState("running")
      abortRef.current = false
      setLogs([])
      setResults([])
      setProgress({ done: 0, fail: 0, total, current: 0 })

      addLog(
        t("post_radar_log_start", {
          posts: selectedPosts.length,
          groups: targetGroups.length,
          min: delayMin,
          max: delayMax
        }),
        "info"
      )

      const anonCache: Record<string, string | null> = {}
      let doneCount = 0
      let failCount = 0
      let current = 0

      for (const post of selectedPosts) {
        for (const group of targetGroups) {
          if (abortRef.current) {
            addLog(t("post_radar_log_stopped_by_user"), "error")
            setProgress({ done: doneCount, fail: failCount, total, current })
            setState("done")
            return
          }

          current++
          const order = current
          setProgress({ done: doneCount, fail: failCount, total, current })
          addLog(
            t("post_radar_log_posting", {
              postId: post.postId,
              groupName: group.groupName
            }),
            "info"
          )

          try {
            const res = await publishRadarPost({
              post,
              group,
              postMode,
              cloneCaption,
              isAnonymous,
              anonCache
            })
            const note =
              res.reason === "no_anonymous_support"
                ? t("post_radar_note_no_anonymous_support")
                : res.note
            if (res.success) {
              doneCount++
              addLog(
                t("post_radar_log_success", {
                  id: res.postUrl.match(/permalink\/(\d+)/)?.[1] || res.postUrl
                }),
                "success",
                res.postUrl
              )
              setResults((prev) => [
                ...prev,
                {
                  order,
                  postId: post.postId,
                  postUrl: res.postUrl,
                  groupName: group.groupName,
                  status: "ok",
                  note
                }
              ])
            } else {
              failCount++
              addLog(
                t("post_radar_log_failed", {
                  reason: note || t("post_radar_log_unknown_error")
                }),
                "error"
              )
              setResults((prev) => [
                ...prev,
                {
                  order,
                  postId: post.postId,
                  postUrl: post.permalink,
                  groupName: group.groupName,
                  status: "fail",
                  note
                }
              ])
            }
          } catch (e) {
            failCount++
            addLog(
              t("post_radar_log_error", {
                message:
                  e instanceof Error
                    ? e.message
                    : t("post_radar_log_unidentified_error")
              }),
              "error"
            )
            setResults((prev) => [
              ...prev,
              {
                order,
                postId: post.postId,
                postUrl: post.permalink,
                groupName: group.groupName,
                status: "fail",
                note: e instanceof Error ? e.message : undefined
              }
            ])
          }

          setProgress({ done: doneCount, fail: failCount, total, current })

          if (current < total && !abortRef.current) {
            const lo = Math.min(delayMin, delayMax)
            const hi = Math.max(delayMin, delayMax)
            const delayMs = (lo + Math.random() * (hi - lo)) * 1000
            await delayWithCountdown(delayMs)
          }
        }
      }

      addLog(
        t("post_radar_log_complete", { done: doneCount, total }),
        doneCount === total ? "success" : "info"
      )
      setProgress({ done: doneCount, fail: failCount, total, current: total })
      setState("done")
    },
    [addLog, delayWithCountdown, t]
  )

  const stop = useCallback(() => {
    abortRef.current = true
  }, [])

  const reset = useCallback(() => {
    setState("idle")
    setScanStatus("")
    setPosts([])
    setSelected(new Set())
    setTypeFilter("all")
    setLogs([])
    setResults([])
    setProgress(EMPTY_PROGRESS)
    abortRef.current = false
  }, [])

  /** Appends imported posts, skipping ids already in the list. */
  const loadPosts = useCallback((newPosts: RadarPost[]) => {
    setPosts((prev) => {
      const seenIds = new Set(prev.map((p) => p.postId))
      const fresh = newPosts.filter((p) => !seenIds.has(p.postId))
      return [...prev, ...fresh]
    })
    setScanStatus("")
    setState("idle")
  }, [])

  return {
    state,
    scanStatus,
    posts,
    selected,
    typeFilter,
    setTypeFilter,
    logs,
    results,
    progress,
    scan,
    loadPosts,
    toggleSelect,
    selectAll,
    clearSelection,
    run,
    stop,
    reset
  }
}

export type PostRadarController = ReturnType<typeof usePostRadar>
