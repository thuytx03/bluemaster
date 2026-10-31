import {
  Columns2,
  ExternalLink,
  Home,
  Maximize2,
  Minimize2,
  Moon,
  PanelRight,
  Plus,
  RefreshCw,
  Settings,
  Sun,
  X
} from "lucide-react"
import { ReactNode, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate } from "react-router-dom"

import { ESocialProvider } from "src/constants/enum"
import { APP_ROUTES } from "src/constants/route.constants"
import {
  changeLanguage,
  LANGUAGES
} from "src/modules/shared/components/SwitchLanguage"
import {
  Tool,
  useActiveTool,
  useTools
} from "src/configs/tools.config"
import {
  Avatar,
  Button,
  cn,
  CopyButton,
  Dropdown,
  Popover,
  Tooltip
} from "src/modules/shared/ui"
import useAuthStore from "src/stores/auth.store"
import useExtensionState from "src/stores/extension-state.store"
import usePinnedTools from "src/stores/pinned-tools.store"
import { showErrorToast, showSuccessToast } from "src/utils/toast.util"

import ToolsPopover from "./ToolsPopover"

export const NAV_RAIL_WIDTH = 72

interface NavMenuProps {
  theme: string
  onClose: () => void
  expanded: boolean
  onToggleExpand: () => void
  /** Push/overlay only makes sense when docked left/right */
  docked: boolean
  /** Expand/restore button (docked + centre dialog) */
  canResize: boolean
}

/* Big rail item: icon in a circle + label underneath. */
const RailItem = ({
  icon,
  label,
  description,
  active,
  onClick,
  isNew,
  color,
  innerRef
}: {
  icon: ReactNode
  label: string
  description?: string
  active?: boolean
  onClick: () => void
  isNew?: boolean
  color?: string
  innerRef?: React.Ref<HTMLButtonElement>
}) => (
  <Tooltip
    placement="left-start"
    className="bm-w-full"
    content={
      <span className="bm-block">
        <span className="bm-block bm-font-semibold">{label}</span>
        {description && (
          <span className="bm-block bm-opacity-80">{description}</span>
        )}
      </span>
    }>
    <button
      ref={innerRef}
      type="button"
      onClick={onClick}
      className="bm-group bm-flex bm-w-full bm-flex-col bm-items-center bm-gap-1 bm-py-1">
      <span
        className={cn(
          "bm-relative bm-inline-flex bm-h-9 bm-w-9 bm-items-center bm-justify-center bm-rounded-full bm-transition-all bm-duration-200 [&>svg]:bm-h-[18px] [&>svg]:bm-w-[18px]",
          active
            ? "bm-bg-surface-3 bm-text-fg"
            : "bm-text-fg group-hover:bm-bg-surface-2",
          active && color
        )}>
        {icon}
        {isNew && (
          <span className="bm-absolute -bm-right-1.5 -bm-top-1 bm-rounded bm-bg-gradient-to-r bm-from-rose-500 bm-to-orange-400 bm-px-[3px] bm-text-[7px] bm-font-bold bm-uppercase bm-leading-[11px] bm-text-white bm-shadow-sm">
            new
          </span>
        )}
      </span>
      <span
        className={cn(
          "bm-max-w-full bm-truncate bm-px-0.5 bm-text-[10.5px] bm-leading-tight",
          active ? "bm-font-semibold bm-text-fg" : "bm-text-fg"
        )}>
        {label}
      </span>
    </button>
  </Tooltip>
)

const SmallIcon = ({
  label,
  onClick,
  children,
  active,
  innerRef
}: {
  label: string
  onClick?: () => void
  children: ReactNode
  active?: boolean
  innerRef?: React.Ref<HTMLButtonElement>
}) => (
  <Tooltip placement="left-start" content={label}>
    <button
      ref={innerRef}
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "bm-inline-flex bm-h-7 bm-w-7 bm-items-center bm-justify-center bm-rounded-full bm-text-fg-muted bm-transition-colors hover:bm-bg-surface-2 hover:bm-text-fg",
        active && "bm-bg-brand-soft bm-text-brand-ink"
      )}>
      {children}
    </button>
  </Tooltip>
)

const fbProfileUrl = (id?: string) =>
  id ? `https://www.facebook.com/${id}` : "https://www.facebook.com/me"

export const NavMenu = ({
  theme,
  onClose,
  expanded,
  onToggleExpand,
  docked,
  canResize
}: NavMenuProps) => {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const tools = useTools()
  const active = useActiveTool(location.pathname, tools)
  const { accounts, authenticate, logout } = useAuthStore()
  const {
    extensionState: { layoutMode },
    setTheme,
    setLayoutMode
  } = useExtensionState()
  const [authing, setAuthing] = useState(false)
  const profileUrl = fbProfileUrl(accounts[ESocialProvider.FACEBOOK]?.id)
  const reauth = async () => {
    try {
      setAuthing(true)
      await authenticate(ESocialProvider.FACEBOOK)
      showSuccessToast(t("verified"))
    } catch (error) {
      await logout(ESocialProvider.FACEBOOK)
      showErrorToast((error as Error).message)
    } finally {
      setAuthing(false)
    }
  }
  const { pinned, load } = usePinnedTools()
  const moreRef = useRef<HTMLButtonElement>(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const avatarRef = useRef<HTMLButtonElement>(null)
  const [accountOpen, setAccountOpen] = useState(false)

  useEffect(() => {
    load()
  }, [load])

  const pinnedTools = pinned
    .map((k) => tools.find((tl) => tl.key === k))
    .filter((tl): tl is Tool => !!tl)

  const fb = accounts[ESocialProvider.FACEBOOK]
  const lang = LANGUAGES.find((l) => l.key === i18n.language) ?? LANGUAGES[0]
  const Flag = lang.Flag
  const isHome = location.pathname === APP_ROUTES.HOME

  return (
    <aside
      data-bluemaster-theme={theme}
      style={{ width: NAV_RAIL_WIDTH }}
      className="bm-flex bm-h-full bm-shrink-0 bm-flex-col bm-items-center bm-border-l bm-border-line bm-bg-surface">
      {/* Window controls */}
      <div className="bm-flex bm-w-full bm-items-center bm-justify-end bm-gap-0.5 bm-px-1.5 bm-pt-1.5">
        {canResize && (
          <SmallIcon
            label={expanded ? t("collapse") : t("expand")}
            onClick={onToggleExpand}>
            {expanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </SmallIcon>
        )}
        <SmallIcon label={t("close_panel")} onClick={onClose}>
          <X size={15} />
        </SmallIcon>
      </div>

      {/* Main navigation */}
      <nav className="x-no-scrollbar bm-flex bm-w-full bm-flex-1 bm-flex-col bm-items-center bm-gap-0 bm-overflow-y-auto bm-px-1 bm-pt-1">
        <RailItem
          icon={<Home />}
          label={t("nav_home")}
          active={isHome}
          onClick={() => navigate(APP_ROUTES.HOME)}
        />
        {pinnedTools.map((tl) => (
          <RailItem
            key={tl.key}
            icon={tl.icon}
            label={tl.label}
            description={tl.description}
            isNew={tl.isNew}
            color={tl.color}
            active={active?.key === tl.key}
            onClick={() => navigate(tl.path)}
          />
        ))}
        <div className="bm-my-1 bm-h-px bm-w-8 bm-bg-line" />
        <RailItem
          innerRef={moreRef}
          icon={<Plus />}
          label={t("more")}
          active={moreOpen}
          onClick={() => setMoreOpen((o) => !o)}
        />
      </nav>

      <ToolsPopover
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        anchorRef={moreRef}
      />

      {/* Utility icons */}
      <div className="bm-flex bm-w-full bm-flex-col bm-items-center bm-gap-0.5 bm-border-t bm-border-line bm-py-2">
        <SmallIcon
          label={theme === "dark" ? t("light_mode") : t("dark_mode")}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </SmallIcon>
        {docked && (
          <SmallIcon
            label={
              layoutMode === "overlay" ? t("push_mode") : t("overlay_mode")
            }
            active={layoutMode === "push"}
            onClick={() =>
              setLayoutMode(layoutMode === "overlay" ? "push" : "overlay")
            }>
            {layoutMode === "overlay" ? (
              <Columns2 size={15} />
            ) : (
              <PanelRight size={15} />
            )}
          </SmallIcon>
        )}
        <Dropdown
          placement="left-start"
          minWidth={150}
          items={LANGUAGES.map((l) => ({
            key: l.key,
            label: l.label,
            icon: <l.Flag className="bm-h-4 bm-w-4 bm-rounded-sm" />,
            onClick: () => changeLanguage(l.key)
          }))}>
          <SmallIcon label={t("language")}>
            <Flag className="bm-h-[15px] bm-w-[15px] bm-rounded-sm" />
          </SmallIcon>
        </Dropdown>
        <SmallIcon
          label={t("settings")}
          active={location.pathname === APP_ROUTES.SETTINGS}
          onClick={() => navigate(APP_ROUTES.SETTINGS)}>
          <Settings size={15} />
        </SmallIcon>
        <Tooltip
          placement="left-start"
          content={fb ? `${t("account")}: ${fb.username}` : t("not_verified")}>
          <button
            ref={avatarRef}
            type="button"
            onClick={() => setAccountOpen((o) => !o)}
            className={cn(
              "bm-relative bm-mt-1 bm-inline-flex bm-h-[26px] bm-w-[26px] bm-shrink-0 bm-items-center bm-justify-center bm-rounded-full bm-leading-none bm-ring-2 bm-ring-transparent bm-ring-offset-2 bm-ring-offset-surface bm-transition-all hover:bm-ring-brand/40 focus:bm-outline-none",
              accountOpen && "bm-ring-brand/60"
            )}>
            <Avatar src={fb?.avatar} name={fb?.username ?? "X"} size={26} />
            <span
              className={cn(
                "bm-absolute -bm-bottom-0.5 -bm-right-0.5 bm-h-2.5 bm-w-2.5 bm-rounded-full bm-border-2 bm-border-surface",
                fb ? "bm-bg-success" : "bm-bg-fg-subtle"
              )}
            />
          </button>
        </Tooltip>

        {/* Account card */}
        <Popover
          open={accountOpen}
          onClose={() => setAccountOpen(false)}
          anchorRef={avatarRef}
          placement="left-start"
          offset={10}
          className="bm-w-[260px] bm-p-3">
          <div className="bm-flex bm-items-center bm-gap-3">
            <Avatar src={fb?.avatar} name={fb?.username ?? "X"} size={44} />
            <div className="bm-min-w-0 bm-flex-1">
              <div className="bm-truncate bm-text-[13.5px] bm-font-semibold bm-text-fg">
                {fb ? fb.username : t("not_verified")}
              </div>
              {fb ? (
                <div className="bm-flex bm-items-center bm-gap-1 bm-font-mono bm-text-[11px] bm-text-fg-muted">
                  <span className="bm-truncate">ID {fb.id}</span>
                  <CopyButton
                    iconOnly
                    size="xs"
                    text={fb.id}
                    label={t("copy")}
                  />
                </div>
              ) : (
                <div className="bm-text-[11.5px] bm-text-fg-muted">
                  {t("ensure_facebook_verified")}
                </div>
              )}
            </div>
          </div>
          <div className="bm-mt-3 bm-flex bm-flex-col bm-gap-1.5">
            {fb && (
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bm-inline-flex bm-h-8 bm-items-center bm-justify-center bm-gap-1.5 bm-rounded-lg bm-bg-brand bm-px-3 bm-text-[12.5px] bm-font-medium bm-text-brand-fg hover:bm-bg-brand-hover hover:bm-no-underline">
                <ExternalLink size={13} />
                {t("open_profile")}
              </a>
            )}
            <Button
              size="sm"
              variant={fb ? "outline" : "primary"}
              loading={authing}
              icon={<RefreshCw size={13} />}
              onClick={reauth}>
              {fb ? t("re_authenticate") : t("verify_now")}
            </Button>
          </div>
        </Popover>
      </div>
    </aside>
  )
}
