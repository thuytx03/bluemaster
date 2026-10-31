import {
  CalendarRange,
  Clapperboard,
  Clock,
  Crosshair,
  Download,
  FileText,
  FolderTree,
  Gauge,
  Images,
  Layers,
  Link2,
  Sparkles,
  User,
  Users,
  Video
} from "lucide-react"
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { v4 as uuidv4 } from "uuid"

import {
  BULK_TYPES_WITH_DATE_FILTER,
  BULK_TYPES_WITH_FOLDER_STRUCTURE,
  BULK_TYPES_WITH_TITLE_AND_TIMESTAMP,
  DEFAULT_BULK_FILE_NAME_FORMAT,
  DEFAULT_CONCURRENCY_PROCESS_LIMIT,
  FACEBOOK_DOWNLOAD_ALL_TYPE_OPTIONS,
  FILE_NAME_CONFIG_DEFAULT_OPTIONS
} from "src/constants/download.constants"
import { ESocialProvider } from "src/constants/enum"
import VerifyAccountNotice from "src/modules/facebook/components/VerifyAccountNotice"
import DateRangeField from "src/modules/download/components/DateRangeField"
import DownloadProcessTable from "src/modules/download/components/DownloadProcessTable"
import FileNameFormatPicker from "src/modules/download/components/FileNameFormatPicker"
import SaveModeField from "src/modules/download/components/SaveModeField"
import useFbBulkDownload, { IBulkTargetInfo } from "src/modules/download/hooks/useFbBulkDownload"
import useSaveMode from "src/modules/download/hooks/useSaveMode"
import useDownloadProcesses from "src/stores/download-process.store"
import {
  IBulkDownloadOptions,
  TDateRange,
  TFacebookDownloadAllType,
  TFacebookTarget,
  TFileNameToken
} from "src/modules/download/types/download.types"
import { parseFacebookTarget } from "src/modules/download/utils/url.util"
import facebookService from "src/modules/facebook/services/facebook.service"
import {
  Button,
  Field,
  Input,
  NumberInput,
  RadioGroup,
  Segmented,
  Select,
  Surface
} from "src/modules/shared/ui"
import { isVerifyAccount } from "src/utils/common.util"
import { formatRangeDateForUIRender, isValidDateRange } from "src/utils/date-time.util"
import { showErrorToast } from "src/utils/toast.util"

const TYPE_LABEL: Record<TFacebookDownloadAllType, string> = {
  PHOTO: "photo_label",
  VIDEO: "video_label",
  REEL: "reel_label",
  HIGHLIGHT: "highlight_label",
  STORY: "story_label"
}

const TYPE_ICON: Record<TFacebookDownloadAllType, ReactNode> = {
  PHOTO: <Images size={14} />,
  VIDEO: <Video size={14} />,
  REEL: <Clapperboard size={14} />,
  HIGHLIGHT: <Sparkles size={14} />,
  STORY: <Clock size={14} />
}

const TYPE_DESC: Record<TFacebookDownloadAllType, string> = {
  PHOTO: "download_type_desc_photo",
  VIDEO: "download_type_desc_video",
  REEL: "download_type_desc_reel",
  HIGHLIGHT: "download_type_desc_highlight",
  STORY: "download_type_desc_story"
}

const DownloadAllForm = () => {
  const { t } = useTranslation()
  const { bulkProcesses, addBulkProcess, removeBulkProcess, updateBulkProcess, clearFinishedProcesses } =
    useDownloadProcesses()
  const {
    startDownloadAllPhotos,
    startDownloadAllVideos,
    startDownloadAllReels,
    startDownloadAllHighlights,
    startDownloadActiveStories
  } = useFbBulkDownload()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [target, setTarget] = useState<TFacebookTarget>("PROFILE")
  const [type, setType] = useState<TFacebookDownloadAllType | undefined>(undefined)
  const [userUrl, setUserUrl] = useState("")
  const [fileNameFormat, setFileNameFormat] = useState<TFileNameToken[]>(DEFAULT_BULK_FILE_NAME_FORMAT)
  const [filterByRangeDate, setFilterByRangeDate] = useState<TDateRange | null>(null)
  const [concurrency, setConcurrency] = useState<number | null>(DEFAULT_CONCURRENCY_PROCESS_LIMIT)
  const [delayTimeInSecond, setDelayTimeInSecond] = useState<number | null>(0)
  const [isMergeIntoOneFolder, setIsMergeIntoOneFolder] = useState(false)
  const [saveMode, setSaveMode] = useSaveMode()
  const [errors, setErrors] = useState<{ type?: string; userUrl?: string; fileNameFormat?: string }>({})

  const supportsDateFilter = !!type && BULK_TYPES_WITH_DATE_FILTER.includes(type)
  const supportsFolderStructure = !!type && BULK_TYPES_WITH_FOLDER_STRUCTURE.includes(type)
  const fileNameOptions = useMemo<TFileNameToken[]>(
    () =>
      type && BULK_TYPES_WITH_TITLE_AND_TIMESTAMP.includes(type)
        ? FILE_NAME_CONFIG_DEFAULT_OPTIONS
        : type === "HIGHLIGHT" || type === "STORY"
          ? ["numericalOrder", "id", "title"]
          : ["numericalOrder", "id"],
    [type]
  )

  // Drop tokens / filters a newly selected type does not support
  useEffect(() => {
    setFileNameFormat((f) => {
      const next = f.filter((token) => fileNameOptions.includes(token))
      return next.length ? next : DEFAULT_BULK_FILE_NAME_FORMAT
    })
    if (!supportsDateFilter) setFilterByRangeDate(null)
  }, [fileNameOptions, supportsDateFilter])

  const handleTargetChange = (next: TFacebookTarget) => {
    setTarget(next)
    setType(undefined)
  }

  const fbProcesses = bulkProcesses[ESocialProvider.FACEBOOK]

  const runners: Record<TFacebookDownloadAllType, typeof startDownloadAllPhotos> = {
    PHOTO: startDownloadAllPhotos,
    VIDEO: startDownloadAllVideos,
    REEL: startDownloadAllReels,
    HIGHLIGHT: startDownloadAllHighlights,
    STORY: startDownloadActiveStories
  }

  /** Run a failed job again with the exact same target and options */
  const handleRetry = (processId: string) => {
    const process = fbProcesses.find((p) => p.id === processId)
    if (!process?.retryPayload) return
    const { info, options } = process.retryPayload
    updateBulkProcess(ESocialProvider.FACEBOOK, processId, {
      status: "RUNNING",
      totalDownloadedItems: 0,
      skippedItems: 0
    })
    void runners[process.downloadType](info, processId, options)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!type) next.type = t("please_select_download_type")
    if (!userUrl.trim()) next.userUrl = target === "PROFILE" ? t("please_enter_user_url") : t("please_enter_group_url")
    if (fileNameFormat.length === 0) next.fileNameFormat = t("please_select_file_name_format")
    setErrors(next)
    if (Object.keys(next).length || !type) return

    const options: IBulkDownloadOptions = {
      saveMode,
      fileNameFormat,
      filterByRangeDate: supportsDateFilter && isValidDateRange(filterByRangeDate) ? filterByRangeDate : null,
      concurrencyProcessLimit: Math.max(1, concurrency ?? DEFAULT_CONCURRENCY_PROCESS_LIMIT),
      delayTimeInSecond: Math.max(0, delayTimeInSecond ?? 0),
      isMergeIntoOneFolder: supportsFolderStructure && isMergeIntoOneFolder
    }

    try {
      setIsSubmitting(true)
      if (!isVerifyAccount(ESocialProvider.FACEBOOK)) {
        throw new Error(t("please_verify_facebook_before_download"))
      }
      const identifier = parseFacebookTarget(userUrl, target)
      let info: IBulkTargetInfo
      if (target === "PROFILE") {
        const profile = await facebookService.getProfileInfo(identifier)
        info = { target, id: profile.id, profile }
      } else {
        const groupId = /^\d+$/.test(identifier)
          ? identifier
          : await facebookService.getGroupIdFromName(identifier)
        info = { target, id: groupId }
      }
      setIsSubmitting(false)

      const processId = uuidv4()
      addBulkProcess(ESocialProvider.FACEBOOK, {
        id: processId,
        username: info.profile?.name || identifier,
        downloadType: type,
        totalDownloadedItems: 0,
        skippedItems: 0,
        filterRangeDate: formatRangeDateForUIRender(options.filterByRangeDate),
        status: "RUNNING",
        retryPayload: { info, options }
      })
      void runners[type](info, processId, options)
    } catch (error) {
      showErrorToast((error as Error).message)
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="bm-flex bm-flex-col bm-gap-4">
      <VerifyAccountNotice provider={ESocialProvider.FACEBOOK} />

      {/* Source */}
      <Surface padding="md" title={t("download_source")} icon={<Crosshair size={14} />}>
        <div className="bm-flex bm-flex-col bm-gap-3">
          <Segmented<TFacebookTarget>
            block
            size="sm"
            value={target}
            onChange={handleTargetChange}
            options={[
              { value: "PROFILE", label: t("user"), icon: <User size={13} /> },
              { value: "GROUP", label: t("group"), icon: <Users size={13} /> }
            ]}
          />
          <div className="bm-grid bm-grid-cols-1 bm-gap-3 pw-md:bm-grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <Field label={t("download_type_label")} required error={errors.type}>
              <Select<TFacebookDownloadAllType>
                value={type}
                invalid={!!errors.type}
                placeholder={t("select_download_type_placeholder")}
                onChange={(v) => {
                  setType(v)
                  setErrors((er) => ({ ...er, type: undefined }))
                }}
                options={FACEBOOK_DOWNLOAD_ALL_TYPE_OPTIONS[target].map((o) => ({
                  value: o.value,
                  label: t(o.label),
                  icon: TYPE_ICON[o.value],
                  description: t(TYPE_DESC[o.value])
                }))}
              />
            </Field>
            <Field
              label={target === "PROFILE" ? t("user_url_label") : t("group_url_label")}
              required
              error={errors.userUrl}
              hint={t("user_url_hint")}>
              <Input
                value={userUrl}
                invalid={!!errors.userUrl}
                prefix={<Link2 size={13} />}
                placeholder={
                  target === "PROFILE"
                    ? "https://www.facebook.com/username"
                    : "https://www.facebook.com/groups/..."
                }
                onChange={(e) => {
                  setUserUrl(e.target.value)
                  setErrors((er) => ({ ...er, userUrl: undefined }))
                }}
              />
            </Field>
          </div>
        </div>
      </Surface>

      {/* Options */}
      <div className="bm-grid bm-grid-cols-1 bm-gap-3 pw-md:bm-grid-cols-2">
        <Surface
          padding="sm"
          title={t("file_name_config_title")}
          description={errors.fileNameFormat ? undefined : t("file_name_config_desc")}
          icon={<FileText size={14} />}
          className={errors.fileNameFormat ? "bm-border-danger/60" : undefined}>
          <FileNameFormatPicker
            value={fileNameFormat}
            onChange={(v) => {
              setFileNameFormat(v)
              setErrors((er) => ({ ...er, fileNameFormat: undefined }))
            }}
            options={fileNameOptions}
            previewExtension={type === "VIDEO" || type === "REEL" ? "mp4" : "jpg"}
          />
          {errors.fileNameFormat && (
            <div className="bm-mt-2 bm-text-[11.5px] bm-text-danger bm-animate-fade-in">{errors.fileNameFormat}</div>
          )}
        </Surface>

        <Surface padding="sm" title={t("download_speed_title")} icon={<Gauge size={14} />}>
          <SaveModeField value={saveMode} onChange={setSaveMode} />
          <div className="bm-mt-3 bm-grid bm-grid-cols-2 bm-gap-3">
            <Field label={t("concurrency_processing_size")} hint={t("concurrency_tooltip")}>
              <NumberInput
                min={1}
                max={30}
                value={concurrency}
                onChange={setConcurrency}
                prefix={<Layers size={13} />}
              />
            </Field>
            <Field label={t("delay_options")} hint={t("delay_tooltip")}>
              <NumberInput
                min={0}
                value={delayTimeInSecond}
                onChange={setDelayTimeInSecond}
                prefix={<Clock size={13} />}
                suffix={t("seconds")}
              />
            </Field>
          </div>
        </Surface>

        {supportsDateFilter && (
          <Surface
            padding="sm"
            title={t("filter_by_range_date")}
            description={t("filter_by_range_date_hint")}
            icon={<CalendarRange size={14} />}
            className="bm-animate-fade-in">
            <DateRangeField value={filterByRangeDate} onChange={setFilterByRangeDate} />
          </Surface>
        )}

        {supportsFolderStructure && (
          <Surface
            padding="sm"
            title={t("folder_structure_options")}
            icon={<FolderTree size={14} />}
            className="bm-animate-fade-in">
            <RadioGroup<boolean>
              value={isMergeIntoOneFolder}
              onChange={setIsMergeIntoOneFolder}
              options={[
                { value: false, label: t("separate_highlight_folder"), description: "highlights/1_<id>/…" },
                { value: true, label: t("merge_highlight_folder"), description: "highlights/1-1_<id>.jpg" }
              ]}
            />
          </Surface>
        )}
      </div>

      <div className="bm-flex bm-items-center bm-justify-between bm-gap-3">
        <span className="bm-text-[11.5px] bm-text-fg-subtle">{t("download_root_folder_hint")}</span>
        <Button type="submit" variant="primary" loading={isSubmitting} icon={<Download size={14} />}>
          {t("start_download")}
        </Button>
      </div>

      <DownloadProcessTable
        processes={fbProcesses}
        onCancel={(id) => removeBulkProcess(ESocialProvider.FACEBOOK, id)}
        onRetry={handleRetry}
        onClearFinished={clearFinishedProcesses}
        targetLabel={t("target_column")}
        typeLabel={(downloadType) => t(TYPE_LABEL[downloadType])}
        showSkipped
        showFilterDate
      />
    </form>
  )
}

export default DownloadAllForm
