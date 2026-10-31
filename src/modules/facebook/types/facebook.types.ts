import { IMediaItem } from "src/modules/download/types/download.types"

export interface IFacebookStory extends IMediaItem {}

export interface IFacebookPost extends IMediaItem {}

export interface IFacebookProfileInfo {
  id: string
  name: string
  /** Bucket id of the user's active (24h) stories, null when none */
  storyBucketId: string | null
  /** Page id backing a professional profile (used by the videos tab), null for regular users */
  delegatePageId: string | null
  /** Relay ids of the profile tabs, read from the profile page header */
  photosTabKeyId: string | null
  reelsTabKeyId: string | null
  albumsTabKeyId: string | null
}

export interface IFacebookStoryDetails {
  id: string
  ownerId: string
  ownerName: string
  title: string
  storiesMedia: IFacebookStory[]
}

export interface IFacebookVideoDetails extends IMediaItem {
  mediaType: "VIDEO"
}

export interface IFacebookPostInfo {
  postId: string
  title: string
  createdAt: number
  totalMedia: number
  firstMediaId: string
  mediasetToken: string
}

export interface IFacebookPostMediaDetails extends IMediaItem {
  nextMediaId: string | null
}

export interface IAccessTokenPage {
  tokenEAAB: string
  tokenEAAGNO: string
}
export type Member = {
  uid: string
  name?: string
  url?: string
}

export type FormatType = "uid" | "uid_name"

export type ExportState = {
  count: number
  options: any[]
  arrUID: Member[]
  status: "continue" | "stop"
  success: boolean
}
