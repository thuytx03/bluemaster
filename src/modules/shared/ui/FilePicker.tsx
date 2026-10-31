import { FileUp, Paperclip, X } from "lucide-react"
import { ReactNode, useRef } from "react"

import Button from "./Button"
import { cn } from "./cn"

interface FilePickerProps {
  accept?: string
  onFile: (file: File) => void
  file?: File | null
  onClear?: () => void
  label?: ReactNode
  hint?: ReactNode
  className?: string
  variant?: "button" | "dropzone"
  size?: "sm" | "md"
}

const FilePicker = ({
  accept,
  onFile,
  file,
  onClear,
  label = "Chọn file",
  hint,
  className,
  variant = "button",
  size = "md"
}: FilePickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const openPicker = () => inputRef.current?.click()

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept={accept}
      className="bm-hidden"
      onChange={(e) => {
        const f = e.target.files?.[0]
        if (f) onFile(f)
        e.target.value = ""
      }}
    />
  )

  if (variant === "dropzone") {
    return (
      <div className={className}>
        {input}
        <button
          type="button"
          onClick={openPicker}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const f = e.dataTransfer.files?.[0]
            if (f) onFile(f)
          }}
          className={cn(
            "bm-flex bm-w-full bm-flex-col bm-items-center bm-justify-center bm-gap-1.5 bm-rounded-xl bm-border bm-border-dashed bm-border-line-strong bm-bg-surface-2/50 bm-px-4 bm-py-5 bm-text-center bm-transition-colors hover:bm-border-brand hover:bm-bg-brand-soft/40"
          )}>
          <span className="bm-inline-flex bm-h-9 bm-w-9 bm-items-center bm-justify-center bm-rounded-xl bm-bg-surface bm-text-brand-ink bm-shadow-card">
            <FileUp size={16} />
          </span>
          <span className="bm-text-[12.5px] bm-font-medium bm-text-fg">{label}</span>
          {hint && <span className="bm-text-[11.5px] bm-text-fg-muted">{hint}</span>}
        </button>
        {file && <FileChip file={file} onClear={onClear} />}
      </div>
    )
  }

  return (
    <div className={cn("bm-flex bm-flex-wrap bm-items-center bm-gap-2", className)}>
      {input}
      <Button variant="outline" size={size} icon={<Paperclip size={14} />} onClick={openPicker}>
        {label}
      </Button>
      {file && <FileChip file={file} onClear={onClear} />}
      {!file && hint && <span className="bm-text-[11.5px] bm-text-fg-subtle">{hint}</span>}
    </div>
  )
}

const FileChip = ({ file, onClear }: { file: File; onClear?: () => void }) => (
  <span className="bm-inline-flex bm-max-w-full bm-items-center bm-gap-2 bm-rounded-lg bm-border bm-border-line bm-bg-surface-2 bm-py-1 bm-pl-2.5 bm-pr-1 bm-text-[12px] bm-text-fg">
    <Paperclip size={12} className="bm-shrink-0 bm-text-fg-muted" />
    <span className="bm-truncate">{file.name}</span>
    <span className="bm-shrink-0 bm-text-fg-subtle">{(file.size / 1024).toFixed(0)} KB</span>
    {onClear && (
      <button
        type="button"
        onClick={onClear}
        className="bm-rounded-md bm-p-0.5 bm-text-fg-subtle hover:bm-bg-surface-3 hover:bm-text-danger"
        aria-label="Bỏ file">
        <X size={12} />
      </button>
    )}
  </span>
)

export default FilePicker
