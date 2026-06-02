import { Button, Card, Checkbox, Col, DatePicker, InputNumber, Row, Select, Tooltip, Typography } from 'antd'
import { ArrowLeft, ArrowRight, Clock, Info, RotateCcw, Settings } from 'lucide-react'
import React from 'react'
import useInboxStore from '../../store/inbox.store'
import { TSendingOrder } from '../../types/inbox.interface'

const { Text, Title } = Typography
const { Option } = Select

const SENDING_ORDER_OPTIONS = [
  { value: '1', label: 'Từ cũ đến mới (Thứ tự thêm)' },
  { value: '2', label: 'Từ mới đến cũ (Ngược thứ tự)' },
  { value: '3', label: 'Ngẫu nhiên (Khuyên dùng)' },
]

const Step4Config: React.FC = () => {
  const { campaign, setSendConfig, nextStep, prevStep } = useInboxStore()
  const { sendConfig } = campaign

  const update = (partial: Partial<typeof sendConfig>) => setSendConfig(partial)

  return (
    <div className="flex flex-col gap-4">
      <Title level={5} className="!mb-0 dark:!text-gray-100">Cấu hình gửi tin — {campaign.fanpageName}</Title>

      <div className="grid grid-cols-2 gap-4">
        {/* LEFT */}
        <div className="flex flex-col gap-3">
          {/* Thứ tự gửi */}
          <Card size="small" title={<span className="dark:text-gray-200"><Settings size={14} className="inline mr-1" />Thứ tự gửi</span>} className="dark:bg-gray-800 dark:border-gray-700">
            <Select
              className="w-full"
              value={sendConfig.sendingOrder}
              onChange={(v) => update({ sendingOrder: v as TSendingOrder, sendingOrderLabel: SENDING_ORDER_OPTIONS.find(o => o.value === v)?.label ?? '' })}
            >
              {SENDING_ORDER_OPTIONS.map((o) => (
                <Option key={o.value} value={o.value}>{o.label}</Option>
              ))}
            </Select>
          </Card>

          {/* Độ trễ */}
          <Card size="small" title={<span className="dark:text-gray-200"><Clock size={14} className="inline mr-1" />Thời gian chờ giữa tin (giây)</span>} className="dark:bg-gray-800 dark:border-gray-700">
            <Row gutter={8} align="middle">
              <Col span={11}>
                <Text className="text-xs dark:text-gray-400">Tối thiểu</Text>
                <InputNumber
                  className="w-full mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  min={0}
                  max={sendConfig.timeTo}
                  value={sendConfig.timeFrom}
                  onChange={(v) => update({ timeFrom: v ?? 0 })}
                  addonAfter={<span className="dark:text-gray-400">s</span>}
                />
              </Col>
              <Col span={2} className="text-center text-gray-400 dark:text-gray-600">—</Col>
              <Col span={11}>
                <Text className="text-xs dark:text-gray-400">Tối đa</Text>
                <InputNumber
                  className="w-full mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  min={sendConfig.timeFrom}
                  value={sendConfig.timeTo}
                  onChange={(v) => update({ timeTo: v ?? 0 })}
                  addonAfter={<span className="dark:text-gray-400">s</span>}
                />
              </Col>
            </Row>
          </Card>

          {/* Giới hạn */}
          <Card size="small" title={<span className="dark:text-gray-200">Giới hạn tin nhắn</span>} className="dark:bg-gray-800 dark:border-gray-700">
            <Tooltip title="0 = gửi tất cả. Nhập số > 0 để giới hạn số tin nhắn gửi trong phiên này.">
              <InputNumber
                className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                min={0}
                value={sendConfig.limitMessage}
                onChange={(v) => update({ limitMessage: v ?? 0 })}
                addonAfter={<Info size={12} className="dark:text-gray-400" />}
                placeholder="0 = không giới hạn"
              />
            </Tooltip>
          </Card>

          {/* Bỏ qua gần đây */}
          <Card size="small" title={<span className="dark:text-gray-200">Bỏ qua khách đã nhắn gần đây</span>} className="dark:bg-gray-800 dark:border-gray-700">
            <InputNumber
              className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              min={0}
              value={sendConfig.skipRecentDays}
              onChange={(v) => update({ skipRecentDays: v ?? 0 })}
              addonAfter={<span className="dark:text-gray-400">ngày</span>}
              placeholder="0 = không bỏ qua"
            />
            <Text className="text-xs text-gray-400 dark:text-gray-500 mt-1 block">
              Bỏ qua khách đã nhắn trong N ngày gần đây
            </Text>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-3">
          {/* Nghỉ */}
          <Card size="small" title={<span className="dark:text-gray-200"><RotateCcw size={14} className="inline mr-1" />Nghỉ định kỳ</span>} className="dark:bg-gray-800 dark:border-gray-700">
            <div className="flex flex-col gap-2">
              <div>
                <Text className="text-xs dark:text-gray-400">Nghỉ sau mỗi</Text>
                <InputNumber
                  className="w-full mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  min={1}
                  value={sendConfig.restAfterMessages}
                  onChange={(v) => update({ restAfterMessages: v ?? 20 })}
                  addonAfter={<span className="dark:text-gray-400">tin</span>}
                />
              </div>
              <div>
                <Text className="text-xs dark:text-gray-400">Thời gian nghỉ</Text>
                <InputNumber
                  className="w-full mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  min={0}
                  value={sendConfig.restDuration}
                  onChange={(v) => update({ restDuration: v ?? 30 })}
                  addonAfter={<span className="dark:text-gray-400">giây</span>}
                />
              </div>
            </div>
          </Card>

          {/* Lịch hẹn giờ */}
          <Card
            size="small"
            title={
              <span className="flex items-center gap-2 dark:text-gray-200">
                <Clock size={14} />
                Hẹn giờ gửi
                <Checkbox
                  checked={sendConfig.scheduleEnabled}
                  onChange={(e) => update({ scheduleEnabled: e.target.checked })}
                />
              </span>
            }
            className="dark:bg-gray-800 dark:border-gray-700"
          >
            {sendConfig.scheduleEnabled ? (
              <div className="flex flex-col gap-2">
                <div>
                  <Text className="text-xs dark:text-gray-400">Bắt đầu từ</Text>
                  <DatePicker
                    showTime
                    className="w-full mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    format="DD/MM/YYYY HH:mm"
                    onChange={(_, dateStr) => {
                      const [day, time] = (Array.isArray(dateStr) ? dateStr[0] : dateStr).split(' ')
                      const [h, m] = (time ?? '').split(':')
                      update({ scheduleStartDay: day, scheduleStartHour: h, scheduleStartMinute: m })
                    }}
                  />
                </div>
                <div>
                  <Text className="text-xs dark:text-gray-400">Kết thúc lúc</Text>
                  <DatePicker
                    showTime
                    className="w-full mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    format="DD/MM/YYYY HH:mm"
                    onChange={(_, dateStr) => {
                      const [day, time] = (Array.isArray(dateStr) ? dateStr[0] : dateStr).split(' ')
                      const [h, m] = (time ?? '').split(':')
                      update({ scheduleEndDay: day, scheduleEndHour: h, scheduleEndMinute: m })
                    }}
                  />
                </div>
              </div>
            ) : (
              <Text className="text-xs text-gray-400 dark:text-gray-500">Bật hẹn giờ để cài đặt thời gian gửi tự động</Text>
            )}
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <Button icon={<ArrowLeft size={14} />} onClick={prevStep}>Quay lại</Button>
        <Button type="primary" icon={<ArrowRight size={14} />} iconPosition="end" onClick={nextStep}>
          Tiếp theo: Xác nhận
        </Button>
      </div>
    </div>
  )
}

export default Step4Config
