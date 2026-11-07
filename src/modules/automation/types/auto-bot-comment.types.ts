/** Types of the auto-bot-comment tool (port of xthuy-social `auto-bot-comment`). */

export type BotIdentityType = "profile" | "page"

export interface BotCommentGroup {
  groupId: string
  groupName: string
  avatarUrl?: string
}

export interface BotCommentIdentity {
  id: string
  name: string
  type: BotIdentityType
  avatar?: string
}

/** Template as handed to the runner (images already as data URLs). */
export interface BotCommentTemplate {
  content: string
  images: { dataUrl: string; name: string }[]
}

export interface BotCommentConfig {
  groups: BotCommentGroup[]
  templates: BotCommentTemplate[]
  identities: BotCommentIdentity[]
  delayMin: number
  delayMax: number
  batchCount: number
  batchRestMinutes: number
  likePost: boolean
  /** Skip a group for the rest of the run once commenting in it failed */
  skipFailedGroups: boolean
  skipAfterErrors: number
}

export type LogKind = "success" | "fail" | "error" | "info" | "system"

export interface BotCommentLog {
  /** Unique within a run; lets countdown lines update in place */
  id: number
  kind: LogKind
  msg: string
  ts: string
  groupName?: string
  groupId?: string
  postId?: string
  permalink?: string
  commentPreview?: string
  cycleIndex?: number
  isChild?: boolean
  isRoot?: boolean
}

export type BotRunState = "idle" | "running" | "paused" | "done" | "error"

export interface BotRunProgress {
  current: number
  total: number
  success: number
  fail: number
}

// ─── Stored entities (chrome.storage, replaced the Laravel API) ─────────────

export interface BotCommentItem {
  id: number
  name: string
  identities: BotCommentIdentity[]
  groups: BotCommentGroup[]
  template_ids: number[]
  delay_min_sec: number
  delay_max_sec: number
  batch_count: number
  batch_rest_minutes: number
  like_post: boolean
  skip_failed_groups: boolean
  stop_after_consecutive_errors: number
  last_run_at: string | null
  created_at: string
  updated_at: string
}

export type BotCommentPayload = Omit<
  BotCommentItem,
  "id" | "created_at" | "updated_at" | "last_run_at"
>

export interface CommentTemplate {
  id: number
  name: string
  content: string
  /** Images as data URLs */
  image_urls: string[] | null
  created_at: string
  updated_at: string
}

export interface CommentTemplateInput {
  name: string
  content: string
  image_urls?: string[] | null
}

export interface GroupLibraryTopic {
  id: number
  name: string
  count: number
}

export interface GroupLibraryItem {
  group_id: string
  group_name: string
  avatar_url: string | null
  member_count: number
  topic_id: number
}

// ─── Wizard ──────────────────────────────────────────────────────────────────

export interface BotWizardSettings {
  likePost: boolean
  skipFailedGroups: boolean
  delayMin: number
  delayMax: number
  batchCount: number
  batchRestMinutes: number
  skipAfterErrors: number
}

export interface BotWizardState {
  botName: string
  selectedContent: Set<number>
  selectedIdentities: Set<string>
  identityMap: Map<string, BotCommentIdentity>
  selectedGroups: Map<string, BotCommentGroup>
  settings: BotWizardSettings
}
