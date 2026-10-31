import { Check, Minus } from "lucide-react"
import { ReactNode } from "react"

import { cn } from "./cn"

/* ------------------------------ Checkbox ------------------------------ */
export interface CheckboxProps {
  checked: boolean
  onChange?: (checked: boolean) => void
  label?: ReactNode
  description?: ReactNode
  disabled?: boolean
  indeterminate?: boolean
  className?: string
  size?: "sm" | "md"
}

export const Checkbox = ({
  checked,
  onChange,
  label,
  description,
  disabled,
  indeterminate,
  className,
  size = "md"
}: CheckboxProps) => (
  <label
    className={cn(
      "bm-group bm-inline-flex bm-cursor-pointer bm-select-none bm-items-start bm-gap-2.5",
      disabled && "bm-cursor-not-allowed bm-opacity-50",
      className
    )}
    onClick={(e) => e.stopPropagation()}>
    <span className="bm-relative bm-mt-px bm-inline-flex bm-shrink-0">
      <input
        type="checkbox"
        className="bm-peer bm-sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <span
        className={cn(
          "bm-inline-flex bm-items-center bm-justify-center bm-rounded-lg bm-border bm-border-line-strong bm-bg-surface bm-text-white bm-transition-all bm-duration-150 group-hover:bm-border-brand peer-focus-visible:bm-shadow-glow",
          size === "sm" ? "bm-h-4 bm-w-4" : "bm-h-[18px] bm-w-[18px]",
          (checked || indeterminate) && "bm-border-brand bm-bg-brand"
        )}>
        {indeterminate ? (
          <Minus size={size === "sm" ? 11 : 12} strokeWidth={3} />
        ) : (
          checked && <Check size={size === "sm" ? 11 : 12} strokeWidth={3} />
        )}
      </span>
    </span>
    {(label || description) && (
      <span className="bm-min-w-0">
        {label && (
          <span className="bm-block bm-text-[13px] bm-leading-5 bm-text-fg">{label}</span>
        )}
        {description && (
          <span className="bm-block bm-text-[11.5px] bm-text-fg-muted">{description}</span>
        )}
      </span>
    )}
  </label>
)

/* ------------------------------- Switch ------------------------------- */
export interface SwitchProps {
  checked: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  size?: "sm" | "md"
  className?: string
  label?: ReactNode
}

export const Switch = ({
  checked,
  onChange,
  disabled,
  size = "md",
  className,
  label
}: SwitchProps) => (
  <label
    className={cn(
      "bm-inline-flex bm-cursor-pointer bm-select-none bm-items-center bm-gap-2.5",
      disabled && "bm-cursor-not-allowed bm-opacity-50",
      className
    )}>
    <span className="bm-relative bm-inline-flex">
      <input
        type="checkbox"
        role="switch"
        className="bm-peer bm-sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <span
        className={cn(
          "bm-relative bm-inline-block bm-rounded-full bm-bg-line-strong bm-transition-colors bm-duration-200 peer-focus-visible:bm-shadow-glow",
          size === "sm" ? "bm-h-5 bm-w-9" : "bm-h-6 bm-w-11",
          checked && "bm-bg-brand"
        )}>
        <span
          className={cn(
            "bm-absolute bm-top-0.5 bm-left-0.5 bm-rounded-full bm-bg-white bm-shadow-sm bm-transition-transform bm-duration-200",
            size === "sm" ? "bm-h-4 bm-w-4" : "bm-h-5 bm-w-5",
            checked && (size === "sm" ? "bm-translate-x-4" : "bm-translate-x-5")
          )}
        />
      </span>
    </span>
    {label && <span className="bm-text-[13px] bm-text-fg">{label}</span>}
  </label>
)

/* ----------------------------- RadioGroup ----------------------------- */
export interface RadioOption<T> {
  value: T
  label: ReactNode
  description?: ReactNode
  icon?: ReactNode
  disabled?: boolean
}

export interface RadioGroupProps<T> {
  value: T
  onChange: (value: T) => void
  options: RadioOption<T>[]
  variant?: "list" | "cards" | "inline"
  className?: string
  columns?: 1 | 2 | 3
}

export function RadioGroup<T>({
  value,
  onChange,
  options,
  variant = "list",
  className,
  columns = 1
}: RadioGroupProps<T>) {
  const isCards = variant === "cards"
  return (
    <div
      role="radiogroup"
      className={cn(
        variant === "inline"
          ? "bm-flex bm-flex-wrap bm-gap-x-4 bm-gap-y-2"
          : isCards
            ? cn(
                "bm-grid bm-gap-2",
                columns === 2 && "bm-grid-cols-2",
                columns === 3 && "bm-grid-cols-3"
              )
            : "bm-flex bm-flex-col bm-gap-1.5",
        className
      )}>
      {options.map((opt, i) => {
        const active = Object.is(opt.value, value)
        return (
          <label
            key={i}
            className={cn(
              "bm-group bm-flex bm-cursor-pointer bm-select-none bm-items-start bm-gap-2.5 bm-transition-colors",
              isCards &&
                "bm-rounded-xl bm-border bm-border-line bm-bg-surface bm-p-3 hover:bm-border-line-strong",
              isCards && active && "bm-border-brand bm-bg-brand-soft/60 bm-shadow-glow",
              opt.disabled && "bm-cursor-not-allowed bm-opacity-50"
            )}>
            <input
              type="radio"
              className="bm-peer bm-sr-only"
              checked={active}
              disabled={opt.disabled}
              onChange={() => onChange(opt.value)}
            />
            <span
              className={cn(
                "bm-mt-0.5 bm-inline-flex bm-h-4 bm-w-4 bm-shrink-0 bm-items-center bm-justify-center bm-rounded-full bm-border bm-border-line-strong bm-bg-surface bm-transition-all group-hover:bm-border-brand peer-focus-visible:bm-shadow-glow",
                active && "bm-border-[5px] bm-border-brand"
              )}
            />
            {opt.icon && (
              <span className="bm-mt-0.5 bm-shrink-0 bm-text-fg-muted">{opt.icon}</span>
            )}
            <span className="bm-min-w-0">
              <span className="bm-block bm-text-[13px] bm-leading-5 bm-text-fg">
                {opt.label}
              </span>
              {opt.description && (
                <span className="bm-block bm-text-[11.5px] bm-text-fg-muted">
                  {opt.description}
                </span>
              )}
            </span>
          </label>
        )
      })}
    </div>
  )
}

/* ------------------------------ Segmented ----------------------------- */
export interface SegmentedOption<T> {
  value: T
  label: ReactNode
  icon?: ReactNode
  disabled?: boolean
}

export interface SegmentedProps<T> {
  value: T
  onChange: (value: T) => void
  options: SegmentedOption<T>[]
  size?: "sm" | "md"
  block?: boolean
  className?: string
}

export function Segmented<T>({
  value,
  onChange,
  options,
  size = "md",
  block,
  className
}: SegmentedProps<T>) {
  return (
    <div
      className={cn(
        "bm-inline-flex bm-items-center bm-gap-0.5 bm-rounded-lg bm-bg-surface-2 bm-p-0.5",
        block && "bm-flex bm-w-full",
        className
      )}>
      {options.map((opt, i) => {
        const active = Object.is(opt.value, value)
        return (
          <button
            key={i}
            type="button"
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "bm-inline-flex bm-items-center bm-justify-center bm-gap-1.5 bm-whitespace-nowrap bm-rounded-lg bm-font-medium bm-text-fg-muted bm-transition-all bm-duration-150 hover:bm-text-fg disabled:bm-cursor-not-allowed disabled:bm-opacity-50",
              size === "sm" ? "bm-h-7 bm-px-2.5 bm-text-[12px]" : "bm-h-8 bm-px-3 bm-text-[12.5px]",
              block && "bm-flex-1",
              active && "bm-bg-surface bm-text-fg bm-shadow-card"
            )}>
            {opt.icon}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
