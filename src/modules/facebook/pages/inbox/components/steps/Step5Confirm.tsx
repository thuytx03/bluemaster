import { Alert, Button, Card, Descriptions, Divider, Tag, Typography } from 'antd'
import { ArrowLeft, CheckCircle, MessageSquare, Send, Users } from 'lucide-react'
import React from 'react'
import useInboxStore from '../../store/inbox.store'
import { previewTemplate } from '../../utils/message-template.util'
import { formatNumber } from '../../utils/inbox-filter.util'

const { Text, Title } = Typography

const ATTACHMENT_LABELS: Record<string, string> = {
  image: 'Hình ảnh',
  video: 'Video',
  audio: 'Âm thanh',
  file: 'File',
  '': 'Không có',
}

const GENDER_LABELS: Record<string, string> = {
  all: 'Tất cả',
  male: 'Nam',
  female: 'Nữ',
  unknown: 'Chưa xác định',
}

const ORDER_LABELS: Record<string, string> = {
  '1': 'Cũ → Mới',
  '2': 'Mới → Cũ',
  '3': 'Ngẫu nhiên',
}

const Step5Confirm: React.FC = () => {
  const { campaign, nextStep, prevStep } = useInboxStore()
  const { fanpageName, category, filteredCount, excludedCustomerIds, filters, messageTemplate, sendConfig } = campaign
  const selectedCount = filteredCount - excludedCustomerIds.length

  const messagePreview = previewTemplate(messageTemplate.content, category)

  const handleStartSending = () => {
    nextStep()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <CheckCircle size={20} className="text-green-500" />
        <Title level={5} className="!mb-0 dark:!text-gray-100">Xác nhận chiến dịch</Title>
      </div>

      {selectedCount === 0 && (
        <Alert type="warning" message="Không có khách hàng nào được chọn. Vui lòng quay lại và kiểm tra bộ lọc / danh sách." showIcon />
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Campaign summary */}
        <Card size="small" title={<span className="dark:text-gray-200"><Users size={14} className="inline mr-1" />Thông tin chiến dịch</span>} className="dark:bg-gray-800 dark:border-gray-700">
          <Descriptions column={1} size="small" bordered className="dark:bg-gray-800/50">
            <Descriptions.Item label={<span className="dark:text-gray-300">Fanpage / Profile</span>}>
              <Text strong className="dark:text-gray-100">{fanpageName}</Text>
              <Tag className="ml-2" color={category === 'profile' ? 'green' : 'blue'}>{category === 'profile' ? 'Profile' : 'Fanpage'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label={<span className="dark:text-gray-300">Số người nhận</span>}>
              <Text strong className="text-blue-600 dark:text-blue-400 text-base">{formatNumber(selectedCount)}</Text> <span className="dark:text-gray-300">khách hàng</span>
              {excludedCustomerIds.length > 0 && (
                <Text className="text-xs text-gray-400 dark:text-gray-500 ml-1">(đã bỏ {excludedCustomerIds.length})</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label={<span className="dark:text-gray-300">Giới tính</span>}><span className="dark:text-gray-300">{GENDER_LABELS[filters.gender]}</span></Descriptions.Item>
            <Descriptions.Item label={<span className="dark:text-gray-300">Số điện thoại</span>}>
              <span className="dark:text-gray-300">{filters.phone === 'all' ? 'Tất cả' : filters.phone === 'has_phone' ? 'Có SĐT' : 'Không có SĐT'}</span>
            </Descriptions.Item>
            <Descriptions.Item label={<span className="dark:text-gray-300">Bạn bè</span>}>
              <span className="dark:text-gray-300">{filters.friend === 'all' ? 'Tất cả' : filters.friend === 'friend' ? 'Đang kết bạn' : 'Chưa kết bạn'}</span>
            </Descriptions.Item>
            {filters.tags.length > 0 && (
              <Descriptions.Item label={<span className="dark:text-gray-300">Tags (có)</span>}>
                {filters.tags.map((t) => <Tag key={t} color="blue">{t}</Tag>)}
              </Descriptions.Item>
            )}
            {filters.exclude_tags.length > 0 && (
              <Descriptions.Item label={<span className="dark:text-gray-300">Tags (loại trừ)</span>}>
                {filters.exclude_tags.map((t) => <Tag key={t} color="red">{t}</Tag>)}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* Send config summary */}
        <Card size="small" title={<span className="dark:text-gray-200"><MessageSquare size={14} className="inline mr-1" />Cấu hình gửi</span>} className="dark:bg-gray-800 dark:border-gray-700">
          <Descriptions column={1} size="small" bordered className="dark:bg-gray-800/50">
            <Descriptions.Item label={<span className="dark:text-gray-300">Thứ tự gửi</span>}><span className="dark:text-gray-300">{ORDER_LABELS[sendConfig.sendingOrder]}</span></Descriptions.Item>
            <Descriptions.Item label={<span className="dark:text-gray-300">Độ trễ</span>}>
              <span className="dark:text-gray-300">{sendConfig.timeFrom}s — {sendConfig.timeTo}s</span>
            </Descriptions.Item>
            <Descriptions.Item label={<span className="dark:text-gray-300">Giới hạn</span>}>
              <span className="dark:text-gray-300">{sendConfig.limitMessage > 0 ? `${formatNumber(sendConfig.limitMessage)} tin` : 'Không giới hạn'}</span>
            </Descriptions.Item>
            <Descriptions.Item label={<span className="dark:text-gray-300">Nghỉ định kỳ</span>}>
              <span className="dark:text-gray-300">Sau {sendConfig.restAfterMessages} tin, nghỉ {sendConfig.restDuration}s</span>
            </Descriptions.Item>
            <Descriptions.Item label={<span className="dark:text-gray-300">Đính kèm</span>}>
              <span className="dark:text-gray-300">{ATTACHMENT_LABELS[messageTemplate.attachmentType] ?? 'Không có'}</span>
              {messageTemplate.attachmentFile && <Text className="text-xs ml-1 dark:text-gray-400">({messageTemplate.attachmentFile.name})</Text>}
            </Descriptions.Item>
            {sendConfig.scheduleEnabled && (
              <Descriptions.Item label={<span className="dark:text-gray-300">Hẹn giờ</span>}>
                <Tag color="orange">Đã bật</Tag>
                {sendConfig.scheduleStartDay && <Text className="text-xs ml-1 dark:text-gray-400">Bắt đầu: {sendConfig.scheduleStartDay} {sendConfig.scheduleStartHour}:{sendConfig.scheduleStartMinute}</Text>}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      </div>

      {/* Message preview */}
      <Card size="small" title={<span className="dark:text-gray-200">Preview nội dung tin nhắn (mẫu)</span>} className="dark:bg-gray-800 dark:border-gray-700">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 max-h-32 overflow-y-auto">
          <Text className="whitespace-pre-wrap text-sm dark:text-gray-300">{messagePreview || '(Không có nội dung)'}</Text>
        </div>
        <Text className="text-xs text-gray-400 dark:text-gray-500 mt-1 block">* Nội dung thực tế sẽ được xử lý SPIN và chèn tên khách hàng khi gửi</Text>
      </Card>

      <Divider className="my-0 dark:border-gray-700" />

      {/* Navigation */}
      <div className="flex justify-between">
        <Button icon={<ArrowLeft size={14} />} onClick={prevStep}>Quay lại</Button>
        <Button
          type="primary"
          size="large"
          icon={<Send size={16} />}
          iconPosition="end"
          disabled={selectedCount === 0}
          onClick={handleStartSending}
          className="bg-green-600 hover:bg-green-700 border-green-600"
        >
          Bắt đầu gửi {formatNumber(selectedCount)} tin nhắn
        </Button>
      </div>
    </div>
  )
}

export default Step5Confirm
