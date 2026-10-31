import { Check, Filter, Inbox, MessageSquare, Send, Settings, ShieldCheck, Users } from "lucide-react"
import React from "react"
import { useTranslation } from "react-i18next"

import PageContainer from "src/modules/shared/components/PageContainer"
import { Avatar, Badge, cn, Surface } from "src/modules/shared/ui"

import Step1Scan from "src/modules/inbox/components/steps/Step1Scan"
import Step2Filter from "src/modules/inbox/components/steps/Step2Filter"
import Step3Compose from "src/modules/inbox/components/steps/Step3Compose"
import Step4Config from "src/modules/inbox/components/steps/Step4Config"
import Step5Confirm from "src/modules/inbox/components/steps/Step5Confirm"
import Step6Send from "src/modules/inbox/components/steps/Step6Send"
import useInboxStore from "src/modules/inbox/stores/inbox.store"

const STEP_META = [
  { title: "Quét khách", description: "Chọn Fanpage/Profile", icon: <Users size={15} /> },
  { title: "Lọc đối tượng", description: "Filter khách hàng", icon: <Filter size={15} /> },
  { title: "Soạn tin", description: "Nội dung & đính kèm", icon: <MessageSquare size={15} /> },
  { title: "Cấu hình", description: "Thời gian & độ trễ", icon: <Settings size={15} /> },
  { title: "Xác nhận", description: "Kiểm tra chiến dịch", icon: <ShieldCheck size={15} /> },
  { title: "Gửi tin", description: "Live progress & báo cáo", icon: <Send size={15} /> }
]

const InboxPage: React.FC = () => {
  const { t } = useTranslation()
  const { currentStep, campaign, setStep } = useInboxStore()
  const isSending = currentStep === 6 && campaign.sendProgress.status !== "idle" && campaign.sendProgress.status !== "finished" && campaign.sendProgress.status !== "stopped"

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Scan />
      case 2:
        return <Step2Filter />
      case 3:
        return <Step3Compose />
      case 4:
        return <Step4Config />
      case 5:
        return <Step5Confirm />
      case 6:
        return <Step6Send />
      default:
        return <Step1Scan />
    }
  }

  const meta = STEP_META[currentStep - 1]

  return (
    <PageContainer
      title={t("auto_inbox")}
      description="Gửi tin nhắn hàng loạt đến khách hàng trên Facebook"
      icon={<Inbox size={20} />}
      accent="bm-bg-[#1877F2]/12 bm-text-[#1877F2]"
      actions={
        campaign.fanpageName ? (
          <div className="bm-flex bm-items-center bm-gap-2 bm-rounded-xl bm-border bm-border-line bm-bg-surface bm-py-1 bm-pl-1 bm-pr-2.5 bm-shadow-card">
            <Avatar src={campaign.fanpageAvatar} name={campaign.fanpageName} size={26} />
            <div className="bm-min-w-0 bm-max-w-[140px]">
              <div className="bm-truncate bm-text-[12px] bm-font-semibold bm-leading-tight bm-text-fg">
                {campaign.fanpageName}
              </div>
              <div className="bm-text-[10.5px] bm-leading-tight bm-text-fg-muted">
                {campaign.category === "profile" ? "Profile" : "Fanpage"}
              </div>
            </div>
          </div>
        ) : null
      }>
      {/* Stepper */}
      <Surface padding="none" className="bm-overflow-hidden">
        <div className="bm-flex bm-items-stretch bm-overflow-x-auto x-no-scrollbar">
          {STEP_META.map((s, i) => {
            const n = i + 1
            const active = n === currentStep
            const done = n < currentStep
            const clickable = done && !isSending
            return (
              <button
                key={n}
                type="button"
                disabled={!clickable}
                onClick={() => clickable && setStep(n)}
                className={cn(
                  "bm-group bm-relative bm-flex bm-min-w-[64px] bm-flex-1 bm-flex-col bm-items-center bm-gap-1.5 bm-px-2 bm-py-3 bm-transition-colors",
                  active && "bm-bg-brand-soft/60",
                  clickable && "hover:bm-bg-surface-2",
                  !clickable && "bm-cursor-default"
                )}>
                <span
                  className={cn(
                    "bm-inline-flex bm-h-8 bm-w-8 bm-items-center bm-justify-center bm-rounded-full bm-border bm-text-[12px] bm-font-semibold bm-transition-all",
                    active && "bm-border-brand bm-bg-brand bm-text-brand-fg bm-shadow-glow",
                    done && "bm-border-success/40 bm-bg-success-soft bm-text-success",
                    !active && !done && "bm-border-line bm-bg-surface bm-text-fg-subtle"
                  )}>
                  {done ? <Check size={14} strokeWidth={3} /> : s.icon}
                </span>
                <span
                  className={cn(
                    "bm-max-w-full bm-truncate bm-text-[10.5px] bm-font-medium",
                    active ? "bm-text-brand-ink" : done ? "bm-text-fg" : "bm-text-fg-subtle"
                  )}>
                  {s.title}
                </span>
                {i < STEP_META.length - 1 && (
                  <span
                    className={cn(
                      "bm-absolute bm-right-0 bm-top-[27px] bm-h-px bm-w-1/2 bm-translate-x-1/2 -bm-translate-y-1/2",
                      done ? "bm-bg-success/40" : "bm-bg-line"
                    )}
                    style={{ left: "calc(50% + 20px)", right: "auto", width: "calc(100% - 40px)", transform: "none" }}
                  />
                )}
              </button>
            )
          })}
        </div>
        <div className="bm-flex bm-items-center bm-justify-between bm-gap-3 bm-border-t bm-border-line bm-bg-surface-2/40 bm-px-4 bm-py-2.5">
          <div className="bm-flex bm-items-center bm-gap-2.5">
            <Badge tone="brand" size="xs">
              {t("step")} {currentStep}/{STEP_META.length}
            </Badge>
            <span className="bm-text-[13px] bm-font-semibold bm-text-fg">{meta.title}</span>
            <span className="bm-hidden bm-text-[11.5px] bm-text-fg-muted pw-sm:bm-inline">· {meta.description}</span>
          </div>
          <div className="bm-flex bm-items-center bm-gap-1">
            {STEP_META.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "bm-h-1.5 bm-rounded-full bm-transition-all bm-duration-300",
                  i + 1 === currentStep ? "bm-w-6 bm-bg-brand" : i + 1 < currentStep ? "bm-w-1.5 bm-bg-brand/40" : "bm-w-1.5 bm-bg-line-strong"
                )}
              />
            ))}
          </div>
        </div>
      </Surface>

      {/* Step content */}
      <Surface padding="md" className="bm-min-h-80">
        <div key={currentStep} className="bm-animate-fade-up">
          {renderStep()}
        </div>
      </Surface>
    </PageContainer>
  )
}

export default InboxPage
