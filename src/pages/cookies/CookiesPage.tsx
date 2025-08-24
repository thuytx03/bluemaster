import { Alert, Button, Card, Dropdown, Input } from 'antd'
import React, { useState } from 'react'
import toast from 'react-hot-toast';
import { CopyOutlined, CheckOutlined, ExportOutlined } from "@ant-design/icons";
import PageContainer from 'src/components/shared/PageContainer'
import { EXTENSION_INFO } from 'src/constants';
import { copyTextToClipboard } from 'src/utils/common.util';
import { exportToJson, exportToTXT } from 'src/utils/export.util';
import { useTranslation } from 'react-i18next';


const CookiePage = () => {
    const { t } = useTranslation();
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
                loading: t('loading_get_cookies', { url: validUrl }),
                success: t('success_get_cookies', { url: validUrl }),
                error: t('error_get_cookies', { url: validUrl })
            }
        )

    }

    return (
        <PageContainer
            title={t('cookies_page_title')}
            className="flex flex-col">
            <Card className="flex-1  shadow border rounded-xl">
                <div className="space-y-2">
                    <Alert message={t('cookies_info')} type="info" showIcon />
                    <Alert
                        message={
                            <div>
                                <div>🔒 {t('cookies_safe', { ext: EXTENSION_INFO.displayName })}<span className="underline"> {t('cookies_safe_highlight')}</span>.</div>
                                <div>📌 {t('cookies_local')}<span className="underline"> {t('cookies_local_highlight')}</span>, {t('cookies_local_extra')}.</div>
                                <div>✅ {t('cookies_privacy')}<span className="underline"> {t('cookies_privacy_highlight')}</span>.</div>
                            </div>
                        }
                        type="success"
                    />
                </div>
                <div className="space-y-2 mt-3">
                    <div className='flex items-center gap-2'>
                        <Input
                            placeholder={t('input_url_placeholder')}
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                        <Button
                            type="primary"
                            onClick={getCookiesByUrl}
                        >
                            {t('get_cookies')}
                        </Button>
                    </div>
                    <div>{t('extract_cookies_from', { url })}</div>
                    <Input.TextArea
                        placeholder={t('cookies_placeholder')}
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
                            {isCopy ? t('copied') : t('copy')}
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
                                                {t('download_txt')}
                                            </div>
                                        ),
                                    },
                                    {
                                        key: '2',
                                        label: (
                                            <div
                                                onClick={() => exportToJson(cookies, fileName)}
                                            >
                                                {t('download_json')}
                                            </div>
                                        ),
                                    },
                                ],
                            }}
                        >
                            {t('download_file')}
                        </Dropdown.Button>

                    </div>
                </div>
            </Card>
        </PageContainer >
    )
}

export default CookiePage