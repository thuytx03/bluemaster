import { BadgeCheck, ShieldCheck } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { ESocialProvider } from "src/constants/enum"
import { PLATFORM_META } from "src/constants/platforms"
import { Avatar, Button, Callout } from "src/modules/shared/ui"
import useAuthStore from "src/stores/auth.store"
import { showErrorToast } from "src/utils/toast.util"

interface VerifyAccountNoticeProps {
  provider?: ESocialProvider
  /** Translation key for the warning text (defaults per provider) */
  messageKey?: string
}

const DEFAULT_KEY: Record<ESocialProvider, string> = {
  [ESocialProvider.FACEBOOK]: "ensure_facebook_verified"
}

/* Shows the account state for a feature: a green chip when verified, a
   warning with a one-click verify button otherwise. */
const VerifyAccountNotice = ({ provider = ESocialProvider.FACEBOOK, messageKey }: VerifyAccountNoticeProps) => {
  const { t } = useTranslation()
  const { accounts, authenticate, logout } = useAuthStore()
  const [authing, setAuthing] = useState(false)
  const account = accounts[provider]
  const meta = PLATFORM_META[provider]

  const verify = async () => {
    try {
      setAuthing(true)
      await authenticate(provider)
    } catch (error) {
      await logout(provider)
      showErrorToast((error as Error).message)
    } finally {
      setAuthing(false)
    }
  }

  if (account) {
    return (
      <Callout
        tone="success"
        compact
        icon={<Avatar src={account.avatar} name={account.username} size={20} />}
        action={<BadgeCheck size={16} className="bm-text-success" />}>
        <span className="bm-font-medium">{t("verified_as", { platform: meta.label })}</span>
        <span className="bm-text-fg-muted"> · {account.username}</span>
      </Callout>
    )
  }

  return (
    <Callout
      tone="warning"
      compact
      action={
        <Button size="xs" variant="primary" loading={authing} icon={<ShieldCheck size={13} />} onClick={verify}>
          {t("verify_now")}
        </Button>
      }>
      {t(messageKey ?? DEFAULT_KEY[provider])} {t("before_using_features")}
    </Callout>
  )
}

export default VerifyAccountNotice
