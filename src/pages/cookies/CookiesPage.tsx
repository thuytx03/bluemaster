import { Alert, Button, Card, Dropdown, Input } from 'antd'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast';
import { CopyOutlined, CheckOutlined, ExportOutlined } from "@ant-design/icons";
import PageContainer from 'src/components/shared/PageContainer'
import { EXTENSION_INFO } from 'src/constants';
import { copyTextToClipboard } from 'src/utils/common.util';
import { exportToJson, exportToTXT } from 'src/utils/export.util';

const CookiePage = () => {
    const [url, setUrl] = useState<string>('https://')
    const [cookies, setCookies] = useState<string>('');
    const [isCopy, setIsCopy] = useState<boolean>(false);
    const cleanUrl = url.replace(/^https?:\/\//i, '');
    const fileName = `${cleanUrl}_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}`;
    const handleCopyCookies = (cookies: string) => {
        copyTextToClipboard(cookies);
        setIsCopy(true);
        setTimeout(() => setIsCopy(false), 2000);
    };

    const getCookiesByUrl = async () => {
        let validUrl = url;
        if (!/^https?:\/\//i.test(validUrl)) {
            validUrl = 'https://' + validUrl;
        }
        return toast.promise(
            (async () => {
                chrome.tabs.query({
                    active: true
                }, function (tabs) {
                    chrome.cookies.getAll({
                        url: validUrl
                    }, function (cookiesArray) {
                        const cookieJson = JSON.stringify({
                            url: validUrl,
                            cookies: cookiesArray
                        }, null, 2);
                        setCookies(cookieJson);
                    });
                });
            })(),
            {
                loading: 'Đang lấy Cookies',
                success: 'Lấy Cookies thành công!',
                error: 'Không thể lấy Cookies!'
            }
        )

    }
    useEffect(() => {
        getCookiesByUrl();
    }, [])
    return (
        <PageContainer
            title="Lấy Cookie Website từ URL"
            className="flex flex-col">
            <Card className="flex-1  shadow border rounded-xl">
                <div className="space-y-2">
                    <Alert message="Cookies là một phần quan trọng trong việc xác thực người dùng trên Facebook." type="info" showIcon

                    />
                    <Alert
                        message={
                            <div>
                                <div>🔒 {EXTENSION_INFO.displayName} giúp bạn lấy cookie của website một cách <span className="underline">an toàn</span>.</div>
                                <div>📌 Cookie của bạn chỉ được <span className="underline">lưu trên thiết bị</span>, không gửi đi đâu cả.</div>
                                <div>✅ Không server, không theo dõi, không thu thập dữ liệu — <span className="underline">bảo mật tuyệt đối</span>.</div>
                            </div>
                        }
                        type="success"
                    />
                </div>
                <div className="space-y-2 mt-3">
                    {/* <div>Trích xuất cookies từ <strong>Facebook</strong></div> */}
                    <div className='flex items-center gap-2'>
                        <Input
                            placeholder='Nhập URL(https://facebook.com)'
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                        <Button
                            type="primary"
                            onClick={getCookiesByUrl}
                        >
                            Lấy cookies
                        </Button>
                    </div>
                    <div>Trích xuất cookies từ <strong>{url}</strong></div>
                    <Input.TextArea
                        placeholder="Cookies"
                        value={cookies}
                        autoSize={{ minRows: 2, maxRows: 10 }}
                        readOnly
                    />
                    <div className='flex items-center gap-2'>
                        <Button
                            icon={isCopy ? <CheckOutlined /> : <CopyOutlined />}
                            type={isCopy ? "primary" : "default"}
                            onClick={() => handleCopyCookies(cookies)}
                        >
                            {isCopy ? "Đã sao chép" : "Sao chép"}
                        </Button>
                        <Dropdown.Button
                            icon={<ExportOutlined />}
                            type={"primary"}
                            menu={{
                                items: [
                                    {
                                        key: '1',
                                        label: (
                                            <div
                                                onClick={() => exportToTXT(cookies, fileName)}
                                            >
                                                Tải TXT
                                            </div>
                                        ),
                                    },
                                    {
                                        key: '2',
                                        label: (
                                            <div
                                                onClick={() => exportToJson(cookies, fileName)}
                                            >
                                                Tải JSON
                                            </div>
                                        ),
                                    },
                                ],
                            }}
                        >
                            Tải File
                        </Dropdown.Button>

                    </div>
                </div>
            </Card>
        </PageContainer >
    )
}

export default CookiePage