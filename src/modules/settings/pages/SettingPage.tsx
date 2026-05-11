import { useTranslation } from "react-i18next"
import PageContainer from "../../shared/components/PageContainer"
import ThemeSwitcher from "../../shared/components/ThemeSwitcher"

const SettingPage = () => {
  const { t } = useTranslation()
  return (
    <PageContainer title={t("settings")} className="flex flex-col">
      <ThemeSwitcher />
    </PageContainer>
  )
}

export default SettingPage
