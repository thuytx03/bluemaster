import { useTranslation } from "react-i18next"
import {
  FacebookIcon,
  InstagramIcon,
  ThreadsIcon,
  XIcon
} from "src/assets/icons"
import CardAccount from "src/modules/accounts/components/CardAccount"
import PageContainer from "src/modules/shared/components/PageContainer"
import { ESocialProvider } from "src/constants/enum"

const SOCIAL_ACCOUNTS = [
  {
    socialName: ESocialProvider.FACEBOOK,
    icon: FacebookIcon
  },
  {
    socialName: ESocialProvider.INSTAGRAM,
    icon: InstagramIcon
  },
  {
    socialName: ESocialProvider.THREADS,
    icon: ThreadsIcon
  },
  {
    socialName: ESocialProvider.X,
    icon: XIcon
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
