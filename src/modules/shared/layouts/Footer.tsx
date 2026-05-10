import { Typography } from "antd"
import { EXTENSION_INFO } from "src/constants"
import { useTranslation } from "react-i18next"

const Footer = () => {
  const { t } = useTranslation()
  const year = new Date().getFullYear()
  
  return (
    <footer className="w-full py-4 px-6 border-t border-zinc-100 dark:border-zinc-900 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm">
      <div className="flex flex-col items-center justify-center gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 tracking-tight uppercase">
            {t("footer_copyright", { year, author: EXTENSION_INFO.author })}
          </span>
          <div className="w-1 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <span className="px-1.5 py-0.5 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
            v{EXTENSION_INFO.version}
          </span>
        </div>
        
        <div className="text-[10px] text-zinc-400/80 dark:text-zinc-600 font-medium">
          Premium Social Extension Tool
        </div>
      </div>
    </footer>
  )
}

export default Footer
