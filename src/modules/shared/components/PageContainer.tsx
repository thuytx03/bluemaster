import { FC, PropsWithChildren } from "react"
import { useTranslation } from "react-i18next"
import { EXTENSION_INFO } from "src/constants"
import useExtensionState from "src/store/extension-state"
import { cn } from "src/utils/common.util"

interface IPageContainerProps extends PropsWithChildren {
  title?: string
  className?: string
}

const PageContainer: FC<IPageContainerProps> = ({
  children,
  title,
  className
}) => {
  const { t } = useTranslation()
  const { extensionState } = useExtensionState()

  return (
    <div
      className={cn(
        "h-full w-full bg-transparent flex flex-col",
        className
      )}>
      {extensionState.isUpdateAvailable ? (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-xl shadow-lg flex flex-col gap-3 animate-fade-in-up mb-4">
          <div className="flex flex-col">
            <span className="font-semibold text-base leading-tight">
              {t("update_available_title") || "🚀 Phiên bản mới!"}
            </span>
            <span className="text-xs text-white/90 mt-1">
              {t("update_available_desc") || "Vui lòng tải phiên bản mới nhất."}
            </span>
          </div>
          <a
            href={EXTENSION_INFO.link_download}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-white text-blue-600 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-100 transition flex items-center justify-center text-sm">
            {t("update_button") || "Cập nhật"}
          </a>
        </div>
      ) : null}
      {title && <h1 className="text-xl font-bold mb-4 px-1">{title}</h1>}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}

export default PageContainer
