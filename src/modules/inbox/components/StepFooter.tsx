import { ArrowLeft, ArrowRight } from "lucide-react"
import { ReactNode } from "react"

import { Button, cn } from "src/modules/shared/ui"

interface StepFooterProps {
  onBack?: () => void
  onNext?: () => void
  nextLabel?: ReactNode
  nextDisabled?: boolean
  nextIcon?: ReactNode
  nextVariant?: "primary" | "success"
  nextSize?: "md" | "lg"
  backLabel?: ReactNode
  extra?: ReactNode
  className?: string
}

const StepFooter = ({
  onBack,
  onNext,
  nextLabel = "Tiếp theo",
  nextDisabled,
  nextIcon = <ArrowRight size={14} />,
  nextVariant = "primary",
  nextSize = "md",
  backLabel = "Quay lại",
  extra,
  className
}: StepFooterProps) => (
  <div className={cn("bm-flex bm-items-center bm-justify-between bm-gap-3 bm-border-t bm-border-line bm-pt-4", className)}>
    <div className="bm-flex bm-items-center bm-gap-2">
      {onBack ? (
        <Button variant="ghost" icon={<ArrowLeft size={14} />} onClick={onBack}>
          {backLabel}
        </Button>
      ) : (
        <span />
      )}
      {extra}
    </div>
    {onNext && (
      <Button
        variant={nextVariant}
        size={nextSize}
        iconRight={nextIcon}
        disabled={nextDisabled}
        onClick={onNext}>
        {nextLabel}
      </Button>
    )}
  </div>
)

export default StepFooter
