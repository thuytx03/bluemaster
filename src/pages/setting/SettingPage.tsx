import { useTranslation } from "react-i18next"
import PageContainer from "src/components/shared/PageContainer"
import ThemeSwitcher from "src/components/shared/ThemeSwitcher"

const SettingPage = () => {
  const { t } = useTranslation()
  return (
    <PageContainer title={t("settings")} className="flex flex-col">
      <ThemeSwitcher />
    </PageContainer>
  )
}

export default SettingPage
