import { Alert, Avatar, Button, Card, Input, List, Progress, Spin, Tag, Typography } from 'antd'
import { MessageSquare, RefreshCw, Search, Users } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import useInboxScan from '../../hooks/useInboxScan'
import useInboxStore from '../../store/inbox.store'
import { IFanpage } from '../../types/inbox.interface'

const { Text, Title } = Typography

const Step1Scan: React.FC = () => {
  const { pages, campaign, nextStep } = useInboxStore()
  const { loadingPages, scanningInbox, scanProgress, scanTotal, pageLoadError, scanError, fetchPages, startScan } = useInboxScan()

  const [search, setSearch] = useState('')
  const [selectedPage, setSelectedPage] = useState<IFanpage | null>(null)

  useEffect(() => {
    if (pages.length === 0) fetchPages()
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Title level={5} className="!mb-0 dark:!text-gray-100">
          Chọn Fanpage hoặc Profile để quét khách hàng
        </Title>
        <Button icon={<RefreshCw size={14} />} onClick={fetchPages} loading={loadingPages} size="small" className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
          Làm mới
        </Button>
      </div>

      {pageLoadError && <Alert type="error" message={pageLoadError} showIcon />}
      {scanError && <Alert type="error" message={scanError} showIcon />}

      {/* Search */}
      <Input
        prefix={<Search size={14} />}
        placeholder="Tìm kiếm Fanpage..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        allowClear
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-500"
      />

      {/* Page list */}
      {loadingPages ? (
        <div className="flex justify-center py-8">
          <Spin size="large" />
        </div>
      ) : (
        <List
          dataSource={filteredPages}
          rowKey="id"
          className="max-h-64 overflow-y-auto border border-gray-100 dark:border-gray-700 rounded-lg"
          renderItem={(page) => {
            const isSelected = selectedPage?.id === page.id
            const isScanning = isSelected && scanningInbox
            return (
              <List.Item
                key={page.id}
                className={`cursor-pointer px-3 py-2 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500' : ''}`}
                onClick={() => !scanningInbox && handleSelectAndScan(page)}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar src={page.avatar || undefined} size={40}>
                      {page.name[0]}
                    </Avatar>
                  }
                  title={
                    <div className="flex items-center gap-2">
                      <Text strong className="dark:text-gray-200">{page.name}</Text>
                      <Tag color={page.type === 'profile' ? 'green' : 'blue'} className="text-xs">
                        {page.type === 'profile' ? 'Profile' : 'Fanpage'}
                      </Tag>
                    </div>
                  }
                  description={<Text className="text-xs text-gray-400 dark:text-gray-500">ID: {page.id}</Text>}
                />
                {isScanning && <Spin size="small" />}
              </List.Item>
            )
          }}
        />
      )}

      {/* Scan progress */}
      {scanningInbox && (
        <Card size="small" className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
          <div className="flex flex-col gap-2">
            <Text className="dark:text-gray-300">Đang quét inbox của <strong className="dark:text-blue-400">{selectedPage?.name}</strong>...</Text>
            <Progress percent={scanPercent} status="active" />
            <Text className="text-xs text-gray-500 dark:text-gray-400">Đã tìm thấy {scanProgress.toLocaleString()} khách hàng</Text>
          </div>
        </Card>
      )}

      {/* Result summary */}
      {!scanningInbox && campaign.totalCustomers > 0 && (
        <Card size="small" className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <div className="flex items-center gap-3">
            <Users size={20} className="text-green-600 dark:text-green-400" />
            <div>
              <Text strong className="text-green-700 dark:text-green-300">
                Quét hoàn tất! Tìm thấy {campaign.totalCustomers.toLocaleString()} khách hàng
              </Text>
              <br />
              <Text className="text-xs text-gray-500 dark:text-gray-400">Fanpage: {campaign.fanpageName}</Text>
            </div>
          </div>
        </Card>
      )}

      {/* Next button */}
      <div className="flex justify-end pt-2">
        <Button
          type="primary"
          icon={<MessageSquare size={14} />}
          disabled={campaign.totalCustomers === 0}
          onClick={handleNext}
        >
          Tiếp theo: Lọc đối tượng ({campaign.totalCustomers.toLocaleString()})
        </Button>
      </div>
    </div>
  )
}

export default Step1Scan
