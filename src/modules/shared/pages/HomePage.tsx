import { ArrowUpRight, ChevronRight, RefreshCw, ShieldCheck } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { FacebookIcon } from "src/assets/icons"
import { EXTENSION_INFO } from "src/constants"
import { ESocialProvider } from "src/constants/enum"
import ToolsPopover from "src/contents/components/sidebar/ToolsPopover"
import PageContainer from "src/modules/shared/components/PageContainer"
import { useTools } from "src/configs/tools.config"
import usePinnedTools from "src/stores/pinned-tools.store"
import { Avatar, Badge, Button, cn, CopyButton } from "src/modules/shared/ui"
import useAuthStore from "src/stores/auth.store"
import useExtensionState from "src/stores/extension-state.store"
import { showErrorToast } from "src/utils/toast.util"

const HomePage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const tools = useTools().filter((tl) => !tl.utility)
  const { pinned } = usePinnedTools()
  const { accounts, authenticate, logout } = useAuthStore()
  const { extensionState } = useExtensionState()
  const fb = accounts[ESocialProvider.FACEBOOK]
  const moreRef = useRef<HTMLButtonElement>(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const [authing, setAuthing] = useState(false)
  const [page, setPage] = useState({ title: document.title, url: location.href })

  useEffect(() => {
    const sync = () => setPage({ title: document.title, url: location.href })
    const obs = new MutationObserver(sync)
    const titleEl = document.querySelector("title")
    if (titleEl) obs.observe(titleEl, { childList: true })
    const iv = setInterval(sync, 2000)
    return () => {
      obs.disconnect()
      clearInterval(iv)
    }
  }, [])

  const handleVerify = async () => {
    try {
      setAuthing(true)
      await authenticate(ESocialProvider.FACEBOOK)
    } catch (error) {
      await logout(ESocialProvider.FACEBOOK)
      showErrorToast((error as Error).message)
    } finally {
      setAuthing(false)
    }
  }

  // pinned tools first, then the rest, capped at 8 — the full list lives in "More"
  const featured = [
    ...pinned.map((k) => tools.find((tl) => tl.key === k)).filter((tl): tl is NonNullable<typeof tl> => !!tl),
    ...tools.filter((tl) => !pinned.includes(tl.key))
  ].slice(0, 8)
  const agentRows = tools.filter((tl) => tl.category === "automation")

  return (
    <PageContainer>
      {/* Heading */}
      <h1 className="bm-text-[24px] bm-font-extrabold bm-leading-none bm-tracking-tight bm-text-fg">
        {t("home_welcome")}
      </h1>

      {/* Tools */}
      <section className="bm-rounded-xl2 bm-border bm-border-line bm-bg-surface bm-p-4 bm-shadow-card">
        <div className="bm-mb-2 bm-flex bm-items-center bm-justify-between">
          <h2 className="bm-text-[15px] bm-font-bold bm-text-fg">{t("tools")}</h2>
          <button
            ref={moreRef}
            type="button"
            onClick={() => setMoreOpen((o) => !o)}
            className="bm-inline-flex bm-items-center bm-gap-0.5 bm-text-[12px] bm-font-medium bm-text-brand-ink hover:bm-underline">
            {t("more")} <ChevronRight size={14} />
          </button>
        </div>
        <div className="bm-grid bm-grid-cols-4 bm-gap-1 pw-lg:bm-grid-cols-6 pw-xl:bm-grid-cols-8">
          {featured.map((tl) => (
            <button
              key={tl.key}
              type="button"
              onClick={() => navigate(tl.path)}
              title={tl.description}
              className="bm-group bm-flex bm-flex-col bm-items-center bm-gap-1.5 bm-rounded-xl bm-px-1 bm-py-2.5 bm-transition-colors hover:bm-bg-surface-2">
              <span className={cn("bm-relative bm-inline-flex bm-h-6 bm-w-6 bm-items-center bm-justify-center bm-transition-transform group-hover:bm-scale-110 [&>svg]:bm-h-5 [&>svg]:bm-w-5", tl.color)}>
                {tl.icon}
                {tl.isNew && (
                  <span className="bm-absolute -bm-right-2 -bm-top-1.5 bm-rounded-md bm-bg-gradient-to-r bm-from-rose-500 bm-to-orange-400 bm-px-1 bm-text-[8px] bm-font-bold bm-uppercase bm-leading-[14px] bm-text-white">
                    new
                  </span>
                )}
              </span>
              <span className="bm-line-clamp-1 bm-w-full bm-text-center bm-text-[11.5px] bm-font-medium bm-text-fg">{tl.label}</span>
            </button>
          ))}
        </div>
        <ToolsPopover open={moreOpen} onClose={() => setMoreOpen(false)} anchorRef={moreRef} placement="bottom-end" />
      </section>

      {/* Automation */}
      <section className="bm-rounded-xl2 bm-border bm-border-line bm-bg-surface bm-p-4 bm-shadow-card">
        <div className="bm-mb-2 bm-flex bm-items-center bm-gap-2">
          <h2 className="bm-text-[15px] bm-font-bold bm-text-fg">{t("automation")}</h2>
          <Badge tone="warning" size="sm" className="bm-bg-gradient-to-r bm-from-rose-500 bm-to-orange-400 bm-text-white">
            New
          </Badge>
        </div>
        <div className="bm-flex bm-flex-col bm-gap-2">
          {agentRows.map((tl) => (
            <button
              key={tl.key}
              type="button"
              onClick={() => navigate(tl.path)}
              className="bm-group bm-flex bm-items-center bm-gap-3 bm-rounded-xl bm-bg-surface-2/70 bm-px-3.5 bm-py-2.5 bm-text-left bm-transition-colors hover:bm-bg-surface-2">
              <span className={cn("bm-inline-flex bm-h-7 bm-w-7 bm-shrink-0 bm-items-center bm-justify-center [&>svg]:bm-h-5 [&>svg]:bm-w-5", tl.color)}>
                {tl.icon}
              </span>
              <span className="bm-min-w-0 bm-flex-1">
                <span className="bm-block bm-truncate bm-text-[13.5px] bm-font-semibold bm-text-fg">{tl.label}</span>
                <span className="bm-block bm-truncate bm-text-[11.5px] bm-text-fg-muted">{tl.description}</span>
              </span>
              <ArrowUpRight size={16} className="bm-shrink-0 bm-text-fg-subtle bm-opacity-0 bm-transition-opacity group-hover:bm-opacity-100" />
            </button>
          ))}
        </div>
      </section>

      {/* Account */}
      <section className="bm-rounded-xl2 bm-border bm-border-line bm-bg-surface bm-p-4 bm-shadow-card">
        <div className="bm-mb-2 bm-flex bm-items-center bm-justify-between">
          <h2 className="bm-text-[15px] bm-font-bold bm-text-fg">{t("home_accounts")}</h2>
        </div>
        <div className="bm-flex bm-items-center bm-gap-3 bm-rounded-xl bm-bg-surface-2/70 bm-px-3.5 bm-py-2.5">
          <span className="bm-relative bm-shrink-0">
            {fb ? (
              <Avatar src={fb.avatar} name={fb.username} size={36} />
            ) : (
              <span className="bm-inline-flex bm-h-9 bm-w-9 bm-items-center bm-justify-center bm-rounded-full bm-bg-surface">
                <FacebookIcon className="bm-h-5 bm-w-5 bm-opacity-60" />
              </span>
            )}
            {fb && (
              <span className="bm-absolute -bm-bottom-0.5 -bm-right-0.5 bm-inline-flex bm-h-4 bm-w-4 bm-items-center bm-justify-center bm-rounded-full bm-bg-white bm-ring-2 bm-ring-surface-2">
                <FacebookIcon className="bm-h-3 bm-w-3" />
              </span>
            )}
          </span>
          <span className="bm-min-w-0 bm-flex-1">
            <span className="bm-block bm-truncate bm-text-[13px] bm-font-semibold bm-text-fg">{fb ? fb.username : "Facebook"}</span>
            <span className={cn("bm-flex bm-items-center bm-gap-1 bm-text-[11.5px]", fb ? "bm-text-success" : "bm-text-fg-muted")}>
              {fb && <ShieldCheck size={12} />}
              {fb ? `${t("verified")} · ID ${fb.id}` : t("not_verified")}
            </span>
          </span>
          <Button
            size="sm"
            variant={fb ? "outline" : "primary"}
            loading={authing}
            icon={fb ? <RefreshCw size={13} /> : <ShieldCheck size={13} />}
            onClick={handleVerify}>
            {fb ? t("re_authenticate") : t("verify_now")}
          </Button>
        </div>
      </section>

      {/* Current page context */}
      <div className="bm-flex bm-items-center bm-gap-3 bm-rounded-xl2 bm-bg-surface-2/70 bm-px-3.5 bm-py-2.5">
        <FacebookIcon className="bm-h-5 bm-w-5 bm-shrink-0" />
        <span className="bm-min-w-0 bm-flex-1">
          <span className="bm-block bm-truncate bm-text-[12.5px] bm-font-medium bm-text-fg">{page.title || "Facebook"}</span>
          <span className="bm-block bm-truncate bm-text-[11.5px] bm-text-fg-subtle">{page.url}</span>
        </span>
        <CopyButton iconOnly text={page.url} label={t("copy_link")} />
      </div>

      <div className="bm-flex bm-items-center bm-justify-between bm-px-1 bm-text-[11px] bm-text-fg-subtle">
        <span>{t("footer_copyright", { year: new Date().getFullYear(), author: EXTENSION_INFO.author })}</span>
        <span className="bm-font-mono">
          v{EXTENSION_INFO.version}
          {extensionState.isUpdateAvailable && <span className="bm-ml-1 bm-text-warning">●</span>}
        </span>
      </div>
    </PageContainer>
  )
}

export default HomePage
