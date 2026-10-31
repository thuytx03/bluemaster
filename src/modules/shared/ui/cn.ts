import clsx, { ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Tailwind is configured with the `bm-` prefix so the extension's utilities
 * can never collide with the host page. tailwind-merge does not know about a
 * Tailwind v3 style prefix, so classes are un-prefixed before merging and
 * re-prefixed afterwards.
 */
export const TW_PREFIX = "bm-"

/** Classes that are hand-written in style.css and must never be prefixed. */
const isCustom = (name: string) =>
  name.startsWith("x-") || name.startsWith("bluemaster-")

/** Index of the last variant separator (":" outside of square brackets), or -1. */
const lastVariantColon = (token: string) => {
  let depth = 0
  let idx = -1
  for (let i = 0; i < token.length; i++) {
    const ch = token[i]
    if (ch === "[") depth++
    else if (ch === "]") depth--
    else if (ch === ":" && depth === 0) idx = i
  }
  return idx
}

const splitToken = (token: string) => {
  const i = lastVariantColon(token)
  const head = token.slice(0, i + 1)
  let rest = token.slice(i + 1)
  let mods = ""
  while (rest.startsWith("!") || rest.startsWith("-")) {
    mods += rest[0]
    rest = rest.slice(1)
  }
  return { head, mods, rest }
}

export const unprefixClass = (token: string) => {
  const { head, mods, rest } = splitToken(token)
  return head + mods + (rest.startsWith(TW_PREFIX) ? rest.slice(TW_PREFIX.length) : rest)
}

export const prefixClass = (token: string) => {
  const { head, mods, rest } = splitToken(token)
  if (!rest || isCustom(rest) || rest.startsWith(TW_PREFIX)) return token
  return head + mods + TW_PREFIX + rest
}

export const cn = (...inputs: ClassValue[]) => {
  const raw = clsx(inputs)
  if (!raw) return raw
  const merged = twMerge(raw.split(/\s+/).filter(Boolean).map(unprefixClass).join(" "))
  return merged.split(/\s+/).filter(Boolean).map(prefixClass).join(" ")
}
