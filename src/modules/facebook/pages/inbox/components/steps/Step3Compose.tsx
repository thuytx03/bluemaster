import { Alert, Button, Card, Input, Radio, Select, Typography, Upload } from 'antd'
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'
import { ArrowLeft, ArrowRight, Eye, Paperclip, Smile, X } from 'lucide-react'
import React, { useRef, useState } from 'react'
import useMessageTemplate from '../../hooks/useMessageTemplate'
import useInboxStore from '../../store/inbox.store'
import { TAttachmentPosition, TAttachmentType } from '../../types/inbox.interface'

const { Text, Title } = Typography
const { TextArea } = Input
const { Option } = Select

const SYNTAX_HINTS = [
  { token: '[u]', desc: 'Tên người nhận' },
  { token: '[r]', desc: 'Emoji vui ngẫu nhiên' },
  { token: '[q]', desc: 'Emoji buồn ngẫu nhiên' },
  { token: '[y]', desc: 'Emoji ngạc nhiên (Fanpage) / Gọi (Profile)' },
  { token: '[x]', desc: 'Xưng hô (chỉ Profile)' },
  { token: 'a|b|c', desc: 'SPIN: chọn ngẫu nhiên' },
]

const Step3Compose: React.FC = () => {
  const { campaign, nextStep, prevStep } = useInboxStore()
  const {
    messageTemplate,
    setContent,
    setAttachmentType,
    setAttachmentPosition,
    setAttachmentFile,
    setImageUrl,
    validate,
    preview,
  } = useMessageTemplate()

  const [showEmoji, setShowEmoji] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewText, setPreviewText] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const textAreaRef = useRef<any>(null)

  const handleEmojiClick = (data: EmojiClickData) => {
    const ta = textAreaRef.current?.resizableTextArea?.textArea
    if (ta) {
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const newVal = messageTemplate.content.slice(0, start) + data.emoji + messageTemplate.content.slice(end)
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
    const ta = textAreaRef.current?.resizableTextArea?.textArea
    if (ta) {
      const start = ta.selectionStart
      const newVal = messageTemplate.content.slice(0, start) + token + messageTemplate.content.slice(start)
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

  return (
    <div className="flex flex-col gap-4">
      <Title level={5} className="!mb-0 dark:!text-gray-100">Soạn tin nhắn — {campaign.fanpageName}</Title>

      {validationError && <Alert type="error" message={validationError} showIcon />}

      {/* Syntax hints */}
      <Card size="small" title={<span className="dark:text-gray-200">Cú pháp hỗ trợ</span>} className="dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          {SYNTAX_HINTS.map((h) => (
            <Button
              key={h.token}
              size="small"
              title={h.desc}
              onClick={() => handleInsertSyntax(h.token)}
              className="font-mono dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            >
              {h.token}
            </Button>
          ))}
          {campaign.category === 'fanpage' && (
            <Text className="text-xs text-gray-400 dark:text-gray-500 self-center ml-1">
              * [x] [y] chỉ dùng cho Profile
            </Text>
          )}
        </div>
      </Card>

      {/* Message editor */}
      <div className="relative">
        <TextArea
          ref={textAreaRef}
          value={messageTemplate.content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Nhập nội dung tin nhắn... Dùng [u] để chèn tên, a|b|c để spin nội dung ngẫu nhiên"
          rows={6}
          className="pr-10 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:placeholder-gray-600"
        />
        <div className="absolute right-2 top-2 flex gap-1">
          <Button
            type="text"
            size="small"
            icon={<Smile size={16} className="dark:text-gray-400" />}
            onClick={() => setShowEmoji(!showEmoji)}
          />
          <Button
            type="text"
            size="small"
            icon={<Eye size={16} className="dark:text-gray-400" />}
            onClick={handlePreview}
          />
        </div>
      </div>

      {/* Emoji picker */}
      {showEmoji && (
        <div className="relative z-50">
          <EmojiPicker onEmojiClick={handleEmojiClick} height={350} />
        </div>
      )}

      {/* Preview */}
      {showPreview && (
        <Card size="small" className="bg-gray-50 dark:bg-gray-900/50 dark:border-gray-700" title={<span className="dark:text-gray-200">Preview</span>}>
          <Text className="whitespace-pre-wrap text-sm dark:text-gray-300">{previewText || '(Trống)'}</Text>
        </Card>
      )}

      {/* Attachment */}
      <Card size="small" title={<span className="dark:text-gray-200"><Paperclip size={14} className="inline mr-1" />Đính kèm</span>} className="dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-col gap-3">
          <div>
            <Text className="text-xs font-medium text-gray-600 dark:text-gray-400">Loại đính kèm</Text>
            <Select
              className="w-full mt-1"
              value={messageTemplate.attachmentType}
              onChange={(v) => setAttachmentType(v as TAttachmentType)}
            >
              <Option value="">Không đính kèm</Option>
              <Option value="image">Hình ảnh</Option>
              <Option value="video">Video</Option>
              <Option value="audio">Âm thanh</Option>
            </Select>
          </div>

          {messageTemplate.attachmentType === 'image' && (
            <div>
              <Text className="text-xs font-medium text-gray-600 dark:text-gray-400">URL ảnh (tuỳ chọn)</Text>
              <Input
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-500"
                placeholder="https://..."
                value={messageTemplate.imageUrl ?? ''}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
          )}

          {messageTemplate.attachmentType && (
            <>
              <div>
                <Text className="text-xs font-medium text-gray-600 dark:text-gray-400">Upload file</Text>
                <Upload
                  maxCount={1}
                  beforeUpload={(file) => { setAttachmentFile(file); return false }}
                  onRemove={() => setAttachmentFile(null)}
                  fileList={messageTemplate.attachmentFile ? [{ uid: '1', name: messageTemplate.attachmentFile.name, status: 'done', originFileObj: messageTemplate.attachmentFile as any }] : []}
                >
                  <Button icon={<Paperclip size={14} />} className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">Chọn file</Button>
                </Upload>
              </div>

              <div>
                <Text className="text-xs font-medium text-gray-600 dark:text-gray-400">Vị trí đính kèm</Text>
                <Radio.Group
                  className="mt-1"
                  value={messageTemplate.attachmentPosition}
                  onChange={(e) => setAttachmentPosition(e.target.value as TAttachmentPosition)}
                >
                  <Radio value="before" className="dark:text-gray-300">Trước tin nhắn</Radio>
                  <Radio value="after" className="dark:text-gray-300">Sau tin nhắn</Radio>
                </Radio.Group>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <Button icon={<ArrowLeft size={14} />} onClick={prevStep}>Quay lại</Button>
        <Button type="primary" icon={<ArrowRight size={14} />} iconPosition="end" onClick={handleNext}>
          Tiếp theo: Cấu hình gửi
        </Button>
      </div>
    </div>
  )
}

export default Step3Compose
