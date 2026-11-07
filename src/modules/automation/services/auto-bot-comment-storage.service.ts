/**
 * Local persistence of the auto-bot-comment tool in chrome.storage.local.
 * Replaces xthuy-social's Laravel endpoints:
 *  - /api/v1/extension/bot-comments (+ /{id}, /{id}/mark-run)  -> bots
 *  - /api/v1/extension/comment-templates (+ /{id})              -> templates
 *  - /api/v1/extension/group-library/topics|items               -> a library the
 *    user manages (topics + groups), fed from synced groups or pasted lists.
 */
import type {
  BotCommentGroup,
  BotCommentItem,
  BotCommentPayload,
  CommentTemplate,
  CommentTemplateInput,
  GroupLibraryItem,
  GroupLibraryTopic
} from "src/modules/automation/types/auto-bot-comment.types"
import { chromeUtils } from "src/utils/chrome.util"

const BOTS_KEY = "AUTO_BOT_COMMENT_BOTS"
const TEMPLATES_KEY = "AUTO_BOT_COMMENT_TEMPLATES"
const LIBRARY_KEY = "AUTO_BOT_COMMENT_GROUP_LIBRARY"

interface LibraryStore {
  topics: { id: number; name: string }[]
  items: GroupLibraryItem[]
}

const nowIso = () => new Date().toISOString()

/** Numeric id that stays unique within `existing`. */
const nextId = (existing: { id: number }[]) =>
  Math.max(Date.now(), ...existing.map((e) => e.id + 1))

const readList = async <T>(key: string): Promise<T[]> =>
  (await chromeUtils.getStorage<T[]>(key)) ?? []

// ─── Bots ────────────────────────────────────────────────────────────────────

/** Newest first, like the API. */
export async function listBots(): Promise<BotCommentItem[]> {
  const bots = await readList<BotCommentItem>(BOTS_KEY)
  return [...bots].sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function createBot(
  data: BotCommentPayload
): Promise<BotCommentItem> {
  const bots = await readList<BotCommentItem>(BOTS_KEY)
  const at = nowIso()
  const bot: BotCommentItem = {
    ...data,
    id: nextId(bots),
    last_run_at: null,
    created_at: at,
    updated_at: at
  }
  await chromeUtils.setStorage(BOTS_KEY, [bot, ...bots])
  return bot
}

export async function updateBot(
  id: number,
  data: Partial<BotCommentItem>
): Promise<BotCommentItem | null> {
  const bots = await readList<BotCommentItem>(BOTS_KEY)
  const idx = bots.findIndex((b) => b.id === id)
  if (idx < 0) return null
  const updated: BotCommentItem = {
    ...bots[idx],
    ...data,
    id,
    updated_at: nowIso()
  }
  bots[idx] = updated
  await chromeUtils.setStorage(BOTS_KEY, bots)
  return updated
}

export async function deleteBot(id: number): Promise<void> {
  const bots = await readList<BotCommentItem>(BOTS_KEY)
  await chromeUtils.setStorage(
    BOTS_KEY,
    bots.filter((b) => b.id !== id)
  )
}

export async function markBotRun(id: number): Promise<string> {
  const at = nowIso()
  await updateBot(id, { last_run_at: at })
  return at
}

// ─── Comment templates ──────────────────────────────────────────────────────

export async function listTemplates(): Promise<CommentTemplate[]> {
  return readList<CommentTemplate>(TEMPLATES_KEY)
}

export async function createTemplate(
  data: CommentTemplateInput
): Promise<CommentTemplate> {
  const list = await listTemplates()
  const at = nowIso()
  const tpl: CommentTemplate = {
    id: nextId(list),
    name: data.name,
    content: data.content,
    image_urls: data.image_urls?.length ? data.image_urls : null,
    created_at: at,
    updated_at: at
  }
  await chromeUtils.setStorage(TEMPLATES_KEY, [...list, tpl])
  return tpl
}

export async function updateTemplate(
  id: number,
  data: Partial<CommentTemplateInput>
): Promise<CommentTemplate | null> {
  const list = await listTemplates()
  const idx = list.findIndex((t) => t.id === id)
  if (idx < 0) return null
  const updated: CommentTemplate = {
    ...list[idx],
    ...data,
    image_urls:
      data.image_urls === undefined
        ? list[idx].image_urls
        : data.image_urls?.length
          ? data.image_urls
          : null,
    updated_at: nowIso()
  }
  list[idx] = updated
  await chromeUtils.setStorage(TEMPLATES_KEY, list)
  return updated
}

export async function deleteTemplate(id: number): Promise<void> {
  const list = await listTemplates()
  await chromeUtils.setStorage(
    TEMPLATES_KEY,
    list.filter((t) => t.id !== id)
  )
}

// ─── Group library ──────────────────────────────────────────────────────────

const readLibrary = async (): Promise<LibraryStore> => {
  const store = await chromeUtils.getStorage<LibraryStore>(LIBRARY_KEY)
  return { topics: store?.topics ?? [], items: store?.items ?? [] }
}
const writeLibrary = (store: LibraryStore) =>
  chromeUtils.setStorage(LIBRARY_KEY, store)

/** Topics with their group count, in creation order. */
export async function listLibraryTopics(): Promise<GroupLibraryTopic[]> {
  const { topics, items } = await readLibrary()
  return topics.map((t) => ({
    ...t,
    count: items.filter((i) => i.topic_id === t.id).length
  }))
}

/** Groups of the given topics (deduplicated by group id), filtered by `q`. */
export async function listLibraryItems(
  topicIds: number[],
  q?: string,
  normalize: (s: string) => string = (s) => s.toLowerCase()
): Promise<GroupLibraryItem[]> {
  const { items } = await readLibrary()
  const wanted = new Set(topicIds)
  const query = q ? normalize(q) : ""
  const seen = new Set<string>()
  const out: GroupLibraryItem[] = []
  for (const item of items) {
    if (!wanted.has(item.topic_id) || seen.has(item.group_id)) continue
    if (
      query &&
      !normalize(item.group_name).includes(query) &&
      !item.group_id.includes(query)
    )
      continue
    seen.add(item.group_id)
    out.push(item)
  }
  return out
}

export async function createLibraryTopic(
  name: string
): Promise<GroupLibraryTopic> {
  const store = await readLibrary()
  const topic = { id: nextId(store.topics), name: name.trim() }
  store.topics.push(topic)
  await writeLibrary(store)
  return { ...topic, count: 0 }
}

export async function renameLibraryTopic(
  id: number,
  name: string
): Promise<void> {
  const store = await readLibrary()
  store.topics = store.topics.map((t) =>
    t.id === id ? { ...t, name: name.trim() } : t
  )
  await writeLibrary(store)
}

/** Deletes a topic together with its groups. */
export async function deleteLibraryTopic(id: number): Promise<void> {
  const store = await readLibrary()
  store.topics = store.topics.filter((t) => t.id !== id)
  store.items = store.items.filter((i) => i.topic_id !== id)
  await writeLibrary(store)
}

/** Adds groups to a topic, skipping those already in it. Returns how many were added. */
export async function addLibraryItems(
  topicId: number,
  groups: (BotCommentGroup & { memberCount?: string | number })[]
): Promise<number> {
  const store = await readLibrary()
  const existing = new Set(
    store.items.filter((i) => i.topic_id === topicId).map((i) => i.group_id)
  )
  let added = 0
  for (const g of groups) {
    if (!g.groupId || existing.has(g.groupId)) continue
    existing.add(g.groupId)
    store.items.push({
      group_id: g.groupId,
      group_name: g.groupName || g.groupId,
      avatar_url: g.avatarUrl ?? null,
      member_count: Number(String(g.memberCount ?? "").replace(/\D/g, "")) || 0,
      topic_id: topicId
    })
    added++
  }
  await writeLibrary(store)
  return added
}

/** Removes groups from the given topics. */
export async function removeLibraryItems(
  topicIds: number[],
  groupIds: string[]
): Promise<void> {
  const store = await readLibrary()
  const topics = new Set(topicIds)
  const groups = new Set(groupIds)
  store.items = store.items.filter(
    (i) => !(topics.has(i.topic_id) && groups.has(i.group_id))
  )
  await writeLibrary(store)
}

const autoBotCommentStorageService = {
  listBots,
  createBot,
  updateBot,
  deleteBot,
  markBotRun,
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  listLibraryTopics,
  listLibraryItems,
  createLibraryTopic,
  renameLibraryTopic,
  deleteLibraryTopic,
  addLibraryItems,
  removeLibraryItems
}
export default autoBotCommentStorageService
