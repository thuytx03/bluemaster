import { create } from "zustand"

import type {
  AdminPermissionTone,
  GroupOrder,
  MediaFile,
  PostCampaignStep,
  PostGroup,
  PostSlot
} from "src/modules/automation/types/post-campaign.types"
import {
  emptySlot,
  POST_CAMPAIGN_MAX_POSTS,
  randomCampaignName
} from "src/modules/automation/utils/post-campaign.util"

type TFunction = (
  key: string,
  params?: Record<string, string | number>
) => string

interface PostCampaignState {
  step: PostCampaignStep
  // Step 1
  selectedGroups: PostGroup[]
  // Step 2 — posts
  posts: PostSlot[]
  currentPostIdx: number
  // Step 2 — campaign config (basic)
  campaignName: string
  skipAfterErrors: number
  maxGroups: number
  groupOrder: GroupOrder
  anonymous: boolean
  skipFailed: boolean
  // Step 2 — campaign config (advanced)
  signature: string
  commentAfterPost: string
  commentImage: MediaFile | null
  reactAfterPost: boolean
  randomPickOneImage: boolean
  requestAdminPermission: boolean
  requestAdminPermissionTone: AdminPermissionTone
}

interface PostCampaignActions {
  setStep: (step: PostCampaignStep) => void
  toggleGroup: (g: PostGroup) => void
  selectAllGroups: (all: PostGroup[]) => void
  clearGroups: () => void
  setSelectedGroups: (groups: PostGroup[]) => void
  updateSlot: (idx: number, slot: PostSlot) => void
  addPost: () => void
  removePost: (idx: number) => void
  switchPost: (idx: number) => void
  setCampaignName: (v: string) => void
  setSkipAfterErrors: (v: number) => void
  setMaxGroups: (v: number) => void
  setGroupOrder: (v: GroupOrder) => void
  setAnonymous: (v: boolean) => void
  setSkipFailed: (v: boolean) => void
  setSignature: (v: string) => void
  setCommentAfterPost: (v: string) => void
  setCommentImage: (img: MediaFile | null) => void
  setReactAfterPost: (v: boolean) => void
  setRandomPickOneImage: (v: boolean) => void
  setRequestAdminPermission: (v: boolean) => void
  setRequestAdminPermissionTone: (v: AdminPermissionTone) => void
  resetCampaign: (t?: TFunction) => void
}

const initialState = (t?: TFunction): PostCampaignState => ({
  step: 1,
  selectedGroups: [],
  posts: [emptySlot()],
  currentPostIdx: 0,
  campaignName: randomCampaignName(t),
  skipAfterErrors: 15,
  maxGroups: 0,
  groupOrder: "top_down",
  anonymous: false,
  skipFailed: false,
  signature: "",
  commentAfterPost: "",
  commentImage: null,
  reactAfterPost: false,
  randomPickOneImage: false,
  requestAdminPermission: false,
  requestAdminPermissionTone: "quick"
})

/** Wizard state of the post campaign tool (kept across sidebar navigation, like the source zustand store). */
export const usePostCampaignStore = create<
  PostCampaignState & PostCampaignActions
>((set) => ({
  ...initialState(),

  setStep: (step) => set({ step }),

  toggleGroup: (g) =>
    set((s) => ({
      selectedGroups: s.selectedGroups.find((x) => x.groupId === g.groupId)
        ? s.selectedGroups.filter((x) => x.groupId !== g.groupId)
        : [...s.selectedGroups, g]
    })),
  selectAllGroups: (all) => set({ selectedGroups: [...all] }),
  clearGroups: () => set({ selectedGroups: [] }),
  setSelectedGroups: (groups) => set({ selectedGroups: groups }),

  updateSlot: (idx, slot) =>
    set((s) => ({ posts: s.posts.map((p, i) => (i === idx ? slot : p)) })),
  addPost: () =>
    set((s) => {
      if (s.posts.length >= POST_CAMPAIGN_MAX_POSTS) return s
      return {
        posts: [...s.posts, emptySlot()],
        currentPostIdx: s.posts.length
      }
    }),
  removePost: (idx) =>
    set((s) => {
      if (s.posts.length <= 1) return s
      const posts = s.posts.filter((_, i) => i !== idx)
      return {
        posts,
        currentPostIdx: Math.min(s.currentPostIdx, posts.length - 1)
      }
    }),
  switchPost: (idx) => set({ currentPostIdx: idx }),

  setCampaignName: (v) => set({ campaignName: v }),
  setSkipAfterErrors: (v) => set({ skipAfterErrors: v }),
  setMaxGroups: (v) => set({ maxGroups: v }),
  setGroupOrder: (v) => set({ groupOrder: v }),
  setAnonymous: (v) => set({ anonymous: v }),
  setSkipFailed: (v) => set({ skipFailed: v }),
  setSignature: (v) => set({ signature: v }),
  setCommentAfterPost: (v) => set({ commentAfterPost: v }),
  setCommentImage: (img) => set({ commentImage: img }),
  setReactAfterPost: (v) => set({ reactAfterPost: v }),
  setRandomPickOneImage: (v) => set({ randomPickOneImage: v }),
  setRequestAdminPermission: (v) => set({ requestAdminPermission: v }),
  setRequestAdminPermissionTone: (v) => set({ requestAdminPermissionTone: v }),

  resetCampaign: (t) => set(initialState(t))
}))
