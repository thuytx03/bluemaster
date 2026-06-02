const HAPPY_EMOJIS = ['😊', '😃', '😄', '😁', '😆', '😍', '🥰', '😋', '😎', '🤗', '👍', '👌', '✌️', '🎉', '🎊']
const SURPRISED_EMOJIS = ['😲', '😮', '😯', '🤯', '😱', '🙀', '😳']
const SAD_EMOJIS = ['😢', '😭', '😔', '😞', '😟', '😕', '🙁', '☹️']

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Xử lý template tin nhắn:
 * - [u] → tên người nhận
 * - [r] → random emoji vui
 * - [q] → emoji buồn
 * - [y] → emoji ngạc nhiên (fanpage) hoặc "Gọi" (profile)
 * - [x] → "Xưng" (chỉ profile)
 * - a|b|c → spin: chọn ngẫu nhiên 1 option
 */
export function processMessageTemplate(
  template: string,
  fullName: string,
  xung = '',
  goi = '',
  category: 'fanpage' | 'profile' = 'fanpage'
): string {
  if (!template) return ''
  let result = template

  // [u] - tên người nhận
  result = result.replace(/\[u\]/gi, fullName ?? '')

  if (category === 'profile') {
    // [x] - Xưng (người gửi)
    const xungValue = xung?.trim() ?? ''
    result = result.replace(/\[x\]/gi, xungValue)

    // [y] - Gọi (người nhận, chỉ profile)
    const goiValue = goi?.trim() ?? ''
    result = result.replace(/\[y\]/gi, goiValue)
  } else {
    // [y] là emoji ngạc nhiên cho fanpage
    result = result.replace(/\[y\]/gi, () => pickRandom(SURPRISED_EMOJIS))
  }

  // [r] - random emoji vui
  result = result.replace(/\[r\]/gi, () => pickRandom(HAPPY_EMOJIS))

  // [q] - emoji buồn
  result = result.replace(/\[q\]/gi, () => pickRandom(SAD_EMOJIS))

  // Spin: a|b|c → chọn ngẫu nhiên
  result = result.replace(/([^|\n\r]+(?:\|[^|\n\r]+)+)/g, (match) => {
    const options = match.split('|').map((o) => o.trim()).filter(Boolean)
    if (options.length > 1) return pickRandom(options)
    return match
  })

  return result
}

/**
 * Validate template: trả về lỗi nếu có, null nếu hợp lệ
 */
export function validateTemplate(template: string): string | null {
  if (!template.trim()) return 'Nội dung tin nhắn không được để trống'
  return null
}

/**
 * Preview template với dữ liệu mẫu
 */
export function previewTemplate(template: string, category: 'fanpage' | 'profile' = 'fanpage'): string {
  return processMessageTemplate(
    template,
    'Nguyễn Văn A',
    category === 'profile' ? 'Mình' : '',
    category === 'profile' ? 'Bạn' : '',
    category
  )
}

/**
 * Đếm số option spin trong template
 */
export function countSpinOptions(template: string): number {
  const matches = template.match(/([^|\n\r]+(?:\|[^|\n\r]+)+)/g)
  return matches ? matches.length : 0
}

export default {
  processMessageTemplate,
  validateTemplate,
  previewTemplate,
  countSpinOptions,
}
