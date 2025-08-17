import { Check, CircleQuestionMark, Copy } from "lucide-react";
import { Main } from "../../components/layout/main";
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { copyTextToClipboard } from "@/helpers/functionHelpers";
import { extensionInfo } from "@/configs/constants";
import toast from "react-hot-toast";

export default function CookiePage() {

  const [cookies, setCookies] = useState<string>('');
  const [isCopy, setIsCopy] = useState<boolean>(false);

  const handleCopyCookies = (cookies: string) => {
    copyTextToClipboard(cookies);
    setIsCopy(true);
    setTimeout(() => setIsCopy(false), 2000);
  };

  const getCookiesFacebook = async () => {
    return toast.promise(
      (async () => {
        chrome.tabs.query({
          active: true
        }, function (tabs) {
          chrome.cookies.getAll({
            url: "https://www.facebook.com"
          }, function (cookiesArray) {
            let cookieString = "";
            let userId = "";
            let cookies = "";
            for (let i = 0; i < cookiesArray.length; i++) {
              cookieString += cookiesArray[i].name + "=" + cookiesArray[i].value + ";";
              if (cookiesArray[i].name === "c_user") {
                userId = cookiesArray[i].value;
              }
            }
            setCookies(cookieString);
          });
        });
      })(),
      {
        loading: 'Đang lấy Cookie Facebook...',
        success: 'Lấy Cookie Facebook thành công!',
        error: 'Không thể lấy Cookie Facebook!'
      }
    )

  }
  useEffect(() => {
    getCookiesFacebook();
  }, [])

  return (
    <>

      <Main >
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Cookies</h2>
          </div>
        </div>
        <div className='flex-1 overflow-auto px-4 py-1 lg:flex-row space-y-2 w-auto '>
          <Alert className="flex items-center w-full bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950 dark:border-blue-400 dark:text-blue-200">
            <div className="flex items-center gap-2 ">
              <CircleQuestionMark className="w-4 h-4" />
              <div className="">
                <span>Cookies là một phần quan trọng trong việc xác thực người dùng trên Facebook.</span>
                {''}
                <a className="text-blue-600" href="https://developers.facebook.com/docs/facebook-login/guides/access-tokens"> Tìm hiểu thêm</a>
              </div>
            </div>
          </Alert>

          <Alert variant="destructive" className="bg-green-50 border-green-500 text-green-700 dark:bg-green-950 dark:border-green-400 dark:text-green-200">
            <AlertDescription className="space-y-1">
              <div>🔒 {extensionInfo.name} giúp bạn lấy cookies Facebook một cách <span className="underline">an toàn</span>.</div>
              <div>📌 Cookies của bạn chỉ được <span className="underline">lưu trên thiết bị</span>, không gửi đi đâu cả.</div>
              <div>✅ Không server, không theo dõi, không thu thập dữ liệu — <span className="underline">bảo mật tuyệt đối</span>.</div>
            </AlertDescription>
          </Alert>

          <Textarea placeholder="Cookies"
            rows={5}
            value={cookies}
          />
          <Button
            onClick={() => handleCopyCookies(cookies)}
            className={isCopy ? "bg-green-500 hover:bg-green-600 text-white" : ""}
          >
            {isCopy ? (
              <>
                <Check /> Đã sao chép
              </>
            ) : (
              <>
                <Copy /> Sao chép
              </>
            )}
          </Button>
        </div>
      </Main>

    </>
  )
}
