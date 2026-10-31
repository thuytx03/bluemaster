import {
  forwardRef,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes
} from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "./cn"

type TSize = "sm" | "md"

const base =
  "bm-w-full bm-bg-surface bm-text-fg bm-border bm-border-line-strong/80 bm-transition-[border-color,box-shadow] bm-duration-150 placeholder:bm-text-fg-subtle hover:bm-border-line-strong focus:bm-border-brand focus:bm-shadow-glow focus:bm-outline-none disabled:bm-cursor-not-allowed disabled:bm-bg-surface-2 disabled:bm-text-fg-muted read-only:bm-bg-surface-2/60"

const SIZE: Record<TSize, string> = {
  sm: "bm-h-8 bm-px-2.5 bm-text-[12.5px] bm-rounded-lg",
  md: "bm-h-9 bm-px-3 bm-text-[13px] bm-rounded-lg"
}

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> {
  size?: TSize
  prefix?: ReactNode
  suffix?: ReactNode
  invalid?: boolean
  mono?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { size = "md", prefix, suffix, invalid, mono, className, ...rest },
    ref
  ) => {
    if (!prefix && !suffix) {
      return (
        <input
          ref={ref}
          className={cn(
            base,
            SIZE[size],
            mono && "bm-font-mono",
            invalid && "bm-border-danger focus:bm-border-danger focus:bm-shadow-[0_0_0_4px_hsl(var(--x-danger)/0.18)]",
            className
          )}
          {...rest}
        />
      )
    }
    return (
      <div
        className={cn(
          "bm-flex bm-items-center bm-overflow-hidden bm-bg-surface bm-border bm-border-line-strong/80 bm-transition-[border-color,box-shadow] bm-duration-150 hover:bm-border-line-strong focus-within:bm-border-brand focus-within:bm-shadow-glow",
          size === "sm" ? "bm-h-8 bm-rounded-lg" : "bm-h-9 bm-rounded-lg",
          invalid && "bm-border-danger focus-within:bm-border-danger focus-within:bm-shadow-[0_0_0_4px_hsl(var(--x-danger)/0.18)]",
          rest.disabled && "bm-bg-surface-2 bm-cursor-not-allowed",
          className
        )}>
        {prefix && (
          <span className="bm-flex bm-h-full bm-shrink-0 bm-items-center bm-whitespace-nowrap bm-bg-surface-2 bm-px-2.5 bm-text-[12px] bm-text-fg-muted bm-border-r bm-border-line">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            "bm-h-full bm-min-w-0 bm-flex-1 bm-bg-transparent bm-px-3 bm-text-fg placeholder:bm-text-fg-subtle focus:bm-outline-none disabled:bm-cursor-not-allowed disabled:bm-text-fg-muted",
            size === "sm" ? "bm-text-[12.5px]" : "bm-text-[13px]",
            mono && "bm-font-mono"
          )}
          {...rest}
        />
        {suffix && (
          <span className="bm-flex bm-h-full bm-shrink-0 bm-items-center bm-whitespace-nowrap bm-bg-surface-2 bm-px-2.5 bm-text-[12px] bm-text-fg-muted bm-border-l bm-border-line">
            {suffix}
          </span>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
  mono?: boolean
  autoGrow?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ invalid, mono, className, rows = 4, ...rest }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        base,
        "bm-min-h-[72px] bm-resize-y bm-rounded-lg bm-px-3 bm-py-2 bm-text-[13px] bm-leading-relaxed",
        mono && "bm-font-mono bm-text-[12px]",
        invalid && "bm-border-danger focus:bm-border-danger focus:bm-shadow-[0_0_0_4px_hsl(var(--x-danger)/0.18)]",
        className
      )}
      {...rest}
    />
  )
)
Textarea.displayName = "Textarea"

export interface NumberInputProps {
  value?: number | null
  onChange?: (value: number | null) => void
  min?: number
  max?: number
  step?: number
  suffix?: ReactNode
  prefix?: ReactNode
  placeholder?: string
  disabled?: boolean
  size?: TSize
  className?: string
  invalid?: boolean
}

export const NumberInput = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  prefix,
  placeholder,
  disabled,
  size = "md",
  className,
  invalid
}: NumberInputProps) => {
  const clamp = (n: number) => {
    let v = n
    if (typeof min === "number") v = Math.max(min, v)
    if (typeof max === "number") v = Math.min(max, v)
    return v
  }
  const bump = (dir: 1 | -1) => {
    const current = typeof value === "number" ? value : typeof min === "number" ? min : 0
    onChange?.(clamp(current + dir * step))
  }
  return (
    <div
      className={cn(
        "bm-flex bm-items-center bm-overflow-hidden bm-bg-surface bm-border bm-border-line-strong/80 bm-transition-[border-color,box-shadow] bm-duration-150 hover:bm-border-line-strong focus-within:bm-border-brand focus-within:bm-shadow-glow",
        size === "sm" ? "bm-h-8 bm-rounded-lg" : "bm-h-9 bm-rounded-lg",
        invalid && "bm-border-danger",
        disabled && "bm-bg-surface-2 bm-cursor-not-allowed",
        className
      )}>
      {prefix && (
        <span className="bm-flex bm-h-full bm-shrink-0 bm-items-center bm-bg-surface-2 bm-px-2.5 bm-text-[12px] bm-text-fg-muted bm-border-r bm-border-line">
          {prefix}
        </span>
      )}
      <input
        type="number"
        inputMode="decimal"
        value={value ?? ""}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => {
          const raw = e.target.value
          if (raw === "") return onChange?.(null)
          const n = Number(raw)
          if (Number.isNaN(n)) return
          onChange?.(n)
        }}
        onBlur={() => {
          if (typeof value === "number") onChange?.(clamp(value))
        }}
        className={cn(
          "bm-h-full bm-min-w-0 bm-flex-1 bm-bg-transparent bm-px-3 bm-tabular-nums bm-text-fg placeholder:bm-text-fg-subtle focus:bm-outline-none disabled:bm-cursor-not-allowed bm-[appearance:textfield] [&::-webkit-inner-spin-button]:bm-appearance-none [&::-webkit-outer-spin-button]:bm-appearance-none",
          size === "sm" ? "bm-text-[12.5px]" : "bm-text-[13px]"
        )}
      />
      <div className="bm-flex bm-h-full bm-shrink-0 bm-flex-col bm-border-l bm-border-line">
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => bump(1)}
          className="bm-flex bm-flex-1 bm-items-center bm-justify-center bm-px-1.5 bm-text-fg-subtle hover:bm-bg-surface-2 hover:bm-text-fg">
          <ChevronUp size={11} />
        </button>
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => bump(-1)}
          className="bm-flex bm-flex-1 bm-items-center bm-justify-center bm-border-t bm-border-line bm-px-1.5 bm-text-fg-subtle hover:bm-bg-surface-2 hover:bm-text-fg">
          <ChevronDown size={11} />
        </button>
      </div>
      {suffix && (
        <span className="bm-flex bm-h-full bm-shrink-0 bm-items-center bm-whitespace-nowrap bm-bg-surface-2 bm-px-2.5 bm-text-[12px] bm-text-fg-muted bm-border-l bm-border-line">
          {suffix}
        </span>
      )}
    </div>
  )
}

export default Input
