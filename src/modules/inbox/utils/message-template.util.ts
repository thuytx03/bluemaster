const HAPPY_EMOJIS = ['😊', '😃', '😄', '😁', '😆', '😍', '🥰', '😋', '😎', '🤗', '👍', '👌', '✌️', '🎉', '🎊']
const SURPRISED_EMOJIS = ['😲', '😮', '😯', '🤯', '😱', '🙀', '😳']
const SAD_EMOJIS = ['😢', '😭', '😔', '😞', '😟', '😕', '🙁', '☹️']

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export type TTemplateCategory = 'fanpage' | 'profile'

/**
 * Placeholders a template may contain. Readable `{...}` tokens are the documented
 * syntax; the single-letter `[u] [r] [q] [y] [x]` forms from older versions still work.
 */
export const TEMPLATE_TOKENS = {
  name: { token: '{name}', legacy: '[u]', label: 'Tên khách hàng', profileOnly: false },
  me: { token: '{me}', legacy: '[x]', label: 'Cách bạn xưng (Mình, Em, Shop...)', profileOnly: true },
  you: { token: '{you}', legacy: '[y]', label: 'Cách gọi khách (Bạn, Anh, Chị...)', profileOnly: true },
  emoji: { token: '{emoji}', legacy: '[r]', label: 'Emoji vui ngẫu nhiên', profileOnly: false },
  wow: { token: '{wow}', legacy: '[y]', label: 'Emoji ngạc nhiên ngẫu nhiên', profileOnly: false },
  sad: { token: '{sad}', legacy: '[q]', label: 'Emoji buồn ngẫu nhiên', profileOnly: false },
  spin: { token: '{a|b|c}', legacy: 'a|b|c', label: 'Chọn ngẫu nhiên một trong các lựa chọn', profileOnly: false }
} as const

const replaceToken = (text: string, pattern: RegExp, value: () => string) => text.replace(pattern, value)

/**
 * Fill a template for one recipient.
 * - {name} / [u]   -> recipient's full name
 * - {me} / [x]     -> how the sender refers to themselves (profile only)
 * - {you} / [y]    -> how the recipient is addressed (profile only; on fanpage [y] is a surprised emoji)
 * - {emoji} / [r]  -> random happy emoji
 * - {wow}          -> random surprised emoji
 * - {sad} / [q]    -> random sad emoji
 * - {a|b|c}        -> one option picked at random (legacy bare `a|b|c` is still accepted)
 */
export function processMessageTemplate(
  template: string,
  fullName: string,
  xung = '',
  goi = '',
  category: TTemplateCategory = 'fanpage'
): string {
  if (!template) return ''
  let result = template

  result = replaceToken(result, /\{name\}|\[u\]/gi, () => fullName ?? '')

  if (category === 'profile') {
    result = replaceToken(result, /\{me\}|\[x\]/gi, () => xung?.trim() ?? '')
    result = replaceToken(result, /\{you\}|\[y\]/gi, () => goi?.trim() ?? '')
  } else {
    // On a fanpage there is no "xưng/gọi"; legacy [y] meant a surprised emoji
    result = replaceToken(result, /\{me\}|\[x\]/gi, () => '')
    result = replaceToken(result, /\{you\}/gi, () => '')
    result = replaceToken(result, /\[y\]/gi, () => pickRandom(SURPRISED_EMOJIS))
  }

  result = replaceToken(result, /\{emoji\}|\[r\]/gi, () => pickRandom(HAPPY_EMOJIS))
  result = replaceToken(result, /\{wow\}/gi, () => pickRandom(SURPRISED_EMOJIS))
  result = replaceToken(result, /\{sad\}|\[q\]/gi, () => pickRandom(SAD_EMOJIS))

  // Spin with braces: {a|b|c}
  result = result.replace(/\{([^{}\n]*\|[^{}\n]*)\}/g, (_, inner: string) => {
    const options = inner.split('|').map((o) => o.trim()).filter(Boolean)
    return options.length > 1 ? pickRandom(options) : inner
  })

  // Legacy bare spin: a|b|c (kept for templates written with older versions)
  result = result.replace(/([^|\n\r{}]+(?:\|[^|\n\r{}]+)+)/g, (match) => {
    const options = match.split('|').map((o) => o.trim()).filter(Boolean)
    return options.length > 1 ? pickRandom(options) : match
  })

  return result.replace(/[ \t]{2,}/g, ' ')
}

/** Returns an error message, or null when the template is usable */
export function validateTemplate(template: string): string | null {
  if (!template.trim()) return 'Nội dung tin nhắn không được để trống'
  return null
}

/** Render the template with sample data for the preview panel */
export function previewTemplate(template: string, category: TTemplateCategory = 'fanpage'): string {
  return processMessageTemplate(
    template,
    'Nguyễn Văn A',
    category === 'profile' ? 'Mình' : '',
    category === 'profile' ? 'Bạn' : '',
    category
  )
}

/** Number of spin groups in the template (both `{a|b}` and legacy `a|b`) */
export function countSpinOptions(template: string): number {
  const braced = template.match(/\{[^{}\n]*\|[^{}\n]*\}/g)?.length ?? 0
  const bare = template.match(/([^|\n\r{}]+(?:\|[^|\n\r{}]+)+)/g)?.length ?? 0
  return braced + bare
}

export default {
  processMessageTemplate,
  validateTemplate,
  previewTemplate,
  countSpinOptions
}
