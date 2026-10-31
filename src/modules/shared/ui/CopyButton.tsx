import { Check, Copy } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import Button, { ButtonProps } from "./Button"
import { IconButton } from "./Button"

interface CopyButtonProps extends Omit<ButtonProps, "onClick" | "icon"> {
  text?: string
  /** Lazily resolve the text at click time (e.g. from an uncontrolled textarea) */
  getText?: () => string
  /** Called after a successful copy (e.g. to show a toast) */
  onCopied?: () => void
  iconOnly?: boolean
  label?: string
}

const copy = (text: string) => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch((err) => {
      console.error("Failed to copy text: ", err)
    })
  }
}

const CopyButton = ({
  text,
  getText,
  onCopied,
  iconOnly,
  label,
  variant = "outline",
  size = "sm",
  disabled,
  ...rest
}: CopyButtonProps) => {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const handle = () => {
    copy(getText ? getText() : text ?? "")
    setCopied(true)
    onCopied?.()
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 2000)
  }

  if (iconOnly) {
    return (
      <IconButton
        label={copied ? t("copied") : label ?? t("copy")}
        size={size}
        variant="ghost"
        onClick={handle}
        disabled={disabled || (!text && !getText)}
        className={copied ? "bm-text-success" : undefined}>
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </IconButton>
    )
  }

  return (
    <Button
      variant={copied ? "success" : variant}
      size={size}
      disabled={disabled || !text}
      onClick={handle}
      icon={copied ? <Check size={14} /> : <Copy size={14} />}
      {...rest}>
      {copied ? t("copied") : label ?? t("copy")}
    </Button>
  )
}

export default CopyButton
