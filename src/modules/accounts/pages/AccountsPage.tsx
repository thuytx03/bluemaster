import { useTranslation } from "react-i18next"
import {
  Facebook,
  Instagram,
  MessageCircle,
  Twitter
} from "lucide-react"
import CardAccount from "../components/CardAccount"
import PageContainer from "../../shared/components/PageContainer"
import { ESocialProvider } from "../../../constants/enum"

const SOCIAL_ACCOUNTS = [
  {
    socialName: ESocialProvider.FACEBOOK,
    icon: Facebook
  },
  {
    socialName: ESocialProvider.INSTAGRAM,
    icon: Instagram
  },
  {
    socialName: ESocialProvider.THREADS,
    icon: MessageCircle
  },
  {
    socialName: ESocialProvider.X,
    icon: Twitter
  }
]

const AccountsPage = () => {
  const { t } = useTranslation()
  return (
    <PageContainer title={t("account_management")} className="flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {SOCIAL_ACCOUNTS.map((account) => (
          <CardAccount key={account.socialName} {...account} />
        ))}
      </div>
    </PageContainer>
  )
}

export default AccountsPage
