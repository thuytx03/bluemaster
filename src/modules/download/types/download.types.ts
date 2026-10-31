import { ESingleDownloadType } from "src/constants/enum"
import { IFacebookProfileInfo } from "src/modules/facebook/types/facebook.types"

/** Tokens that can be combined (in order) to build a file name */
export type TFileNameToken = "numericalOrder" | "id" | "title" | "timestamp"

export type TProcessStatus = "RUNNING" | "COMPLETED" | "FAILED"

export type TMediaType = "PHOTO" | "VIDEO"

export type TFacebookDownloadAllType =
  | "PHOTO"
  | "VIDEO"
  | "REEL"
  | "HIGHLIGHT"
  | "STORY"

export type TFacebookTarget = "PROFILE" | "GROUP"

/** [from, to] as yyyy-mm-dd strings (value of <input type="date">) */
export type TDateRange = [string, string]

export interface IMediaItem {
  id: string
  downloadUrl: string
  mediaType: TMediaType
  /** Caption / description, used for the "title" file name token */
  title?: string
  /** Unix timestamp (seconds) */
  createdAt?: number
  thumbnailUrl?: string
}

export interface IPagedResult<T> {
  dataItems: T[]
  pagination: {
    hasNextPage: boolean
    nextCursor: string
  }
}

export type TSaveMode = "files" | "zip"

export interface IBulkDownloadOptions {
  saveMode: TSaveMode
  fileNameFormat: TFileNameToken[]
  filterByRangeDate: TDateRange | null
  concurrencyProcessLimit: number
  delayTimeInSecond: number
  isMergeIntoOneFolder: boolean
}

export interface IFacebookDownloadAllForm extends IBulkDownloadOptions {
  target: TFacebookTarget
  type: TFacebookDownloadAllType
  userUrl: string
}

export interface IBulkTargetInfo {
  target: TFacebookTarget
  /** Numeric id of the profile or group */
  id: string
  profile?: IFacebookProfileInfo
}

/** Everything needed to run the same bulk job again */
export interface IBulkRetryPayload {
  info: IBulkTargetInfo
  options: IBulkDownloadOptions
}

export interface IBulkDownloadProcess {
  id: string
  username: string
  downloadType: TFacebookDownloadAllType
  totalDownloadedItems: number
  skippedItems: number
  filterRangeDate: string | null
  status: TProcessStatus
  retryPayload?: IBulkRetryPayload
}

export interface ISingleDownloadProcess {
  id: string
  /** Display id extracted from the URL (post id, video id, ...) */
  username: string
  url: string
  downloadType: ESingleDownloadType
  /** 0 when unknown */
  totalItems: number
  totalDownloadedItems: number
  status: TProcessStatus
  /** Save mode used when the process was created (reused on retry) */
  saveMode?: TSaveMode
}

export type TSingleFileNameConfig = Partial<
  Record<ESingleDownloadType, TFileNameToken[]>
>
