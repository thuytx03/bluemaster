import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import postCampaignService from "src/modules/automation/services/post-campaign.service"
import type {
  LogEntry,
  MediaFile,
  PostCampaignProgress,
  PostCampaignRunState,
  PostConfig,
  PostGroup
} from "src/modules/automation/types/post-campaign.types"
import {
  extractPostIds,
  friendlyError,
  nowTs,
  processContent,
  randInt,
  shuffle
} from "src/modules/automation/utils/post-campaign.util"
import { useFacebook } from "src/modules/facebook/hooks/useFacebookSession"
import {
  commentOnPost as fbCommentOnPost,
  postShareLinkToGroup as fbPostShareLinkToGroup,
  postToGroup as fbPostToGroup,
  reactPost as fbReactPost,
  uploadImages as fbUploadImages,
  uploadVideo as fbUploadVideo,
  getGroupAnonProfileId
} from "src/modules/facebook/services/fb-post.service"
import { spinBare } from "src/utils/spin-text.util"

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Runs a post campaign: posts to each group in turn with delays, rests, pause / resume / stop and a live log. */
export function usePostCampaign() {
  const { profile } = useFacebook()
  const { t } = useTranslation()

  const [runState, setRunState] = useState<PostCampaignRunState>("idle")
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<PostCampaignProgress>({
    current: 0,
    total: 0,
    success: 0,
    fail: 0
  })
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [countdown, setCountdown] = useState<number | null>(null)
  const [statusMsg, setStatusMsg] = useState("")

  const pausedRef = useRef(false)
  const abortRef = useRef(false)
  const groupsSinceRest = useRef(0)
  const consecutiveErrors = useRef(0)

  // Leaving the tool stops the campaign instead of posting on in the background
  useEffect(
    () => () => {
      abortRef.current = true
    },
    []
  )

  const addLog = (entry: LogEntry) =>
    setLogs((prev) => {
      const next = [...prev, entry]
      return next.length > 1000 ? next.slice(-1000) : next
    })

  async function sleepWithCountdown(
    ms: number,
    label?: string
  ): Promise<boolean> {
    const totalSec = Math.ceil(ms / 1000)
    for (let s = totalSec; s >= 0; s--) {
      while (pausedRef.current && !abortRef.current) {
        setCountdown(null)
        await sleep(200)
      }
      if (abortRef.current) {
        setCountdown(null)
        return false
      }
      setCountdown(s)
      if (label && s > 0)
        setStatusMsg(
          t("campaign_manager_runner_countdown_remaining", {
            label,
            seconds: s
          })
        )
      if (s === 0) break
      await sleep(1000)
    }
    setCountdown(null)
    return true
  }

  async function waitIfPaused(): Promise<boolean> {
    while (pausedRef.current && !abortRef.current) await sleep(200)
    return !abortRef.current
  }

  async function doUploadImages(files: MediaFile[]): Promise<string[]> {
    if (!files.length) return []
    try {
      return await fbUploadImages(files)
    } catch {
      return []
    }
  }

  async function doPostToGroup(
    group: PostGroup,
    content: string,
    photoIds: string[],
    videoId: string | null,
    textFormatPresetId?: string | null,
    feeling?: { objectId: string; verbId: string } | null,
    checkinPlaceId?: string | null,
    anonymousActorId?: string | null,
    shareLinkUrl?: string | null
  ): Promise<{ ok: boolean; postUrl: string; error?: string }> {
    try {
      // Link share uses its own mutation
      if (shareLinkUrl && !photoIds.length && !videoId) {
        const result = await fbPostShareLinkToGroup({
          groupId: group.groupId,
          content,
          shareLinkUrl,
          anonymousActorId: anonymousActorId ?? null
        })
        return {
          ok: result.success,
          postUrl: result.postUrl,
          error: result.note
        }
      }
      const result = await fbPostToGroup({
        groupId: group.groupId,
        content,
        photoIds,
        videoId,
        textFormatPresetId: textFormatPresetId ?? null,
        feeling: feeling ?? null,
        checkinPlaceId: checkinPlaceId ?? null,
        anonymousActorId: anonymousActorId ?? null
      })
      return { ok: result.success, postUrl: result.postUrl, error: result.note }
    } catch (e) {
      return {
        ok: false,
        postUrl: "",
        error: String((e as Error)?.message ?? e)
      }
    }
  }

  const post = useCallback(
    async (config: PostConfig) => {
      if (!config.groups.length) {
        setError(t("campaign_manager_runner_error_no_group_selected"))
        setRunState("error")
        return
      }
      const validPosts = config.posts.filter((p) => p.content.trim())
      if (!validPosts.length) {
        setError(t("campaign_manager_runner_error_no_content"))
        setRunState("error")
        return
      }
      if (!profile?.fb_dtsg) {
        setError(t("campaign_manager_runner_error_not_logged_in"))
        setRunState("error")
        return
      }

      pausedRef.current = false
      abortRef.current = false
      groupsSinceRest.current = 0
      consecutiveErrors.current = 0
      setRunState("running")
      setError(null)
      setLogs([])

      const systemName = t("campaign_manager_runner_system_name")
      addLog({
        name: systemName,
        kind: "system",
        icon: "▶",
        msg: t("campaign_manager_runner_log_start"),
        ts: nowTs()
      })

      let success = 0
      let fail = 0

      const ordered =
        config.groupOrder === "random" ? shuffle(config.groups) : config.groups
      const groups =
        config.maxGroups > 0 ? ordered.slice(0, config.maxGroups) : ordered
      setProgress({ current: 0, total: groups.length, success: 0, fail: 0 })

      // Shuffle queue: each round uses every post once in random order, so posts are spread evenly
      let queue = shuffle(validPosts)

      for (let i = 0; i < groups.length; i++) {
        if (!(await waitIfPaused())) break
        if (abortRef.current) break

        const group = groups[i]
        if (queue.length === 0) queue = shuffle(validPosts)
        const slot = queue.shift()!
        const ts = nowTs()

        setStatusMsg(
          t("campaign_manager_runner_status_posting_to_group", {
            groupName: group.groupName,
            current: i + 1,
            total: groups.length
          })
        )

        // Status background (random when several are selected)
        const statusBgIds = slot.statusBgIds ?? []
        const isStatusPost = statusBgIds.length > 0
        const textFormatPresetId = isStatusPost
          ? statusBgIds[Math.floor(Math.random() * statusBgIds.length)]
          : null

        // Upload images / video
        let photoIds: string[] = []
        let videoId: string | null = null

        let imagesToUpload = slot.images
        if (imagesToUpload.length > 1 && config.randomPickOneImage) {
          imagesToUpload = [
            imagesToUpload[Math.floor(Math.random() * imagesToUpload.length)]
          ]
        }

        if (imagesToUpload.length) {
          addLog({
            name: group.groupName,
            kind: "posting",
            icon: "⏳",
            msg: t("campaign_manager_runner_log_uploading_image_progress", {
              total: imagesToUpload.length
            }),
            ts
          })
          photoIds = await doUploadImages(imagesToUpload)
          if (photoIds.length) {
            addLog({
              name: group.groupName,
              kind: "posting",
              icon: "⏳",
              msg: t("campaign_manager_runner_log_upload_image_done", {
                done: photoIds.length,
                total: imagesToUpload.length
              }),
              ts: nowTs()
            })
          }
        } else if (!isStatusPost && slot.video) {
          addLog({
            name: group.groupName,
            kind: "posting",
            icon: "⏳",
            msg: t("campaign_manager_runner_log_uploading_video"),
            ts
          })
          videoId = await fbUploadVideo(slot.video, group.groupId).catch(
            () => null
          )
          if (videoId) await sleep(2500)
        } else if (!isStatusPost && slot.videoLinkUrl) {
          addLog({
            name: group.groupName,
            kind: "posting",
            icon: "⏳",
            msg: t("campaign_manager_runner_log_downloading_video_link"),
            ts
          })
          const fileData = await postCampaignService
            .downloadVideoFromLink(slot.videoLinkUrl)
            .catch(() => null)
          if (fileData) {
            addLog({
              name: group.groupName,
              kind: "posting",
              icon: "⏳",
              msg: t("campaign_manager_runner_log_uploading_video"),
              ts: nowTs()
            })
            videoId = await fbUploadVideo(fileData, group.groupId).catch(
              () => null
            )
            if (videoId) await sleep(2500)
          }
        }

        // Content
        let content = processContent(
          slot.content,
          group.groupName,
          profile?.name
        )
        if (!isStatusPost) {
          if (config.signature) content += "\n\n" + config.signature
          if (config.requestAdminPermission) {
            const phrase =
              config.requestAdminPermissionTone === "warm"
                ? t("campaign_manager_runner_admin_permission_phrase_warm")
                : t("campaign_manager_runner_admin_permission_phrase_quick")
            content = phrase + "\n\n" + content
          }
        }

        // Anonymous post — needs the group's anonymous author id
        let anonymousActorId: string | null = null
        if (config.anonymous) {
          anonymousActorId = await getGroupAnonProfileId(group.groupId)
          if (!anonymousActorId) {
            addLog({
              name: group.groupName,
              kind: "fail",
              icon: "❌",
              msg: t("campaign_manager_runner_log_anonymous_not_supported"),
              ts: nowTs()
            })
            fail++
            setProgress({ current: i + 1, total: groups.length, success, fail })
            continue
          }
        }

        const feeling = slot.feelingObjectId
          ? { objectId: slot.feelingObjectId, verbId: "" }
          : null
        const checkinPlaceId = slot.checkinPlaceId ?? null

        addLog({
          name: group.groupName,
          kind: "posting",
          icon: "⏳",
          msg: t("campaign_manager_runner_log_start_posting_group", {
            groupName: group.groupName
          }),
          ts: nowTs()
        })

        const result = await doPostToGroup(
          group,
          content,
          photoIds,
          videoId,
          textFormatPresetId,
          feeling,
          checkinPlaceId,
          anonymousActorId,
          slot.shareLinkUrl ?? null
        )

        if (result.ok) {
          success++
          consecutiveErrors.current = 0
          groupsSinceRest.current++

          addLog({
            name: group.groupName,
            kind: "success",
            icon: "✅",
            msg: t("campaign_manager_runner_log_post_success", {
              groupName: group.groupName
            }),
            postUrl: result.postUrl,
            ts: nowTs()
          })

          // React after posting
          if (config.reactAfterPost && result.postUrl) {
            const ids = extractPostIds(result.postUrl)
            if (ids) {
              for (let s = 5; s > 0; s--) {
                if (abortRef.current || pausedRef.current) break
                setStatusMsg(
                  t("campaign_manager_runner_status_react_countdown", {
                    seconds: s
                  })
                )
                await sleep(1000)
              }
              if (!abortRef.current) {
                await fbReactPost(ids.pId, ids.gId).catch(() => undefined)
                addLog({
                  name: group.groupName,
                  kind: "success",
                  icon: "❤️",
                  msg: t("campaign_manager_runner_log_react_done"),
                  ts: nowTs()
                })
              }
            }
          }

          // Comment after posting
          if (config.commentAfterPost && result.postUrl) {
            const ids = extractPostIds(result.postUrl)
            if (ids) {
              for (let s = 5; s > 0; s--) {
                if (abortRef.current || pausedRef.current) break
                setStatusMsg(
                  t("campaign_manager_runner_status_comment_countdown", {
                    seconds: s
                  })
                )
                await sleep(1000)
              }
              if (!abortRef.current) {
                let commentPhotoId: string | null = null
                if (config.commentImage) {
                  const ids2 = await doUploadImages([config.commentImage])
                  commentPhotoId = ids2[0] ?? null
                }
                await fbCommentOnPost(
                  ids.pId,
                  ids.gId,
                  spinBare(config.commentAfterPost),
                  commentPhotoId
                ).catch(() => undefined)
                addLog({
                  name: group.groupName,
                  kind: "success",
                  icon: "💬",
                  msg: t("campaign_manager_runner_log_comment_done"),
                  ts: nowTs()
                })
              }
            }
          }
        } else {
          fail++
          consecutiveErrors.current++
          addLog({
            name: group.groupName,
            kind: "fail",
            icon: "❌",
            msg: friendlyError(
              result.error ?? t("campaign_manager_runner_error_unknown"),
              t
            ),
            ts: nowTs()
          })
        }

        setProgress({ current: i + 1, total: groups.length, success, fail })

        // Stop after too many consecutive errors
        if (
          config.skipAfterErrors > 0 &&
          consecutiveErrors.current >= config.skipAfterErrors
        ) {
          addLog({
            name: systemName,
            kind: "system",
            icon: "🛑",
            msg: t("campaign_manager_runner_log_stop_too_many_errors", {
              count: config.skipAfterErrors
            }),
            ts: nowTs()
          })
          break
        }

        // Periodic rest
        if (
          config.restAfterN > 0 &&
          config.restMinutes > 0 &&
          groupsSinceRest.current >= config.restAfterN &&
          i < groups.length - 1
        ) {
          groupsSinceRest.current = 0
          addLog({
            name: systemName,
            kind: "system",
            icon: "⏸",
            msg: t("campaign_manager_runner_log_rest_time", {
              minutes: config.restMinutes
            }),
            ts: nowTs()
          })
          const cont = await sleepWithCountdown(
            config.restMinutes * 60 * 1000,
            t("campaign_manager_runner_rest_label", {
              minutes: config.restMinutes
            })
          )
          if (!cont) break
        }

        // Delay between groups
        if (i < groups.length - 1 && !abortRef.current) {
          const lo = Math.max(1, config.delayMin)
          const hi = Math.max(lo, config.delayMax)
          const delaySec = randInt(lo, hi)
          addLog({
            name: systemName,
            kind: "system",
            icon: "⏳",
            msg: t("campaign_manager_runner_log_delay_time", {
              seconds: delaySec
            }),
            ts: nowTs()
          })
          const cont = await sleepWithCountdown(
            delaySec * 1000,
            t("campaign_manager_runner_delay_label")
          )
          if (!cont) break
        }
      }

      setStatusMsg("")
      setCountdown(null)
      setRunState(abortRef.current ? "idle" : "done")

      if (!abortRef.current) {
        addLog({
          name: systemName,
          kind: "system",
          icon: "🎉",
          msg: t("campaign_manager_runner_log_completed", {
            success,
            fail
          }),
          ts: nowTs()
        })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    abortRef.current = true
    pausedRef.current = false
    setRunState("idle")
    setCountdown(null)
    setStatusMsg("")
  }, [])

  const reset = useCallback(() => {
    abortRef.current = false
    pausedRef.current = false
    groupsSinceRest.current = 0
    consecutiveErrors.current = 0
    setRunState("idle")
    setError(null)
    setLogs([])
    setProgress({ current: 0, total: 0, success: 0, fail: 0 })
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
    post,
    pause,
    resume,
    stop,
    reset
  }
}
