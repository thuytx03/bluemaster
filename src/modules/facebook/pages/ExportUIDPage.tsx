import { Button, Card } from "antd";
import { useNavigate } from "react-router-dom";
import { copyTextToClipboard } from "src/utils/common.util";
import IconLoading from "src/modules/shared/components/IconLoading";
import ExportMemberToExcel from "../components/export/ExportMemberToExcel";
import { exportToTXT } from "src/utils/export.util";
import { useFacebookUIDScraper } from "../hooks/useFacebookUIDScraper";
import PageContainer from "../../shared/components/PageContainer";
import { useTranslation } from "react-i18next";
import { APP_ROUTES } from "src/constants/route";

const ExportUIDPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    state,
    textAreaRef,
    isCopy,
    setIsCopy,
    cleanup,
    handleStop,
    handleContinue,
    fileName
  } = useFacebookUIDScraper();

  const handleClose = () => {
    cleanup();
    navigate(APP_ROUTES.FACEBOOK.EXTRACT_UID);
  };

  return (
    <PageContainer title={t("extract_uid_title")} className="flex flex-col">
      <Card className="flex-1 shadow border rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {state.status === "continue" ? (
              <>
                <IconLoading size={16} />
                <span className="text-sm">
                  Đang quét <span className="text-red-500 font-semibold">({state.count})</span>
                </span>
              </>
            ) : (
              <span className="text-sm">
                Đã quét được <span className="text-red-500 font-semibold">({state.count})</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {state.status === "continue" ? (
              <Button danger type="primary" onClick={handleStop}>Dừng</Button>
            ) : (
              <Button type="primary" onClick={handleContinue}>Tiếp tục</Button>
            )}
            <Button onClick={handleClose}>Đóng</Button>
          </div>
        </div>

        <textarea
          ref={textAreaRef}
          rows={10}
          className="w-full p-2 resize-none rounded border outline-none focus:border-blue-500 font-mono text-sm"
        />

        {state.success && (
          <div className="text-green-500 text-sm mt-2">Đã quét hết danh sách!</div>
        )}

        <div className="flex items-center gap-2 mt-3">
          <ExportMemberToExcel data={state.arrUID} />
          <Button
          type="primary"
            onClick={() => exportToTXT(textAreaRef.current?.value || "", fileName)}
          >
            Export TXT
          </Button>
          <Button
            type={isCopy ? "primary" : "default"}
            onClick={() => {
              copyTextToClipboard(textAreaRef.current?.value || "");
              setIsCopy(true);
              setTimeout(() => setIsCopy(false), 2000);
            }}
          >
            {isCopy ? "Copied!" : "Copy"}
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
};

export default ExportUIDPage;
