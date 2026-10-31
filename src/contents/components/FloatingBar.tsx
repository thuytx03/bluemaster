import { Download, Home, Inbox, Pickaxe, Settings, X } from "lucide-react"
import { ReactNode, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import iconUrl from "url:assets/icon.png"

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

interface DockButtonProps {
  label: string
  onClick: () => void
  children: ReactNode
  left: boolean
  /** Larger hero button with the mascot */
  primary?: boolean
  /** Compact secondary action (e.g. hide launcher) */
  small?: boolean
  hint?: string
}

/* One dock item: circular button + label that slides in from the side on hover. */
const DockButton = ({ label, onClick, children, left, primary, small, hint }: DockButtonProps) => (
  <div className={cn("bm-group/item bm-relative bm-flex bm-items-center", left && "bm-flex-row-reverse")}>
    <span
      className={cn(
        "bm-pointer-events-none bm-absolute bm-top-1/2 -bm-translate-y-1/2 bm-whitespace-nowrap bm-rounded-lg bm-bg-fg bm-px-2.5 bm-py-1.5 bm-text-[12px] bm-font-medium bm-text-app bm-opacity-0 bm-shadow-pop bm-transition-all bm-duration-150 group-hover/item:bm-opacity-100",
        left
          ? "bm-left-full bm-ml-3 -bm-translate-x-1 group-hover/item:bm-translate-x-0"
          : "bm-right-full bm-mr-3 bm-translate-x-1 group-hover/item:bm-translate-x-0"
      )}>
      {label}
      {hint && <span className="bm-ml-1.5 bm-opacity-60">{hint}</span>}
    </span>
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "bm-relative bm-inline-flex bm-shrink-0 bm-items-center bm-justify-center bm-overflow-hidden bm-rounded-full bm-transition-all bm-duration-200 focus-visible:bm-outline-none focus-visible:bm-shadow-glow active:bm-scale-95",
        small ? "bm-h-7 bm-w-7" : "bm-h-10 bm-w-10",
        primary
          ? "bm-ring-1 bm-ring-white/80 bm-shadow-[0_6px_18px_rgba(24,119,242,0.45)] hover:bm-shadow-[0_8px_24px_rgba(24,119,242,0.6)]"
          : small
            ? "bm-bg-surface bm-text-fg-subtle bm-shadow-card bm-ring-1 bm-ring-line hover:bm-bg-danger hover:bm-text-white hover:bm-ring-danger"
            : "bm-bg-surface bm-text-fg-muted bm-shadow-card bm-ring-1 bm-ring-line hover:bm-bg-brand hover:bm-text-brand-fg hover:bm-ring-brand"
      )}>
      {children}
    </button>
  </div>
)

/* Launcher docked to the screen edge while the panel is closed. */
const FloatingBar = ({ isOpen, onOpen, theme, side = "right" }: FloatingBarProps) => {
  const left = side === "left"
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(false)

  if (isOpen || dismissed) return null

  const go = (path: string) => {
    navigate(path)
    onOpen()
  }

  const reveal =
    "bm-flex bm-flex-col bm-gap-2 bm-opacity-0 bm-pointer-events-none bm-transition-all bm-duration-200 group-hover/bar:bm-pointer-events-auto group-hover/bar:bm-translate-y-0 group-hover/bar:bm-opacity-100"

  return (
    <div
      data-bluemaster-theme={theme || "light"}
      className={cn(
        "bm-group/bar bm-fixed bm-bottom-20 bm-z-[2147483647] bm-flex bm-flex-col bm-items-center bm-gap-2 bm-pointer-events-auto bm-animate-slide-in-right",
        left ? "bm-left-3" : "bm-right-3"
      )}>
      {/* Extra shortcuts, revealed on hover */}
      <div className={cn(reveal, "bm-translate-y-2")}>
        <DockButton label={t("nav_home")} onClick={() => go(APP_ROUTES.HOME)} left={left}>
          <Home size={16} />
        </DockButton>
      </div>

      {/* Quick actions */}
      <DockButton label={t("auto_inbox")} onClick={() => go(APP_ROUTES.INBOX)} left={left}>
        <Inbox size={16} />
      </DockButton>
      <DockButton label={t("scan_uid")} onClick={() => go(APP_ROUTES.FACEBOOK.EXTRACT_UID)} left={left}>
        <Pickaxe size={16} />
      </DockButton>
      <DockButton label={t("batch_download")} onClick={() => go(APP_ROUTES.DOWNLOAD_ALL.FACEBOOK)} left={left}>
        <Download size={16} />
      </DockButton>

      {/* Mascot: opens the panel */}
      <DockButton label={t("open_panel")} hint={TOGGLE_SHORTCUT_LABEL} onClick={onOpen} left={left} primary>
        <img src={iconUrl} alt="Bluemaster" className="bm-h-full bm-w-full bm-object-cover" draggable={false} />
      </DockButton>

      {/* Settings + hide launcher, revealed on hover */}
      <div className={cn(reveal, "-bm-translate-y-2 bm-items-center")}>
        <DockButton label={t("settings")} onClick={() => go(APP_ROUTES.SETTINGS)} left={left}>
          <Settings size={16} />
        </DockButton>
        <DockButton
          label={t("hide_launcher")}
          hint={t("hide_launcher_hint")}
          onClick={() => setDismissed(true)}
          left={left}
          small>
          <X size={13} />
        </DockButton>
      </div>
    </div>
  )
}

export default FloatingBar
