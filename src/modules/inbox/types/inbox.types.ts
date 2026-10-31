// ==================== FACEBOOK CONFIG ====================
export interface IFbRequestConfig {
  c_user: string
  fb_dtsg: string
  jazoest: string
  lsd: string
  cquick_token: string
  cquick: string
  __a: number
  __ccg: string
  __comet_req: number
  __csr: string
  __dyn: string
  __hs: string
  __hsi: string
  __pc: string
  __rev: number
  __req: string
  __s: string
  __spin_b: string
  __spin_r: number
  __spin_t?: number
  usid: string
  dpr: number
  bl_hash_version: string
  comet_env: number
  compose_bootloads: string
  hsi?: string
  semr_host_bucket: string
  spin: string
  wbloks_env: string
}

// ==================== PAGE / FANPAGE ====================
export interface IFanpage {
  id: string
  name: string
  avatar: string
  type: 'page' | 'profile'
}

export interface IUserInfo {
  id: string
  name: string
  avatar: string
}

// ==================== CUSTOMER / THREAD ====================
export interface ICustomer {
  id: string
  name: string
  time: string
  xung?: string
  goi?: string
  gender?: 'male' | 'female' | 'unknown'
  hasPhone?: boolean
  isFriend?: boolean
  senderType?: 'customer' | 'page' | 'unknown'
  tags?: string[]
  isBlocked?: boolean
}

export interface IInboxThread {
  threadId: string
  participants: ICustomer[]
  lastMessage?: string
  lastMessageTime?: string
  unreadCount?: number
}

// ==================== FILTER ====================
export type TGenderFilter = 'all' | 'male' | 'female' | 'unknown'
export type TPhoneFilter = 'all' | 'has_phone' | 'no_phone'
export type TFriendFilter = 'all' | 'friend' | 'not_friend'
export type TSenderTypeFilter = 'all' | 'customer' | 'page'

export interface IInboxFilter {
  gender: TGenderFilter
  phone: TPhoneFilter
  friend: TFriendFilter
  sender_type: TSenderTypeFilter
  tags: string[]
  exclude_tags: string[]
  post_id: string | null
  exclude_blocked: boolean
  split_file_index: number
  split_file_size: number
}

export interface IFilterStats {
  total: number
  category: 'fanpage' | 'profile'
  gender: {
    male: number
    female: number
    unknown: number
  }
  phone: {
    has_phone: number
    no_phone: number
  }
  friend: {
    friend: number
    not_friend: number
  }
  sender_type: {
    customer: number
    page: number
  }
  tags: ITagStat[]
}

export interface ITagStat {
  name: string
  count: number
}

// ==================== MESSAGE TEMPLATE ====================
export type TAttachmentType = '' | 'image' | 'video' | 'audio' | 'file'
export type TAttachmentPosition = 'before' | 'after'

export interface IMessageTemplate {
  content: string
  attachmentType: TAttachmentType
  attachmentPosition: TAttachmentPosition
  attachmentFile: File | null
  imageUrl?: string
}

// ==================== SEND CONFIG ====================
export type TSendingOrder = '1' | '2' | '3'

export interface ISendConfig {
  sendingOrder: TSendingOrder
  sendingOrderLabel: string
  limitMessage: number
  timeFrom: number
  timeTo: number
  skipRecentDays: number
  restAfterMessages: number
  restDuration: number
  scheduleEnabled: boolean
  scheduleStartDay: string | null
  scheduleStartHour: string | null
  scheduleStartMinute: string | null
  scheduleEndDay: string | null
  scheduleEndHour: string | null
  scheduleEndMinute: string | null
}

// ==================== SEND PROGRESS ====================
export type TSendStatus = 'idle' | 'running' | 'paused' | 'resting' | 'finished' | 'stopped'

export interface ISendProgress {
  status: TSendStatus
  currentIndex: number
  total: number
  successCount: number
  failureCount: number
  skippedCount: number
  percent: number
  currentCustomer: ICustomer | null
  restUntil: number
  logs: ISendLogEntry[]
}

export interface ISendLogEntry {
  id: string
  customerId: string
  customerName: string
  status: 'success' | 'failure' | 'skipped'
  message: string
  error?: string
  timestamp: number
}

// ==================== CAMPAIGN ====================
export interface ICampaignState {
  // Step 1
  fanpageId: string | null
  fanpageName: string | null
  fanpageAvatar: string | null
  category: 'fanpage' | 'profile'
  totalCustomers: number
  customers: ICustomer[]

  // Step 2
  filters: IInboxFilter
  filteredCount: number
  filteredPercent: number
  filteredCustomers: ICustomer[]
  filterStats: IFilterStats | null
  excludedCustomerIds: string[]

  // Step 3
  messageTemplate: IMessageTemplate

  // Step 4
  sendConfig: ISendConfig

  // Step 5 / Step 6
  sendProgress: ISendProgress
}

// ==================== REPORT ====================
export interface ICampaignReport {
  fanpageId: string
  fanpageName: string
  startTime: number
  endTime: number
  totalSent: number
  successCount: number
  failureCount: number
  skippedCount: number
  successList: ICustomer[]
  failureList: Array<ICustomer & { error: string }>
  skippedList: Array<ICustomer & { reason: string }>
}

// ==================== API RESPONSE ====================
export interface IApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string | IFbApiError
}

export interface IFbApiError {
  error: number | string
  errorDescription?: string
  errorSummary?: string
}
