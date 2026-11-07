import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import {
  buildSearchFilters,
  commentHuntPost,
  reactHuntPost,
  searchHuntPosts,
  uploadCommentImage
} from "src/modules/automation/services/comment-hunter.service"
import type {
  CkCategoryFilter,
  CkImage,
  CkLogEntry,
  CkPost,
  CkProgress,
  CkResult,
  CkRunOptions,
  CkSearchOptions,
  CkState
} from "src/modules/automation/types/comment-hunter.types"
import {
  dedupePostsForRun,
  filterPostsByCategory,
  parseCommentLines,
  pickRandom,
  postLink,
  randomDelayMs
} from "src/modules/automation/utils/comment-hunter.util"

const EMPTY_PROGRESS: CkProgress = { done: 0, fail: 0, total: 0, current: 0 }

/** Port of xthuy-social `comment-hunter/use-comment-hunter.ts`. */
export const useCommentHunter = () => {
  const { t } = useTranslation()

  const [state, setState] = useState<CkState>("idle")
  const [searchStatus, setSearchStatus] = useState("")
  const [posts, setPosts] = useState<CkPost[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [categoryFilter, setCategoryFilter] = useState<CkCategoryFilter>("all")
  const [logs, setLogs] = useState<CkLogEntry[]>([])
  const [results, setResults] = useState<CkResult[]>([])
  const [progress, setProgress] = useState<CkProgress>(EMPTY_PROGRESS)
  const [images, setImages] = useState<CkImage[]>([])

  const abortRef = useRef(false)
  const unmountedRef = useRef(false)
  const logIdRef = useRef(0)

  // Leaving the page stops a running job (there would be no stop button left).
  useEffect(() => {
    unmountedRef.current = false
    return () => {
      unmountedRef.current = true
      abortRef.current = true
    }
  }, [])

  const errMsg = useCallback(
    (e: unknown) =>
      e instanceof Error ? e.message : t("comment_hunter_generic_error"),
    [t]
  )

  const addLog = useCallback(
    (
      text: string,
      type: CkLogEntry["type"] = "info",
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

  const searchPosts = useCallback(
    async ({ keyword, limit, recentPosts, authorFilter }: CkSearchOptions) => {
      if (!keyword.trim()) return
      setState("searching")
      setSearchStatus(t("comment_hunter_status_searching", { keyword }))
      setPosts([])
      setSelected(new Set())
      setCategoryFilter("all")

      let found: CkPost[]
      try {
        found = await searchHuntPosts(
          keyword,
          limit,
          buildSearchFilters(recentPosts, authorFilter),
          (n) =>
            setSearchStatus(
              t("comment_hunter_status_found_progress", { found: n, limit })
            ),
          () => unmountedRef.current
        )
      } catch (e) {
        setSearchStatus(
          t("comment_hunter_status_search_error", {
            message: e instanceof Error ? e.message : "Unknown error"
          })
        )
        setState("idle")
        return
      }

      setPosts(found)
      setSearchStatus(
        found.length
          ? t("comment_hunter_status_found_total", { count: found.length })
          : t("comment_hunter_status_not_found")
      )
      setState("idle")
    },
    [t]
  )

  const toggleSelect = useCallback((idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }, [])

  const selectAll = useCallback(
    (allPosts: CkPost[], filter: CkCategoryFilter, checked: boolean) => {
      setSelected((prev) => {
        const next = new Set(prev)
        filterPostsByCategory(allPosts, filter).forEach(({ i }) =>
          checked ? next.add(i) : next.delete(i)
        )
        return next
      })
    },
    []
  )

  const delayWithCountdown = useCallback(
    async (delayMs: number) => {
      if (delayMs < 2000) {
        await new Promise<void>((r) => setTimeout(r, delayMs))
        return
      }
      let remaining = Math.ceil(delayMs / 1000)
      const rowId = addLog(
        t("comment_hunter_log_countdown", { seconds: remaining }),
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
              t("comment_hunter_log_countdown", { seconds: remaining })
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

  const run = useCallback(
    async ({
      commentText,
      posts: selectedPosts,
      images: imgs,
      doReact,
      delayMin,
      delayMax
    }: CkRunOptions) => {
      if (!commentText.trim() || !selectedPosts.length) return

      const { posts: postsToRun, skipped } = dedupePostsForRun(selectedPosts)

      const total = postsToRun.length
      setState("running")
      abortRef.current = false
      setLogs([])
      setResults([])
      setProgress({ done: 0, fail: 0, total, current: 0 })

      if (skipped > 0) {
        addLog(t("comment_hunter_log_dedupe_warn", { skipped, total }), "warn")
      }

      const lineItems = parseCommentLines(commentText)

      let doneCount = 0
      let failCount = 0

      for (let i = 0; i < postsToRun.length; i++) {
        if (abortRef.current) {
          addLog(t("comment_hunter_log_stopped_by_user"), "error")
          break
        }

        const p = postsToRun[i]
        const index = i + 1
        setProgress({ done: doneCount, fail: failCount, total, current: index })

        let photoId: string | null = null
        if (imgs.length) {
          const chosen = pickRandom(imgs)
          addLog(
            t("comment_hunter_log_uploading_image", {
              index,
              total,
              postId: p.postId
            })
          )
          try {
            photoId = await uploadCommentImage(chosen)
            if (photoId)
              addLog(
                t("comment_hunter_log_upload_success", { id: photoId }),
                "success"
              )
            else addLog(t("comment_hunter_log_upload_no_id"), "warn")
          } catch (e) {
            addLog(
              t("comment_hunter_log_upload_failed", { message: errMsg(e) }),
              "warn"
            )
          }
        }

        const text =
          lineItems.length > 1
            ? pickRandom(lineItems)
            : lineItems[0] ?? commentText.trim()

        if (doReact) {
          addLog(
            t("comment_hunter_log_reacting", { index, total, postId: p.postId })
          )
          try {
            await reactHuntPost(p)
            addLog(
              t("comment_hunter_log_react_success", { index, total }),
              "success"
            )
          } catch (e) {
            addLog(
              t("comment_hunter_log_react_failed", {
                index,
                total,
                message: errMsg(e)
              }),
              "warn"
            )
          }
        }

        try {
          addLog(
            t("comment_hunter_log_sending_comment", {
              index,
              total,
              preview: text.substring(0, 40) + (text.length > 40 ? "..." : "")
            })
          )
          await commentHuntPost(p, text, photoId)
          doneCount++
          const linkUrl = postLink(p)
          const order = doneCount
          addLog(
            t("comment_hunter_log_comment_success", { index, total }),
            "success",
            linkUrl
          )
          setResults((prev) => [
            ...prev,
            {
              order,
              postId: p.postId,
              linkUrl,
              commentText: text,
              time: Date.now() / 1000
            }
          ])
        } catch (e) {
          failCount++
          addLog(
            t("comment_hunter_log_comment_failed", {
              index,
              total,
              message: errMsg(e)
            }),
            "error",
            p.postUrl
          )
        }

        setProgress({ done: doneCount, fail: failCount, total, current: index })

        if (i < postsToRun.length - 1 && !abortRef.current) {
          await delayWithCountdown(randomDelayMs(delayMin, delayMax))
        }
      }

      addLog(
        t("comment_hunter_log_finished", { done: doneCount, total }),
        doneCount === total ? "success" : "info"
      )
      setProgress({ done: doneCount, fail: failCount, total, current: total })
      setState("done")
    },
    [addLog, delayWithCountdown, errMsg, t]
  )

  const stop = useCallback(() => {
    abortRef.current = true
  }, [])

  const reset = useCallback(() => {
    setState("idle")
    setSearchStatus("")
    setPosts([])
    setSelected(new Set())
    setCategoryFilter("all")
    setLogs([])
    setResults([])
    setProgress(EMPTY_PROGRESS)
    setImages([])
    abortRef.current = false
  }, [])

  return {
    state,
    searchStatus,
    posts,
    selected,
    categoryFilter,
    setCategoryFilter,
    logs,
    results,
    progress,
    images,
    setImages,
    searchPosts,
    toggleSelect,
    selectAll,
    run,
    stop,
    reset
  }
}

export type CommentHunter = ReturnType<typeof useCommentHunter>
