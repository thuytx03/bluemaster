import dayjs from "dayjs"
import { CheckCircle2, Coffee, Download, Pause, Play, RotateCcw, SkipForward, Square, XCircle } from "lucide-react"
import React, { useEffect, useMemo, useRef } from "react"

import {
  Badge,
  Button,
  Callout,
  DataColumn,
  DataTable,
  Progress,
  Spinner,
  StatTile,
  Surface,
  TBadgeTone
} from "src/modules/shared/ui"

import useMessageSender from "src/modules/inbox/hooks/useMessageSender"
import useInboxStore from "src/modules/inbox/stores/inbox.store"
import { ISendLogEntry } from "src/modules/inbox/types/inbox.types"
import { formatNumber } from "src/modules/inbox/utils/inbox-filter.util"

const STATUS_TONE: Record<string, TBadgeTone> = {
  success: "success",
  failure: "danger",
  skipped: "warning"
}

const STATUS_LABEL: Record<string, string> = {
  success: "Thành công",
  failure: "Thất bại",
  skipped: "Bỏ qua"
}

const Step6Send: React.FC = () => {
  const { campaign, resetCampaign, setStep } = useInboxStore()
  const { sendProgress, startError, startSending, pauseSending, resumeSending, stopSending } =
    useMessageSender()

  const hasStarted = useRef(false)

  // Auto-start khi vào step 6 lần đầu
  useEffect(() => {
    if (!hasStarted.current && sendProgress.status === "idle") {
      hasStarted.current = true
      startSending()
    }
    // Auto-start exactly once when entering step 6
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const {
    status,
    currentIndex,
    total,
    successCount,
    failureCount,
    skippedCount,
    percent,
    currentCustomer,
    restUntil,
    logs
  } = sendProgress

  const isRunning = status === "running"
  const isPaused = status === "paused"
  const isResting = status === "resting"
  const isDone = status === "finished" || status === "stopped"

  const restSecondsLeft = restUntil > Date.now() ? Math.ceil((restUntil - Date.now()) / 1000) : 0

  const handleExportReport = () => {
    const csvRows = [
      ["Tên", "ID", "Trạng thái", "Thời gian", "Lỗi"],
      ...logs.map((l) => [
        l.customerName,
        l.customerId,
        STATUS_LABEL[l.status],
        dayjs(l.timestamp).format("HH:mm:ss"),
        l.error ?? ""
      ])
    ]
    const csv = csvRows.map((r) => r.join(",")).join("\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `bao_cao_${campaign.fanpageName}_${dayjs().format("YYYYMMDD_HHmm")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const logColumns = useMemo<DataColumn<ISendLogEntry>[]>(
    () => [
      {
        key: "time",
        title: "Thời gian",
        width: 76,
        render: (r) => (
          <span className="bm-font-mono bm-text-[11px] bm-text-fg-muted">{dayjs(r.timestamp).format("HH:mm:ss")}</span>
        )
      },
      {
        key: "customer",
        title: "Khách hàng",
        render: (r) => (
          <div className="bm-min-w-0">
            <div className="bm-truncate bm-text-[12px] bm-font-medium bm-text-fg">{r.customerName}</div>
            <div className="bm-truncate bm-font-mono bm-text-[10.5px] bm-text-fg-subtle">{r.customerId}</div>
          </div>
        )
      },
      {
        key: "status",
        title: "Trạng thái",
        width: 100,
        render: (r) => (
          <Badge tone={STATUS_TONE[r.status]} size="xs">
            {STATUS_LABEL[r.status]}
          </Badge>
        )
      },
      {
        key: "error",
        title: "Lỗi",
        render: (r) => (r.error ? <span className="bm-text-[11.5px] bm-text-danger">{r.error}</span> : null)
      }
    ],
    []
  )

  const statusView = (() => {
    if (isRunning && currentCustomer)
      return (
        <span className="bm-flex bm-items-center bm-gap-2">
          <Spinner size={14} className="bm-text-brand-ink" />
          Đang gửi tới <strong className="bm-text-brand-ink">{currentCustomer.name}</strong>
        </span>
      )
    if (isPaused) return <Badge tone="warning" icon={<Pause size={12} />}>Đã tạm dừng</Badge>
    if (isResting)
      return (
        <Badge tone="info" icon={<Coffee size={12} />}>
          Đang nghỉ… ({restSecondsLeft}s)
        </Badge>
      )
    if (status === "finished") return <Badge tone="success" icon={<CheckCircle2 size={12} />}>Hoàn thành!</Badge>
    if (status === "stopped") return <Badge tone="danger" icon={<Square size={12} />}>Đã dừng</Badge>
    return <span className="bm-text-fg-subtle">Đang khởi động...</span>
  })()

  const successRate = total > 0 ? Math.round((successCount / total) * 100) : 0

  return (
    <div className="bm-flex bm-flex-col bm-gap-4">
      <div className="bm-flex bm-items-start bm-justify-between bm-gap-3">
        <div>
          <div className="bm-text-[14px] bm-font-semibold bm-text-fg">Gửi tin nhắn</div>
          <div className="bm-text-[12px] bm-text-fg-muted">{campaign.fanpageName}</div>
        </div>
        {isDone && (
          <Button
            size="sm"
            variant="outline"
            icon={<RotateCcw size={13} />}
            onClick={() => {
              resetCampaign()
              setStep(1)
            }}>
            Chiến dịch mới
          </Button>
        )}
      </div>

      {startError && (
        <Callout tone="danger" compact>
          {startError}
        </Callout>
      )}

      {/* Progress */}
      <Surface padding="md">
        <div className="bm-flex bm-flex-col bm-gap-3">
          <div className="bm-flex bm-items-center bm-justify-between bm-gap-3 bm-text-[13px] bm-text-fg">
            {statusView}
            <span className="bm-font-mono bm-text-[12px] bm-text-fg-muted">
              {currentIndex}/{total}
            </span>
          </div>
          <Progress
            value={percent}
            size="md"
            striped={!isDone}
            tone={isDone ? (status === "finished" ? "success" : "danger") : isResting ? "info" : "brand"}
            label
          />
        </div>
      </Surface>

      {/* Stats */}
      <div className="bm-grid bm-grid-cols-2 bm-gap-2 pw-sm:bm-grid-cols-4">
        <StatTile size="sm" label="Thành công" value={formatNumber(successCount)} tone="success" icon={<CheckCircle2 size={15} />} />
        <StatTile size="sm" label="Thất bại" value={formatNumber(failureCount)} tone="danger" icon={<XCircle size={15} />} />
        <StatTile size="sm" label="Bỏ qua" value={formatNumber(skippedCount)} tone="warning" icon={<SkipForward size={15} />} />
        <StatTile size="sm" label="Tỷ lệ" value={`${successRate}%`} tone="brand" />
      </div>

      {/* Controls */}
      <div className="bm-flex bm-flex-wrap bm-gap-2">
        {isRunning && (
          <Button icon={<Pause size={14} />} onClick={pauseSending}>
            Tạm dừng
          </Button>
        )}
        {isPaused && (
          <Button variant="primary" icon={<Play size={14} />} onClick={resumeSending}>
            Tiếp tục
          </Button>
        )}
        {!isDone && (
          <Button variant="danger" icon={<Square size={14} />} onClick={stopSending}>
            Dừng chiến dịch
          </Button>
        )}
        {isDone && (
          <Button variant="outline" icon={<Download size={14} />} onClick={handleExportReport}>
            Xuất báo cáo CSV
          </Button>
        )}
      </div>

      {/* Log */}
      <Surface padding="none" title={`Nhật ký gửi tin`} description={`${logs.length} dòng`} className="bm-overflow-hidden">
        <DataTable
          columns={logColumns}
          rows={[...logs].reverse()}
          rowKey={(r) => r.id}
          dense
          maxHeight={240}
          className="bm-rounded-none bm-border-0"
          emptyTitle="Chưa có nhật ký"
        />
      </Surface>

      <div className="bm-text-[12px] bm-text-fg-muted">
        {formatNumber(successCount)} tin đã gửi thành công / {formatNumber(total)} tổng
      </div>
    </div>
  )
}

export default Step6Send
