import { useMemo, useRef, useState } from "react";
import { copyTextToClipboard } from "src/utils/common.util";
import { exportToTXT } from "src/utils/export.util";
import IconLoading from "src/components/IconLoading";
import ExportMemberToExcel from "../components/export/ExportMemberToExcel";
import { useFacebookScraper } from "../hooks/useFacebookScraper";

const ExportUIDPage = () => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [isCopy, setIsCopy] = useState(false);

  const fileName = useMemo(
    () => "danh_sach_uid_txt_" + Date.now(),
    []
  );

  const { state, handleStop, handleContinue, handleClose } =
    useFacebookScraper(textAreaRef);

  if (!state.isLayoutExportUid) return null;

  const isScanning = state.status === "continue";

  return (
    <div className="xthuy_social_fb_container relative">
      {/* Close */}
      <button
        className="absolute bg-white py-1 px-[10px] rounded-full text-black border shadow hover:text-gray-700 focus:outline-none"
        style={{ right: "-5px", top: "-5px" }}
        onClick={handleClose}
      >
        X
      </button>

      {/* Status row */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          {isScanning ? (
            <>
              <IconLoading size={16} />
              <p className="text-sm">
                Đang quét <span className="text-red-500">({state.count})</span>
              </p>
            </>
          ) : (
            <p className="text-sm">
              Đã quét được{" "}
              <span className="text-red-500">({state.count})</span>
            </p>
          )}
        </div>

        {isScanning ? (
          <button
            onClick={handleStop}
            className="bg-red-500 text-white font-bold py-2 px-4 rounded"
          >
            Dừng
          </button>
        ) : (
          <button
            onClick={handleContinue}
            className="bg-blue-500 text-white font-bold py-2 px-4 rounded"
          >
            Tiếp tục
          </button>
        )}
      </div>

      {/* UID output */}
      <div style={{ margin: "10px 0" }}>
        <textarea
          ref={textAreaRef}
          id="textAreaInput"
          rows={8}
          className="w-full p-2 resize-none rounded border outline-none focus:border-blue-500"
        />
        {state.success && (
          <p className="text-green-500 text-sm mt-1">Đã quét hết danh sách!</p>
        )}
      </div>

      {/* Export actions */}
      <div style={{ display: "flex", gap: "5px" }}>
        <ExportMemberToExcel data={state.arrUID} />

        <button
          type="button"
          onClick={() => exportToTXT(textAreaRef.current?.value ?? "", fileName)}
          className="h-10 bg-yellow-500 text-white px-4 rounded text-sm"
        >
          Export TXT
        </button>

        <button
          onClick={() => {
            copyTextToClipboard(textAreaRef.current?.value ?? "");
            setIsCopy(true);
            setTimeout(() => setIsCopy(false), 2000);
          }}
          className={`h-10 ${isCopy ? "bg-green-500" : "bg-blue-500"} text-white px-4 rounded text-sm`}
        >
          {isCopy ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
};

export default ExportUIDPage;
