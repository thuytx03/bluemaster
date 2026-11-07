import { ImagePlus, X } from "lucide-react"
import { useRef } from "react"
import { useTranslation } from "react-i18next"

import type { CkImage } from "src/modules/automation/types/comment-hunter.types"
import { readImageFiles } from "src/modules/automation/utils/comment-hunter.util"
import { Button, IconButton } from "src/modules/shared/ui"

/** Image picker of the source Step 2: each post gets one random image from the list. */
export function ImageAttachments({
  images,
  setImages,
  disabled
}: {
  images: CkImage[]
  setImages: (updater: (prev: CkImage[]) => CkImage[]) => void
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAddImages = (files: FileList | null) => {
    if (!files?.length) return
    void readImageFiles(files).then((loaded) =>
      setImages((prev) => [...prev, ...loaded])
    )
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="bm-flex bm-flex-col bm-gap-1.5">
      <p className="bm-text-[12px] bm-font-medium bm-text-fg-muted">
        {t("comment_hunter_label_attach_image")}
      </p>
      <div className="bm-flex bm-flex-wrap bm-items-center bm-gap-2">
        <Button
          variant="outline"
          size="sm"
          icon={<ImagePlus size={14} />}
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}>
          {t("comment_hunter_button_choose_image")}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="bm-hidden"
          onChange={(e) => handleAddImages(e.target.files)}
        />
        {images.length > 0 && (
          <>
            <span className="bm-min-w-0 bm-max-w-[200px] bm-truncate bm-text-[12px] bm-text-fg-muted">
              {images.length === 1
                ? images[0].name
                : t("comment_hunter_image_count_random", {
                    count: images.length
                  })}
            </span>
            <IconButton
              size="xs"
              label={t("comment_hunter_button_clear_images")}
              onClick={() => setImages(() => [])}
              disabled={disabled}>
              <X size={13} />
            </IconButton>
          </>
        )}
      </div>
      <p className="bm-text-[11.5px] bm-text-fg-subtle">
        {t("comment_hunter_hint_image_prefix")}{" "}
        <strong>{t("comment_hunter_hint_image_multiple")}</strong>
        {t("comment_hunter_hint_image_middle")}
        <strong>{t("comment_hunter_hint_image_random_label")}</strong>
        {t("comment_hunter_hint_image_suffix")}
      </p>
      {images.length > 0 && (
        <div className="bm-mt-1 bm-flex bm-flex-wrap bm-gap-2">
          {images.map((img, idx) => (
            <div key={idx} className="bm-relative">
              <img
                src={img.dataUrl}
                alt={img.name}
                className="bm-h-14 bm-w-14 bm-rounded-lg bm-border bm-border-line bm-object-cover"
              />
              <button
                type="button"
                aria-label={t("comment_hunter_button_remove_image")}
                disabled={disabled}
                onClick={() =>
                  setImages((prev) => prev.filter((_, j) => j !== idx))
                }
                className="bm-absolute -bm-right-1 -bm-top-1 bm-flex bm-h-5 bm-w-5 bm-items-center bm-justify-center bm-rounded-full bm-bg-danger bm-text-white bm-shadow disabled:bm-opacity-50">
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
