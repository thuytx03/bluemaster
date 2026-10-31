import { CalendarClock, Clock, Hash, History, RotateCcw, Shuffle } from "lucide-react"
import React from "react"

import { Field, Input, NumberInput, Select, Surface, Switch, Tooltip } from "src/modules/shared/ui"

import useInboxStore from "src/modules/inbox/stores/inbox.store"
import { TSendingOrder } from "src/modules/inbox/types/inbox.types"
import StepFooter from "src/modules/inbox/components/StepFooter"

const SENDING_ORDER_OPTIONS: { value: TSendingOrder; label: string }[] = [
  { value: "1", label: "Từ cũ đến mới (Thứ tự thêm)" },
  { value: "2", label: "Từ mới đến cũ (Ngược thứ tự)" },
  { value: "3", label: "Ngẫu nhiên (Khuyên dùng)" }
]

/* "DD/MM/YYYY" + "HH" + "mm"  ->  "YYYY-MM-DDTHH:mm" for <input type="datetime-local"> */
const toLocalInput = (day: string | null, hour: string | null, minute: string | null) => {
  if (!day) return ""
  const [d, m, y] = day.split("/")
  if (!d || !m || !y) return ""
  return `${y}-${m}-${d}T${(hour ?? "00").padStart(2, "0")}:${(minute ?? "00").padStart(2, "0")}`
}

/* "YYYY-MM-DDTHH:mm" -> { day: "DD/MM/YYYY", h: "HH", m: "mm" } */
const fromLocalInput = (value: string) => {
  if (!value) return { day: null, h: null, m: null }
  const [date, time] = value.split("T")
  const [y, mo, d] = date.split("-")
  const [h, m] = (time ?? "").split(":")
  return { day: `${d}/${mo}/${y}`, h: h ?? null, m: m ?? null }
}

const Step4Config: React.FC = () => {
  const { campaign, setSendConfig, nextStep, prevStep } = useInboxStore()
  const { sendConfig } = campaign

  const update = (partial: Partial<typeof sendConfig>) => setSendConfig(partial)

  return (
    <div className="bm-flex bm-flex-col bm-gap-4">
      <div>
        <div className="bm-text-[14px] bm-font-semibold bm-text-fg">Cấu hình gửi tin</div>
        <div className="bm-text-[12px] bm-text-fg-muted">{campaign.fanpageName}</div>
      </div>

      <div className="bm-grid bm-grid-cols-1 bm-gap-3 pw-md:bm-grid-cols-2">
        {/* LEFT */}
        <div className="bm-flex bm-flex-col bm-gap-3">
          <Surface padding="sm" title="Thứ tự gửi" icon={<Shuffle size={14} />}>
            <Select<TSendingOrder>
              value={sendConfig.sendingOrder}
              onChange={(v) =>
                update({
                  sendingOrder: v,
                  sendingOrderLabel: SENDING_ORDER_OPTIONS.find((o) => o.value === v)?.label ?? ""
                })
              }
              options={SENDING_ORDER_OPTIONS}
            />
          </Surface>

          <Surface padding="sm" title="Thời gian chờ giữa tin" icon={<Clock size={14} />}>
            <div className="bm-grid bm-grid-cols-[1fr_auto_1fr] bm-items-end bm-gap-2">
              <Field label="Tối thiểu">
                <NumberInput
                  min={0}
                  max={sendConfig.timeTo}
                  value={sendConfig.timeFrom}
                  onChange={(v) => update({ timeFrom: v ?? 0 })}
                  suffix="s"
                />
              </Field>
              <span className="bm-pb-2.5 bm-text-fg-subtle">—</span>
              <Field label="Tối đa">
                <NumberInput
                  min={sendConfig.timeFrom}
                  value={sendConfig.timeTo}
                  onChange={(v) => update({ timeTo: v ?? 0 })}
                  suffix="s"
                />
              </Field>
            </div>
          </Surface>

          <Surface padding="sm" title="Giới hạn tin nhắn" icon={<Hash size={14} />}>
            <Tooltip content="0 = gửi tất cả. Nhập số > 0 để giới hạn số tin nhắn gửi trong phiên này." placement="bottom-start">
              <div className="bm-w-full">
                <NumberInput
                  min={0}
                  value={sendConfig.limitMessage}
                  onChange={(v) => update({ limitMessage: v ?? 0 })}
                  suffix="tin"
                  placeholder="0 = không giới hạn"
                />
              </div>
            </Tooltip>
          </Surface>

          <Surface padding="sm" title="Bỏ qua khách đã nhắn gần đây" icon={<History size={14} />}>
            <NumberInput
              min={0}
              value={sendConfig.skipRecentDays}
              onChange={(v) => update({ skipRecentDays: v ?? 0 })}
              suffix="ngày"
              placeholder="0 = không bỏ qua"
            />
            <div className="bm-mt-1.5 bm-text-[11.5px] bm-text-fg-subtle">Bỏ qua khách đã nhắn trong N ngày gần đây</div>
          </Surface>
        </div>

        {/* RIGHT */}
        <div className="bm-flex bm-flex-col bm-gap-3">
          <Surface padding="sm" title="Nghỉ định kỳ" icon={<RotateCcw size={14} />}>
            <div className="bm-flex bm-flex-col bm-gap-3">
              <Field label="Nghỉ sau mỗi">
                <NumberInput
                  min={1}
                  value={sendConfig.restAfterMessages}
                  onChange={(v) => update({ restAfterMessages: v ?? 20 })}
                  suffix="tin"
                />
              </Field>
              <Field label="Thời gian nghỉ">
                <NumberInput
                  min={0}
                  value={sendConfig.restDuration}
                  onChange={(v) => update({ restDuration: v ?? 30 })}
                  suffix="giây"
                />
              </Field>
            </div>
          </Surface>

          <Surface
            padding="sm"
            title="Hẹn giờ gửi"
            icon={<CalendarClock size={14} />}
            extra={
              <Switch
                size="sm"
                checked={sendConfig.scheduleEnabled}
                onChange={(c) => update({ scheduleEnabled: c })}
              />
            }>
            {sendConfig.scheduleEnabled ? (
              <div className="bm-flex bm-flex-col bm-gap-3 bm-animate-fade-in">
                <Field label="Bắt đầu từ">
                  <Input
                    type="datetime-local"
                    value={toLocalInput(sendConfig.scheduleStartDay, sendConfig.scheduleStartHour, sendConfig.scheduleStartMinute)}
                    onChange={(e) => {
                      const { day, h, m } = fromLocalInput(e.target.value)
                      update({ scheduleStartDay: day, scheduleStartHour: h, scheduleStartMinute: m })
                    }}
                  />
                </Field>
                <Field label="Kết thúc lúc">
                  <Input
                    type="datetime-local"
                    value={toLocalInput(sendConfig.scheduleEndDay, sendConfig.scheduleEndHour, sendConfig.scheduleEndMinute)}
                    onChange={(e) => {
                      const { day, h, m } = fromLocalInput(e.target.value)
                      update({ scheduleEndDay: day, scheduleEndHour: h, scheduleEndMinute: m })
                    }}
                  />
                </Field>
              </div>
            ) : (
              <div className="bm-text-[11.5px] bm-text-fg-subtle">Bật hẹn giờ để cài đặt thời gian gửi tự động</div>
            )}
          </Surface>
        </div>
      </div>

      <StepFooter onBack={prevStep} onNext={nextStep} nextLabel="Tiếp theo: Xác nhận" />
    </div>
  )
}

export default Step4Config
