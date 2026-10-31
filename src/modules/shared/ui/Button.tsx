import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react"

import { cn } from "./cn"
import Spinner from "./Spinner"

export type TButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success"
  | "link"
export type TButtonSize = "xs" | "sm" | "md" | "lg"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: TButtonVariant
  size?: TButtonSize
  loading?: boolean
  icon?: ReactNode
  iconRight?: ReactNode
  block?: boolean
}

const VARIANT: Record<TButtonVariant, string> = {
  primary:
    "bm-bg-brand bm-text-brand-fg bm-shadow-[0_1px_0_hsl(var(--x-brand-hover))] hover:bm-bg-brand-hover active:bm-translate-y-px disabled:bm-bg-brand/50",
  secondary:
    "bm-bg-surface-2 bm-text-fg hover:bm-bg-surface-3 active:bm-bg-surface-3 disabled:bm-text-fg-subtle",
  outline:
    "bm-bg-surface bm-text-fg bm-border bm-border-line-strong hover:bm-bg-surface-2 active:bm-bg-surface-3 disabled:bm-text-fg-subtle",
  ghost: "bm-bg-transparent bm-text-fg-muted hover:bm-bg-surface-2 hover:bm-text-fg",
  danger:
    "bm-bg-danger bm-text-white hover:bm-brightness-110 active:bm-translate-y-px disabled:bm-opacity-50",
  success:
    "bm-bg-success bm-text-white hover:bm-brightness-110 active:bm-translate-y-px disabled:bm-opacity-50",
  link: "bm-bg-transparent bm-text-brand-ink hover:bm-underline bm-px-0 bm-h-auto"
}

const SIZE: Record<TButtonSize, string> = {
  xs: "bm-h-7 bm-px-2.5 bm-text-[12px] bm-gap-1.5 bm-rounded-lg",
  sm: "bm-h-8 bm-px-3 bm-text-[12.5px] bm-gap-1.5 bm-rounded-lg",
  md: "bm-h-9 bm-px-3.5 bm-text-[13px] bm-gap-2 bm-rounded-lg",
  lg: "bm-h-11 bm-px-5 bm-text-[14px] bm-gap-2 bm-rounded-xl"
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "secondary",
      size = "md",
      loading,
      icon,
      iconRight,
      block,
      className,
      children,
      disabled,
      type = "button",
      ...rest
    },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        "bm-relative bm-inline-flex bm-select-none bm-items-center bm-justify-center bm-whitespace-nowrap bm-font-medium bm-transition-all bm-duration-150 disabled:bm-cursor-not-allowed disabled:active:bm-translate-y-0",
        VARIANT[variant],
        variant !== "link" && SIZE[size],
        block && "bm-w-full",
        className
      )}
      {...rest}>
      {loading ? (
        <Spinner size={size === "xs" ? 12 : 14} />
      ) : (
        icon && <span className="bm-inline-flex bm-shrink-0 bm-items-center">{icon}</span>
      )}
      {children && <span className="bm-truncate">{children}</span>}
      {iconRight && (
        <span className="bm-inline-flex bm-shrink-0 bm-items-center">{iconRight}</span>
      )}
    </button>
  )
)
Button.displayName = "Button"

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  size?: TButtonSize
  variant?: "ghost" | "outline" | "secondary" | "primary" | "danger"
  active?: boolean
}

const ICON_SIZE: Record<TButtonSize, string> = {
  xs: "bm-h-7 bm-w-7 bm-rounded-lg",
  sm: "bm-h-8 bm-w-8 bm-rounded-lg",
  md: "bm-h-9 bm-w-9 bm-rounded-lg",
  lg: "bm-h-10 bm-w-10 bm-rounded-xl"
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { label, size = "sm", variant = "ghost", active, className, children, ...rest },
    ref
  ) => (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "bm-inline-flex bm-shrink-0 bm-items-center bm-justify-center bm-transition-colors bm-duration-150 disabled:bm-cursor-not-allowed disabled:bm-opacity-50",
        VARIANT[variant],
        ICON_SIZE[size],
        active && "bm-bg-brand-soft bm-text-brand-ink hover:bm-bg-brand-soft",
        className
      )}
      {...rest}>
      {children}
    </button>
  )
)
IconButton.displayName = "IconButton"

export default Button
