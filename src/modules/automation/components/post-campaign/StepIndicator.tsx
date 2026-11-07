import { ArrowLeft } from "lucide-react"

import { cn } from "src/modules/shared/ui"

interface Step {
  n: number
  label: string
}

interface Props {
  steps: Step[]
  current: number
  onBack?: () => void
  backDisabled?: boolean
}

/** Wizard progress bar; only the active step's label is shown to fit the narrow sidebar. */
export function StepIndicator({ steps, current, onBack, backDisabled }: Props) {
  return (
    <div className="bm-flex bm-shrink-0 bm-items-center bm-gap-2 bm-rounded-xl bm-border bm-border-line bm-bg-surface bm-px-3 bm-py-2">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          disabled={backDisabled}
          className="bm-mr-1 bm-flex bm-shrink-0 bm-items-center bm-justify-center bm-text-fg-muted bm-transition-colors hover:bm-text-fg disabled:bm-cursor-not-allowed disabled:bm-opacity-40">
          <ArrowLeft size={14} />
        </button>
      )}
      <div className="bm-flex bm-min-w-0 bm-flex-1 bm-items-center bm-gap-1">
        {steps.map((s, i) => {
          const done = current > s.n
          const active = current === s.n
          return (
            <div
              key={s.n}
              className={cn(
                "bm-flex bm-items-center bm-gap-1",
                active ? "bm-min-w-0" : "bm-shrink-0"
              )}>
              <span
                className={cn(
                  "bm-flex bm-h-5 bm-w-5 bm-shrink-0 bm-items-center bm-justify-center bm-rounded-full bm-text-[10px] bm-font-bold bm-transition-colors",
                  done && "bm-bg-brand bm-text-white",
                  active &&
                    "bm-border bm-border-brand bm-bg-brand-soft bm-text-brand-ink",
                  !done && !active && "bm-bg-surface-2 bm-text-fg-muted"
                )}>
                {done ? "✓" : s.n}
              </span>
              {active && (
                <span className="bm-truncate bm-text-[12px] bm-font-semibold bm-text-fg">
                  {s.label}
                </span>
              )}
              {i < steps.length - 1 && (
                <span className="bm-mx-0.5 bm-shrink-0 bm-text-fg-subtle">
                  →
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
