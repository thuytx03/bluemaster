import { FileText } from "lucide-react"
import { useTranslation } from "react-i18next"

import { DEFAULT_SINGLE_FILE_NAME_FORMAT, SINGLE_DOWNLOAD_TYPES } from "src/constants/download.constants"
import FileNameFormatPicker from "src/modules/download/components/FileNameFormatPicker"
import { ESingleDownloadType } from "src/constants/enum"
import useExtensionState from "src/stores/extension-state.store"

const PREVIEW_EXTENSION: Partial<Record<ESingleDownloadType, string>> = {
  [ESingleDownloadType.FACEBOOK_VIDEO]: "mp4",
  [ESingleDownloadType.FACEBOOK_COMMENT_VIDEO]: "mp4"
}

/** Settings block: per-type file name format for the multi-URL downloader */
const SingleFileNameConfig = () => {
  const { t } = useTranslation()
  const {
    extensionState: { downloadSingleFileNameConfig },
    setDownloadSingleFileNameConfig
  } = useExtensionState()

  return (
    <div className="bm-grid bm-grid-cols-1 bm-gap-3">
      {SINGLE_DOWNLOAD_TYPES.map((meta) => {
        const value = downloadSingleFileNameConfig[meta.type] ?? DEFAULT_SINGLE_FILE_NAME_FORMAT
        return (
          <div
            key={meta.type}
            className="bm-rounded-xl bm-border bm-border-line bm-bg-surface bm-p-3 bm-transition-shadow hover:bm-shadow-card">
            <div className="bm-mb-2 bm-flex bm-items-center bm-gap-2 bm-text-[12.5px] bm-font-semibold bm-text-fg">
              <FileText size={13} className="bm-text-fg-muted" />
              {t(meta.label)}
            </div>
            <FileNameFormatPicker
              value={value}
              options={meta.fileNameOptions}
              previewExtension={PREVIEW_EXTENSION[meta.type] ?? "jpg"}
              onChange={(next) => {
                // never persist an empty format: fall back to the default
                void setDownloadSingleFileNameConfig(
                  meta.type,
                  next.length ? next : DEFAULT_SINGLE_FILE_NAME_FORMAT
                )
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

export default SingleFileNameConfig
