import { useMemo } from "react";
import { Member } from "src/modules/facebook/types/facebook.interface";
import { ColumnWidth, exportToExcel, Header } from "src/utils/export.util";
import { Button } from "antd";
import { FileSpreadsheet } from "lucide-react";

interface IProps {
  data?: Member[];
}

const vietnameseHeaders: Header[] = [{ A: "UID", B: "Tên", C: "URL" }];

const wscols: ColumnWidth[] = [
  { wch: 20 }, // UID
  { wch: 30 }, // Tên
  { wch: 60 }, // URL
];

const ExportMemberToExcel = ({ data }: IProps) => {
  const fileName = useMemo(
    () => "danh_sach_uid_xlsx_" + new Date().getTime(),
    []
  );

  const memberData = useMemo(
    () => (data ?? []).map(({ uid, name, url }) => ({ uid, name, url })),
    [data]
  );

  return (
    <Button
      icon={<FileSpreadsheet size={16} />}
      onClick={() => exportToExcel(memberData, fileName, wscols, vietnameseHeaders)}
      className="bg-green-600 hover:bg-green-700 text-white border-none flex items-center gap-2"
    >
      Export Excel
    </Button>
  );
};

export default ExportMemberToExcel;
