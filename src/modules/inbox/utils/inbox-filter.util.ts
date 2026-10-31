import { ICustomer, IFilterStats, IInboxFilter } from 'src/modules/inbox/types/inbox.types'

export const SPLIT_FILE_SIZE = 3000

/**
 * Áp dụng bộ lọc lên danh sách customers
 */
export function applyFilter(customers: ICustomer[], filter: IInboxFilter): ICustomer[] {
  let result = [...customers]

  // Loại trừ user bị blocked
  if (filter.exclude_blocked) {
    result = result.filter((c) => !c.isBlocked)
  }

  // Lọc giới tính
  if (filter.gender !== 'all') {
    result = result.filter((c) => c.gender === filter.gender)
  }

  // Lọc có/không có phone
  if (filter.phone !== 'all') {
    result = result.filter((c) => (filter.phone === 'has_phone' ? c.hasPhone : !c.hasPhone))
  }

  // Lọc bạn bè
  if (filter.friend !== 'all') {
    result = result.filter((c) => (filter.friend === 'friend' ? c.isFriend : !c.isFriend))
  }

  // Lọc loại người gửi
  if (filter.sender_type !== 'all') {
    result = result.filter((c) => c.senderType === filter.sender_type)
  }

  // Lọc theo tags (include - phải có ít nhất 1 trong tags)
  if (filter.tags.length > 0) {
    result = result.filter((c) => filter.tags.some((tag) => c.tags?.includes(tag)))
  }

  // Loại trừ theo tags
  if (filter.exclude_tags.length > 0) {
    result = result.filter((c) => !filter.exclude_tags.some((tag) => c.tags?.includes(tag)))
  }

  // Chia tệp
  if (filter.split_file_index > 0) {
    const size = filter.split_file_size ?? SPLIT_FILE_SIZE
    const start = (filter.split_file_index - 1) * size
    result = result.slice(start, start + size)
  }

  return result
}

/**
 * Tính toán thống kê từ danh sách customers
 */
export function computeFilterStats(customers: ICustomer[], category: 'fanpage' | 'profile'): IFilterStats {
  const stats: IFilterStats = {
    total: customers.length,
    category,
    gender: { male: 0, female: 0, unknown: 0 },
    phone: { has_phone: 0, no_phone: 0 },
    friend: { friend: 0, not_friend: 0 },
    sender_type: { customer: 0, page: 0 },
    tags: [],
  }

  const tagMap = new Map<string, number>()

  customers.forEach((c) => {
    // Gender
    stats.gender[c.gender ?? 'unknown']++

    // Phone
    if (c.hasPhone) stats.phone.has_phone++
    else stats.phone.no_phone++

    // Friend
    if (c.isFriend) stats.friend.friend++
    else stats.friend.not_friend++

    // Sender type
    if (c.senderType === 'customer') stats.sender_type.customer++
    else if (c.senderType === 'page') stats.sender_type.page++

    // Tags
    c.tags?.forEach((tag) => {
      tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1)
    })
  })

  stats.tags = Array.from(tagMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))

  return stats
}

/**
 * Tính số tệp cần chia
 */
export function computeSplitFileCount(total: number, fileSize = SPLIT_FILE_SIZE): number {
  return Math.ceil(total / fileSize)
}

/**
 * Kiểm tra có nên hiển thị tùy chọn chia tệp không
 */
export function shouldShowSplitFile(total: number, fileSize = SPLIT_FILE_SIZE): boolean {
  return total > fileSize
}

/**
 * Format số với dấu phân cách nghìn
 */
export function formatNumber(num: number): string {
  if (!num) return '0'
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
}

export default {
  applyFilter,
  computeFilterStats,
  computeSplitFileCount,
  shouldShowSplitFile,
  formatNumber,
  SPLIT_FILE_SIZE,
}
