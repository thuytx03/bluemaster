import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react"
import { Eye, EyeOff, Paperclip, Smile, Wand2 } from "lucide-react"
import React, { useCallback, useRef, useState } from "react"

import {
  Callout,
  Field,
  FilePicker,
  IconButton,
  Input,
  Popover,
  RadioGroup,
  Select,
  Surface,
  Textarea,
  Tooltip
} from "src/modules/shared/ui"
import useExtensionState from "src/stores/extension-state.store"

import useMessageTemplate from "src/modules/inbox/hooks/useMessageTemplate"
import useInboxStore from "src/modules/inbox/stores/inbox.store"
import { TAttachmentPosition, TAttachmentType } from "src/modules/inbox/types/inbox.types"
import StepFooter from "src/modules/inbox/components/StepFooter"

const SYNTAX_HINTS = [
  { token: "bm-[u]", desc: "Tên người nhận" },
  { token: "bm-[r]", desc: "Emoji vui ngẫu nhiên" },
  { token: "bm-[q]", desc: "Emoji buồn ngẫu nhiên" },
  { token: "bm-[y]", desc: "Emoji ngạc nhiên (Fanpage) / Gọi (Profile)" },
  { token: "bm-[x]", desc: "Xưng hô (chỉ Profile)" },
  { token: "a|b|c", desc: "SPIN: chọn ngẫu nhiên" }
]

const Step3Compose: React.FC = () => {
  const { campaign, nextStep, prevStep } = useInboxStore()
  const {
    extensionState: { theme }
  } = useExtensionState()
  const {
    messageTemplate,
    setContent,
    setAttachmentType,
    setAttachmentPosition,
    setAttachmentFile,
    setImageUrl,
    validate,
    preview
  } = useMessageTemplate()

  const [showEmoji, setShowEmoji] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewText, setPreviewText] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const emojiBtnRef = useRef<HTMLButtonElement>(null)
  const closeEmoji = useCallback(() => setShowEmoji(false), [])

  const handleEmojiClick = (data: EmojiClickData) => {
    const ta = textAreaRef.current
    if (ta) {
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const newVal =
        messageTemplate.content.slice(0, start) + data.emoji + messageTemplate.content.slice(end)
      setContent(newVal)
      setTimeout(() => {
        ta.focus()
        ta.setSelectionRange(start + data.emoji.length, start + data.emoji.length)
      }, 50)
    } else {
      setContent(messageTemplate.content + data.emoji)
    }
    setShowEmoji(false)
  }

  const handleInsertSyntax = (token: string) => {
    const ta = textAreaRef.current
    if (ta) {
      const start = ta.selectionStart
      const newVal =
        messageTemplate.content.slice(0, start) + token + messageTemplate.content.slice(start)
      setContent(newVal)
      setTimeout(() => {
        ta.focus()
        ta.setSelectionRange(start + token.length, start + token.length)
      }, 50)
    } else {
      setContent(messageTemplate.content + token)
    }
  }

  const handleNext = () => {
    const err = validate()
    if (err && !messageTemplate.attachmentFile) {
      setValidationError(err)
      return
    }
    setValidationError(null)
    nextStep()
  }

  const handlePreview = () => {
    setPreviewText(preview())
    setShowPreview(!showPreview)
  }

  const charCount = messageTemplate.content.length

  return (
    <div className="bm-flex bm-flex-col bm-gap-4">
      <div>
        <div className="bm-text-[14px] bm-font-semibold bm-text-fg">Soạn tin nhắn</div>
        <div className="bm-text-[12px] bm-text-fg-muted">{campaign.fanpageName}</div>
      </div>

      {validationError && (
        <Callout tone="danger" compact>
          {validationError}
        </Callout>
      )}

      {/* Editor */}
      <Surface padding="none" className="bm-overflow-hidden focus-within:bm-border-brand focus-within:bm-shadow-glow">
        {/* Toolbar */}
        <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-1.5 bm-border-b bm-border-line bm-bg-surface-2/50 bm-px-2 bm-py-1.5">
          <span className="bm-mr-1 bm-inline-flex bm-items-center bm-gap-1 bm-text-[11px] bm-font-medium bm-text-fg-muted">
            <Wand2 size={12} /> Cú pháp
          </span>
          {SYNTAX_HINTS.map((h) => (
            <Tooltip key={h.token} content={h.desc} placement="bottom-start">
              <button
                type="button"
                onClick={() => handleInsertSyntax(h.token)}
                className="bm-inline-flex bm-h-6 bm-items-center bm-rounded-md bm-border bm-border-line bm-bg-surface bm-px-1.5 bm-font-mono bm-text-[11px] bm-text-fg-muted bm-transition-colors hover:bm-border-brand hover:bm-text-brand-ink">
                {h.token}
              </button>
            </Tooltip>
          ))}
          <span className="bm-ml-auto bm-flex bm-items-center bm-gap-0.5">
            <IconButton ref={emojiBtnRef} label="Emoji" size="xs" active={showEmoji} onClick={() => setShowEmoji((v) => !v)}>
              <Smile size={15} />
            </IconButton>
            <IconButton label="Xem trước" size="xs" active={showPreview} onClick={handlePreview}>
              {showPreview ? <EyeOff size={15} /> : <Eye size={15} />}
            </IconButton>
          </span>
        </div>
        <Textarea
          ref={textAreaRef}
          value={messageTemplate.content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Nhập nội dung tin nhắn... Dùng [u] để chèn tên, a|b|c để spin nội dung ngẫu nhiên"
          rows={7}
          className="bm-rounded-none bm-border-0 bm-bg-transparent focus:bm-shadow-none"
        />
        <div className="bm-flex bm-items-center bm-justify-between bm-border-t bm-border-line/70 bm-px-3 bm-py-1.5 bm-text-[11px] bm-text-fg-subtle">
          <span>
            {campaign.category === "fanpage" ? "* [x] [y] chỉ dùng cho Profile" : "Hỗ trợ [x] xưng hô và [y] gọi"}
          </span>
          <span className="bm-tabular-nums">{charCount} ký tự</span>
        </div>
      </Surface>

      <Popover open={showEmoji} onClose={closeEmoji} anchorRef={emojiBtnRef} placement="bottom-end" className="bm-overflow-hidden">
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          height={360}
          width={320}
          theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
          lazyLoadEmojis
          previewConfig={{ showPreview: false }}
        />
      </Popover>

      {/* Preview */}
      {showPreview && (
        <Surface padding="sm" tone="muted" title="Xem trước" icon={<Eye size={14} />} className="bm-animate-fade-in">
          <div className="bm-max-w-[85%] bm-rounded-2xl bm-rounded-tl-md bm-bg-brand bm-px-3.5 bm-py-2.5 bm-text-[13px] bm-leading-relaxed bm-text-brand-fg bm-shadow-card">
            <span className="bm-whitespace-pre-wrap">{previewText || "(Trống)"}</span>
          </div>
        </Surface>
      )}

      {/* Attachment */}
      <Surface padding="sm" title="Đính kèm" icon={<Paperclip size={14} />}>
        <div className="bm-flex bm-flex-col bm-gap-3">
          <Field label="Loại đính kèm">
            <Select<TAttachmentType>
              value={messageTemplate.attachmentType}
              onChange={(v) => setAttachmentType(v)}
              options={[
                { value: "", label: "Không đính kèm" },
                { value: "image", label: "Hình ảnh" },
                { value: "video", label: "Video" },
                { value: "audio", label: "Âm thanh" }
              ]}
            />
          </Field>

          {messageTemplate.attachmentType === "image" && (
            <Field label="URL ảnh (tuỳ chọn)" className="bm-animate-fade-in">
              <Input
                placeholder="https://..."
                value={messageTemplate.imageUrl ?? ""}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </Field>
          )}

          {messageTemplate.attachmentType && (
            <div className="bm-grid bm-grid-cols-1 bm-gap-3 bm-animate-fade-in pw-sm:bm-grid-cols-2">
              <Field label="Upload file">
                <FilePicker
                  variant="dropzone"
                  label="Chọn hoặc kéo thả file"
                  hint={messageTemplate.attachmentType}
                  accept={
                    messageTemplate.attachmentType === "image"
                      ? "image/*"
                      : messageTemplate.attachmentType === "video"
                        ? "video/*"
                        : messageTemplate.attachmentType === "audio"
                          ? "audio/*"
                          : undefined
                  }
                  file={messageTemplate.attachmentFile}
                  onFile={(file) => setAttachmentFile(file)}
                  onClear={() => setAttachmentFile(null)}
                />
              </Field>
              <Field label="Vị trí đính kèm">
                <RadioGroup<TAttachmentPosition>
                  variant="cards"
                  value={messageTemplate.attachmentPosition}
                  onChange={(v) => setAttachmentPosition(v)}
                  options={[
                    { value: "before", label: "Trước tin nhắn" },
                    { value: "after", label: "Sau tin nhắn" }
                  ]}
                />
              </Field>
            </div>
          )}
        </div>
      </Surface>

      <StepFooter onBack={prevStep} onNext={handleNext} nextLabel="Tiếp theo: Cấu hình gửi" />
    </div>
  )
}

export default Step3Compose
