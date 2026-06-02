import { Alert, Button, Card, Progress, Statistic, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { CheckCircle, Download, Pause, Play, RotateCcw, Square, XCircle } from 'lucide-react'
import React, { useEffect, useRef } from 'react'
import useMessageSender from '../../hooks/useMessageSender'
import useInboxStore from '../../store/inbox.store'
import { ISendLogEntry } from '../../types/inbox.interface'
import { formatNumber } from '../../utils/inbox-filter.util'

const { Text, Title } = Typography

const STATUS_COLOR: Record<string, string> = {
  success: 'success',
  failure: 'error',
  skipped: 'warning',
}

const STATUS_LABEL: Record<string, string> = {
  success: 'Thành công',
  failure: 'Thất bại',
  skipped: 'Bỏ qua',
}

const logColumns: ColumnsType<ISendLogEntry> = [
  {
    title: 'Thời gian',
    dataIndex: 'timestamp',
    key: 'timestamp',
    width: 80,
    render: (ts: number) => <Text className="text-xs dark:text-gray-400">{dayjs(ts).format('HH:mm:ss')}</Text>,
  },
  {
    title: 'Khách hàng',
    dataIndex: 'customerName',
    key: 'customerName',
    render: (name: string, row) => (
      <div>
        <Text className="text-xs font-medium dark:text-gray-200">{name}</Text>
        <br />
        <Text className="text-xs text-gray-400 dark:text-gray-500">{row.customerId}</Text>
      </div>
    ),
  },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    render: (s: string) => <Tag color={STATUS_COLOR[s]}>{STATUS_LABEL[s]}</Tag>,
  },
  {
    title: 'Lỗi',
    dataIndex: 'error',
    key: 'error',
    render: (err?: string) => err ? <Text className="text-xs text-red-500">{err}</Text> : null,
  },
]

const Step6Send: React.FC = () => {
  const { campaign, resetCampaign, setStep } = useInboxStore()
  const { sendProgress, startError, startSending, pauseSending, resumeSending, stopSending } = useMessageSender()

  const logEndRef = useRef<HTMLDivElement>(null)
  const hasStarted = useRef(false)

  // Auto-start khi vào step 6 lần đầu
  useEffect(() => {
    if (!hasStarted.current && sendProgress.status === 'idle') {
      hasStarted.current = true
      startSending()
    }
  }, [])

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [sendProgress.logs.length])

  const { status, currentIndex, total, successCount, failureCount, skippedCount, percent, currentCustomer, restUntil, logs } = sendProgress

  const isRunning = status === 'running'
  const isPaused = status === 'paused'
  const isResting = status === 'resting'
  const isDone = status === 'finished' || status === 'stopped'

  const restSecondsLeft = restUntil > Date.now() ? Math.ceil((restUntil - Date.now()) / 1000) : 0

  const handleExportReport = () => {
    const csvRows = [
      ['Tên', 'ID', 'Trạng thái', 'Thời gian', 'Lỗi'],
      ...logs.map((l) => [l.customerName, l.customerId, STATUS_LABEL[l.status], dayjs(l.timestamp).format('HH:mm:ss'), l.error ?? '']),
    ]
    const csv = csvRows.map((r) => r.join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bao_cao_${campaign.fanpageName}_${dayjs().format('YYYYMMDD_HHmm')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Title level={5} className="!mb-0 dark:!text-gray-100">
          Gửi tin nhắn — {campaign.fanpageName}
        </Title>
        {isDone && (
          <Button icon={<RotateCcw size={14} />} onClick={() => { resetCampaign(); setStep(1) }}>
            Chiến dịch mới
          </Button>
        )}
      </div>

      {startError && <Alert type="error" message={startError} showIcon />}

      {/* Progress */}
      <Card size="small" className="dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Text className="text-sm dark:text-gray-300">
              {isRunning && currentCustomer && (
                <span>Đang gửi tới: <strong className="dark:text-blue-400">{currentCustomer.name}</strong></span>
              )}
              {isPaused && <span className="text-yellow-600 dark:text-yellow-500">Đã tạm dừng</span>}
              {isResting && <span className="text-blue-600 dark:text-blue-400">Đang nghỉ... ({restSecondsLeft}s)</span>}
              {status === 'finished' && <span className="text-green-600 dark:text-green-500">Hoàn thành!</span>}
              {status === 'stopped' && <span className="text-red-500 dark:text-red-400">Đã dừng</span>}
              {status === 'idle' && <span className="text-gray-400 dark:text-gray-600">Đang khởi động...</span>}
            </Text>
            <Text className="text-xs text-gray-400 dark:text-gray-600">{currentIndex}/{total}</Text>
          </div>
          <Progress
            percent={percent}
            status={isDone ? (status === 'finished' ? 'success' : 'exception') : 'active'}
            strokeColor={isResting ? '#3b82f6' : undefined}
          />
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card size="small" className="dark:bg-gray-800 dark:border-gray-700">
          <Statistic
            title={<span className="dark:text-gray-400">Thành công</span>}
            value={successCount}
            prefix={<CheckCircle size={14} className="text-green-500" />}
            valueStyle={{ color: '#16a34a' }}
          />
        </Card>
        <Card size="small" className="dark:bg-gray-800 dark:border-gray-700">
          <Statistic
            title={<span className="dark:text-gray-400">Thất bại</span>}
            value={failureCount}
            prefix={<XCircle size={14} className="text-red-500" />}
            valueStyle={{ color: '#dc2626' }}
          />
        </Card>
        <Card size="small" className="dark:bg-gray-800 dark:border-gray-700">
          <Statistic title={<span className="dark:text-gray-400">Bỏ qua</span>} value={skippedCount} valueStyle={{ color: '#d97706' }} />
        </Card>
        <Card size="small" className="dark:bg-gray-800 dark:border-gray-700">
          <Statistic title={<span className="dark:text-gray-400">Tỷ lệ</span>} value={total > 0 ? Math.round((successCount / total) * 100) : 0} suffix={<span className="dark:text-gray-400">%</span>} valueStyle={{ color: 'inherit' }} className="dark:text-gray-100" />
        </Card>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {isRunning && (
          <Button icon={<Pause size={14} />} onClick={pauseSending}>Tạm dừng</Button>
        )}
        {isPaused && (
          <Button type="primary" icon={<Play size={14} />} onClick={resumeSending}>Tiếp tục</Button>
        )}
        {!isDone && (
          <Button danger icon={<Square size={14} />} onClick={stopSending}>Dừng chiến dịch</Button>
        )}
        {isDone && (
          <Button icon={<Download size={14} />} onClick={handleExportReport}>Xuất báo cáo CSV</Button>
        )}
      </div>

      {/* Log */}
      <Card
        size="small"
        title={<span className="dark:text-gray-200">Nhật ký gửi tin ({logs.length} dòng)</span>}
        className="flex-1 dark:bg-gray-800 dark:border-gray-700"
        bodyStyle={{ padding: 0 }}
      >
        <div className="max-h-48 overflow-y-auto">
          <Table
            dataSource={[...logs].reverse()}
            columns={logColumns}
            rowKey="id"
            size="small"
            pagination={false}
            scroll={{ x: true }}
          />
          <div ref={logEndRef} />
        </div>
      </Card>

      <div className="dark:text-gray-400">
        {formatNumber(successCount)} tin đã gửi thành công / {formatNumber(total)} tổng
      </div>
    </div>
  )
}

export default Step6Send
