import { Badge, Button, Card, Checkbox, Divider, Input, Select, Statistic, Tag, Typography } from 'antd'
import { ArrowLeft, ArrowRight, Filter, Search, Users } from 'lucide-react'
import React, { useMemo, useState } from 'react'
import useInboxFilter from '../../hooks/useInboxFilter'
import useInboxStore from '../../store/inbox.store'
import { formatNumber, shouldShowSplitFile, computeSplitFileCount, SPLIT_FILE_SIZE } from '../../utils/inbox-filter.util'
import { TFriendFilter, TGenderFilter, TPhoneFilter, TSenderTypeFilter } from '../../types/inbox.interface'

const { Text, Title } = Typography
const { Option } = Select

const Step2Filter: React.FC = () => {
  const { campaign, nextStep, prevStep, toggleExcludeCustomer, setExcludedCustomerIds } = useInboxStore()
  const { filters, filterStats, filteredCount, filteredPercent, updateFilter, clearFilter } = useInboxFilter()

  const [search, setSearch] = useState('')

  const showSplit = shouldShowSplitFile(campaign.totalCustomers)
  const splitCount = computeSplitFileCount(campaign.totalCustomers)

  const excludedSet = useMemo(() => new Set(campaign.excludedCustomerIds), [campaign.excludedCustomerIds])
  const selectedCount = filteredCount - campaign.excludedCustomerIds.length

  const displayList = useMemo(() => {
    if (!search.trim()) return campaign.filteredCustomers
    const q = search.toLowerCase()
    return campaign.filteredCustomers.filter((c) => c.name.toLowerCase().includes(q) || c.id.includes(q))
  }, [campaign.filteredCustomers, search])

  const handleSelectAll = () => setExcludedCustomerIds([])
  const handleDeselectAll = () => setExcludedCustomerIds(campaign.filteredCustomers.map((c) => c.id))

  const splitOptions = useMemo(() => {
    if (!showSplit) return []
    return Array.from({ length: splitCount }, (_, i) => {
      const start = i * SPLIT_FILE_SIZE
      const size = Math.min(SPLIT_FILE_SIZE, campaign.totalCustomers - start)
      return { value: i + 1, label: `Tệp ${i + 1} (${formatNumber(size)} user)` }
    })
  }, [showSplit, splitCount, campaign.totalCustomers])

  const stats = filterStats

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Title level={5} className="!mb-0 dark:!text-gray-100">
          Lọc đối tượng — {campaign.fanpageName}
        </Title>
        <Button size="small" onClick={clearFilter} className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">Xóa bộ lọc</Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* LEFT: Filters */}
        <div className="flex flex-col gap-3">
          {/* Chia tệp */}
          {showSplit && (
            <Card size="small" title={<span className="dark:text-gray-200">Chia Tệp Gửi</span>} className="dark:bg-gray-800 dark:border-gray-700">
              <Select
                className="w-full"
                value={filters.split_file_index}
                onChange={(v) => updateFilter({ split_file_index: v })}
              >
                <Option value={0}>-- Không chia tệp --</Option>
                {splitOptions.map((o) => (
                  <Option key={o.value} value={o.value}>{o.label}</Option>
                ))}
              </Select>
              <Text className="text-xs text-gray-400 dark:text-gray-500 mt-1 block">
                Chia nhỏ theo ngày thêm (cũ → mới), mỗi tệp tối đa {formatNumber(SPLIT_FILE_SIZE)} user
              </Text>
            </Card>
          )}

          {/* Filters */}
          <Card size="small" title={<span className="dark:text-gray-200"><Filter size={14} className="inline mr-1" />Bộ lọc</span>} className="dark:bg-gray-800 dark:border-gray-700">
            <div className="flex flex-col gap-3">
              {/* Giới tính */}
              <div>
                <Text className="text-xs font-medium text-gray-600 dark:text-gray-400">Giới tính</Text>
                <Select
                  className="w-full mt-1"
                  value={filters.gender}
                  onChange={(v) => updateFilter({ gender: v as TGenderFilter })}
                >
                  <Option value="all">Tất cả ({formatNumber(stats?.total ?? 0)})</Option>
                  <Option value="male">Nam ({formatNumber(stats?.gender.male ?? 0)})</Option>
                  <Option value="female">Nữ ({formatNumber(stats?.gender.female ?? 0)})</Option>
                  <Option value="unknown">Chưa xác định ({formatNumber(stats?.gender.unknown ?? 0)})</Option>
                </Select>
              </div>

              {/* Số điện thoại */}
              <div>
                <Text className="text-xs font-medium text-gray-600 dark:text-gray-400">Số điện thoại</Text>
                <Select
                  className="w-full mt-1"
                  value={filters.phone}
                  onChange={(v) => updateFilter({ phone: v as TPhoneFilter })}
                >
                  <Option value="all">Tất cả</Option>
                  <Option value="has_phone">Có SĐT ({formatNumber(stats?.phone.has_phone ?? 0)})</Option>
                  <Option value="no_phone">Không có SĐT ({formatNumber(stats?.phone.no_phone ?? 0)})</Option>
                </Select>
              </div>

              {/* Bạn bè */}
              <div>
                <Text className="text-xs font-medium text-gray-600 dark:text-gray-400">Bạn bè</Text>
                <Select
                  className="w-full mt-1"
                  value={filters.friend}
                  onChange={(v) => updateFilter({ friend: v as TFriendFilter })}
                >
                  <Option value="all">Tất cả</Option>
                  <Option value="friend">Đang kết bạn ({formatNumber(stats?.friend.friend ?? 0)})</Option>
                  <Option value="not_friend">Chưa kết bạn ({formatNumber(stats?.friend.not_friend ?? 0)})</Option>
                </Select>
              </div>

              {/* Loại người gửi */}
              <div>
                <Text className="text-xs font-medium text-gray-600 dark:text-gray-400">Loại người gửi</Text>
                <Select
                  className="w-full mt-1"
                  value={filters.sender_type}
                  onChange={(v) => updateFilter({ sender_type: v as TSenderTypeFilter })}
                >
                  <Option value="all">Tất cả</Option>
                  <Option value="customer">Khách nhắn trước ({formatNumber(stats?.sender_type.customer ?? 0)})</Option>
                  <Option value="page">Page nhắn trước ({formatNumber(stats?.sender_type.page ?? 0)})</Option>
                </Select>
              </div>

              {/* Tags */}
              {stats && stats.tags.length > 0 && (
                <>
                  <Divider className="my-1 dark:border-gray-700" />
                  <div>
                    <Text className="text-xs font-medium text-gray-600 dark:text-gray-400">Tags (bao gồm)</Text>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {stats.tags.map((t) => (
                        <Tag
                          key={t.name}
                          color={filters.tags.includes(t.name) ? 'blue' : 'default'}
                          className="cursor-pointer"
                          onClick={() => {
                            const newTags = filters.tags.includes(t.name)
                              ? filters.tags.filter((x) => x !== t.name)
                              : [...filters.tags, t.name]
                            updateFilter({ tags: newTags })
                          }}
                        >
                          {t.name} ({t.count})
                        </Tag>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Text className="text-xs font-medium text-gray-600 dark:text-gray-400">Tags (loại trừ)</Text>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {stats.tags.map((t) => (
                        <Tag
                          key={t.name}
                          color={filters.exclude_tags.includes(t.name) ? 'red' : 'default'}
                          className="cursor-pointer dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                          onClick={() => {
                            const newTags = filters.exclude_tags.includes(t.name)
                              ? filters.exclude_tags.filter((x) => x !== t.name)
                              : [...filters.exclude_tags, t.name]
                            updateFilter({ exclude_tags: newTags })
                          }}
                        >
                          {t.name} ({t.count})
                        </Tag>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Loại trừ blocked */}
              <Checkbox
                checked={filters.exclude_blocked}
                onChange={(e) => updateFilter({ exclude_blocked: e.target.checked })}
                className="dark:text-gray-300"
              >
                <Text className="text-xs dark:text-gray-300">Bỏ qua người dùng bị chặn</Text>
              </Checkbox>
            </div>
          </Card>
        </div>

        {/* RIGHT: Result + Customer selection */}
        <div className="flex flex-col gap-3">
          {/* Stats */}
          <Card size="small" className="dark:bg-gray-800 dark:border-gray-700">
            <div className="grid grid-cols-3 gap-2">
              <Statistic title={<span className="dark:text-gray-400">Tổng</span>} value={campaign.totalCustomers} prefix={<Users size={12} />} valueStyle={{ fontSize: 16, color: 'inherit' }} className="dark:text-gray-100" />
              <Statistic title={<span className="dark:text-gray-400">Sau lọc</span>} value={filteredCount} valueStyle={{ fontSize: 16, color: filteredCount > 0 ? '#16a34a' : '#dc2626' }} />
              <Statistic title={<span className="dark:text-gray-400">Sẽ gửi</span>} value={selectedCount} valueStyle={{ fontSize: 16, color: selectedCount > 0 ? '#2563eb' : '#dc2626' }} />
            </div>
          </Card>

          {/* Customer checkbox list */}
          <Card
            size="small"
            title={
              <div className="flex items-center justify-between dark:text-gray-200">
                <span>Chọn người nhận</span>
                <div className="flex gap-1">
                  <Button size="small" type="link" className="!p-0 !text-xs dark:text-blue-400" onClick={handleSelectAll}>
                    Chọn tất cả
                  </Button>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <Button size="small" type="link" className="!p-0 !text-xs text-red-400 dark:text-red-500" onClick={handleDeselectAll}>
                    Bỏ tất cả
                  </Button>
                </div>
              </div>
            }
            className="flex-1 dark:bg-gray-800 dark:border-gray-700"
          >
            <Input
              size="small"
              prefix={<Search size={12} />}
              placeholder="Tìm theo tên hoặc ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              className="mb-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-500"
            />
            <div className="max-h-72 overflow-y-auto flex flex-col gap-0.5">
              {displayList.length === 0 && (
                <Text className="text-xs text-gray-400 py-2 text-center block">
                  {search ? 'Không tìm thấy' : 'Không có khách hàng nào'}
                </Text>
              )}
              {displayList.map((c) => {
                const checked = !excludedSet.has(c.id)
                return (
                  <div
                    key={c.id}
                    className={`flex items-center gap-2 px-1 py-1 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!checked ? 'opacity-40' : ''}`}
                    onClick={() => toggleExcludeCustomer(c.id)}
                  >
                    <Checkbox checked={checked} onChange={() => toggleExcludeCustomer(c.id)} onClick={(e) => e.stopPropagation()} />
                    <Badge color={c.gender === 'male' ? 'blue' : c.gender === 'female' ? 'pink' : 'gray'} />
                    <div className="min-w-0 flex-1">
                      <Text className="text-xs font-medium block truncate dark:text-gray-200">{c.name}</Text>
                      <Text className="text-[10px] text-gray-400 dark:text-gray-500">{c.id}</Text>
                    </div>
                    {c.tags && c.tags.length > 0 && (
                      <Tag color="blue" className="!text-[9px] !px-1 !py-0 shrink-0">{c.tags[0]}</Tag>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <Button icon={<ArrowLeft size={14} />} onClick={prevStep}>Quay lại</Button>
        <Button
          type="primary"
          icon={<ArrowRight size={14} />}
          iconPosition="end"
          disabled={selectedCount === 0}
          onClick={nextStep}
        >
          Tiếp theo: Soạn tin ({formatNumber(selectedCount)})
        </Button>
      </div>
    </div>
  )
}

export default Step2Filter
