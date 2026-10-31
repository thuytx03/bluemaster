import { Archive, Files } from "lucide-react"
import { useTranslation } from "react-i18next"

import { TSaveMode } from "src/modules/download/types/download.types"
import { Field, Segmented } from "src/modules/shared/ui"

interface SaveModeFieldProps {
  value: TSaveMode
  onChange: (mode: TSaveMode) => void
}

/** Files vs. single ZIP. ZIP means Chrome asks where to save only once. */
const SaveModeField = ({ value, onChange }: SaveModeFieldProps) => {
  const { t } = useTranslation()
  return (
    <Field label={t("save_mode")} hint={value === "zip" ? t("save_mode_zip_hint") : t("save_mode_files_hint")}>
      <Segmented<TSaveMode>
        size="sm"
        block
        value={value}
        onChange={onChange}
        options={[
          { value: "files", label: t("save_mode_files"), icon: <Files size={13} /> },
          { value: "zip", label: t("save_mode_zip"), icon: <Archive size={13} /> }
        ]}
      />
    </Field>
  )
}

export default SaveModeField
