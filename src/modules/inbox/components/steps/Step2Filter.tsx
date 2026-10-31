import { Filter, Search, Users } from "lucide-react"
import React, { useMemo, useState } from "react"

import {
  Badge,
  Button,
  Checkbox,
  cn,
  Field,
  Input,
  Select,
  StatTile,
  Surface
} from "src/modules/shared/ui"

import useInboxFilter from "src/modules/inbox/hooks/useInboxFilter"
import useInboxStore from "src/modules/inbox/stores/inbox.store"
import {
  TFriendFilter,
  TGenderFilter,
  TPhoneFilter,
  TSenderTypeFilter
} from "src/modules/inbox/types/inbox.types"
import {
  computeSplitFileCount,
  formatNumber,
  shouldShowSplitFile,
  SPLIT_FILE_SIZE
} from "src/modules/inbox/utils/inbox-filter.util"
import StepFooter from "src/modules/inbox/components/StepFooter"

const TagChip = ({
  active,
  tone,
  onClick,
  children
}: {
  active: boolean
  tone: "brand" | "danger"
  onClick: () => void
  children: React.ReactNode
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "bm-inline-flex bm-h-6 bm-items-center bm-rounded-lg bm-border bm-px-2 bm-text-[11px] bm-font-medium bm-transition-colors",
      active
        ? tone === "brand"
          ? "bm-border-brand/40 bm-bg-brand-soft bm-text-brand-ink"
          : "bm-border-danger/40 bm-bg-danger-soft bm-text-danger"
        : "bm-border-line bm-bg-surface bm-text-fg-muted hover:bm-border-line-strong hover:bm-text-fg"
    )}>
    {children}
  </button>
)

const Step2Filter: React.FC = () => {
  const { campaign, nextStep, prevStep, toggleExcludeCustomer, setExcludedCustomerIds } =
    useInboxStore()
  const { filters, filterStats, filteredCount, updateFilter, clearFilter } = useInboxFilter()

  const [search, setSearch] = useState("")

  const showSplit = shouldShowSplitFile(campaign.totalCustomers)
  const splitCount = computeSplitFileCount(campaign.totalCustomers)

  const excludedSet = useMemo(
    () => new Set(campaign.excludedCustomerIds),
    [campaign.excludedCustomerIds]
  )
  const selectedCount = filteredCount - campaign.excludedCustomerIds.length

  const displayList = useMemo(() => {
    if (!search.trim()) return campaign.filteredCustomers
    const q = search.toLowerCase()
    return campaign.filteredCustomers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.id.includes(q)
    )
  }, [campaign.filteredCustomers, search])

  const handleSelectAll = () => setExcludedCustomerIds([])
  const handleDeselectAll = () =>
    setExcludedCustomerIds(campaign.filteredCustomers.map((c) => c.id))

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
    <div className="bm-flex bm-flex-col bm-gap-4">
      <div className="bm-flex bm-items-start bm-justify-between bm-gap-3">
        <div>
          <div className="bm-text-[14px] bm-font-semibold bm-text-fg">Lọc đối tượng</div>
          <div className="bm-text-[12px] bm-text-fg-muted">{campaign.fanpageName}</div>
        </div>
        <Button size="sm" variant="ghost" onClick={clearFilter}>
          Xóa bộ lọc
        </Button>
      </div>

      {/* Stats */}
      <div className="bm-grid bm-grid-cols-3 bm-gap-2">
        <StatTile size="sm" label="Tổng" value={formatNumber(campaign.totalCustomers)} icon={<Users size={15} />} />
        <StatTile
          size="sm"
          label="Sau lọc"
          value={formatNumber(filteredCount)}
          tone={filteredCount > 0 ? "success" : "danger"}
        />
        <StatTile
          size="sm"
          label="Sẽ gửi"
          value={formatNumber(selectedCount)}
          tone={selectedCount > 0 ? "brand" : "danger"}
        />
      </div>

      <div className="bm-grid bm-grid-cols-1 bm-gap-4 pw-md:bm-grid-cols-2">
        {/* LEFT: Filters */}
        <div className="bm-flex bm-flex-col bm-gap-3">
          {showSplit && (
            <Surface padding="sm" title="Chia tệp gửi">
              <Select<number>
                value={filters.split_file_index}
                onChange={(v) => updateFilter({ split_file_index: v })}
                options={[{ value: 0, label: "-- Không chia tệp --" }, ...splitOptions]}
              />
              <div className="bm-mt-1.5 bm-text-[11.5px] bm-text-fg-subtle">
                Chia nhỏ theo ngày thêm (cũ → mới), mỗi tệp tối đa {formatNumber(SPLIT_FILE_SIZE)} user
              </div>
            </Surface>
          )}

          <Surface padding="sm" title="Bộ lọc" icon={<Filter size={14} />}>
            <div className="bm-flex bm-flex-col bm-gap-3">
              <Field label="Giới tính">
                <Select<TGenderFilter>
                  size="sm"
                  value={filters.gender}
                  onChange={(v) => updateFilter({ gender: v })}
                  options={[
                    { value: "all", label: `Tất cả (${formatNumber(stats?.total ?? 0)})` },
                    { value: "male", label: `Nam (${formatNumber(stats?.gender.male ?? 0)})` },
                    { value: "female", label: `Nữ (${formatNumber(stats?.gender.female ?? 0)})` },
                    { value: "unknown", label: `Chưa xác định (${formatNumber(stats?.gender.unknown ?? 0)})` }
                  ]}
                />
              </Field>
              <Field label="Số điện thoại">
                <Select<TPhoneFilter>
                  size="sm"
                  value={filters.phone}
                  onChange={(v) => updateFilter({ phone: v })}
                  options={[
                    { value: "all", label: "Tất cả" },
                    { value: "has_phone", label: `Có SĐT (${formatNumber(stats?.phone.has_phone ?? 0)})` },
                    { value: "no_phone", label: `Không có SĐT (${formatNumber(stats?.phone.no_phone ?? 0)})` }
                  ]}
                />
              </Field>
              <Field label="Bạn bè">
                <Select<TFriendFilter>
                  size="sm"
                  value={filters.friend}
                  onChange={(v) => updateFilter({ friend: v })}
                  options={[
                    { value: "all", label: "Tất cả" },
                    { value: "friend", label: `Đang kết bạn (${formatNumber(stats?.friend.friend ?? 0)})` },
                    { value: "not_friend", label: `Chưa kết bạn (${formatNumber(stats?.friend.not_friend ?? 0)})` }
                  ]}
                />
              </Field>
              <Field label="Loại người gửi">
                <Select<TSenderTypeFilter>
                  size="sm"
                  value={filters.sender_type}
                  onChange={(v) => updateFilter({ sender_type: v })}
                  options={[
                    { value: "all", label: "Tất cả" },
                    { value: "customer", label: `Khách nhắn trước (${formatNumber(stats?.sender_type.customer ?? 0)})` },
                    { value: "page", label: `Page nhắn trước (${formatNumber(stats?.sender_type.page ?? 0)})` }
                  ]}
                />
              </Field>

              {stats && stats.tags.length > 0 && (
                <>
                  <div className="bm-h-px bm-bg-line" />
                  <Field label="Tags (bao gồm)">
                    <div className="bm-flex bm-flex-wrap bm-gap-1.5">
                      {stats.tags.map((tg) => (
                        <TagChip
                          key={tg.name}
                          tone="brand"
                          active={filters.tags.includes(tg.name)}
                          onClick={() => {
                            const newTags = filters.tags.includes(tg.name)
                              ? filters.tags.filter((x) => x !== tg.name)
                              : [...filters.tags, tg.name]
                            updateFilter({ tags: newTags })
                          }}>
                          {tg.name} ({tg.count})
                        </TagChip>
                      ))}
                    </div>
                  </Field>
                  <Field label="Tags (loại trừ)">
                    <div className="bm-flex bm-flex-wrap bm-gap-1.5">
                      {stats.tags.map((tg) => (
                        <TagChip
                          key={tg.name}
                          tone="danger"
                          active={filters.exclude_tags.includes(tg.name)}
                          onClick={() => {
                            const newTags = filters.exclude_tags.includes(tg.name)
                              ? filters.exclude_tags.filter((x) => x !== tg.name)
                              : [...filters.exclude_tags, tg.name]
                            updateFilter({ exclude_tags: newTags })
                          }}>
                          {tg.name} ({tg.count})
                        </TagChip>
                      ))}
                    </div>
                  </Field>
                </>
              )}

              <Checkbox
                size="sm"
                checked={filters.exclude_blocked}
                onChange={(c) => updateFilter({ exclude_blocked: c })}
                label="Bỏ qua người dùng bị chặn"
              />
            </div>
          </Surface>
        </div>

        {/* RIGHT: Recipient selection */}
        <Surface
          padding="none"
          title="Chọn người nhận"
          description={`${formatNumber(selectedCount)} / ${formatNumber(filteredCount)} đã chọn`}
          extra={
            <>
              <Button size="xs" variant="link" onClick={handleSelectAll}>
                Chọn tất cả
              </Button>
              <span className="bm-text-fg-subtle">|</span>
              <Button size="xs" variant="link" className="bm-text-danger" onClick={handleDeselectAll}>
                Bỏ tất cả
              </Button>
            </>
          }>
          <div className="bm-p-2">
            <Input
              size="sm"
              prefix={<Search size={13} />}
              placeholder="Tìm theo tên hoặc ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="bm-max-h-80 bm-overflow-y-auto bm-border-t bm-border-line/70">
            {displayList.length === 0 && (
              <div className="bm-py-6 bm-text-center bm-text-[12px] bm-text-fg-subtle">
                {search ? "Không tìm thấy" : "Không có khách hàng nào"}
              </div>
            )}
            {displayList.map((c) => {
              const checked = !excludedSet.has(c.id)
              return (
                <div
                  key={c.id}
                  onClick={() => toggleExcludeCustomer(c.id)}
                  className={cn(
                    "bm-flex bm-cursor-pointer bm-items-center bm-gap-2.5 bm-px-3 bm-py-1.5 bm-transition-colors hover:bm-bg-surface-2",
                    !checked && "bm-opacity-45"
                  )}>
                  <Checkbox size="sm" checked={checked} onChange={() => toggleExcludeCustomer(c.id)} />
                  <span
                    className={cn(
                      "bm-h-2 bm-w-2 bm-shrink-0 bm-rounded-full",
                      c.gender === "male" ? "bm-bg-info" : c.gender === "female" ? "bm-bg-pink-500" : "bm-bg-fg-subtle"
                    )}
                  />
                  <div className="bm-min-w-0 bm-flex-1">
                    <div className="bm-truncate bm-text-[12.5px] bm-font-medium bm-text-fg">{c.name}</div>
                    <div className="bm-truncate bm-font-mono bm-text-[10.5px] bm-text-fg-subtle">{c.id}</div>
                  </div>
                  {c.tags && c.tags.length > 0 && (
                    <Badge tone="info" size="xs">
                      {c.tags[0]}
                    </Badge>
                  )}
                </div>
              )
            })}
          </div>
        </Surface>
      </div>

      <StepFooter
        onBack={prevStep}
        onNext={nextStep}
        nextDisabled={selectedCount === 0}
        nextLabel={`Tiếp theo: Soạn tin (${formatNumber(selectedCount)})`}
      />
    </div>
  )
}

export default Step2Filter
