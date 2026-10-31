import { ReactNode } from "react"

import { cn } from "./cn"

interface FieldProps {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  required?: boolean
  children: ReactNode
  className?: string
  htmlFor?: string
  extra?: ReactNode
}

const Field = ({
  label,
  hint,
  error,
  required,
  children,
  className,
  htmlFor,
  extra
}: FieldProps) => (
  <div className={cn("bm-flex bm-min-w-0 bm-flex-col bm-gap-1.5", className)}>
    {(label || extra) && (
      <div className="bm-flex bm-items-center bm-justify-between bm-gap-2">
        {label && (
          <label htmlFor={htmlFor} className="bm-text-[12px] bm-font-medium bm-text-fg-muted">
            {label}
            {required && <span className="bm-ml-0.5 bm-text-danger">*</span>}
          </label>
        )}
        {extra}
      </div>
    )}
    {children}
    {error ? (
      <div className="bm-text-[11.5px] bm-text-danger bm-animate-fade-in">{error}</div>
    ) : (
      hint && <div className="bm-text-[11.5px] bm-text-fg-subtle">{hint}</div>
    )}
  </div>
)

export default Field
