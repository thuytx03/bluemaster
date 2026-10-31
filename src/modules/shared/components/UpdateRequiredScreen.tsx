import { ArrowUpRight, RefreshCw, ShieldAlert } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import iconUrl from "url:assets/icon.png"

import { EXTENSION_INFO } from "src/constants"
import { requestVersionCheck } from "src/modules/shared/services/version-check.service"
import { Badge, Button, Callout } from "src/modules/shared/ui"
import useExtensionState from "src/stores/extension-state.store"

/**
 * Replaces the panel when the running build is older than `min_supported`
 * in version.json. The only way forward is to install the newer release.
 */
const UpdateRequiredScreen = () => {
  const { t } = useTranslation()
  const { extensionState, setExtensionState } = useExtensionState()
  const [rechecking, setRechecking] = useState(false)

  const recheck = async () => {
    setRechecking(true)
    const result = await requestVersionCheck({ force: true })
    if (result) {
      setExtensionState({
        latestVersion: result.latestVersion,
        minSupportedVersion: result.minSupportedVersion,
        isUpdateAvailable: result.isUpdateAvailable,
        isUpdateRequired: result.isUpdateRequired,
        updateNotes: result.notes,
        downloadUrl: result.downloadUrl
      })
    }
    setRechecking(false)
  }

  return (
    <div className="bm-flex bm-h-full bm-w-full bm-flex-col bm-items-center bm-justify-center bm-overflow-y-auto bm-bg-app bm-px-5 bm-py-8 x-dots">
      <div className="bm-w-full bm-max-w-[420px] bm-rounded-lg bm-border bm-border-line bm-bg-surface bm-p-6 bm-shadow-card">
        <div className="bm-flex bm-flex-col bm-items-center bm-text-center">
          <span className="bm-relative bm-inline-flex bm-h-14 bm-w-14 bm-items-center bm-justify-center">
            <span className="bm-absolute bm-inset-0 bm-rounded-lg x-gradient bm-opacity-40" />
            <span className="bm-relative bm-inline-flex bm-h-14 bm-w-14 bm-items-center bm-justify-center bm-rounded-lg x-gradient bm-p-[2px]">
              <span className="bm-inline-flex bm-h-full bm-w-full bm-items-center bm-justify-center bm-overflow-hidden bm-rounded-lg bm-bg-surface">
                <img src={iconUrl} alt="logo" className="bm-h-8 bm-w-8 bm-object-contain" />
              </span>
            </span>
            <span className="bm-absolute -bm-bottom-1 -bm-right-1 bm-inline-flex bm-h-6 bm-w-6 bm-items-center bm-justify-center bm-rounded-full bm-bg-warning bm-text-white bm-shadow-card">
              <ShieldAlert size={13} />
            </span>
          </span>

          <h1 className="bm-mt-4 bm-text-[16px] bm-font-bold bm-tracking-tight bm-text-fg">
            {t("update_required_title")}
          </h1>
          <p className="bm-mt-1.5 bm-text-[12.5px] bm-leading-relaxed bm-text-fg-muted">
            {t("update_required_desc")}
          </p>

          <div className="bm-mt-4 bm-flex bm-items-center bm-gap-2 bm-text-[12px]">
            <span className="bm-inline-flex bm-items-center bm-gap-1.5">
              <span className="bm-text-fg-subtle">{t("installed_version")}</span>
              <Badge tone="danger" size="xs">
                <span className="bm-font-mono">v{EXTENSION_INFO.version}</span>
              </Badge>
            </span>
            <span className="bm-text-fg-subtle">→</span>
            <span className="bm-inline-flex bm-items-center bm-gap-1.5">
              <span className="bm-text-fg-subtle">{t("new_version")}</span>
              <Badge tone="success" size="xs">
                <span className="bm-font-mono">v{extensionState.latestVersion}</span>
              </Badge>
            </span>
          </div>
        </div>

        {extensionState.updateNotes ? (
          <Callout tone="info" title={t("update_notes")} className="bm-mt-5">
            {extensionState.updateNotes}
          </Callout>
        ) : null}

        <div className="bm-mt-5 bm-flex bm-flex-col bm-gap-2">
          <a
            href={extensionState.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bm-inline-flex bm-h-10 bm-w-full bm-items-center bm-justify-center bm-gap-2 bm-rounded-lg bm-bg-brand bm-px-4 bm-text-[13px] bm-font-semibold bm-text-brand-fg hover:bm-bg-brand-hover hover:bm-no-underline">
            {t("download_update")} v{extensionState.latestVersion}
            <ArrowUpRight size={14} />
          </a>
          <Button
            variant="ghost"
            size="sm"
            block
            loading={rechecking}
            icon={<RefreshCw size={13} />}
            onClick={recheck}>
            {t("recheck_update")}
          </Button>
        </div>

        <div className="bm-mt-5 bm-rounded-lg bm-bg-surface-2 bm-p-3.5">
          <div className="bm-text-[11.5px] bm-font-semibold bm-uppercase bm-tracking-wide bm-text-fg-subtle">
            {t("update_steps_title")}
          </div>
          <ol className="bm-mt-2 bm-flex bm-flex-col bm-gap-1.5 bm-text-[12px] bm-leading-snug bm-text-fg-muted">
            {["update_step_1", "update_step_2", "update_step_3"].map((key, i) => (
              <li key={key} className="bm-flex bm-gap-2">
                <span className="bm-inline-flex bm-h-4.5 bm-w-4.5 bm-shrink-0 bm-items-center bm-justify-center bm-rounded-full bm-bg-brand-soft bm-text-[10.5px] bm-font-semibold bm-text-brand-ink">
                  {i + 1}
                </span>
                <span>{t(key)}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}

export default UpdateRequiredScreen
