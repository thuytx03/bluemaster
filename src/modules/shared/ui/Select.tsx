import { Check, ChevronDown } from "lucide-react"
import {
  KeyboardEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"

import { cn } from "./cn"
import Popover from "./Popover"

export interface SelectOption<T> {
  value: T
  label: ReactNode
  description?: ReactNode
  icon?: ReactNode
  disabled?: boolean
}

export interface SelectGroup<T> {
  label: string
  options: SelectOption<T>[]
}

export interface SelectProps<T> {
  value?: T
  onChange?: (value: T) => void
  options?: SelectOption<T>[]
  groups?: SelectGroup<T>[]
  placeholder?: string
  disabled?: boolean
  size?: "sm" | "md"
  className?: string
  invalid?: boolean
  prefix?: ReactNode
}

function Select<T>({
  value,
  onChange,
  options,
  groups,
  placeholder = "Chọn...",
  disabled,
  size = "md",
  className,
  invalid,
  prefix
}: SelectProps<T>) {
  const anchorRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)

  const flat = useMemo<SelectOption<T>[]>(() => {
    if (groups) return groups.flatMap((g) => g.options)
    return options ?? []
  }, [options, groups])

  const selected = flat.find((o) => Object.is(o.value, value))
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (open) {
      const idx = flat.findIndex((o) => Object.is(o.value, value))
      setHighlight(idx)
    }
  }, [open, flat, value])

  const pick = (opt: SelectOption<T>) => {
    if (opt.disabled) return
    onChange?.(opt.value)
    setOpen(false)
    anchorRef.current?.focus()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      if (!open) return setOpen(true)
      const dir = e.key === "ArrowDown" ? 1 : -1
      let next = highlight
      for (let i = 0; i < flat.length; i++) {
        next = (next + dir + flat.length) % flat.length
        if (!flat[next].disabled) break
      }
      setHighlight(next)
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      if (!open) return setOpen(true)
      if (flat[highlight]) pick(flat[highlight])
    }
  }

  const renderOption = (opt: SelectOption<T>, index: number) => {
    const isSelected = Object.is(opt.value, value)
    const isHl = index === highlight
    return (
      <button
        type="button"
        key={index}
        disabled={opt.disabled}
        onMouseEnter={() => setHighlight(index)}
        onClick={() => pick(opt)}
        className={cn(
          "bm-flex bm-w-full bm-items-center bm-gap-2.5 bm-rounded-lg bm-px-2.5 bm-py-2 bm-text-left bm-text-[13px] bm-transition-colors disabled:bm-cursor-not-allowed disabled:bm-opacity-50",
          isHl && "bm-bg-surface-2",
          isSelected && "bm-text-brand-ink bm-font-medium"
        )}>
        {opt.icon && <span className="bm-shrink-0 bm-text-fg-muted">{opt.icon}</span>}
        <span className="bm-min-w-0 bm-flex-1">
          <span className="bm-block bm-truncate">{opt.label}</span>
          {opt.description && (
            <span className="bm-block bm-truncate bm-text-[11.5px] bm-font-normal bm-text-fg-muted">
              {opt.description}
            </span>
          )}
        </span>
        {isSelected && <Check size={14} className="bm-shrink-0 bm-text-brand-ink" />}
      </button>
    )
  }

  let runningIndex = 0

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "bm-flex bm-w-full bm-items-center bm-gap-2 bm-bg-surface bm-text-left bm-border bm-border-line-strong/80 bm-transition-[border-color,box-shadow] bm-duration-150 hover:bm-border-line-strong focus:bm-border-brand focus:bm-shadow-glow focus:bm-outline-none disabled:bm-cursor-not-allowed disabled:bm-bg-surface-2 disabled:bm-text-fg-muted",
          size === "sm" ? "bm-h-8 bm-rounded-lg bm-px-2.5 bm-text-[12.5px]" : "bm-h-9 bm-rounded-lg bm-px-3 bm-text-[13px]",
          open && "bm-border-brand bm-shadow-glow",
          invalid && "bm-border-danger",
          className
        )}>
        {prefix && <span className="bm-shrink-0 bm-text-fg-muted">{prefix}</span>}
        {selected?.icon && (
          <span className="bm-shrink-0 bm-text-fg-muted">{selected.icon}</span>
        )}
        <span
          className={cn(
            "bm-min-w-0 bm-flex-1 bm-truncate",
            !selected && "bm-text-fg-subtle"
          )}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={15}
          className={cn(
            "bm-shrink-0 bm-text-fg-subtle bm-transition-transform bm-duration-200",
            open && "bm-rotate-180 bm-text-brand-ink"
          )}
        />
      </button>
      <Popover
        open={open}
        onClose={close}
        anchorRef={anchorRef}
        matchWidth
        className="bm-max-h-72 bm-overflow-y-auto bm-p-1.5">
        <div role="listbox">
          {groups
            ? groups.map((g) => (
                <div key={g.label} className="bm-mb-1 last:bm-mb-0">
                  <div className="bm-px-2.5 bm-pb-1 bm-pt-1.5 bm-text-[10.5px] bm-font-semibold bm-uppercase bm-tracking-wider bm-text-fg-subtle">
                    {g.label}
                  </div>
                  {g.options.map((o) => renderOption(o, runningIndex++))}
                </div>
              ))
            : flat.map((o, i) => renderOption(o, i))}
          {flat.length === 0 && (
            <div className="bm-px-2.5 bm-py-3 bm-text-center bm-text-[12px] bm-text-fg-subtle">
              Không có lựa chọn
            </div>
          )}
        </div>
      </Popover>
    </>
  )
}

export default Select
