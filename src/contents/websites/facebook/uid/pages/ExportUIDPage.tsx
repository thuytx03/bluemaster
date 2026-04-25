import { copyTextToClipboard } from "src/utils/common.util";
import IconLoading from "src/components/IconLoading";
import ExportMemberToExcel from "../components/export/ExportMemberToExcel";
import { exportToTXT } from "src/utils/export.util";
import { useFacebookUIDScraper } from "../hooks/useFacebookUIDScraper";

const ExportUIDPage = () => {
  const {
    state,
    textAreaRef,
    isCopy,
    setIsCopy,
    handleClose,
    handleStop,
    handleContinue,
    fileName
  } = useFacebookUIDScraper();

  return (
    <>
      {state.isLayoutExportUid && (
        <div className='xthuy_social_fb_container relative'>
          <button
            className="absolute bg-white py-1 px-[10px] rounded-full text-black border shadow hover:text-gray-700 focus:outline-none"
            style={{ right: "-5px", top: "-5px" }}
            onClick={handleClose}
          >
            X
          </button>

          <div className='flex items-center justify-between mt-4'>
            <div>
              {state.status === "continue" ? (
                <div className="flex items-center gap-2">
                  <IconLoading size={16} />
                  <p className='text-sm'>Đang quét <span className="text-red-500">({state.count})</span></p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className='text-sm'>Đã quét được <span className="text-red-500">({state.count})</span></p>
                </div>
              )}

            </div>
            <div>
              {state.status === "continue" ? (
                <button onClick={handleStop} className='bg-red-500 text-white font-bold py-2 px-4 rounded'>
                  Dừng
                </button>
              ) : (
                <button onClick={handleContinue} className='bg-blue-500 text-white font-bold py-2 px-4 rounded'>
                  Tiếp tục
                </button>
              )}
            </div>
          </div>
          <div style={{ margin: "10px 0px" }}>
            <textarea
              ref={textAreaRef}
              id='textAreaInput'
              rows={8}
              className="w-full p-2 resize-none rounded border outline-none focus:border-blue-500"
            />
            {state.success && <div className="text-green-500">Đã quét hết danh sách!</div>}

          </div>

          <div style={{ display: "flex", gap: "5px" }}>

            <ExportMemberToExcel data={state.arrUID} />
            <button
              type="button"
              onClick={() => exportToTXT(textAreaRef.current?.value || '', fileName)}
              className="h-10 bg-yellow-500 text-white px-4 rounded text-sm"
            >
              Export TXT
            </button>
            <button onClick={() => {
              copyTextToClipboard(textAreaRef.current?.value || '');
              setIsCopy(true);
              setTimeout(() => setIsCopy(false), 2000);
            }}
              className={`h-10 ${isCopy ? 'bg-green-500' : 'bg-blue-500'} text-white px-4 rounded text-sm `}>
              {isCopy ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ExportUIDPage;