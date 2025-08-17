import { Check, CircleQuestionMark, Copy } from "lucide-react";
import { Main } from "../../components/layout/main";
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState } from "react";
import { fetchTokenEAAB, fetchTokenEAAGNO } from "@/helpers/accessTokenHelpers";
import toast from "react-hot-toast";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { copyTextToClipboard } from "@/helpers/functionHelpers";
import { IAccessTokenPage } from "@/types/facebook";
import { extensionInfo } from "@/configs/constants";

export default function AccessTokenPage() {

  const [token, setToken] = useState<IAccessTokenPage>({
    tokenEAAB: "",
    tokenEAAGNO: "",
  });
  const [isCopy, setIsCopy] = useState<{ [key: string]: boolean }>({});
  const handleGetTokenEEAB = async () => {
    if (!token.tokenEAAB) {
      return toast.promise(
        (async () => {
          const result = await fetchTokenEAAB();
          if (result) {
            setToken((prev) => ({ ...prev, tokenEAAB: result as string }));
            return result;
          } else {
            throw new Error('Không thể lấy token EAAB!');
          }
        })(),
        {
          loading: 'Đang lấy Token EAAB...',
          success: 'Lấy Token EAAB thành công!',
          error: 'Không thể lấy Token EAAB!'
        }
      );
    }
  };

  const handleGetTokenEAAGNO = async () => {
    if (!token.tokenEAAGNO) {
      return toast.promise(
        (async () => {
          const result = await fetchTokenEAAGNO();
          if (result) {
            setToken((prev) => ({ ...prev, tokenEAAGNO: result as string }));
            return result;
          } else {
            throw new Error('Không thể lấy token EAAGNO!');
          }
        })(),
        {
          loading: 'Đang lấy Token EAAGNO...',
          success: 'Lấy Token EAAGNO thành công!',
          error: 'Không thể lấy Token EAAGNO!'
        }
      );
    }
  };

  const handleCopyToken = (type: string, token: string) => {
    copyTextToClipboard(token);
    setIsCopy(prev => ({ ...prev, [type]: true }));
    setTimeout(() => setIsCopy(prev => ({ ...prev, [type]: false })), 2000);
  };

  useEffect(() => {
    handleGetTokenEEAB();
  }, []);

  return (
    <>

      <Main >
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Lấy Access Token</h2>
          </div>
        </div>
        <div className='flex-1 overflow-auto px-4 py-1 lg:flex-row space-y-2 w-auto '>
          <Alert className="flex items-center w-full bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950 dark:border-blue-400 dark:text-blue-200">
            <div className="flex items-center gap-2 ">
              <CircleQuestionMark className="w-4 h-4" />
              <div className="">
                <span>Access token là một khóa bí mật, cho phép bạn truy cập vào các API của Facebook.</span>
                {''}
                <a className="text-blue-600" href="https://developers.facebook.com/docs/facebook-login/guides/access-tokens"> Tìm hiểu thêm</a>
              </div>
            </div>
          </Alert>

          <Alert variant="destructive" className="bg-green-50 border-green-500 text-green-700 dark:bg-green-950 dark:border-green-400 dark:text-green-200">
            <AlertDescription className="space-y-1">
              <div>🔒 {extensionInfo.name} giúp bạn lấy token Facebook một cách <span className="underline">an toàn</span>.</div>
              <div>📌 Token của bạn chỉ được <span className="underline">lưu trên thiết bị</span>, không gửi đi đâu cả.</div>
              <div>✅ Không server, không theo dõi, không thu thập dữ liệu — <span className="underline">bảo mật tuyệt đối</span>.</div>
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="EAAB" >
            <TabsList className="dark:bg-slate-800 w-auto px-2 overflow-x-auto ">
              <TabsTrigger value="EAAB">EAAB (Ads Campaigns)</TabsTrigger>
              <TabsTrigger value="EAAGNO" onClick={handleGetTokenEAAGNO}>EAAGNO (Business Manager)</TabsTrigger>
            </TabsList>
            <TabsContent value="EAAB" className="space-y-2">
              <Textarea placeholder="Token EAAB" value={token.tokenEAAB} />
              <Button
                onClick={() => handleCopyToken("EAAB", token.tokenEAAB)}
                className={isCopy["EAAB"] ? "bg-green-500 hover:bg-green-600 text-white" : ""}
              >
                {isCopy["EAAB"] ? (
                  <>
                    <Check /> Đã sao chép
                  </>
                ) : (
                  <>
                    <Copy /> Sao chép
                  </>
                )}
              </Button>
            </TabsContent>
            <TabsContent value="EAAGNO" className="space-y-2">
              <Textarea placeholder="Token EAAGNO" value={token.tokenEAAGNO} />
              <Button
                onClick={() => handleCopyToken("EAAGNO", token.tokenEAAGNO)}
                className={isCopy["EAAGNO"] ? "bg-green-500 hover:bg-green-600 text-white" : ""}
              >
                {isCopy["EAAGNO"] ? (
                  <>
                    <Check /> Đã sao chép
                  </>
                ) : (
                  <>
                    <Copy /> Sao chép
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </Main>

    </>
  )
}
