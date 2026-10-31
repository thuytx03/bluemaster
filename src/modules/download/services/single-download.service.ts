import {
  DEFAULT_SINGLE_FILE_NAME_FORMAT,
  DOWNLOAD_STORIES_IN_HIGHLIGHT_BATCH_SIZE
} from "src/constants/download.constants"
import { ESingleDownloadType } from "src/constants/enum"
import { SINGLE_DOWNLOAD_URL_PATTERNS } from "src/constants/regex.constants"
import { MAX_RETRY_REQUEST } from "src/constants/app.constants"
import useDownloadProcesses from "src/stores/download-process.store"
import {
  ISingleDownloadProcess,
  TFileNameToken
} from "src/modules/download/types/download.types"
import { IMediaSink } from "src/modules/download/utils/media-sink.util"
import { extractIdByRegex } from "src/modules/download/utils/url.util"
import facebookService from "src/modules/facebook/services/facebook.service"
import useExtensionState from "src/stores/extension-state.store"
import {
  delay,
  downloadInBatches,
  isSingleDownloadProcessExist,
  retryWrapper
} from "src/utils/download.util"
import { getFileExtensionByMediaType, getFilename, joinPath } from "src/utils/file.util"

/** User-configured file name format for a single-download type (Settings page) */
export const getSingleFileNameFormat = (type: ESingleDownloadType): TFileNameToken[] => {
  const config = useExtensionState.getState().extensionState.downloadSingleFileNameConfig
  const format = config[type]
  return format && format.length > 0 ? format : DEFAULT_SINGLE_FILE_NAME_FORMAT
}

const updateProcess = (processId: string, payload: Partial<ISingleDownloadProcess>) =>
  useDownloadProcesses.getState().updateSingleProcess(processId, payload)

const isAlive = (processId: string) => isSingleDownloadProcessExist(processId)

/** Save through the sink with the same retry policy the reference extension uses */
const downloadMedia = (sink: IMediaSink, url: string, filename: string) =>
  retryWrapper(() => sink.save(url, filename), { maxRetries: 3, delayMs: 1000 })

export interface ISingleDownloadContext {
  processId: string
  url: string
  sink: IMediaSink
}

/** Video / reel / watch URL */
export const downloadFacebookVideo = async ({ processId, url, sink }: ISingleDownloadContext) => {
  const format = getSingleFileNameFormat(ESingleDownloadType.FACEBOOK_VIDEO)
  const details = await facebookService.getVideoDetails(url)
  if (!isAlive(processId)) return
  updateProcess(processId, { totalItems: 1, username: details.id })
  const name = getFilename({
    id: details.id,
    title: details.title,
    timestamp: details.createdAt,
    format
  })
  await downloadMedia(sink, details.downloadUrl, joinPath("facebook_videos", `${name}.mp4`))
  updateProcess(processId, { totalDownloadedItems: 1 })
}

/** Story / highlight bucket URL */
export const downloadFacebookStory = async ({ processId, url, sink }: ISingleDownloadContext) => {
  const format = getSingleFileNameFormat(ESingleDownloadType.FACEBOOK_HIGHLIGHT_STORY)
  const bucketId = extractIdByRegex({
    url,
    regexPattern: SINGLE_DOWNLOAD_URL_PATTERNS[ESingleDownloadType.FACEBOOK_HIGHLIGHT_STORY]
  })
  const details = await facebookService.getStoryDetails(bucketId)
  if (!isAlive(processId)) return
  updateProcess(processId, { totalItems: details.storiesMedia.length })
  let downloaded = 0
  await downloadInBatches({
    items: details.storiesMedia,
    batchSize: DOWNLOAD_STORIES_IN_HIGHLIGHT_BATCH_SIZE,
    processItem: async (story, order) => {
      if (!isAlive(processId)) return
      const name = `${order}_${getFilename({ id: story.id, title: details.title, format })}`
      await downloadMedia(
        sink,
        story.downloadUrl,
        joinPath(
          `facebook_story_${bucketId}`,
          `${name}.${getFileExtensionByMediaType(story.mediaType)}`
        )
      )
      downloaded += 1
      updateProcess(processId, { totalDownloadedItems: downloaded })
    }
  })
}

/** Every photo/video attached to a post, walking the media viewer */
export const downloadFacebookPostMedia = async ({ processId, url, sink }: ISingleDownloadContext) => {
  const format = getSingleFileNameFormat(ESingleDownloadType.FACEBOOK_POST_MEDIA)
  const info = await facebookService.getPostInfo(url)
  if (!isAlive(processId)) return
  updateProcess(processId, { username: info.postId, totalItems: info.totalMedia })

  let downloaded = 0
  let cursor: string | null = info.firstMediaId
  let retryCount = 0
  const seen = new Set<string>()
  while (downloaded < info.totalMedia && cursor) {
    if (!isAlive(processId)) return
    if (seen.has(cursor)) break
    let media
    try {
      media = await facebookService.getPostMediaDetails(cursor, info.mediasetToken)
    } catch (error) {
      retryCount += 1
      if (retryCount >= MAX_RETRY_REQUEST) throw error
      await delay(1000)
      continue
    }
    retryCount = 0
    seen.add(cursor)
    const name = `${downloaded + 1}_${getFilename({
      id: media.id,
      title: info.title,
      timestamp: info.createdAt,
      format
    })}`
    await downloadMedia(
      sink,
      media.downloadUrl,
      joinPath(
        `facebook_post_${info.postId}`,
        `${name}.${getFileExtensionByMediaType(media.mediaType)}`
      )
    )
    downloaded += 1
    updateProcess(processId, { totalDownloadedItems: downloaded })
    cursor = media.nextMediaId
  }
}

/** Whole album (media/set URL) */
export const downloadFacebookAlbumMedia = async ({ processId, url, sink }: ISingleDownloadContext) => {
  const format = getSingleFileNameFormat(ESingleDownloadType.FACEBOOK_ALBUM_MEDIA)
  const albumId = extractIdByRegex({
    url,
    regexPattern: SINGLE_DOWNLOAD_URL_PATTERNS[ESingleDownloadType.FACEBOOK_ALBUM_MEDIA]
  })
  let cursor = ""
  let downloaded = 0
  let retryCount = 0
  while (true) {
    if (!isAlive(processId)) return
    const page = await facebookService.getBulkAlbumMediaById(albumId, cursor)
    if (!page) {
      retryCount += 1
      if (retryCount >= MAX_RETRY_REQUEST) throw new Error("Không thể lấy dữ liệu album")
      await delay(1000)
      continue
    }
    retryCount = 0
    await downloadInBatches({
      items: page.dataItems,
      batchSize: 8,
      processItem: async (item, order) => {
        if (!isAlive(processId)) return
        const name = getFilename({
          order: downloaded + order,
          id: item.id,
          title: item.title,
          timestamp: item.createdAt,
          format
        })
        await downloadMedia(
          sink,
          item.downloadUrl,
          joinPath(
            `facebook_album_${albumId}`,
            `${name}.${getFileExtensionByMediaType(item.mediaType)}`
          )
        )
      },
      onBatchCompleted: (count) => updateProcess(processId, { totalDownloadedItems: downloaded + count })
    })
    downloaded += page.dataItems.length
    updateProcess(processId, { totalDownloadedItems: downloaded })
    cursor = page.pagination.nextCursor
    if (!page.pagination.hasNextPage) break
  }
}

/** Video attached to a comment or reply */
export const downloadFacebookCommentVideo = async ({ processId, url, sink }: ISingleDownloadContext) => {
  const format = getSingleFileNameFormat(ESingleDownloadType.FACEBOOK_COMMENT_VIDEO)
  const { id, downloadUrl } = await facebookService.getCommentVideoDownloadUrl(url)
  if (!isAlive(processId)) return
  updateProcess(processId, { totalItems: 1, username: id })
  const name = getFilename({ id, format })
  await downloadMedia(sink, downloadUrl, joinPath("facebook_comment_videos", `${name}.mp4`))
  updateProcess(processId, { totalDownloadedItems: 1 })
}

export const SINGLE_DOWNLOAD_HANDLERS: Record<
  ESingleDownloadType,
  (ctx: ISingleDownloadContext) => Promise<void>
> = {
  [ESingleDownloadType.FACEBOOK_POST_MEDIA]: downloadFacebookPostMedia,
  [ESingleDownloadType.FACEBOOK_VIDEO]: downloadFacebookVideo,
  [ESingleDownloadType.FACEBOOK_HIGHLIGHT_STORY]: downloadFacebookStory,
  [ESingleDownloadType.FACEBOOK_ALBUM_MEDIA]: downloadFacebookAlbumMedia,
  [ESingleDownloadType.FACEBOOK_COMMENT_VIDEO]: downloadFacebookCommentVideo
}
