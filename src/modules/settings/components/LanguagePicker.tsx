import { useTranslation } from "react-i18next"

import { changeLanguage, LANGUAGES } from "src/modules/shared/components/SwitchLanguage"
import { cn } from "src/modules/shared/ui"

const LanguagePicker = () => {
  const { i18n } = useTranslation()
  return (
    <div className="bm-grid bm-grid-cols-2 bm-gap-2">
      {LANGUAGES.map((l) => {
        const active = i18n.language === l.key
        return (
          <button
            key={l.key}
            type="button"
            onClick={() => changeLanguage(l.key)}
            className={cn(
              "bm-flex bm-items-center bm-gap-2.5 bm-rounded-xl bm-border bm-bg-surface bm-px-3 bm-py-2.5 bm-text-left bm-transition-all",
              active ? "bm-border-brand bm-bg-brand-soft/50 bm-shadow-glow" : "bm-border-line hover:bm-border-line-strong"
            )}>
            <l.Flag className="bm-h-5 bm-w-5 bm-rounded-sm bm-shadow-sm" />
            <span className="bm-flex-1 bm-text-[13px] bm-font-medium bm-text-fg">{l.label}</span>
            <span
              className={cn(
                "bm-h-4 bm-w-4 bm-rounded-full bm-border bm-transition-all",
                active ? "bm-border-[5px] bm-border-brand" : "bm-border-line-strong"
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

export default LanguagePicker
