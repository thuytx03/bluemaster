import { useCallback, useRef, useState } from 'react'
import { batchSendMessages } from 'src/modules/inbox/services/message-sender.service'
import { getFbRequestConfig } from 'src/modules/inbox/services/inbox.service'
import useInboxStore from 'src/modules/inbox/stores/inbox.store'
import { ISendLogEntry } from 'src/modules/inbox/types/inbox.types'
import { v4 as uuid } from 'uuid'

export function useMessageSender() {
  const { campaign, setSendStatus, updateSendProgress, addSendLog, resetSendProgress } = useInboxStore()

  const stoppedRef = useRef(false)
  const pausedRef = useRef(false)
  const [startError, setStartError] = useState<string | null>(null)

  const { sendProgress, sendConfig, messageTemplate, filteredCustomers, excludedCustomerIds, fanpageId, category } = campaign
  const finalCustomers = filteredCustomers.filter((c) => !excludedCustomerIds.includes(c.id))

  const startSending = useCallback(async () => {
    if (!fanpageId) { setStartError('Chưa chọn Fanpage'); return }
    if (finalCustomers.length === 0) { setStartError('Không có khách hàng để gửi'); return }
    if (!messageTemplate.content.trim() && !messageTemplate.attachmentFile) {
      setStartError('Chưa nhập nội dung tin nhắn')
      return
    }

    const config = await getFbRequestConfig()
    if (!config) { setStartError('Không lấy được cấu hình Facebook. Vui lòng thử lại.'); return }

    setStartError(null)
    stoppedRef.current = false
    pausedRef.current = false
    resetSendProgress()
    setSendStatus('running')
    updateSendProgress({ total: finalCustomers.length })

    let attachmentFiles: File[] | undefined
    if (messageTemplate.attachmentFile) {
      attachmentFiles = [messageTemplate.attachmentFile]
    }

    await batchSendMessages({
      customers: finalCustomers,
      pageId: fanpageId,
      category,
      messageTemplate: messageTemplate.content,
      imageUrl: messageTemplate.imageUrl || undefined,
      attachmentFiles,
      attachmentType: messageTemplate.attachmentType || undefined,
      attachmentPosition: messageTemplate.attachmentPosition,
      sendConfig,
      config,
      isStopped: () => stoppedRef.current,
      isPaused: () => pausedRef.current,

      onProgress: ({ currentIndex, successCount, failureCount, skippedCount, percent, currentCustomer, log }) => {
        const enrichedLog: ISendLogEntry = { ...log, id: uuid() }
        updateSendProgress({ currentIndex, successCount, failureCount, skippedCount, percent, currentCustomer })
        addSendLog(enrichedLog)
      },

      onRest: (restUntil) => {
        setSendStatus('resting')
        updateSendProgress({ restUntil })
      },

      onFinish: () => {
        const wasStopped = stoppedRef.current
        setSendStatus(wasStopped ? 'stopped' : 'finished')
        updateSendProgress({ currentCustomer: null, restUntil: 0 })
      },
    })
  }, [fanpageId, finalCustomers, messageTemplate, sendConfig, category, setSendStatus, updateSendProgress, addSendLog, resetSendProgress])

  const pauseSending = useCallback(() => {
    pausedRef.current = true
    setSendStatus('paused')
  }, [setSendStatus])

  const resumeSending = useCallback(() => {
    pausedRef.current = false
    setSendStatus('running')
  }, [setSendStatus])

  const stopSending = useCallback(() => {
    stoppedRef.current = true
    pausedRef.current = false
    setSendStatus('stopped')
  }, [setSendStatus])

  return {
    sendProgress,
    startError,
    startSending,
    pauseSending,
    resumeSending,
    stopSending,
  }
}

export default useMessageSender
