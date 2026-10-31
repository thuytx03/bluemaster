import { Braces, Cookie, Download, FileDown, FileJson, FileText, Globe } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { EXTENSION_INFO } from "src/constants"
import PageContainer from "src/modules/shared/components/PageContainer"
import {
  Button,
  Callout,
  CopyButton,
  Dropdown,
  DropdownItem,
  Field,
  Input,
  Surface,
  Textarea
} from "src/modules/shared/ui"
import { chromeUtils } from "src/utils/chrome.util"
import { exportToJson, exportToTXT } from "src/utils/export.util"

const OutputBlock = ({
  title,
  icon,
  value,
  exportMenu,
  downloadLabel,
  placeholder
}: {
  title: string
  icon: JSX.Element
  value: string
  exportMenu: DropdownItem[]
  downloadLabel: string
  placeholder: string
}) => (
  <Surface
    title={title}
    icon={icon}
    padding="sm"
    extra={
      <>
        <CopyButton text={value} size="xs" />
        <Dropdown items={exportMenu} placement="bottom-end">
          <Button size="xs" variant="primary" icon={<Download size={13} />} disabled={!value}>
            {downloadLabel}
          </Button>
        </Dropdown>
      </>
    }>
    <Textarea
      placeholder={placeholder}
      value={value}
      readOnly
      mono
      rows={value ? 7 : 3}
      className="bm-max-h-60"
    />
  </Surface>
)

const ExportCookiesPage = () => {
  const { t } = useTranslation()
  const [url, setUrl] = useState<string>(window.location.origin)
  const [cookies, setCookies] = useState<string>("")
  const [cookieString, setCookieString] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const cleanUrl = url.replace(/^https?:\/\//i, "")
  const fileName = `${cleanUrl}_${new Date().toLocaleDateString("vi-VN").replace(/\//g, "-")}`

  const getCookiesByUrl = async () => {
    let validUrl = url
    if (!/^https?:\/\//i.test(validUrl)) {
      validUrl = "https://" + validUrl
    }
    setLoading(true)
    return toast
      .promise(
        (async () => {
          const cookiesArray = await chromeUtils.getChromeCookiesList(validUrl)

          const cookieJson = JSON.stringify(
            {
              url: validUrl,
              cookies: cookiesArray
            },
            null,
            2
          )

          setCookies(cookieJson)
          setCookieString(
            cookiesArray
              .map((cookie: { name: string; value: string }) => `${cookie.name}=${cookie.value}`)
              .join("; ")
          )
        })(),
        {
          loading: t("loading_get_cookies", { url: validUrl }),
          success: t("success_get_cookies", { url: validUrl }),
          error: t("error_get_cookies", { url: validUrl })
        }
      )
      .unwrap()
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }

  const exportMenu = (data: string) => [
    {
      key: "txt",
      label: t("download_txt"),
      icon: <FileText size={14} />,
      onClick: () => exportToTXT(data, fileName)
    },
    {
      key: "json",
      label: t("download_json"),
      icon: <FileJson size={14} />,
      onClick: () => exportToJson(data, fileName)
    }
  ]

  return (
    <PageContainer
      title={t("export_cookies")}
      description={t("cookies_info")}
      icon={<Cookie size={20} />}
      accent="bm-bg-amber-500/12 bm-text-amber-600 dark:bm-text-amber-400">
      <Callout tone="secure" compact>
        <div className="bm-flex bm-flex-col bm-gap-0.5">
          <span>
            🔒 {t("cookies_safe", { ext: EXTENSION_INFO.displayName })}{" "}
            <span className="bm-font-medium">{t("cookies_safe_highlight")}</span>.
          </span>
          <span>
            📌 {t("cookies_local")} <span className="bm-font-medium">{t("cookies_local_highlight")}</span>,{" "}
            {t("cookies_local_extra")}.
          </span>
          <span>
            ✅ {t("cookies_privacy")} <span className="bm-font-medium">{t("cookies_privacy_highlight")}</span>.
          </span>
        </div>
      </Callout>

      <Surface padding="sm">
        <Field label={t("target_url")}>
          <div className="bm-flex bm-gap-2">
            <Input
              prefix={<Globe size={14} />}
              placeholder={t("input_url_placeholder")}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && getCookiesByUrl()}
              className="bm-flex-1"
            />
            <Button variant="primary" loading={loading} icon={<FileDown size={14} />} onClick={getCookiesByUrl}>
              {t("get_cookies")}
            </Button>
          </div>
        </Field>
      </Surface>

      <OutputBlock
        title={t("extract_cookies_from_json", { url: cleanUrl })}
        icon={<Braces size={14} />}
        value={cookies}
        exportMenu={exportMenu(cookies)}
        downloadLabel={t("download_file")}
        placeholder={t("cookies_placeholder")}
      />
      <OutputBlock
        title={t("extract_cookies_from_string", { url: cleanUrl })}
        icon={<FileText size={14} />}
        value={cookieString}
        exportMenu={exportMenu(cookieString)}
        downloadLabel={t("download_file")}
        placeholder={t("cookies_placeholder")}
      />
    </PageContainer>
  )
}

export default ExportCookiesPage
