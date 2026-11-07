/** Types of the "post campaign" tool (bulk posting to Facebook groups), ported from xthuy-social `post-campaign`. */

export interface PostGroup {
  groupId: string
  groupName: string
  avatarUrl?: string
}

export interface MediaFile {
  dataUrl: string
  name: string
}

export type AttachKind =
  | "none"
  | "status"
  | "status_images"
  | "image"
  | "video"
  | "video_link"
  | "link"

export interface CheckinPlace {
  id: string
  name: string
  address?: string
}

export interface FeelingItem {
  emoji: string
  name: string
  objectId?: string
}

/** One post being composed in step 2 */
export interface PostSlot {
  content: string
  attachKind: AttachKind
  images: MediaFile[]
  video: MediaFile | null
  videoLinkUrl: string
  shareLinkUrl: string
  statusBgIds: string[]
  checkin: CheckinPlace | null
  feeling: FeelingItem | null
}

/** A post as handed to the runner */
export interface PostSlotData {
  content: string
  images: MediaFile[]
  video: MediaFile | null
  videoLinkUrl?: string
  shareLinkUrl?: string
  statusBgIds?: string[]
  checkinPlaceId?: string | null
  feelingObjectId?: string | null
}

export type GroupOrder = "top_down" | "random"
export type AdminPermissionTone = "quick" | "warm"

export interface PostConfig {
  campaignName: string
  groups: PostGroup[]
  posts: PostSlotData[]
  delayMin: number
  delayMax: number
  restAfterN: number
  restMinutes: number
  skipAfterErrors: number
  maxGroups: number
  groupOrder: GroupOrder
  signature: string
  commentAfterPost: string
  commentImage: MediaFile | null
  reactAfterPost: boolean
  randomPickOneImage: boolean
  requestAdminPermission: boolean
  requestAdminPermissionTone: AdminPermissionTone
  anonymous: boolean
}

export type PostCampaignRunState =
  | "idle"
  | "running"
  | "paused"
  | "done"
  | "error"

export interface PostCampaignProgress {
  current: number
  total: number
  success: number
  fail: number
}

export interface LogEntry {
  name: string
  kind: "system" | "posting" | "success" | "fail"
  icon: string
  msg: string
  postUrl?: string
  ts: string
}

export interface StatusBgPreset {
  id: string
  desc: string
  bgColor: string
  gradColor: string | null
  gradDir: string | null
  imgUrl: string | null
  textColor: string
  thumbUrl: string | null
}

export interface StatusBgCategory {
  name: string
  presets: StatusBgPreset[]
}

export type PostCampaignStep = 1 | 2 | 3 | 4
