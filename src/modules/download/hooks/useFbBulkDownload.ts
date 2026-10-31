import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { DOWNLOAD_STORIES_IN_HIGHLIGHT_BATCH_SIZE } from "src/constants/download.constants"
import { ESocialProvider } from "src/constants/enum"
import useDownloadProcesses from "src/stores/download-process.store"
import {
  IBulkDownloadOptions,
  IBulkDownloadProcess,
  IBulkTargetInfo,
  IMediaItem,
  IPagedResult
} from "src/modules/download/types/download.types"
import { createMediaSink, IMediaSink } from "src/modules/download/utils/media-sink.util"
import facebookService, { getLastGraphqlError } from "src/modules/facebook/services/facebook.service"
import {
  isItemBetweenRangeDate,
  isItemDateBeforeStartOfRangeDate,
  isValidDateRange
} from "src/utils/date-time.util"
import {
  delay,
  downloadInBatches,
  isBulkDownloadProcessExist
} from "src/utils/download.util"
import { getFileExtensionByMediaType, getFilename, joinPath } from "src/utils/file.util"
import { showErrorToast } from "src/utils/toast.util"

/** Each fetcher already tries every known GraphQL query, so a few page retries are enough */
const MAX_PAGE_RETRIES = 3

interface IPaginateParams<T> {
  processId: string
  options: IBulkDownloadOptions
  fetchPage: (cursor: string) => Promise<IPagedResult<T> | null>
  processPage: (items: T[]) => Promise<{ shouldStop?: boolean } | void>
}

export type { IBulkTargetInfo }

const useFbBulkDownload = () => {
  const { t } = useTranslation()
  const { updateBulkProcess } = useDownloadProcesses()

  const isAlive = useCallback(
    (processId: string) => isBulkDownloadProcessExist(ESocialProvider.FACEBOOK, processId),
    []
  )
  const update = useCallback(
    (processId: string, payload: Partial<IBulkDownloadProcess>) =>
      updateBulkProcess(ESocialProvider.FACEBOOK, processId, payload),
    [updateBulkProcess]
  )
  const fetchError = () => {
    const detail = getLastGraphqlError()
    return detail ? `${t("fetch_error_facebook")} (${detail})` : t("fetch_error_facebook")
  }

  const waitBetweenPages = async (options: IBulkDownloadOptions) => {
    if (options.delayTimeInSecond > 0) await delay(options.delayTimeInSecond * 1000)
  }

  /** Cursor loop shared by every list-based type. A null page is retried. */
  const paginate = async <T>({ processId, options, fetchPage, processPage }: IPaginateParams<T>) => {
    let cursor = ""
    let retryCount = 0
    while (true) {
      if (!isAlive(processId)) return
      const page = await fetchPage(cursor)
      if (!page) {
        retryCount += 1
        if (retryCount >= MAX_PAGE_RETRIES) throw new Error(fetchError())
        await delay(1000)
        continue
      }
      retryCount = 0
      const result = await processPage(page.dataItems)
      cursor = page.pagination.nextCursor
      if (!page.pagination.hasNextPage || result?.shouldStop) break
      await waitBetweenPages(options)
    }
  }

  /** Apply the date filter to a page (newest-first feeds) */
  const applyDateFilter = (items: IMediaItem[], options: IBulkDownloadOptions) => {
    if (!isValidDateRange(options.filterByRangeDate)) {
      return { kept: items, skipped: 0, shouldStop: false }
    }
    const range = options.filterByRangeDate
    const kept = items.filter((item) => isItemBetweenRangeDate(item.createdAt, range))
    const last = items[items.length - 1]
    const shouldStop = !!last && isItemDateBeforeStartOfRangeDate(last.createdAt, range)
    return { kept, skipped: items.length - kept.length, shouldStop }
  }

  const runGuarded = async (processId: string, sink: IMediaSink, job: () => Promise<void>) => {
    try {
      await job()
      await sink.finish()
      if (isAlive(processId)) update(processId, { status: "COMPLETED" })
    } catch (error) {
      showErrorToast((error as Error).message || fetchError())
      // keep whatever was collected before the failure
      await sink.finish().catch(() => undefined)
      if (isAlive(processId)) update(processId, { status: "FAILED" })
    }
  }

  /** PHOTO / VIDEO / REEL share the same "list + download page" flow */
  const downloadMediaList = async (
    processId: string,
    sink: IMediaSink,
    options: IBulkDownloadOptions,
    folder: string,
    extension: "jpg" | "mp4" | "auto",
    fetchPage: (cursor: string) => Promise<IPagedResult<IMediaItem> | null>
  ) => {
    let downloaded = 0
    let skipped = 0
    await paginate<IMediaItem>({
      processId,
      options,
      fetchPage,
      processPage: async (items) => {
        const { kept, skipped: pageSkipped, shouldStop } = applyDateFilter(items, options)
        skipped += pageSkipped
        update(processId, { skippedItems: skipped })
        await downloadInBatches({
          items: kept,
          batchSize: options.concurrencyProcessLimit,
          processItem: async (item, order) => {
            if (!isAlive(processId)) return
            const ext = extension === "auto" ? getFileExtensionByMediaType(item.mediaType) : extension
            const name = getFilename({
              order: downloaded + order,
              id: item.id,
              title: item.title,
              timestamp: item.createdAt,
              format: options.fileNameFormat
            })
            await sink.save(item.downloadUrl, joinPath(folder, `${name}.${ext}`))
          },
          onBatchCompleted: (count) => update(processId, { totalDownloadedItems: downloaded + count })
        })
        downloaded += kept.length
        update(processId, { totalDownloadedItems: downloaded })
        return { shouldStop }
      }
    })
  }

  const startDownloadAllPhotos = (info: IBulkTargetInfo, processId: string, options: IBulkDownloadOptions) => {
    const folder = joinPath(`facebook_${info.target.toLowerCase()}_${info.id}`, "photos")
    const sink = createMediaSink(options.saveMode, folder.replace(/\//g, "_"))
    return runGuarded(processId, sink, () =>
      downloadMediaList(
        processId,
        sink,
        options,
        folder,
        "jpg",
        (cursor) =>
          info.target === "PROFILE"
            ? facebookService.getProfileBulkPhotos(info.profile ?? { id: info.id, photosTabKeyId: null }, cursor)
            : facebookService.getGroupBulkPhotos(info.id, cursor)
      )
    )
  }

  const startDownloadAllVideos = (info: IBulkTargetInfo, processId: string, options: IBulkDownloadOptions) => {
    const folder = joinPath(`facebook_${info.target.toLowerCase()}_${info.id}`, "videos")
    const sink = createMediaSink(options.saveMode, folder.replace(/\//g, "_"))
    return runGuarded(processId, sink, () =>
      downloadMediaList(
        processId,
        sink,
        options,
        folder,
        "mp4",
        (cursor) =>
          info.target === "PROFILE"
            ? facebookService.getProfileBulkVideos(info.profile ?? { id: info.id, delegatePageId: null }, cursor)
            : facebookService.getGroupBulkVideos(info.id, cursor)
      )
    )
  }

  const startDownloadAllReels = (info: IBulkTargetInfo, processId: string, options: IBulkDownloadOptions) => {
    const folder = joinPath(`facebook_profile_${info.id}`, "reels")
    const sink = createMediaSink(options.saveMode, folder.replace(/\//g, "_"))
    return runGuarded(processId, sink, () =>
      downloadMediaList(
        processId,
        sink,
        options,
        folder,
        "mp4",
        (cursor) => facebookService.getProfileBulkReels(info.profile ?? { id: info.id, reelsTabKeyId: null }, cursor)
      )
    )
  }

  const startDownloadAllHighlights = (info: IBulkTargetInfo, processId: string, options: IBulkDownloadOptions) => {
    const sink = createMediaSink(options.saveMode, `facebook_profile_${info.id}_highlights`)
    return runGuarded(processId, sink, async () => {
      let highlightsDone = 0
      await paginate<string>({
        processId,
        options,
        fetchPage: (cursor) => facebookService.getProfileBulkHighlightsId(info.id, cursor),
        processPage: async (highlightIds) => {
          for (let i = 0; i < highlightIds.length; i++) {
            if (!isAlive(processId)) return
            const highlightId = highlightIds[i]
            const details = await facebookService.getStoryDetails(highlightId)
            const highlightOrder = highlightsDone + i + 1
            const baseFolder = joinPath(`facebook_profile_${info.id}`, "highlights")
            const folder = options.isMergeIntoOneFolder
              ? baseFolder
              : joinPath(baseFolder, `${highlightOrder}_${highlightId}`)
            await downloadInBatches({
              items: details.storiesMedia,
              batchSize: DOWNLOAD_STORIES_IN_HIGHLIGHT_BATCH_SIZE,
              processItem: async (story, order) => {
                if (!isAlive(processId)) return
                const name = getFilename({
                  order: options.isMergeIntoOneFolder ? `${highlightOrder}-${order}` : order,
                  id: options.isMergeIntoOneFolder ? `${highlightId}-${story.id}` : story.id,
                  title: details.title,
                  timestamp: story.createdAt,
                  format: options.fileNameFormat
                })
                await sink.save(story.downloadUrl, joinPath(folder, `${name}.${getFileExtensionByMediaType(story.mediaType)}`))
              }
            })
            update(processId, { totalDownloadedItems: highlightOrder })
          }
          highlightsDone += highlightIds.length
          update(processId, { totalDownloadedItems: highlightsDone })
        }
      })
    })
  }

  const startDownloadActiveStories = (info: IBulkTargetInfo, processId: string, options: IBulkDownloadOptions) => {
    const sink = createMediaSink(options.saveMode, `facebook_profile_${info.id}_stories_24h`)
    return runGuarded(processId, sink, async () => {
      const bucketId = info.profile?.storyBucketId
      if (!bucketId) throw new Error(t("no_active_stories"))
      const details = await facebookService.getStoryDetails(bucketId)
      const folder = joinPath(`facebook_profile_${info.id}`, "stories_24h")
      await downloadInBatches({
        items: details.storiesMedia,
        batchSize: DOWNLOAD_STORIES_IN_HIGHLIGHT_BATCH_SIZE,
        processItem: async (story, order) => {
          if (!isAlive(processId)) return
          const name = getFilename({
            order,
            id: story.id,
            title: details.title,
            timestamp: story.createdAt,
            format: options.fileNameFormat
          })
          await sink.save(story.downloadUrl, joinPath(folder, `${name}.${getFileExtensionByMediaType(story.mediaType)}`))
        },
        onBatchCompleted: (count) => update(processId, { totalDownloadedItems: count })
      })
    })
  }

  return {
    startDownloadAllPhotos,
    startDownloadAllVideos,
    startDownloadAllReels,
    startDownloadAllHighlights,
    startDownloadActiveStories
  }
}

export default useFbBulkDownload
