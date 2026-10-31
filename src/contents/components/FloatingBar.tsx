import { Download, Inbox, Pickaxe, Plus, Settings, X } from "lucide-react"
import { ReactNode, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import iconUrl from "url:assets/icon.png"

import { FacebookIcon } from "src/assets/icons"
import { APP_ROUTES } from "src/constants/route.constants"
import { cn } from "src/modules/shared/ui"

interface FloatingBarProps {
  isOpen: boolean
  onOpen: () => void
  theme: "light" | "dark"
  side?: "left" | "right"
}

export const IS_MAC = /Mac|iPhone|iPad/.test(navigator.platform)
export const TOGGLE_SHORTCUT_LABEL = IS_MAC ? "⌥X" : "Alt+X"

const RoundButton = ({
  label,
  onClick,
  children,
  badge,
  className
}: {
  label: string
  onClick: () => void
  children: ReactNode
  badge?: ReactNode
  className?: string
}) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    onClick={onClick}
    className={cn(
      "bm-relative bm-inline-flex bm-h-8 bm-w-8 bm-items-center bm-justify-center bm-rounded-full bm-bg-white bm-text-zinc-600 bm-shadow-[0_1px_6px_rgba(0,0,0,0.14)] bm-ring-1 bm-ring-black/5 bm-transition-all bm-duration-200 hover:-bm-translate-x-0.5 hover:bm-text-[#5B4BDB] hover:bm-shadow-[0_4px_12px_rgba(0,0,0,0.18)]",
      className
    )}>
    {children}
    {badge && (
      <span className="bm-absolute -bm-bottom-0.5 -bm-right-0.5 bm-inline-flex bm-h-3.5 bm-w-3.5 bm-items-center bm-justify-center bm-rounded-full bm-bg-white bm-shadow-sm bm-ring-1 bm-ring-black/5">
        {badge}
      </span>
    )}
  </button>
)

/* Launcher docked to the right edge while the panel is closed. */
const FloatingBar = ({
  isOpen,
  onOpen,
  theme,
  side = "right"
}: FloatingBarProps) => {
  const left = side === "left"
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(false)

  if (isOpen || dismissed) return null

  const go = (path: string) => {
    navigate(path)
    onOpen()
  }

  return (
    <div
      data-bluemaster-theme={theme || "light"}
      className={cn(
        "bm-group/bar bm-fixed bm-bottom-20 bm-z-[2147483647] bm-flex bm-flex-col bm-gap-2 bm-pointer-events-auto bm-animate-slide-in-right",
        left ? "bm-left-1.5 bm-items-start" : "bm-right-1.5 bm-items-end"
      )}>
      {/* Revealed on hover */}
      <div
        className={cn(
          "bm-flex bm-translate-y-2 bm-flex-col bm-gap-2 bm-opacity-0 bm-pointer-events-none bm-transition-all bm-duration-200 group-hover/bar:bm-pointer-events-auto group-hover/bar:bm-translate-y-0 group-hover/bar:bm-opacity-100",
          left ? "bm-items-start" : "bm-items-end"
        )}>
        <RoundButton
          label={t("nav_home")}
          onClick={() => go(APP_ROUTES.HOME)}
          className="bm-bg-[#ECE8FF] bm-text-[#5B4BDB] bm-ring-[#5B4BDB]/10 hover:bm-text-[#4338CA]">
          <Plus size={16} />
        </RoundButton>
      </div>

      {/* Quick actions */}
      <RoundButton label={t("auto_inbox")} onClick={() => go(APP_ROUTES.INBOX)}>
        <Inbox size={15} />
      </RoundButton>
      <RoundButton
        label={t("scan_uid")}
        onClick={() => go(APP_ROUTES.FACEBOOK.EXTRACT_UID)}>
        <Pickaxe size={15} />
      </RoundButton>
      <RoundButton
        label={t("batch_download")}
        onClick={() => go(APP_ROUTES.DOWNLOAD_ALL.FACEBOOK)}
        badge={<FacebookIcon className="bm-h-2.5 bm-w-2.5" />}>
        <Download size={15} />
      </RoundButton>

      {/* Main pill */}
      <div className={cn("bm-relative", left ? "-bm-ml-2" : "-bm-mr-2")}>
        <button
          type="button"
          title={`${t("open_panel")} (${TOGGLE_SHORTCUT_LABEL})`}
          onClick={onOpen}
          className={cn(
            "bm-group/pill bm-flex bm-h-9 bm-items-center bm-bg-[#ECE8FF] bm-py-1 bm-text-[#5B4BDB] bm-shadow-[0_2px_10px_rgba(91,75,219,0.22)] bm-ring-1 bm-ring-[#5B4BDB]/10 bm-transition-all bm-duration-200 hover:bm-bg-[#E3DEFF]",
            left
              ? "bm-flex-row-reverse bm-rounded-r-full bm-pr-1 bm-pl-1.5 hover:bm-pl-3"
              : "bm-rounded-l-full bm-pl-1 bm-pr-1.5 hover:bm-pr-3"
          )}>
          <span className="bm-relative bm-inline-flex bm-h-7 bm-w-7 bm-shrink-0 bm-overflow-hidden bm-rounded-full bm-ring-2 bm-ring-white/80">
            <img
              src={iconUrl}
              alt="logo"
              className="bm-h-full bm-w-full bm-object-cover"
            />
          </span>
          <span className="bm-max-w-0 bm-overflow-hidden bm-whitespace-nowrap bm-text-[12px] bm-font-semibold bm-tracking-wide bm-opacity-0 bm-transition-all bm-duration-200 group-hover/pill:bm-mx-1.5 group-hover/pill:bm-max-w-[60px] group-hover/pill:bm-opacity-100">
            {TOGGLE_SHORTCUT_LABEL}
          </span>
        </button>
        <button
          type="button"
          title={t("close_panel")}
          aria-label={t("close_panel")}
          onClick={() => setDismissed(true)}
          className={cn(
            "bm-absolute -bm-top-1.5 bm-inline-flex bm-h-4 bm-w-4 bm-scale-75 bm-items-center bm-justify-center bm-rounded-full bm-bg-white bm-text-zinc-500 bm-opacity-0 bm-pointer-events-none bm-shadow-md bm-ring-1 bm-ring-black/10 bm-transition-all bm-duration-200 hover:bm-bg-zinc-100 hover:bm-text-zinc-900 group-hover/bar:bm-pointer-events-auto group-hover/bar:bm-scale-100 group-hover/bar:bm-opacity-100",
            left ? "-bm-right-1.5" : "-bm-left-1.5"
          )}>
          <X size={10} />
        </button>
      </div>

      {/* Settings, revealed on hover */}
      <div className="bm-translate-y-[-8px] bm-opacity-0 bm-pointer-events-none bm-transition-all bm-duration-200 group-hover/bar:bm-pointer-events-auto group-hover/bar:bm-translate-y-0 group-hover/bar:bm-opacity-100">
        <RoundButton
          label={t("settings")}
          onClick={() => go(APP_ROUTES.SETTINGS)}>
          <Settings size={15} />
        </RoundButton>
      </div>
    </div>
  )
}

export default FloatingBar
