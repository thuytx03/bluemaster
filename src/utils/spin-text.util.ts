/**
 * Random-variant ("spin") text helpers shared by the bulk posting / commenting
 * tools. Each tool keeps the syntax its xthuy-social original documented.
 */

const pick = <T>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)]
/** Trimmed, non-empty options of `a | b | c`. */
export const splitOptions = (text: string) =>
  text
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean)

/** `Chào {anh|chị} {bạn|nhé}` → every `{a|b|c}` group replaced by one option. */
export function spinBraces(raw: string): string {
  return raw.replace(/\{([^{}]+)\}/g, (_, inner: string) => {
    const parts = splitOptions(inner)
    return parts.length ? pick(parts) : ""
  })
}

/** `a | b | c` → the whole text is one choice list (no `|` → unchanged). */
export function spinBare(raw: string): string {
  if (!raw.includes("|")) return raw
  const parts = splitOptions(raw)
  return parts.length > 1 ? pick(parts) : raw
}
