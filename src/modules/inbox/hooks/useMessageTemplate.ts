import { useCallback } from 'react'
import { previewTemplate, validateTemplate } from 'src/modules/inbox/utils/message-template.util'
import useInboxStore from 'src/modules/inbox/stores/inbox.store'
import { IMessageTemplate, TAttachmentPosition, TAttachmentType } from 'src/modules/inbox/types/inbox.types'

export function useMessageTemplate() {
  const { campaign, setMessageTemplate } = useInboxStore()
  const { messageTemplate, category } = campaign

  const updateTemplate = useCallback(
    (partial: Partial<IMessageTemplate>) => {
      setMessageTemplate(partial)
    },
    [setMessageTemplate]
  )

  const setContent = useCallback(
    (content: string) => {
      setMessageTemplate({ content })
    },
    [setMessageTemplate]
  )

  const setAttachmentType = useCallback(
    (attachmentType: TAttachmentType) => {
      setMessageTemplate({ attachmentType, attachmentFile: null })
    },
    [setMessageTemplate]
  )

  const setAttachmentPosition = useCallback(
    (attachmentPosition: TAttachmentPosition) => {
      setMessageTemplate({ attachmentPosition })
    },
    [setMessageTemplate]
  )

  const setAttachmentFile = useCallback(
    (attachmentFile: File | null) => {
      setMessageTemplate({ attachmentFile })
    },
    [setMessageTemplate]
  )

  const setImageUrl = useCallback(
    (imageUrl: string) => {
      setMessageTemplate({ imageUrl })
    },
    [setMessageTemplate]
  )

  const validate = useCallback(() => {
    return validateTemplate(messageTemplate.content)
  }, [messageTemplate.content])

  const preview = useCallback(() => {
    return previewTemplate(messageTemplate.content, category)
  }, [messageTemplate.content, category])

  return {
    messageTemplate,
    updateTemplate,
    setContent,
    setAttachmentType,
    setAttachmentPosition,
    setAttachmentFile,
    setImageUrl,
    validate,
    preview,
  }
}

export default useMessageTemplate
