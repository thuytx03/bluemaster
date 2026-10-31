import { Moon, Sun } from "lucide-react"
import { useTranslation } from "react-i18next"

import { TTheme } from "src/modules/shared/types/common.types"
import { cn } from "src/modules/shared/ui"
import useExtensionState from "src/stores/extension-state.store"

/* Visual theme picker used on the settings page. */
const ThemeSwitcher = () => {
  const { t } = useTranslation()
  const {
    extensionState: { theme },
    setTheme
  } = useExtensionState()

  const handleThemeChange = async (newTheme: TTheme) => {
    await setTheme(newTheme)
  }

  const options: { value: TTheme; label: string; icon: JSX.Element; preview: string }[] = [
    {
      value: "light",
      label: t("light_mode"),
      icon: <Sun size={14} />,
      preview: "bm-bg-[#f4f6fb]"
    },
    {
      value: "dark",
      label: t("dark_mode"),
      icon: <Moon size={14} />,
      preview: "bm-bg-[#0b0d14]"
    }
  ]

  return (
    <div className="bm-grid bm-grid-cols-2 bm-gap-3">
      {options.map((opt) => {
        const active = theme === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleThemeChange(opt.value)}
            className={cn(
              "bm-group bm-flex bm-flex-col bm-overflow-hidden bm-rounded-xl2 bm-border bm-bg-surface bm-text-left bm-transition-all",
              active
                ? "bm-border-brand bm-shadow-glow"
                : "bm-border-line hover:bm-border-line-strong"
            )}>
            {/* mini preview */}
            <div className={cn("bm-relative bm-h-20 bm-w-full bm-p-3", opt.preview)}>
              <div
                className={cn(
                  "bm-flex bm-h-full bm-w-full bm-overflow-hidden bm-rounded-lg bm-border",
                  opt.value === "light"
                    ? "bm-border-black/5 bm-bg-white"
                    : "bm-border-white/10 bm-bg-[#131620]"
                )}>
                <div
                  className={cn(
                    "bm-h-full bm-w-1/4 bm-border-r",
                    opt.value === "light" ? "bm-border-black/5 bm-bg-[#f4f6fb]" : "bm-border-white/10 bm-bg-[#0b0d14]"
                  )}
                />
                <div className="bm-flex bm-flex-1 bm-flex-col bm-gap-1.5 bm-p-2">
                  <div className="bm-h-1.5 bm-w-2/3 bm-rounded-full x-gradient" />
                  <div
                    className={cn(
                      "bm-h-1.5 bm-w-1/2 bm-rounded-full",
                      opt.value === "light" ? "bm-bg-black/10" : "bm-bg-white/15"
                    )}
                  />
                  <div
                    className={cn(
                      "bm-h-1.5 bm-w-5/6 bm-rounded-full",
                      opt.value === "light" ? "bm-bg-black/10" : "bm-bg-white/15"
                    )}
                  />
                </div>
              </div>
            </div>
            <div className="bm-flex bm-items-center bm-justify-between bm-px-3 bm-py-2.5">
              <span className="bm-flex bm-items-center bm-gap-1.5 bm-text-[12.5px] bm-font-medium bm-text-fg">
                {opt.icon}
                {opt.label}
              </span>
              <span
                className={cn(
                  "bm-h-4 bm-w-4 bm-rounded-full bm-border bm-transition-all",
                  active ? "bm-border-[5px] bm-border-brand" : "bm-border-line-strong"
                )}
              />
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default ThemeSwitcher
