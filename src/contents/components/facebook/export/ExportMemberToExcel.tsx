import { useEffect, useState } from "react";
import { Member } from "src/interfaces/facebook.interface";
import { ColumnWidth, exportToExcel, Header } from "src/utils/export.util";
interface IProps {
  data?: Member[];
}
const ExportMemberToExcel = ({ data }: IProps) => {
  const fileName = "danh_sach_uid_xlsx_" + new Date().getTime();
  const [member, setMember] = useState<Member[]>([]);

  function memberData(data: Member[]) {
    return data.map((member, index) => ({
      uid: member.uid,
      name: member.name,
      url: member.url,
    }));
  }

  // Header tiếng Việt
  const vietnameseHeaders: Header[] = [
    { A: "UID", B: "Tên", C: "URL" },
  ];

  // Độ rộng cột
  const wscols: ColumnWidth[] = [
    { wch: 15 }, // UID
    { wch: 30 }, // Tên
    { wch: 60 }, // URL

  ];
  useEffect(() => {
    if (data) {
      const member = memberData(data)
      setMember(member)
    }
  }, [data]);
  return (
    <button
      type="button"
      onClick={() => exportToExcel(member, fileName, wscols, vietnameseHeaders)}
      className="h-10 bg-green-500 text-white px-4 rounded text-sm"
    >
      Export Excel
    </button>
  )
}

export default ExportMemberToExcel
