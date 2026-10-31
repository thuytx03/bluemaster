import { useTranslation } from "react-i18next"

import { FlagEnglish, FlagVietNam } from "src/assets/icons"
import i18n from "src/i18n"
import { Dropdown, IconButton } from "src/modules/shared/ui"

export const LANGUAGES = [
  { key: "vi", label: "Tiếng Việt", Flag: FlagVietNam },
  { key: "en", label: "English", Flag: FlagEnglish }
]

const setLanguageCookie = (lang: string) => {
  document.cookie = `language=${lang}; path=/; max-age=31536000` // lưu 1 năm
}

export const changeLanguage = (lang: string) => {
  i18n.changeLanguage(lang)
  setLanguageCookie(lang)
}

const SwitchLanguage = () => {
  const { t, i18n: i18next } = useTranslation()
  const current =
    LANGUAGES.find((l) => l.key === i18next.language) ?? LANGUAGES[0]
  const Flag = current.Flag

  return (
    <Dropdown
      placement="bottom-end"
      minWidth={160}
      items={LANGUAGES.map((l) => ({
        key: l.key,
        label: l.label,
        icon: <l.Flag className="bm-h-4 bm-w-4 bm-rounded-sm" />,
        onClick: () => changeLanguage(l.key)
      }))}>
      <IconButton label={t("language")}>
        <Flag className="bm-h-[18px] bm-w-[18px] bm-rounded-sm bm-shadow-sm" />
      </IconButton>
    </Dropdown>
  )
}

export default SwitchLanguage
