import { Alert, Button, Card, Input, Upload } from 'antd'
import React, { useState } from 'react'
import { toast } from 'sonner';
import { ImportOutlined, UploadOutlined } from "@ant-design/icons";
import PageContainer from '../../shared/components/PageContainer'
import { useTranslation } from 'react-i18next';
import { chromeUtils } from '../../../utils/chrome.util';

const ImportCookiesPage = () => {
    const { t } = useTranslation();
    const [importInput, setImportInput] = useState<string>('');
    const [manualUrl, setManualUrl] = useState<string>('')

    const handleImportCookies = async (data?: string) => {
        let rawData = (data || importInput).trim();

        // Loại bỏ nhiều lớp quotes thừa (từ copy-paste hoặc chat)
        while (
            (rawData.startsWith('"') && rawData.endsWith('"')) ||
            (rawData.startsWith("'") && rawData.endsWith("'"))
        ) {
            rawData = rawData.slice(1, -1).trim();
        }

        if (!rawData) {
            return toast.error("Vui lòng nhập dữ liệu cookie.");
        }

        return toast.promise(
            (async () => {
                let cookiesToImport: any[] = [];
                let topLevelUrl = '';
                    let isJsonMode = false;

                    // 1. Thử parse dạng JSON trước
                    if (rawData.startsWith('[') || rawData.startsWith('{')) {
                        try {
                            const parsed = JSON.parse(rawData);
                            isJsonMode = true;
                            if (Array.isArray(parsed)) {
                                cookiesToImport = parsed;
                            } else if (typeof parsed === 'object') {
                                if (Array.isArray(parsed.cookies)) {
                                    cookiesToImport = parsed.cookies;
                                    if (parsed.url) topLevelUrl = parsed.url;
                                } else {
                                    cookiesToImport = [parsed];
                                }
                            }
                        } catch (e) {
                            console.warn("JSON parse failed, falling back to string parse.");
                        }
                    }

                    // 2. Nếu không phải JSON, parse dạng String
                    // Hỗ trợ 2 format:
                    //   A) domain/path name=value (mỗi dòng 1 cookie, có domain/path đầu dòng)
                    //   B) name=value; name2=value2; ... (format document.cookie)
                    if (cookiesToImport.length === 0) {
                        isJsonMode = false;

                        // Thử parse format A: mỗi dòng là "domain/path name=value"
                        const lines = rawData.split('\n');
                        let parsedFormatA = false;
                        for (const line of lines) {
                            const trimmed = line.trim();
                            if (!trimmed) continue;

                            const spaceIdx = trimmed.indexOf(' ');
                            if (spaceIdx > 0) {
                                const before = trimmed.substring(0, spaceIdx).trim();
                                const after = trimmed.substring(spaceIdx + 1).trim();
                                const eqIdx = after.indexOf('=');
                                // Domain hợp lệ thường không chứa '=' hoặc ';'
                                if (eqIdx > 0 && !before.includes('=') && !before.includes(';')) {
                                    const name = after.substring(0, eqIdx).trim();
                                    const value = after.substring(eqIdx + 1).trim();
                                    const slashIdx = before.indexOf('/');
                                    const cookieData: any = { name, value };
                                    if (slashIdx > 0) {
                                        cookieData.domain = before.substring(0, slashIdx);
                                        cookieData.path = before.substring(slashIdx + 1) || '/';
                                    } else {
                                        cookieData.domain = before;
                                        cookieData.path = '/';
                                    }
                                    // Xoá prefix chấm đầu nếu có ở domain để an toàn (hoặc chrome tự xử lý)
                                    cookiesToImport.push(cookieData);
                                    parsedFormatA = true;
                                }
                            }
                        }

                        // Nếu không phải format A, parse format B: "name=value; name2=value2; ..."
                        if (!parsedFormatA) {
                            cookiesToImport = []; // Reset nếu form A chạy nửa vời
                            const items = rawData.split(/;\s*/);
                            for (const item of items) {
                                const trimmedItem = item.trim();
                                if (!trimmedItem) continue;

                                const equalIndex = trimmedItem.indexOf('=');
                                if (equalIndex > 0) {
                                    const name = trimmedItem.substring(0, equalIndex).trim();
                                    const value = trimmedItem.substring(equalIndex + 1).trim();
                                    if (name) {
                                        cookiesToImport.push({ name, value });
                                    }
                                }
                            }
                        }
                    }

                    if (cookiesToImport.length === 0) {
                        throw new Error("Không tìm thấy dữ liệu cookie hợp lệ.");
                    }

                    let fallbackUrl = topLevelUrl || manualUrl;
                    if (fallbackUrl) {
                        // Làm sạch URL: xóa https:// dư thừa nếu người dùng paste
                        fallbackUrl = fallbackUrl.replace(/^https?:\/\//i, '');
                        fallbackUrl = 'https://' + fallbackUrl;
                    }

                    let firstSuccessUrl = '';
                    let successCount = 0;
                    let failCount = 0;

                    for (const cookie of cookiesToImport) {
                        let targetUrl = topLevelUrl;

                        if (!targetUrl && cookie.domain) {
                            const cleanDomain = cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain;
                            targetUrl = `https://${cleanDomain}${cookie.path || '/'}`;
                        }

                        if (!targetUrl) {
                            targetUrl = fallbackUrl;
                        }

                        if (!targetUrl) {
                            console.warn("[ImportCookies] Bỏ qua cookie (không có URL):", cookie.name);
                            continue;
                        }

                        let finalUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;

                        try {
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            const { hostOnly, session, storeId, ...setDetails } = cookie;

                            const extraOptions: any = {};
                            if (!isJsonMode) {
                                if (finalUrl.startsWith('https')) {
                                    extraOptions.secure = true;
                                    extraOptions.sameSite = 'no_restriction';
                                }
                                extraOptions.path = '/';
                                const sessionNames = ['session', 'auth', 'token', 'jwt', 'xsrf', 'id', 'authorization'];
                                if (sessionNames.some(s => cookie.name.toLowerCase().includes(s))) {
                                    extraOptions.httpOnly = true;
                                }
                            }

                            const result = await chromeUtils.setChromeCookie({
                                ...setDetails,
                                ...extraOptions,
                                url: finalUrl,
                            });
                            

                            if (result) {
                                successCount++;
                                if (!firstSuccessUrl) firstSuccessUrl = finalUrl;
                            } else {
                                failCount++;
                                console.warn("[ImportCookies] chrome.cookies.set trả về null:", cookie.name, "| URL:", finalUrl);
                            }
                        } catch (e: any) {
                            failCount++;
                            console.error("[ImportCookies] Lỗi set cookie:", cookie.name, "| finalUrl:", finalUrl, "| Error:", e.message);
                        }
                    }

                    if (successCount === 0) {
                        throw new Error("Không có cookie nào được nhập thành công. Vui lòng kiểm tra lại URL mục tiêu.");
                    }

                    setImportInput('');
                    
                    const redirectUrl = fallbackUrl || firstSuccessUrl;
                    if (redirectUrl) {
                        setTimeout(() => {
                            chromeUtils.openNewTab({url: redirectUrl})
                        }, 1500); // Đợi 1.5s để hiển thị thông báo toast
                    }

                    return successCount;
                })(),
                {
                    loading: 'Đang nhập cookies...',
                    success: (count) => `Đã nhập thành công ${count} cookies!`,
                    error: (err) => `Lỗi: ${err.message}`
                }
        );
    };

    const handleFileUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            handleImportCookies(content);
        };
        reader.readAsText(file);
        return false;
    };

    return (
        <PageContainer
            title={t('import_cookies')}
            className="flex flex-col">
            <Card className="flex-1 shadow border rounded-xl">
                <div className="space-y-2">
                    <Alert
                        message="Thông tin bảo mật"
                        description="Việc nhập cookie giúp bạn đăng nhập nhanh chóng mà không cần mật khẩu. Hãy đảm bảo dữ liệu này từ nguồn tin cậy."
                        type="info"
                        showIcon
                    />
                    <Alert message={t('import_cookies_confirm_desc')} type="warning" showIcon />
                </div>
                
                <div className="space-y-2 mt-3">
                    <div className='flex items-center gap-2'>
                        <Input
                            placeholder="Nhập URL mục tiêu (Ví dụ: https://facebook.com hoặc facebook.com)"
                            value={manualUrl}
                            onChange={(e) => setManualUrl(e.target.value)}
                        />
                    </div>
                    <div className="text-[11px] text-gray-500 italic pb-2">
                        💡 Bắt buộc nếu nhập dạng chuỗi đơn giản. Với chuỗi có sẵn domain, hệ thống tự nhận diện.
                    </div>

                    <div>Dữ liệu Cookies (Hỗ trợ JSON hoặc Chuỗi document.cookie)</div>
                    <Input.TextArea
                        placeholder={"Dán nội dung JSON hoặc chuỗi cookie vào đây...\nVí dụ: lang=vi; authorization=eyJ...; XSRF-TOKEN=..."}
                        value={importInput}
                        onChange={(e) => setImportInput(e.target.value)}
                        autoSize={{ minRows: 10, maxRows: 18 }}
                    />

                    <div className="flex items-center gap-2 mt-2">
                        <Button
                            type="primary"
                            icon={<ImportOutlined />}
                            onClick={() => handleImportCookies()}
                        >
                            Nhập dữ liệu
                        </Button>
                        <Upload
                            beforeUpload={handleFileUpload as any}
                            showUploadList={false}
                            accept=".json,.txt"
                        >
                            <Button icon={<UploadOutlined />}>Tải file lên</Button>
                        </Upload>
                    </div>
                </div>
            </Card>
        </PageContainer>
    )
}

export default ImportCookiesPage
