import { useMemo } from "react";
import { Member } from "src/modules/facebook/types/facebook.interface";
import { ColumnWidth, exportToExcel, Header } from "src/utils/export.util";

interface IProps {
  data?: Member[];
}

// ─── Config (stable references, defined outside component) ────────────────────

const vietnameseHeaders: Header[] = [{ A: "UID", B: "Tên", C: "URL" }];

const wscols: ColumnWidth[] = [
  { wch: 15 }, // UID
  { wch: 30 }, // Tên
  { wch: 60 }, // URL
];

// ─── Component ────────────────────────────────────────────────────────────────

const ExportMemberToExcel = ({ data }: IProps) => {
  const fileName = useMemo(
    () => "danh_sach_uid_xlsx_" + new Date().getTime(),
    []
  );

  const memberData = useMemo(
    () =>
      (data ?? []).map(({ uid, name, url }) => ({ uid, name, url })),
    [data]
  );

  return (
    <button
      type="button"
      onClick={() => exportToExcel(memberData, fileName, wscols, vietnameseHeaders)}
      className="h-10 bg-green-500 text-white px-4 rounded text-sm"
    >
      Export Excel
    </button>
  );
};

export default ExportMemberToExcel;
