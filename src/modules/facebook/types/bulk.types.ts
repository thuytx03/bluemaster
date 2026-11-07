export interface BulkState<T extends string = string> {
  type: T
  total: number
  current: number
  success: number
  fail: number
}

export type FriendsBulkState = BulkState<
  "unfriend" | "block" | "unblock" | "restrict" | "unrestrict" | "poke"
>
