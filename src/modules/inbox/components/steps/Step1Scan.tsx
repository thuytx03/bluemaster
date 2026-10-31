import { MessageSquare, RefreshCw, Search, Users } from "lucide-react"
import React, { useEffect, useMemo, useState } from "react"

import {
  Avatar,
  Badge,
  Button,
  Callout,
  cn,
  EmptyState,
  Input,
  Progress,
  SectionLabel,
  Spinner,
  Surface
} from "src/modules/shared/ui"

import useInboxScan from "src/modules/inbox/hooks/useInboxScan"
import useInboxStore from "src/modules/inbox/stores/inbox.store"
import { IFanpage } from "src/modules/inbox/types/inbox.types"
import StepFooter from "src/modules/inbox/components/StepFooter"

const Step1Scan: React.FC = () => {
  const { pages, campaign, nextStep } = useInboxStore()
  const {
    loadingPages,
    scanningInbox,
    scanProgress,
    scanTotal,
    pageLoadError,
    scanError,
    fetchPages,
    startScan
  } = useInboxScan()

  const [search, setSearch] = useState("")
  const [selectedPage, setSelectedPage] = useState<IFanpage | null>(null)

  useEffect(() => {
    if (pages.length === 0) fetchPages()
    // Load the page list once when entering step 1
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredPages = useMemo(() => {
    if (!search.trim()) return pages
    return pages.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
  }, [pages, search])

  const handleSelectAndScan = async (page: IFanpage) => {
    setSelectedPage(page)
    await startScan(page)
  }

  const handleNext = () => {
    if (campaign.totalCustomers > 0) nextStep()
  }

  const scanPercent = scanTotal > 0 ? Math.round((scanProgress / scanTotal) * 100) : 0

  return (
    <div className="bm-flex bm-flex-col bm-gap-4">
      <div className="bm-flex bm-items-start bm-justify-between bm-gap-3">
        <div>
          <div className="bm-text-[14px] bm-font-semibold bm-text-fg">
            Chọn Fanpage hoặc Profile để quét khách hàng
          </div>
          <div className="bm-text-[12px] bm-text-fg-muted">
            Nhấn vào một trang để bắt đầu quét hộp thư.
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          icon={<RefreshCw size={13} className={cn(loadingPages && "bm-animate-spin")} />}
          onClick={fetchPages}
          loading={loadingPages}>
          Làm mới
        </Button>
      </div>

      {pageLoadError && <Callout tone="danger" compact>{pageLoadError}</Callout>}
      {scanError && <Callout tone="danger" compact>{scanError}</Callout>}

      <Input
        prefix={<Search size={14} />}
        placeholder="Tìm kiếm Fanpage..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Page list */}
      <div>
        <SectionLabel hint={`${filteredPages.length} trang`}>Danh sách trang</SectionLabel>
        <div className="bm-max-h-72 bm-overflow-y-auto bm-rounded-xl2 bm-border bm-border-line bm-bg-surface">
          {loadingPages ? (
            <div className="bm-flex bm-flex-col bm-gap-2 bm-p-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="bm-flex bm-items-center bm-gap-3 bm-p-2">
                  <span className="bm-h-10 bm-w-10 bm-rounded-full x-skeleton bm-animate-shimmer" />
                  <span className="bm-flex bm-flex-1 bm-flex-col bm-gap-1.5">
                    <span className="bm-h-3 bm-w-1/2 bm-rounded-full x-skeleton bm-animate-shimmer" />
                    <span className="bm-h-2.5 bm-w-1/3 bm-rounded-full x-skeleton bm-animate-shimmer" />
                  </span>
                </div>
              ))}
            </div>
          ) : filteredPages.length === 0 ? (
            <EmptyState
              compact
              icon={<Users size={18} />}
              title={search ? "Không tìm thấy trang phù hợp" : "Chưa có trang nào"}
            />
          ) : (
            <ul className="bm-divide-y bm-divide-line/70">
              {filteredPages.map((page) => {
                const isSelected = selectedPage?.id === page.id
                const isScanning = isSelected && scanningInbox
                return (
                  <li key={page.id}>
                    <button
                      type="button"
                      disabled={scanningInbox}
                      onClick={() => !scanningInbox && handleSelectAndScan(page)}
                      className={cn(
                        "bm-flex bm-w-full bm-items-center bm-gap-3 bm-px-3 bm-py-2.5 bm-text-left bm-transition-colors",
                        isSelected ? "bm-bg-brand-soft/60" : "hover:bm-bg-surface-2",
                        scanningInbox && !isSelected && "bm-opacity-50"
                      )}>
                      <Avatar src={page.avatar} name={page.name} size={40} />
                      <div className="bm-min-w-0 bm-flex-1">
                        <div className="bm-flex bm-items-center bm-gap-2">
                          <span className="bm-truncate bm-text-[13px] bm-font-semibold bm-text-fg">
                            {page.name}
                          </span>
                          <Badge tone={page.type === "profile" ? "success" : "info"} size="xs">
                            {page.type === "profile" ? "Profile" : "Fanpage"}
                          </Badge>
                        </div>
                        <div className="bm-truncate bm-font-mono bm-text-[11px] bm-text-fg-subtle">
                          ID: {page.id}
                        </div>
                      </div>
                      {isScanning && <Spinner size={16} className="bm-text-brand-ink" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Scan progress */}
      {scanningInbox && (
        <Surface tone="info" padding="sm" className="bm-animate-fade-in">
          <div className="bm-flex bm-flex-col bm-gap-2">
            <div className="bm-flex bm-items-center bm-justify-between bm-text-[12.5px]">
              <span className="bm-text-fg">
                Đang quét inbox của <strong>{selectedPage?.name}</strong>…
              </span>
              <span className="bm-font-semibold bm-tabular-nums bm-text-info">
                {scanProgress.toLocaleString()}
              </span>
            </div>
            <Progress value={scanPercent} tone="info" striped label />
            <span className="bm-text-[11.5px] bm-text-fg-muted">
              Đã tìm thấy {scanProgress.toLocaleString()} khách hàng
            </span>
          </div>
        </Surface>
      )}

      {/* Result summary */}
      {!scanningInbox && campaign.totalCustomers > 0 && (
        <Surface tone="success" padding="sm" className="bm-animate-fade-in">
          <div className="bm-flex bm-items-center bm-gap-3">
            <span className="bm-inline-flex bm-h-10 bm-w-10 bm-items-center bm-justify-center bm-rounded-xl bm-bg-success/15 bm-text-success">
              <Users size={18} />
            </span>
            <div className="bm-min-w-0">
              <div className="bm-text-[13px] bm-font-semibold bm-text-fg">
                Quét hoàn tất! Tìm thấy {campaign.totalCustomers.toLocaleString()} khách hàng
              </div>
              <div className="bm-truncate bm-text-[11.5px] bm-text-fg-muted">Fanpage: {campaign.fanpageName}</div>
            </div>
          </div>
        </Surface>
      )}

      <StepFooter
        onNext={handleNext}
        nextDisabled={campaign.totalCustomers === 0}
        nextIcon={<MessageSquare size={14} />}
        nextLabel={`Tiếp theo: Lọc đối tượng (${campaign.totalCustomers.toLocaleString()})`}
      />
    </div>
  )
}

export default Step1Scan
