import { Alert, Button, Card, Input } from 'antd'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast';
import { CopyOutlined, CheckOutlined } from "@ant-design/icons";
import PageContainer from 'src/components/shared/PageContainer'
import { EXTENSION_INFO } from 'src/constants';
import { copyTextToClipboard } from 'src/utils/common.util';

const CookiePage = () => {
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
        <PageContainer
            title="Lấy Cookie Facebook"
            className="flex flex-col">
            <Card className="flex-1  shadow border rounded-xl">
                <div className="space-y-2">
                    <Alert message="Cookies là một phần quan trọng trong việc xác thực người dùng trên Facebook." type="info" showIcon

                    />
                    <Alert
                        message={
                            <div>
                                <div>🔒 {EXTENSION_INFO.displayName} giúp bạn lấy cookie Facebook một cách <span className="underline">an toàn</span>.</div>
                                <div>📌 Cookie của bạn chỉ được <span className="underline">lưu trên thiết bị</span>, không gửi đi đâu cả.</div>
                                <div>✅ Không server, không theo dõi, không thu thập dữ liệu — <span className="underline">bảo mật tuyệt đối</span>.</div>
                            </div>
                        }
                        type="success"
                    />
                </div>
                <div className="space-y-2 mt-3">
                    <div>Trích xuất cookies từ <strong>Facebook</strong></div>
                    <Input.TextArea
                        placeholder="Cookies"
                        value={cookies}
                        autoSize={{ minRows: 2 }}
                        readOnly
                    />
                    <Button
                        icon={isCopy ? <CheckOutlined /> : <CopyOutlined />}
                        type={isCopy ? "primary" : "default"}
                        onClick={() => handleCopyCookies(cookies)}
                    >
                        {isCopy ? "Đã sao chép" : "Sao chép"}
                    </Button>
                </div>
            </Card>
        </PageContainer >
    )
}

export default CookiePage