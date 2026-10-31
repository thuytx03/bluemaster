import { ArrowUpRight, Rocket } from "lucide-react"
import { FC, PropsWithChildren, ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { EXTENSION_INFO } from "src/constants"
import { cn } from "src/modules/shared/ui"
import useExtensionState from "src/stores/extension-state.store"

interface IPageContainerProps extends PropsWithChildren {
  title?: ReactNode
  description?: ReactNode
  icon?: ReactNode
  /** Tailwind classes for the icon tile, e.g. a platform accent */
  accent?: string
  actions?: ReactNode
  className?: string
}

const PageContainer: FC<IPageContainerProps> = ({
  children,
  title,
  description,
  icon,
  accent = "bm-bg-brand-soft bm-text-brand-ink",
  actions,
  className
}) => {
  const { t } = useTranslation()
  const { extensionState } = useExtensionState()

  return (
    <div className={cn("bm-flex bm-h-full bm-w-full bm-flex-col bm-gap-4", className)}>
      {extensionState.isUpdateAvailable ? (
        <div className="bm-relative bm-overflow-hidden bm-rounded-xl2 x-gradient bm-p-[1px] bm-shadow-glow">
          <div className="bm-flex bm-items-center bm-gap-3 bm-rounded-lg bm-bg-surface/95 bm-px-3.5 bm-py-3">
            <span className="bm-inline-flex bm-h-9 bm-w-9 bm-shrink-0 bm-items-center bm-justify-center bm-rounded-xl x-gradient bm-text-white">
              <Rocket size={16} />
            </span>
            <div className="bm-min-w-0 bm-flex-1">
              <div className="bm-truncate bm-text-[13px] bm-font-semibold bm-text-fg">
                {t("update_available_title")}
              </div>
              <div className="bm-truncate bm-text-[11.5px] bm-text-fg-muted">
                {t("update_available_desc")}
              </div>
            </div>
            <a
              href={EXTENSION_INFO.link_download}
              target="_blank"
              rel="noopener noreferrer"
              className="bm-inline-flex bm-h-8 bm-shrink-0 bm-items-center bm-gap-1 bm-rounded-lg bm-bg-brand bm-px-3 bm-text-[12px] bm-font-medium bm-text-brand-fg hover:bm-bg-brand-hover hover:bm-no-underline">
              {t("update_button")}
              <ArrowUpRight size={13} />
            </a>
          </div>
        </div>
      ) : null}

      {(title || actions) && (
        <div className="bm-flex bm-items-start bm-justify-between bm-gap-3">
          <div className="bm-flex bm-min-w-0 bm-items-center bm-gap-3">
            {icon && (
              <span
                className={cn(
                  "bm-inline-flex bm-h-10 bm-w-10 bm-shrink-0 bm-items-center bm-justify-center bm-rounded-xl2 bm-shadow-card",
                  accent
                )}>
                {icon}
              </span>
            )}
            <div className="bm-min-w-0">
              <h1 className="bm-truncate bm-text-[17px] bm-font-bold bm-leading-tight bm-tracking-tight bm-text-fg">
                {title}
              </h1>
              {description && (
                <p className="bm-mt-0.5 bm-text-[12px] bm-leading-snug bm-text-fg-muted">
                  {description}
                </p>
              )}
            </div>
          </div>
          {actions && <div className="bm-flex bm-shrink-0 bm-items-center bm-gap-2">{actions}</div>}
        </div>
      )}

      <div className="bm-flex bm-min-h-0 bm-flex-1 bm-flex-col bm-gap-4">{children}</div>
    </div>
  )
}

export default PageContainer
