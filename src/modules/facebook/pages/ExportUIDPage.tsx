import { Button, Card, Spin } from "antd";
import { useNavigate } from "react-router-dom";
import { copyTextToClipboard } from "src/utils/common.util";
import IconLoading from "src/modules/shared/components/IconLoading";
import ExportMemberToExcel from "../components/export/ExportMemberToExcel";
import { exportToTXT } from "src/utils/export.util";
import { useFacebookUIDScraper } from "../hooks/useFacebookUIDScraper";
import PageContainer from "../../shared/components/PageContainer";
import { useTranslation } from "react-i18next";
import { APP_ROUTES } from "src/constants/route";
import { Select, Space } from 'antd';
import type { SelectProps } from 'antd';
import { FileText } from "lucide-react";

const options: SelectProps['options'] = [
  {
    value: 'uid',
    label: 'UID',
  },
  {
    value: 'name',
    label: 'Tên',
  },

];

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
  const handleChange = (value: string | string[]) => {
    console.log(`Selected: ${value}`);
  };
  return (
    <PageContainer title={t("extract_uid_title")} className="flex flex-col">
      <Card className="flex-1 shadow border rounded-xl dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col items-center justify-between gap-4">
            {/* Status Section */}
            <div className="w-full ">
              <div className={`flex items-center justify-center md:justify-start gap-3 px-4 py-1.5 rounded-md border whitespace-nowrap ${state.status === "continue" ? "bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800" : "bg-gray-50 border-gray-100 dark:bg-gray-700/50 dark:border-gray-600"}`}>
                {state.status === "continue" ? (
                  <>
                    <Spin size={"small"} className="text-blue-500" />
                    <span className="text-sm font-semibold dark:text-gray-200">
                      Đang quét: <span className="text-blue-600 dark:text-blue-400 text-sm">{state.count}</span>
                    </span>
                  </>
                ) : (
                  <span className="text-sm font-semibold dark:text-gray-200">
                    Trạng thái: <span className="text-green-600 dark:text-green-400 text-sm">Đã quét {state.count}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Controls Section */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <div className="flex items-center justify-between  gap-2 w-full sm:w-auto">
                <Select
                  mode="multiple"

                  placeholder="Chọn trường"
                  defaultValue={['uid', 'name']}
                  onChange={handleChange}
                  className="flex-1 sm:min-w-[180px]"
                  options={options}
                />
              </div>
              <div className="flex items-center gap-2 w-full">
                {state.status === "continue" ? (
                  <Button danger type="primary" onClick={handleStop} className="flex-1 sm:flex-none">Dừng lại</Button>
                ) : (
                  <Button type="primary" onClick={handleContinue} className="flex-1 sm:flex-none">Tiếp tục quét</Button>
                )}
                <Button onClick={handleClose} className="flex-1 sm:flex-none">Hủy bỏ</Button>
              </div>
            </div>
          </div>
        </div>

        <textarea
          ref={textAreaRef}
          rows={18}
          className="w-full p-2 resize-none rounded border outline-none focus:border-blue-500 font-mono text-sm dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200"
        />

        {state.success && (
          <div className="text-green-500 text-sm mt-2">Đã quét hết danh sách!</div>
        )}

        <div className="flex items-center gap-2 mt-3">
          <ExportMemberToExcel data={state.arrUID} />
          <Button
            icon={<FileText size={14} />}
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
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          >
            {isCopy ? "Copied!" : "Copy"}
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
};

export default ExportUIDPage;
