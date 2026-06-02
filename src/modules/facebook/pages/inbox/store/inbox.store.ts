import { create } from 'zustand'
import {
  ICampaignState,
  ICustomer,
  IFanpage,
  IFilterStats,
  IInboxFilter,
  IMessageTemplate,
  ISendConfig,
  ISendLogEntry,
  ISendProgress,
  TSendStatus,
} from '../types/inbox.interface'

const DEFAULT_FILTER: IInboxFilter = {
  gender: 'all',
  phone: 'all',
  friend: 'all',
  sender_type: 'all',
  tags: [],
  exclude_tags: [],
  post_id: null,
  exclude_blocked: false,
  split_file_index: 0,
  split_file_size: 3000,
}

const DEFAULT_MESSAGE_TEMPLATE: IMessageTemplate = {
  content: '',
  attachmentType: '',
  attachmentPosition: 'after',
  attachmentFile: null,
  imageUrl: '',
}

const DEFAULT_SEND_CONFIG: ISendConfig = {
  sendingOrder: '3',
  sendingOrderLabel: 'Ngẫu nhiên (Khuyên dùng)',
  limitMessage: 0,
  timeFrom: 2,
  timeTo: 5,
  skipRecentDays: 0,
  restAfterMessages: 20,
  restDuration: 30,
  scheduleEnabled: false,
  scheduleStartDay: null,
  scheduleStartHour: null,
  scheduleStartMinute: null,
  scheduleEndDay: null,
  scheduleEndHour: null,
  scheduleEndMinute: null,
}

const DEFAULT_SEND_PROGRESS: ISendProgress = {
  status: 'idle',
  currentIndex: 0,
  total: 0,
  successCount: 0,
  failureCount: 0,
  skippedCount: 0,
  percent: 0,
  currentCustomer: null,
  restUntil: 0,
  logs: [],
}

interface IInboxStore {
  // Data
  currentStep: number
  pages: IFanpage[]
  campaign: ICampaignState

  // Step navigation
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void

  // Step 1: Scan
  setPages: (pages: IFanpage[]) => void
  selectPage: (fanpage: IFanpage) => void
  setCustomers: (customers: ICustomer[]) => void
  setTotalCustomers: (total: number) => void

  // Step 2: Filter
  setFilter: (filter: Partial<IInboxFilter>) => void
  resetFilter: () => void
  setFilterStats: (stats: IFilterStats) => void
  setFilteredCustomers: (customers: ICustomer[], count: number, percent: number) => void
  toggleExcludeCustomer: (id: string) => void
  setExcludedCustomerIds: (ids: string[]) => void

  // Step 3: Message
  setMessageTemplate: (template: Partial<IMessageTemplate>) => void

  // Step 4: Config
  setSendConfig: (config: Partial<ISendConfig>) => void

  // Step 6: Progress
  setSendStatus: (status: TSendStatus) => void
  updateSendProgress: (progress: Partial<ISendProgress>) => void
  addSendLog: (log: ISendLogEntry) => void
  resetSendProgress: () => void

  // Reset all
  resetCampaign: () => void
}

const useInboxStore = create<IInboxStore>((set, get) => ({
  currentStep: 1,
  pages: [],
  campaign: {
    fanpageId: null,
    fanpageName: null,
    fanpageAvatar: null,
    category: 'fanpage',
    totalCustomers: 0,
    customers: [],
    filters: { ...DEFAULT_FILTER },
    filteredCount: 0,
    filteredPercent: 0,
    filteredCustomers: [],
    filterStats: null,
    excludedCustomerIds: [],
    messageTemplate: { ...DEFAULT_MESSAGE_TEMPLATE },
    sendConfig: { ...DEFAULT_SEND_CONFIG },
    sendProgress: { ...DEFAULT_SEND_PROGRESS },
  },

  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, 6) })),
  prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),

  setPages: (pages) => set({ pages }),

  selectPage: (fanpage) =>
    set((s) => ({
      campaign: {
        ...s.campaign,
        fanpageId: fanpage.id,
        fanpageName: fanpage.name,
        fanpageAvatar: fanpage.avatar,
        category: fanpage.type === 'profile' ? 'profile' : 'fanpage',
        customers: [],
        totalCustomers: 0,
        filteredCustomers: [],
        filteredCount: 0,
        filteredPercent: 0,
        filterStats: null,
        filters: { ...DEFAULT_FILTER },
      },
    })),

  setCustomers: (customers) =>
    set((s) => ({
      campaign: { ...s.campaign, customers },
    })),

  setTotalCustomers: (total) =>
    set((s) => ({
      campaign: { ...s.campaign, totalCustomers: total },
    })),

  setFilter: (filter) =>
    set((s) => ({
      campaign: {
        ...s.campaign,
        filters: { ...s.campaign.filters, ...filter },
      },
    })),

  resetFilter: () =>
    set((s) => ({
      campaign: {
        ...s.campaign,
        filters: { ...DEFAULT_FILTER },
      },
    })),

  setFilterStats: (stats) =>
    set((s) => ({
      campaign: { ...s.campaign, filterStats: stats },
    })),

  setFilteredCustomers: (customers, count, percent) =>
    set((s) => ({
      campaign: {
        ...s.campaign,
        filteredCustomers: customers,
        filteredCount: count,
        filteredPercent: percent,
        excludedCustomerIds: [],
      },
    })),

  toggleExcludeCustomer: (id) =>
    set((s) => {
      const excluded = s.campaign.excludedCustomerIds
      const next = excluded.includes(id) ? excluded.filter((x) => x !== id) : [...excluded, id]
      return { campaign: { ...s.campaign, excludedCustomerIds: next } }
    }),

  setExcludedCustomerIds: (ids) =>
    set((s) => ({ campaign: { ...s.campaign, excludedCustomerIds: ids } })),

  setMessageTemplate: (template) =>
    set((s) => ({
      campaign: {
        ...s.campaign,
        messageTemplate: { ...s.campaign.messageTemplate, ...template },
      },
    })),

  setSendConfig: (config) =>
    set((s) => ({
      campaign: {
        ...s.campaign,
        sendConfig: { ...s.campaign.sendConfig, ...config },
      },
    })),

  setSendStatus: (status) =>
    set((s) => ({
      campaign: {
        ...s.campaign,
        sendProgress: { ...s.campaign.sendProgress, status },
      },
    })),

  updateSendProgress: (progress) =>
    set((s) => ({
      campaign: {
        ...s.campaign,
        sendProgress: { ...s.campaign.sendProgress, ...progress },
      },
    })),

  addSendLog: (log) =>
    set((s) => {
      const logs = [...s.campaign.sendProgress.logs, log]
      // Giới hạn 200 dòng log
      const trimmed = logs.length > 200 ? logs.slice(logs.length - 200) : logs
      return {
        campaign: {
          ...s.campaign,
          sendProgress: { ...s.campaign.sendProgress, logs: trimmed },
        },
      }
    }),

  resetSendProgress: () =>
    set((s) => ({
      campaign: {
        ...s.campaign,
        sendProgress: { ...DEFAULT_SEND_PROGRESS },
      },
    })),

  resetCampaign: () =>
    set({
      currentStep: 1,
      pages: [],
      campaign: {
        fanpageId: null,
        fanpageName: null,
        fanpageAvatar: null,
        category: 'fanpage',
        totalCustomers: 0,
        customers: [],
        filters: { ...DEFAULT_FILTER },
        filteredCount: 0,
        filteredPercent: 0,
        filteredCustomers: [],
        filterStats: null,
        excludedCustomerIds: [],
        messageTemplate: { ...DEFAULT_MESSAGE_TEMPLATE },
        sendConfig: { ...DEFAULT_SEND_CONFIG },
        sendProgress: { ...DEFAULT_SEND_PROGRESS },
      },
    }),
}))

export default useInboxStore
