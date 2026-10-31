import { Braces, ExternalLink, KeyRound } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { EXTENSION_INFO } from "src/constants"
import PageContainer from "src/modules/shared/components/PageContainer"
import { Badge, Callout, CopyButton, Surface, Tabs, Textarea } from "src/modules/shared/ui"

import { IAccessTokenPage } from "src/modules/facebook/types/facebook.types"
import { fetchTokenEAAB, fetchTokenEAAGNO } from "src/modules/facebook/utils/facebook.util"

const TokenPanel = ({
  description,
  placeholder,
  value
}: {
  description: string
  placeholder: string
  value: string
}) => (
  <Surface
    padding="sm"
    title={description}
    icon={<KeyRound size={14} />}
    extra={
      <>
        {value ? (
          <Badge tone="success" size="xs" dot>
            {value.length} ký tự
          </Badge>
        ) : (
          <Badge tone="neutral" size="xs" dot pulse>
            …
          </Badge>
        )}
        <CopyButton text={value} size="xs" variant="primary" />
      </>
    }>
    <Textarea placeholder={placeholder} value={value} readOnly mono rows={4} className="bm-break-all" />
  </Surface>
)

export default function AccessTokenPage() {
  const { t } = useTranslation()
  const [token, setToken] = useState<IAccessTokenPage>({
    tokenEAAB: "",
    tokenEAAGNO: ""
  })

  const handleGetTokenEEAB = async () => {
    if (!token.tokenEAAB) {
      return toast.promise(
        (async () => {
          const result = await fetchTokenEAAB()
          if (result) {
            setToken((prev) => ({ ...prev, tokenEAAB: result as string }))
            return result
          } else {
            throw new Error(t("error_get_eaab"))
          }
        })(),
        {
          loading: t("loading_get_eaab"),
          success: t("success_get_eaab"),
          error: t("error_get_eaab")
        }
      )
    }
  }

  const handleGetTokenEAAGNO = async () => {
    if (!token.tokenEAAGNO) {
      return toast.promise(
        (async () => {
          const result = await fetchTokenEAAGNO()
          if (result) {
            setToken((prev) => ({ ...prev, tokenEAAGNO: result as string }))
            return result
          } else {
            throw new Error(t("error_get_eaagno"))
          }
        })(),
        {
          loading: t("loading_get_eaagno"),
          success: t("success_get_eaagno"),
          error: t("error_get_eaagno")
        }
      )
    }
  }

  useEffect(() => {
    handleGetTokenEEAB()
    // Fetch the token once when the page opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <PageContainer
      title={t("access_token_page_title")}
      description={t("access_token_info")}
      icon={<Braces size={20} />}
      accent="bm-bg-[#1877F2]/12 bm-text-[#1877F2]"
      actions={
        <a
          className="bm-inline-flex bm-h-8 bm-items-center bm-gap-1 bm-rounded-lg bm-border bm-border-line bm-bg-surface bm-px-2.5 bm-text-[12px] bm-font-medium bm-text-fg-muted hover:bm-bg-surface-2 hover:bm-text-fg hover:bm-no-underline"
          target="_blank"
          rel="noopener noreferrer"
          href="https://developers.facebook.com/docs/facebook-login/guides/access-tokens">
          {t("access_token_learn_more")}
          <ExternalLink size={12} />
        </a>
      }>
      <Callout tone="secure" compact>
        <div className="bm-flex bm-flex-col bm-gap-0.5">
          <span>🔒 {t("access_token_safe", { ext: EXTENSION_INFO.displayName })}</span>
          <span>📌 {t("access_token_local")}</span>
          <span>✅ {t("access_token_privacy")}</span>
        </div>
      </Callout>

      <Tabs
        defaultActiveKey="EAAB"
        onChange={handleGetTokenEAAGNO}
        items={[
          {
            key: "EAAB",
            label: t("eaab_tab_label"),
            content: (
              <TokenPanel
                description={t("eaab_extract_desc")}
                placeholder={t("eaab_placeholder")}
                value={token.tokenEAAB}
              />
            )
          },
          {
            key: "EAAGNO",
            label: t("eaagno_tab_label"),
            content: (
              <TokenPanel
                description={t("eaagno_extract_desc")}
                placeholder={t("eaagno_placeholder")}
                value={token.tokenEAAGNO}
              />
            )
          }
        ]}
      />
    </PageContainer>
  )
}
