import { Alert, Button, Card } from "antd";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Tabs } from 'antd';
import { Input } from "antd";
import { CopyOutlined, CheckOutlined } from "@ant-design/icons";
import PageContainer from "src/components/shared/PageContainer";
import { EXTENSION_INFO } from "src/constants";
import { IAccessTokenPage } from "src/interfaces/facebook.interface";
import { copyTextToClipboard } from "src/utils/common.util";
import { fetchTokenEAAB, fetchTokenEAAGNO } from "src/utils/facebook.util";


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
      <PageContainer
        title="Lấy Access Token Facebook"
        className="flex flex-col">
        <Card className="flex-1  shadow border rounded-xl">
          <div className="space-y-2">
            <Alert message="Access token là một khóa bí mật, cho phép bạn truy cập vào các API của Facebook." type="info" showIcon
              action={
                <a className="text-blue-600" target="_blank" href="https://developers.facebook.com/docs/facebook-login/guides/access-tokens"> Tìm hiểu thêm</a>
              }
            />
            <Alert
              message={
                <div>
                  <div>🔒 {EXTENSION_INFO.displayName} giúp bạn lấy token Facebook một cách <span className="underline">an toàn</span>.</div>
                  <div>📌 Token của bạn chỉ được <span className="underline">lưu trên thiết bị</span>, không gửi đi đâu cả.</div>
                  <div>✅ Không server, không theo dõi, không thu thập dữ liệu — <span className="underline">bảo mật tuyệt đối</span>.</div>
                </div>
              }
              type="success"
            />
          </div>
          <Tabs
            className="mt-3"
            type="card"
            defaultActiveKey="EAAB"
            items={[
              {
                label: "EAAB (Ads Campaigns)",
                key: "EAAB",
                children: (
                  <div className="space-y-2">
                    <div>Trích xuất token từ <strong>Ads Campaigns</strong></div>
                    <Input.TextArea
                      placeholder="Token EAAB"
                      value={token.tokenEAAB}
                      autoSize={{ minRows: 2 }}
                      readOnly
                    />
                    <Button
                      icon={isCopy["EAAB"] ? <CheckOutlined /> : <CopyOutlined />}
                      type={isCopy["EAAB"] ? "primary" : "default"}
                      onClick={() => handleCopyToken("EAAB", token.tokenEAAB)}
                    >
                      {isCopy["EAAB"] ? "Đã sao chép" : "Sao chép"}
                    </Button>
                  </div>
                ),
              },
              {
                label: "EAAGNO (Business Manager)",
                key: "EAAGNO",
                children: (
                  <div className="space-y-2">
                    <div>Trích xuất token từ <strong>Business Manager</strong></div>
                    <Input.TextArea
                      placeholder="Token EAAGNO"
                      value={token.tokenEAAGNO}
                      autoSize={{ minRows: 2 }}
                      readOnly
                    />
                    <Button
                      icon={isCopy["EAAGNO"] ? <CheckOutlined /> : <CopyOutlined />}
                      type={isCopy["EAAGNO"] ? "primary" : "default"}
                      onClick={() => handleCopyToken("EAAGNO", token.tokenEAAGNO)}
                    >
                      {isCopy["EAAGNO"] ? "Đã sao chép" : "Sao chép"}
                    </Button>
                  </div>
                ),
              },
            ]}
            onChange={handleGetTokenEAAGNO}
          />
        </Card>
      </PageContainer>
    

    </>
  )
}
