import { CheckCircle2, MessageSquare, Send, Settings2, Users } from "lucide-react"
import React from "react"

import { Badge, Callout, DescList, Surface } from "src/modules/shared/ui"

import useInboxStore from "src/modules/inbox/stores/inbox.store"
import { formatNumber } from "src/modules/inbox/utils/inbox-filter.util"
import { previewTemplate } from "src/modules/inbox/utils/message-template.util"
import StepFooter from "src/modules/inbox/components/StepFooter"

const ATTACHMENT_LABELS: Record<string, string> = {
  image: "Hình ảnh",
  video: "Video",
  audio: "Âm thanh",
  file: "File",
  "": "Không có"
}

const GENDER_LABELS: Record<string, string> = {
  all: "Tất cả",
  male: "Nam",
  female: "Nữ",
  unknown: "Chưa xác định"
}

const ORDER_LABELS: Record<string, string> = {
  "1": "Cũ → Mới",
  "2": "Mới → Cũ",
  "3": "Ngẫu nhiên"
}

const Step5Confirm: React.FC = () => {
  const { campaign, nextStep, prevStep } = useInboxStore()
  const { fanpageName, category, filteredCount, excludedCustomerIds, filters, messageTemplate, sendConfig } =
    campaign
  const selectedCount = filteredCount - excludedCustomerIds.length

  const messagePreview = previewTemplate(messageTemplate.content, category)

  const handleStartSending = () => {
    nextStep()
  }

  return (
    <div className="bm-flex bm-flex-col bm-gap-4">
      <div className="bm-flex bm-items-center bm-gap-2">
        <span className="bm-inline-flex bm-h-7 bm-w-7 bm-items-center bm-justify-center bm-rounded-lg bm-bg-success-soft bm-text-success">
          <CheckCircle2 size={15} />
        </span>
        <div>
          <div className="bm-text-[14px] bm-font-semibold bm-text-fg">Xác nhận chiến dịch</div>
          <div className="bm-text-[12px] bm-text-fg-muted">Kiểm tra lại trước khi bắt đầu gửi</div>
        </div>
      </div>

      {selectedCount === 0 && (
        <Callout tone="warning" compact>
          Không có khách hàng nào được chọn. Vui lòng quay lại và kiểm tra bộ lọc / danh sách.
        </Callout>
      )}

      <div className="bm-grid bm-grid-cols-1 bm-gap-3 pw-md:bm-grid-cols-2">
        <Surface padding="sm" title="Thông tin chiến dịch" icon={<Users size={14} />}>
          <DescList
            labelWidth={110}
            items={[
              {
                label: "Fanpage / Profile",
                value: (
                  <span className="bm-flex bm-flex-wrap bm-items-center bm-gap-1.5">
                    <span className="bm-font-semibold">{fanpageName}</span>
                    <Badge tone={category === "profile" ? "success" : "info"} size="xs">
                      {category === "profile" ? "Profile" : "Fanpage"}
                    </Badge>
                  </span>
                )
              },
              {
                label: "Số người nhận",
                value: (
                  <span>
                    <span className="bm-text-[14px] bm-font-bold bm-text-brand-ink">{formatNumber(selectedCount)}</span>{" "}
                    khách hàng
                    {excludedCustomerIds.length > 0 && (
                      <span className="bm-ml-1 bm-text-[11px] bm-text-fg-subtle">(đã bỏ {excludedCustomerIds.length})</span>
                    )}
                  </span>
                )
              },
              { label: "Giới tính", value: GENDER_LABELS[filters.gender] },
              {
                label: "Số điện thoại",
                value: filters.phone === "all" ? "Tất cả" : filters.phone === "has_phone" ? "Có SĐT" : "Không có SĐT"
              },
              {
                label: "Bạn bè",
                value: filters.friend === "all" ? "Tất cả" : filters.friend === "friend" ? "Đang kết bạn" : "Chưa kết bạn"
              },
              ...(filters.tags.length > 0
                ? [
                    {
                      label: "Tags (có)",
                      value: (
                        <span className="bm-flex bm-flex-wrap bm-gap-1">
                          {filters.tags.map((tg) => (
                            <Badge key={tg} tone="info" size="xs">
                              {tg}
                            </Badge>
                          ))}
                        </span>
                      )
                    }
                  ]
                : []),
              ...(filters.exclude_tags.length > 0
                ? [
                    {
                      label: "Tags (loại trừ)",
                      value: (
                        <span className="bm-flex bm-flex-wrap bm-gap-1">
                          {filters.exclude_tags.map((tg) => (
                            <Badge key={tg} tone="danger" size="xs">
                              {tg}
                            </Badge>
                          ))}
                        </span>
                      )
                    }
                  ]
                : [])
            ]}
          />
        </Surface>

        <Surface padding="sm" title="Cấu hình gửi" icon={<Settings2 size={14} />}>
          <DescList
            labelWidth={110}
            items={[
              { label: "Thứ tự gửi", value: ORDER_LABELS[sendConfig.sendingOrder] },
              { label: "Độ trễ", value: `${sendConfig.timeFrom}s — ${sendConfig.timeTo}s` },
              {
                label: "Giới hạn",
                value: sendConfig.limitMessage > 0 ? `${formatNumber(sendConfig.limitMessage)} tin` : "Không giới hạn"
              },
              {
                label: "Nghỉ định kỳ",
                value: `Sau ${sendConfig.restAfterMessages} tin, nghỉ ${sendConfig.restDuration}s`
              },
              {
                label: "Đính kèm",
                value: (
                  <span>
                    {ATTACHMENT_LABELS[messageTemplate.attachmentType] ?? "Không có"}
                    {messageTemplate.attachmentFile && (
                      <span className="bm-ml-1 bm-text-[11px] bm-text-fg-muted">({messageTemplate.attachmentFile.name})</span>
                    )}
                  </span>
                )
              },
              ...(sendConfig.scheduleEnabled
                ? [
                    {
                      label: "Hẹn giờ",
                      value: (
                        <span className="bm-flex bm-flex-wrap bm-items-center bm-gap-1.5">
                          <Badge tone="warning" size="xs">
                            Đã bật
                          </Badge>
                          {sendConfig.scheduleStartDay && (
                            <span className="bm-text-[11px] bm-text-fg-muted">
                              Bắt đầu: {sendConfig.scheduleStartDay} {sendConfig.scheduleStartHour}:
                              {sendConfig.scheduleStartMinute}
                            </span>
                          )}
                        </span>
                      )
                    }
                  ]
                : [])
            ]}
          />
        </Surface>
      </div>

      <Surface padding="sm" title="Preview nội dung tin nhắn (mẫu)" icon={<MessageSquare size={14} />}>
        <div className="bm-max-h-40 bm-overflow-y-auto">
          <div className="bm-inline-block bm-max-w-[85%] bm-rounded-2xl bm-rounded-tl-md bm-bg-brand bm-px-3.5 bm-py-2.5 bm-text-[13px] bm-leading-relaxed bm-text-brand-fg bm-shadow-card">
            <span className="bm-whitespace-pre-wrap">{messagePreview || "(Không có nội dung)"}</span>
          </div>
        </div>
        <div className="bm-mt-2 bm-text-[11px] bm-text-fg-subtle">
          * Nội dung thực tế sẽ được xử lý SPIN và chèn tên khách hàng khi gửi
        </div>
      </Surface>

      <StepFooter
        onBack={prevStep}
        onNext={handleStartSending}
        nextDisabled={selectedCount === 0}
        nextVariant="success"
        nextSize="lg"
        nextIcon={<Send size={15} />}
        nextLabel={`Bắt đầu gửi ${formatNumber(selectedCount)} tin nhắn`}
      />
    </div>
  )
}

export default Step5Confirm
