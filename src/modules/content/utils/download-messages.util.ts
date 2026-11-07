import FileSaver from "file-saver"
import type { TFunction } from "i18next"

import { normalizeForSearch } from "src/configs/tools.config"
import type {
  DownloadMessagesFormat,
  MessageThread,
  RawMessage,
  ThreadTypeFilter
} from "src/modules/content/types/download-messages.types"
import { exportToCSV, exportToExcel, exportToTXT } from "src/utils/export.util"

interface Viewer {
  uid: string
  name?: string | null
}

export const escapeHtml = (e: string | null | undefined) =>
  String(e ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")

const formatTimestamp = (ts?: string) => (ts ? new Date(parseInt(ts, 10)).toLocaleString("vi-VN") : "")

const isSystemMessage = (msg: RawMessage) => msg.__typename === "GenericAdminTextMessage"

/** Group-type filter accepts both GROUP and GROUP_THREAD; search matches name, type and participant names. */
export function filterThreads(threads: MessageThread[], query: string, typeFilter: ThreadTypeFilter): MessageThread[] {
  const trimmed = query.trim()
  const normalizedQuery = normalizeForSearch(trimmed)
  return threads.filter((thread) => {
    if (typeFilter !== "all") {
      if (typeFilter === "GROUP") {
        if (thread.threadType !== "GROUP" && thread.threadType !== "GROUP_THREAD") return false
      } else if (thread.threadType !== typeFilter) {
        return false
      }
    }
    if (!trimmed) return true
    const nameMatch = normalizeForSearch(thread.name || "").includes(normalizedQuery)
    const typeMatch = normalizeForSearch(thread.threadType || "").includes(normalizedQuery)
    const participantMatch = thread.participants.some((p) => normalizeForSearch(p.name || "").includes(normalizedQuery))
    return nameMatch || typeMatch || participantMatch
  })
}

function resolveSenderName(msg: RawMessage, thread: MessageThread, viewer: Viewer, t: TFunction): string {
  const senderName = msg.message_sender?.messaging_actor?.name || msg.message_sender?.name
  if (senderName) return senderName
  const senderId = msg.message_sender?.id
  if (senderId === viewer.uid) {
    return viewer.name || t("download_messages_tool_default_sender_me")
  }
  const found = thread.participants.find((p) => p.id === senderId)
  return found ? found.name : t("download_messages_tool_default_participant_name")
}

function renderMessageHtml(msg: RawMessage, thread: MessageThread, viewer: Viewer, t: TFunction): string {
  const isMe = msg.message_sender?.id === viewer.uid
  const timestampStr = formatTimestamp(msg.timestamp_precise)

  if (isSystemMessage(msg)) {
    return `
            <div class="timestamp">${escapeHtml(timestampStr)}</div>
            <div class="msg system"><div class="bubble">${escapeHtml(msg.snippet ?? "")}</div></div>
            `
  }

  const senderName = resolveSenderName(msg, thread, viewer, t)
  const showSenderName = !isMe && thread.threadType !== "ONE_TO_ONE"

  let content = ""
  if (msg.message?.text) {
    content += `<span>${escapeHtml(msg.message.text).replace(/\n/g, "<br>")}</span>`
  }
  for (const att of msg.blob_attachments ?? []) {
    const imgUri = att.large_preview?.uri || att.preview?.uri
    if (imgUri) {
      content += `<img src="${escapeHtml(imgUri)}" class="img-attachment" loading="lazy" alt="attachment">`
    }
  }
  if (msg.sticker?.url) {
    content += `<img src="${escapeHtml(msg.sticker.url)}" class="sticker" loading="lazy" alt="${escapeHtml(msg.sticker.label ?? "sticker")}">`
  }
  if (!content) {
    content = `<span style="opacity:0.5;font-style:italic">${escapeHtml(t("download_messages_tool_unsupported_message_type"))}</span>`
  }

  const alignClass = isMe ? "me" : "them"
  return `
        <div class="timestamp">${escapeHtml(timestampStr)}</div>
        <div class="msg ${alignClass}">
            <div class="bubble-wrapper">
                ${showSenderName ? `<div class="sender-name">${escapeHtml(senderName)}</div>` : ""}
                <div class="bubble">${content}</div>
            </div>
        </div>
        `
}

export function generateTxtContent(thread: MessageThread, messages: RawMessage[], viewer: Viewer, t: TFunction): string {
  let text = `==================================================\n`
  text += `${t("download_messages_tool_txt_header_title")}\n`
  text += `${t("download_messages_tool_txt_conversation_label")}: ${thread.name || t("download_messages_tool_txt_unnamed")}\n`
  text += `${t("download_messages_tool_txt_type_label")}: ${thread.threadType === "ONE_TO_ONE" ? t("download_messages_tool_txt_type_personal") : t("download_messages_tool_txt_type_group")}\n`
  text += `${t("download_messages_tool_txt_export_count_label")}: ${messages.length}\n`
  text += `${t("download_messages_tool_txt_export_time_label")}: ${new Date().toLocaleString("vi-VN")}\n`
  text += `${t("download_messages_tool_txt_members_label")}: ${thread.participants.map((p) => p.name).join(", ")}\n`
  text += `==================================================\n\n`

  messages.forEach((msg) => {
    const timestampStr = formatTimestamp(msg.timestamp_precise)
    if (isSystemMessage(msg)) {
      text += `[${timestampStr}] [${t("download_messages_tool_txt_system_tag")}] ${msg.snippet || ""}\n`
      return
    }
    const senderName = resolveSenderName(msg, thread, viewer, t)
    let body = msg.message?.text || ""
    if (msg.blob_attachments?.length) body += t("download_messages_tool_txt_attachment_tag")
    if (msg.sticker?.url) body += t("download_messages_tool_txt_sticker_tag")
    if (!body) body = t("download_messages_tool_txt_unsupported_body")
    text += `[${timestampStr}] ${senderName}: ${body}\n`
  })

  return text
}

export function generateHtmlContent(thread: MessageThread, messages: RawMessage[], viewer: Viewer, t: TFunction): string {
  const defaultName = t("download_messages_tool_html_default_name")
  const title = `${t("download_messages_tool_html_title_prefix")} ${thread.name || defaultName}`
  const listHtml = messages.map((msg) => renderMessageHtml(msg, thread, viewer, t)).join("\n")

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1c1e21; color: #e4e6eb; min-height: 100vh; padding: 20px 16px; }
    .chat-wrapper { max-width: 700px; margin: 0 auto; background: #242526; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); overflow: hidden; display: flex; flex-direction: column; }
    .chat-header { text-align: center; padding: 24px 16px 16px; border-bottom: 1px solid #3a3b3c; background: rgba(255,255,255,0.02); }
    .chat-header h1 { font-size: 1.4rem; font-weight: 700; color: #e4e6eb; }
    .chat-header .meta { font-size: 0.8rem; color: #8a8d91; margin-top: 6px; display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; }
    .chat-header .badge { display: inline-block; background: #3a3b3c; border-radius: 12px; padding: 2px 10px; font-size: 0.75rem; color: #b0b3b8; }
    .messages { display: flex; flex-direction: column; gap: 4px; padding: 20px; }
    .msg { display: flex; align-items: flex-end; gap: 8px; padding: 2px 0; width: 100%; }
    .msg.me { justify-content: flex-end; }
    .msg.them { justify-content: flex-start; }
    .msg.system { justify-content: center; }
    .bubble-wrapper { max-width: 70%; display: flex; flex-direction: column; }
    .msg.me .bubble-wrapper { align-items: flex-end; }
    .msg.them .bubble-wrapper { align-items: flex-start; }
    .sender-name { font-size: 0.75rem; color: #8a8d91; margin-bottom: 4px; margin-left: 4px; }
    .bubble { padding: 10px 16px; border-radius: 18px; font-size: 0.92rem; line-height: 1.4; word-break: break-word; }
    .msg.them .bubble { background: #3a3b3c; border-bottom-left-radius: 4px; color: #e4e6eb; }
    .msg.me .bubble { background: #0084ff; border-bottom-right-radius: 4px; color: #fff; }
    .msg.system .bubble { background: transparent; color: #8a8d91; font-size: 0.78rem; font-style: italic; text-align: center; padding: 4px 8px; }
    .img-attachment { max-width: 260px; border-radius: 12px; margin-top: 6px; display: block; }
    .sticker { width: 90px; height: 90px; object-fit: contain; display: block; margin-top: 4px; }
    .timestamp { font-size: 0.68rem; color: #8a8d91; text-align: center; margin: 12px 0 2px; width: 100%; }
    .footer { text-align: center; padding: 20px; font-size: 0.75rem; color: #8a8d91; border-top: 1px solid #3a3b3c; background: rgba(255,255,255,0.01); }
  </style>
</head>
<body>
  <div class="chat-wrapper">
    <div class="chat-header">
      <h1>${escapeHtml(thread.name || defaultName)}</h1>
      <div class="meta">
        <span>${escapeHtml(thread.threadType === "ONE_TO_ONE" ? t("download_messages_tool_html_type_direct") : t("download_messages_tool_html_type_group"))}</span>
        <span class="badge">${messages.length} ${escapeHtml(t("download_messages_tool_html_message_count_suffix"))}</span>
      </div>
    </div>
    <div class="messages">
      ${listHtml}
    </div>
    <div class="footer">${escapeHtml(t("download_messages_tool_html_footer_exported_by"))} &middot; ${escapeHtml(new Date().toLocaleString("vi-VN"))}</div>
  </div>
</body>
</html>`
}

/** Builds the conversation file (HTML or TXT) and hands it to the browser download. */
export function saveConversationFile(
  thread: MessageThread,
  messages: RawMessage[],
  format: DownloadMessagesFormat,
  viewer: Viewer,
  t: TFunction
): void {
  const cleanThreadName = (thread.name || t("download_messages_tool_html_default_name")).replace(
    /[/\\?%*:|"<>\s]/g,
    "_"
  )
  const baseName = `Messenger_${cleanThreadName}_${new Date().toISOString().slice(0, 10)}`
  if (format === "txt") {
    exportToTXT(generateTxtContent(thread, messages, viewer, t), `${baseName}.txt`)
  } else {
    const html = generateHtmlContent(thread, messages, viewer, t)
    FileSaver.saveAs(new Blob([html], { type: "text/html;charset=utf-8" }), `${baseName}.html`)
  }
}

export const getThreadTypeLabel = (threadType: string, t: TFunction) =>
  threadType === "ONE_TO_ONE"
    ? t("download_messages_tool_type_personal")
    : threadType === "PAGE"
      ? t("download_messages_tool_type_fanpage")
      : t("download_messages_tool_type_group")

const listHeaders = (t: TFunction) => [
  t("download_messages_tool_csv_header_id"),
  t("download_messages_tool_csv_header_name"),
  t("download_messages_tool_csv_header_type"),
  t("download_messages_tool_csv_header_message_count"),
  t("download_messages_tool_csv_header_member_count")
]

const listRows = (threads: MessageThread[], t: TFunction) =>
  threads.map((thread) => [
    thread.id,
    thread.name || "",
    getThreadTypeLabel(thread.threadType, t),
    thread.messagesCount,
    thread.participants.length + 1
  ])

const listFileName = (t: TFunction) =>
  `${t("download_messages_tool_export_list_filename")}_${new Date().toISOString().slice(0, 10)}`

export function exportThreadListCsv(threads: MessageThread[], t: TFunction): void {
  exportToCSV(listHeaders(t), listRows(threads, t), `${listFileName(t)}.csv`)
}

export function exportThreadListExcel(threads: MessageThread[], t: TFunction): void {
  const cols = ["A", "B", "C", "D", "E"]
  const toRow = (values: unknown[]) => Object.fromEntries(cols.map((c, i) => [c, values[i]]))
  const header = [toRow(listHeaders(t)) as Record<string, string>]
  const data = listRows(threads, t).map(toRow)
  exportToExcel(data, listFileName(t), [{ wch: 22 }, { wch: 36 }, { wch: 14 }, { wch: 14 }, { wch: 14 }], header)
}
