import { FileSpreadsheet } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { Member } from "src/modules/facebook/types/facebook.types"
import { Button } from "src/modules/shared/ui"
import { ColumnWidth, exportToExcel, Header } from "src/utils/export.util"

interface IProps {
  data?: Member[]
  disabled?: boolean
}

const vietnameseHeaders: Header[] = [{ A: "UID", B: "Tên", C: "URL" }]

const wscols: ColumnWidth[] = [
  { wch: 20 }, // UID
  { wch: 30 }, // Tên
  { wch: 60 } // URL
]

const ExportMemberToExcel = ({ data, disabled }: IProps) => {
  const { t } = useTranslation()
  const fileName = useMemo(() => "danh_sach_uid_xlsx_" + new Date().getTime(), [])

  const memberData = useMemo(
    () => (data ?? []).map(({ uid, name, url }) => ({ uid, name, url })),
    [data]
  )

  return (
    <Button
      variant="success"
      size="sm"
      disabled={disabled}
      icon={<FileSpreadsheet size={14} />}
      onClick={() => exportToExcel(memberData, fileName, wscols, vietnameseHeaders)}>
      {t("export_excel")}
    </Button>
  )
}

export default ExportMemberToExcel
