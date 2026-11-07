import {
  ChevronDown,
  HelpCircle,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import {
  DEFAULT_DELAY_CONFIG,
  getDelayConfig,
  saveDelayConfig,
  type DelayConfig
} from "src/modules/facebook/utils/delay-config.util"
import { Badge, Button, cn, NumberInput, Tooltip } from "src/modules/shared/ui"

interface FacebookDelayConfigProps {
  /** localStorage key — must be unique per module */
  storageKey?: string
  defaults?: Partial<DelayConfig>
  showSleepConfig?: boolean
  showLimitsConfig?: boolean
  onSaved?: (config: DelayConfig) => void
}

/** Ported from xthuy-social `common/components/FacebookDelayConfig` (same storage + validation). */
export function FacebookDelayConfig({
  storageKey = "bm_fb_delay_config",
  defaults,
  showSleepConfig = true,
  showLimitsConfig = true,
  onSaved
}: FacebookDelayConfigProps) {
  const { t } = useTranslation()
  const defaultsRef = useRef(defaults)
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState<DelayConfig>(() =>
    getDelayConfig(storageKey, defaultsRef.current)
  )

  useEffect(() => {
    setConfig(getDelayConfig(storageKey, defaultsRef.current))
    const handle = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { storageKey: string }
        | undefined
      if (!detail || detail.storageKey === storageKey)
        setConfig(getDelayConfig(storageKey, defaultsRef.current))
    }
    window.addEventListener("fb_delay_config_changed", handle)
    return () => window.removeEventListener("fb_delay_config_changed", handle)
  }, [storageKey])

  const set = (key: keyof DelayConfig) => (v: number | null) =>
    setConfig((prev) => ({ ...prev, [key]: v ?? 0 }))

  const handleSave = () => {
    if (config.minDelay < 1)
      return toast.error(t("shared_delay_error_min_delay"))
    if (config.maxDelay < config.minDelay)
      return toast.error(t("shared_delay_error_max_delay"))
    if (showSleepConfig) {
      if (config.sleepAfter < 1)
        return toast.error(t("shared_delay_error_sleep_after"))
      if (config.minSleep < 1)
        return toast.error(t("shared_delay_error_min_sleep"))
      if (config.maxSleep < config.minSleep)
        return toast.error(t("shared_delay_error_max_sleep"))
    }
    if (showLimitsConfig) {
      if (config.totalActions < 1)
        return toast.error(t("shared_delay_error_total_actions"))
      if (config.maxFailures < 1)
        return toast.error(t("shared_delay_error_max_failures"))
    }
    saveDelayConfig(config, storageKey)
    toast.success(t("shared_delay_saved"))
    onSaved?.(config)
  }

  const handleReset = () => {
    const d = { ...DEFAULT_DELAY_CONFIG, ...defaults }
    setConfig(d)
    saveDelayConfig(d, storageKey)
    toast.success(t("shared_delay_reset"))
  }

  const field = (key: keyof DelayConfig, label: string, tip: string) => (
    <label className="bm-flex bm-flex-col bm-gap-1">
      <span className="bm-flex bm-items-center bm-gap-1 bm-text-[11.5px] bm-font-medium bm-text-fg-muted">
        {t(label)}
        <Tooltip
          content={<span className="bm-block bm-max-w-[240px]">{t(tip)}</span>}>
          <HelpCircle size={12} className="bm-text-fg-subtle" />
        </Tooltip>
      </span>
      <NumberInput size="sm" min={0} value={config[key]} onChange={set(key)} />
    </label>
  )

  const group = (title: string, children: React.ReactNode) => (
    <div className="bm-rounded-lg bm-border bm-border-line bm-bg-surface bm-p-2.5">
      <div className="bm-mb-2 bm-text-[11px] bm-font-semibold bm-uppercase bm-tracking-wide bm-text-fg-subtle">
        {t(title)}
      </div>
      <div className="bm-grid bm-grid-cols-2 bm-gap-2">{children}</div>
    </div>
  )

  return (
    <div className="bm-w-full bm-rounded-xl2 bm-border bm-border-line bm-bg-surface-2/50 bm-p-2.5">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="bm-flex bm-w-full bm-items-center bm-gap-2 bm-text-left">
        <span className="bm-inline-flex bm-h-7 bm-w-7 bm-shrink-0 bm-items-center bm-justify-center bm-rounded-lg bm-bg-brand-soft bm-text-brand-ink">
          <SlidersHorizontal size={14} />
        </span>
        <span className="bm-min-w-0 bm-flex-1">
          <span className="bm-flex bm-items-center bm-gap-1.5 bm-text-[12.5px] bm-font-semibold bm-text-fg">
            <span className="bm-truncate">{t("shared_delay_title")}</span>
            <Badge tone="success" size="sm">
              <ShieldCheck size={11} /> {t("shared_delay_badge_safe")}
            </Badge>
          </span>
          <span className="bm-block bm-truncate bm-text-[11px] bm-text-fg-muted">
            {config.minDelay}–{config.maxDelay}s
            {showSleepConfig &&
              ` · ${config.sleepAfter} → ${config.minSleep}–${config.maxSleep}s`}
            {showLimitsConfig && ` · max ${config.totalActions}`}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={cn(
            "bm-text-fg-subtle bm-transition-transform",
            isOpen && "bm-rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="bm-mt-3 bm-flex bm-flex-col bm-gap-2">
          <p className="bm-text-[11.5px] bm-text-fg-muted">
            {t("shared_delay_description")}
          </p>
          {group(
            "shared_delay_group_delay_title",
            <>
              {field(
                "minDelay",
                "shared_delay_min_delay_label",
                "shared_delay_min_delay_tooltip"
              )}
              {field(
                "maxDelay",
                "shared_delay_max_delay_label",
                "shared_delay_max_delay_tooltip"
              )}
            </>
          )}
          {showSleepConfig &&
            group(
              "shared_delay_group_sleep_title",
              <>
                {field(
                  "sleepAfter",
                  "shared_delay_sleep_after_label",
                  "shared_delay_sleep_after_tooltip"
                )}
                <span />
                {field(
                  "minSleep",
                  "shared_delay_min_sleep_label",
                  "shared_delay_min_sleep_tooltip"
                )}
                {field(
                  "maxSleep",
                  "shared_delay_max_sleep_label",
                  "shared_delay_max_sleep_tooltip"
                )}
              </>
            )}
          {showLimitsConfig &&
            group(
              "shared_delay_group_limits_title",
              <>
                {field(
                  "totalActions",
                  "shared_delay_total_actions_label",
                  "shared_delay_total_actions_tooltip"
                )}
                {field(
                  "maxFailures",
                  "shared_delay_max_failures_label",
                  "shared_delay_max_failures_tooltip"
                )}
              </>
            )}
          <div className="bm-flex bm-justify-end bm-gap-2">
            <Button
              size="sm"
              variant="ghost"
              icon={<RotateCcw size={13} />}
              onClick={handleReset}>
              {t("shared_delay_reset_button")}
            </Button>
            <Button size="sm" variant="primary" onClick={handleSave}>
              {t("shared_delay_apply_button")}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
