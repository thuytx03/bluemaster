import { Clock, MessageSquare, RefreshCw, RotateCcw, Search, Square, Users, Zap } from "lucide-react"
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
  Segmented,
  Spinner,
  Surface,
  Tooltip
} from "src/modules/shared/ui"

import useInboxScan from "src/modules/inbox/hooks/useInboxScan"
import useInboxStore from "src/modules/inbox/stores/inbox.store"
import { IFanpage } from "src/modules/inbox/types/inbox.types"
import StepFooter from "src/modules/inbox/components/StepFooter"

const CONCURRENCY_OPTIONS = [1, 2, 3, 4].map((n) => ({ value: n, label: String(n) }))

const formatDuration = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return `${m}m ${String(s % 60).padStart(2, "0")}s`
}

const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })

/** Ticks once a second while `active` so elapsed time can be rendered */
const useNow = (active: boolean) => {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [active])
  return now
}

const Step1Scan: React.FC = () => {
  const { pages, campaign, nextStep } = useInboxStore()
  const {
    loadingPages,
    scanningInbox,
    scanProgress,
    scanStartedAt,
    pageLoadError,
    scanError,
    scanInfo,
    concurrency,
    setConcurrency,
    fetchPages,
    pagesFetchedAt,
    startScan,
    stopScan
  } = useInboxScan()

  const [search, setSearch] = useState("")
  const [selectedPage, setSelectedPage] = useState<IFanpage | null>(null)
  const [stopping, setStopping] = useState(false)
  const now = useNow(scanningInbox)

  useEffect(() => {
    if (pages.length === 0) fetchPages()
    // Load the page list once when entering step 1
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!scanningInbox) setStopping(false)
  }, [scanningInbox])

  const filteredPages = useMemo(() => {
    if (!search.trim()) return pages
    return pages.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
  }, [pages, search])

  const handleSelectAndScan = async (page: IFanpage) => {
    setSelectedPage(page)
    await startScan(page)
  }

  const handleRescan = (mode: "auto" | "full") => {
    const page = selectedPage ?? pages.find((p) => p.id === campaign.fanpageId)
    if (page) {
      setSelectedPage(page)
      startScan(page, mode)
    }
  }

  const handleStop = () => {
    setStopping(true)
    stopScan()
  }

  const handleNext = () => {
    if (campaign.totalCustomers > 0) nextStep()
  }

  const elapsedMs = scanStartedAt ? now - scanStartedAt : 0
  const rate = elapsedMs > 2000 ? Math.round((scanProgress / elapsedMs) * 60000) : 0

  return (
    <div className="bm-flex bm-flex-col bm-gap-4">
      <div className="bm-flex bm-items-start bm-justify-between bm-gap-3">
        <div>
          <div className="bm-text-[14px] bm-font-semibold bm-text-fg">
            Chọn Fanpage hoặc Profile để quét khách hàng
          </div>
          <div className="bm-text-[12px] bm-text-fg-muted">
            Nhấn vào một trang để bắt đầu quét hộp thư. Lần quét sau chỉ lấy thêm hội thoại mới.
          </div>
        </div>
        <div className="bm-flex bm-flex-col bm-items-end bm-gap-1">
          <Button
            size="sm"
            variant="outline"
            icon={<RefreshCw size={13} className={cn(loadingPages && "bm-animate-spin")} />}
            onClick={() => fetchPages(true)}
            loading={loadingPages}
            disabled={scanningInbox}>
            Làm mới
          </Button>
          {pagesFetchedAt && (
            <span className="bm-text-[11px] bm-text-fg-subtle">
              Cập nhật lúc {formatTime(pagesFetchedAt)} · tự làm mới sau 15 phút
            </span>
          )}
        </div>
      </div>

      {pageLoadError && <Callout tone="danger" compact>{pageLoadError}</Callout>}
      {scanError && <Callout tone="danger" compact>{scanError}</Callout>}

      <div className="bm-flex bm-items-center bm-gap-3">
        <Input
          className="bm-flex-1"
          prefix={<Search size={14} />}
          placeholder="Tìm kiếm Fanpage..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Tooltip content="Số luồng quét song song. Nhiều luồng nhanh hơn nhưng dễ bị Facebook giới hạn tạm thời; 3 là mức cân bằng.">
          <div className="bm-flex bm-items-center bm-gap-2">
            <span className="bm-inline-flex bm-items-center bm-gap-1 bm-text-[12px] bm-text-fg-muted">
              <Zap size={13} /> Luồng
            </span>
            <Segmented
              size="sm"
              value={concurrency}
              onChange={setConcurrency}
              options={scanningInbox ? CONCURRENCY_OPTIONS.map((o) => ({ ...o, disabled: true })) : CONCURRENCY_OPTIONS}
            />
          </div>
        </Tooltip>
      </div>

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
            <div className="bm-flex bm-items-center bm-justify-between bm-gap-3 bm-text-[12.5px]">
              <span className="bm-min-w-0 bm-truncate bm-text-fg">
                {stopping ? "Đang dừng, giữ lại kết quả đã quét…" : (
                  <>Đang quét inbox của <strong>{selectedPage?.name}</strong>…</>
                )}
              </span>
              <Button size="xs" variant="outline" icon={<Square size={11} />} onClick={handleStop} disabled={stopping}>
                Dừng &amp; dùng kết quả
              </Button>
            </div>
            <Progress value={100} tone="info" striped />
            <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-x-4 bm-gap-y-1 bm-text-[11.5px] bm-text-fg-muted">
              <span>
                Đã tìm thấy <strong className="bm-tabular-nums bm-text-fg">{scanProgress.toLocaleString()}</strong> khách hàng
              </span>
              <span className="bm-inline-flex bm-items-center bm-gap-1 bm-tabular-nums">
                <Clock size={11} /> {formatDuration(elapsedMs)}
              </span>
              {rate > 0 && <span className="bm-tabular-nums">~{rate.toLocaleString()} khách/phút</span>}
              <span>{concurrency} luồng</span>
            </div>
          </div>
        </Surface>
      )}

      {/* Result summary */}
      {!scanningInbox && campaign.totalCustomers > 0 && (
        <Surface tone={scanInfo && !scanInfo.complete ? "warning" : "success"} padding="sm" className="bm-animate-fade-in">
          <div className="bm-flex bm-items-center bm-gap-3">
            <span
              className={cn(
                "bm-inline-flex bm-h-10 bm-w-10 bm-shrink-0 bm-items-center bm-justify-center bm-rounded-xl",
                scanInfo && !scanInfo.complete ? "bm-bg-warning/15 bm-text-warning" : "bm-bg-success/15 bm-text-success"
              )}>
              <Users size={18} />
            </span>
            <div className="bm-min-w-0 bm-flex-1">
              <div className="bm-text-[13px] bm-font-semibold bm-text-fg">
                {scanInfo && !scanInfo.complete ? "Đã dừng sớm. " : "Quét hoàn tất! "}
                Có {campaign.totalCustomers.toLocaleString()} khách hàng
              </div>
              <div className="bm-truncate bm-text-[11.5px] bm-text-fg-muted">
                {campaign.fanpageName}
                {scanInfo && (
                  <>
                    {" · "}
                    {scanInfo.fromCache
                      ? `${scanInfo.changed.toLocaleString()} mới/cập nhật`
                      : `${scanInfo.requests} lượt gọi`}
                    {" · "}
                    {formatDuration(scanInfo.elapsedMs)} · lúc {formatTime(scanInfo.scannedAt)}
                  </>
                )}
              </div>
              {scanInfo?.warning && (
                <div className="bm-truncate bm-text-[11.5px] bm-text-warning">{scanInfo.warning}</div>
              )}
            </div>
            <div className="bm-flex bm-shrink-0 bm-items-center bm-gap-1.5">
              <Tooltip content="Chỉ lấy thêm hội thoại mới kể từ lần quét trước">
                <Button size="xs" variant="outline" icon={<RefreshCw size={12} />} onClick={() => handleRescan("auto")}>
                  Cập nhật
                </Button>
              </Tooltip>
              <Tooltip content="Bỏ kết quả đã lưu và quét lại toàn bộ hộp thư">
                <Button size="xs" variant="ghost" icon={<RotateCcw size={12} />} onClick={() => handleRescan("full")}>
                  Quét lại từ đầu
                </Button>
              </Tooltip>
            </div>
          </div>
        </Surface>
      )}

      <StepFooter
        onNext={handleNext}
        nextDisabled={campaign.totalCustomers === 0 || scanningInbox}
        nextIcon={<MessageSquare size={14} />}
        nextLabel={`Tiếp theo: Lọc đối tượng (${campaign.totalCustomers.toLocaleString()})`}
      />
    </div>
  )
}

export default Step1Scan
