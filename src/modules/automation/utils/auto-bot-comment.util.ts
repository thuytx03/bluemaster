import type {
  BotCommentGroup,
  BotCommentItem,
  BotWizardSettings,
  BotWizardState
} from "src/modules/automation/types/auto-bot-comment.types"

/** Number of spin variants shown on a template card (source heuristic). */
export function countSpin(text: string): number {
  return text.split("|").length
}

export function nowTs(): string {
  return new Date().toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  })
}

export function previewText(raw: string, emptyLabel: string, max = 30): string {
  const s = raw.replace(/\s+/g, " ").trim()
  if (s.length <= max) return s || emptyLabel
  return s.slice(0, max - 1) + "…"
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  })
}

/** One group per line: `groupId|name`, a group URL, or a bare id. */
export function parseCustomGroups(raw: string): BotCommentGroup[] {
  const seen = new Set<string>()
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|")
      if (parts.length >= 2)
        return { groupId: parts[0].trim(), groupName: parts[1].trim() }
      const m = line.match(/groups\/(\d+)/)
      const gid = m ? m[1] : line.replace(/\D/g, "").slice(0, 20)
      return { groupId: gid, groupName: gid }
    })
    .filter((g) => {
      if (!/^\d+$/.test(g.groupId) || seen.has(g.groupId)) return false
      seen.add(g.groupId)
      return true
    })
}

/** Reads up to `max` image files as data URLs. */
export function readImageFiles(files: File[], max = 10): Promise<string[]> {
  return Promise.all(
    files
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, max)
      .map(
        (file) =>
          new Promise<string>((res, rej) => {
            const r = new FileReader()
            r.onload = () => res(r.result as string)
            r.onerror = rej
            r.readAsDataURL(file)
          })
      )
  )
}

export const DEFAULT_BOT_SETTINGS: BotWizardSettings = {
  likePost: false,
  skipFailedGroups: false,
  delayMin: 60,
  delayMax: 120,
  batchCount: 5,
  batchRestMinutes: 10,
  skipAfterErrors: 10
}

export function emptyWizard(): BotWizardState {
  return {
    botName: `Bot Comment ${new Date().toLocaleString("vi-VN")}`,
    selectedContent: new Set(),
    selectedIdentities: new Set(),
    identityMap: new Map(),
    selectedGroups: new Map(),
    settings: { ...DEFAULT_BOT_SETTINGS }
  }
}

export function wizardFromBot(bot: BotCommentItem): BotWizardState {
  return {
    botName: bot.name,
    selectedContent: new Set(bot.template_ids),
    selectedIdentities: new Set(bot.identities.map((i) => i.id)),
    identityMap: new Map(bot.identities.map((i) => [i.id, i])),
    selectedGroups: new Map(bot.groups.map((g) => [g.groupId, g])),
    settings: {
      likePost: bot.like_post,
      skipFailedGroups: bot.skip_failed_groups,
      delayMin: bot.delay_min_sec,
      delayMax: bot.delay_max_sec,
      batchCount: bot.batch_count,
      batchRestMinutes: bot.batch_rest_minutes,
      skipAfterErrors: bot.stop_after_consecutive_errors
    }
  }
}
