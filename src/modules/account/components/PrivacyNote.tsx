import { useTranslation } from "react-i18next"

import { Callout } from "src/modules/shared/ui"

/** "Your data stays in this browser" note shown on the account tools. */
export default function PrivacyNote() {
  const { t } = useTranslation()
  return (
    <Callout tone="secure" compact>
      <span className="bm-text-[12px]">
        {t("privacy_note_browser_only_prefix")}{" "}
        <strong>{t("privacy_note_browser_only_strong")}</strong>{" "}
        {t("privacy_note_browser_only_suffix")}
      </span>
    </Callout>
  )
}
