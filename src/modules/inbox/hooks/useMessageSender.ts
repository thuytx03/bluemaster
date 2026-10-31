import { useCallback, useEffect, useState } from 'react'
import { v4 as uuid } from 'uuid'

import { EStorageKey } from 'src/constants/enum'
import { getFbRequestConfig } from 'src/modules/inbox/services/inbox.service'
import useInboxStore from 'src/modules/inbox/stores/inbox.store'
import { IInboxCampaignJob } from 'src/modules/inbox/types/inbox.types'
import {
  fileToStoredAttachment,
  isCampaignDone,
  jobToProgress,
  orderCustomers,
  resolveSchedule,
} from 'src/modules/inbox/utils/campaign.util'

type TCampaignCommand = 'pause' | 'resume' | 'stop' | 'sendNow' | 'clear'

function sendBgMessage<T = any>(message: Record<string, any>): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message))
      resolve(response)
    })
  })
}

export const getStoredCampaign = async (): Promise<IInboxCampaignJob | null> => {
  const res = await sendBgMessage<{ success: boolean; job?: IInboxCampaignJob | null }>({ action: 'INBOX_CAMPAIGN_GET' })
  return res?.job ?? null
}

/**
 * Step-6 controller. The service worker runs the campaign; this hook builds the
 * job, sends commands and mirrors the stored record into the store so the UI
 * keeps updating after a reload or while the panel is closed.
 */
export function useMessageSender() {
  const { campaign, updateSendProgress, resetSendProgress } = useInboxStore()
  const [startError, setStartError] = useState<string | null>(null)

  const { sendProgress, sendConfig, messageTemplate, filteredCustomers, excludedCustomerIds, fanpageId, fanpageName, fanpageAvatar, category } = campaign
  const finalCustomers = filteredCustomers.filter((c) => !excludedCustomerIds.includes(c.id))

  // Mirror the worker's record
  useEffect(() => {
    const apply = (job: IInboxCampaignJob | null | undefined) => {
      if (job) updateSendProgress(jobToProgress(job))
    }
    // A finished record left in storage must not overwrite the campaign about to start;
    // InboxPage already showed it when the tool was opened
    getStoredCampaign()
      .then((job) => {
        if (job && !isCampaignDone(job.status)) apply(job)
      })
      .catch(() => {})
    const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === 'local' && changes[EStorageKey.INBOX_CAMPAIGN]) {
        apply(changes[EStorageKey.INBOX_CAMPAIGN].newValue as IInboxCampaignJob | undefined)
      }
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [updateSendProgress])

  const startSending = useCallback(async () => {
    if (!fanpageId) { setStartError('Chưa chọn Fanpage'); return }
    if (finalCustomers.length === 0) { setStartError('Không có khách hàng để gửi'); return }
    if (!messageTemplate.content.trim() && !messageTemplate.attachmentFile) {
      setStartError('Chưa nhập nội dung tin nhắn')
      return
    }
    const schedule = resolveSchedule(sendConfig)
    if (schedule.error) { setStartError(schedule.error); return }

    // Loads the request config into the worker before the first send
    const config = await getFbRequestConfig()
    if (!config) { setStartError('Không lấy được cấu hình Facebook. Hãy đăng nhập lại facebook.com rồi thử lại.'); return }

    setStartError(null)
    resetSendProgress()

    try {
      const job: IInboxCampaignJob = {
        id: uuid(),
        pageId: fanpageId,
        pageName: fanpageName ?? '',
        pageAvatar: fanpageAvatar ?? '',
        category,
        customers: orderCustomers(finalCustomers, sendConfig),
        messageTemplate: messageTemplate.content,
        imageUrl: messageTemplate.imageUrl || undefined,
        attachment: messageTemplate.attachmentFile ? await fileToStoredAttachment(messageTemplate.attachmentFile) : null,
        attachmentType: messageTemplate.attachmentType,
        attachmentPosition: messageTemplate.attachmentPosition,
        sendConfig,
        scheduledStartAt: schedule.startAt,
        scheduledEndAt: schedule.endAt,
        status: 'idle',
        currentIndex: 0,
        successCount: 0,
        failureCount: 0,
        skippedCount: 0,
        currentCustomer: null,
        restUntil: 0,
        logs: [],
        createdAt: Date.now(),
      }
      const res = await sendBgMessage<{ success: boolean; error?: string }>({ action: 'INBOX_CAMPAIGN_START', payload: job })
      if (!res?.success) setStartError(res?.error ?? 'Không khởi động được chiến dịch')
    } catch (e: any) {
      setStartError(e?.message ?? 'Không khởi động được chiến dịch')
    }
  }, [fanpageId, fanpageName, fanpageAvatar, finalCustomers, messageTemplate, sendConfig, category, resetSendProgress])

  const command = useCallback((cmd: TCampaignCommand) => {
    return sendBgMessage({ action: 'INBOX_CAMPAIGN_COMMAND', payload: { command: cmd } }).catch(() => {})
  }, [])

  const pauseSending = useCallback(() => command('pause'), [command])
  const resumeSending = useCallback(() => command('resume'), [command])
  const stopSending = useCallback(() => command('stop'), [command])
  const sendNow = useCallback(() => command('sendNow'), [command])
  /** Forget the finished campaign so a new one can start */
  const clearCampaign = useCallback(async () => {
    await command('clear')
    resetSendProgress()
  }, [command, resetSendProgress])

  return {
    sendProgress,
    startError,
    startSending,
    pauseSending,
    resumeSending,
    stopSending,
    sendNow,
    clearCampaign,
  }
}

export default useMessageSender
