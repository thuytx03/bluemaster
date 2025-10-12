import { API_BASE_URL } from "src/constants/api";
import { Card, Flex, Badge } from "antd";
import PageContainer from "src/components/shared/PageContainer";
import { useTranslation } from "react-i18next";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input, Select, Table, TableColumnsType, TableProps } from "antd"
import { useEffect, useState } from "react";
import LoginQrCodeModal from "./components/modal/LoginQrCodeModal";
import toast from "react-hot-toast";
import { getCookie } from "src/utils/chrome.util";
import { COOKIE_DOMAIN_FCHAT } from "src/constants";
import { IPage } from "src/interfaces/page.interface";
import { getPages } from "src/services/page.service";
import { HTTPSTATUS } from "src/constants/http";

type TableRowSelection<T extends object = object> = TableProps<T>['rowSelection'];
interface IDataMessage {
    event: "QRCodeGenerated" | "Error" | "QRCodeExpired" | "QRCodeScanned" | "QRCodeDeclined" | "GotLoginInfo" | "ProfileError" | "ExitPageConnect" | "LoginError" | "LoginSuccess" | "ProfileExists";
    msg: string
    data: {
        url: string
    }
}
interface DataType {
    key: React.Key;
    name: string;
    avatar: string;
    phone: string;
    status: number;
}

const columns: TableColumnsType<DataType> = [
    {
        title: 'Ảnh',
        dataIndex: 'avatar',
        render: (avatar: string) =>
            avatar ? (
                <img
                    src={avatar}
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover border"
                />
            ) : (
                <span>-</span>
            ),
    },
    { title: 'Tên', dataIndex: 'name' },
    { title: 'Số điện thoại', dataIndex: 'phone' },
    {
        title: 'Trạng thái',
        dataIndex: 'status',
        render: (status: number) => {
            let color = 'default';
            let text = '';
            if (status === 1) {
                color = 'green';
                text = 'Hoạt động';
            } else if (status === 2) {
                color = 'red';
                text = 'Mất kết nối';
            } else if (status === 3) {
                color = 'orange';
                text = 'Tạm dừng';
            } else {
                text = 'Không xác định';
            }
            return <Badge color={color} text={text} />;
        }
    },
];


const ZaloAccountManagerPage = () => {
    const { t } = useTranslation();
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [isOpenLoginQrCodeModal, setIsOpenLoginQrCodeModal] = useState(false);
    const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
    const [pages, setPages] = useState<IPage[]>([]);

    const handleGenerateQR = async (proxy: string) => {
        try {
            const accessToken = await getCookie(COOKIE_DOMAIN_FCHAT, 'accessToken');
            const linkEndpoint = `${API_BASE_URL}/api/v1/zalo/login-qr`;
            const payload = {
                proxy: proxy,
            };
            const res = await fetch(linkEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken || ''}`,
                },
                body: JSON.stringify(payload),
            });

            const reader = (res.body as ReadableStream)
                .pipeThrough(new TextDecoderStream())
                .getReader();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const lines = value.split("\n");
                lines.forEach(text => {
                    if (text) {
                        try {
                            const data: IDataMessage = JSON.parse(text.replace("data: ", ""));
                            switch (data.event) {
                                case "QRCodeGenerated":
                                    setQrCodeImage(`${data.data.url}`);
                                    break;
                                case "QRCodeExpired":
                                    setQrCodeImage('');
                                    setIsOpenLoginQrCodeModal(false);
                                    toast.error(data.msg || 'QR code đã hết hạn, vui lòng thử lại!');
                                    break;
                                case "QRCodeDeclined":
                                    setQrCodeImage('');
                                    setIsOpenLoginQrCodeModal(false);
                                    toast.error(data.msg || 'Người dùng đã từ chối đăng nhập Zalo!');
                                    break;
                                case "Error":
                                case "LoginError":
                                    setQrCodeImage('');
                                    setIsOpenLoginQrCodeModal(false);
                                    toast.error(data.msg || 'Đăng nhập Zalo không thành công!');
                                    break;
                                case "ProfileError":
                                    setQrCodeImage('');
                                    setIsOpenLoginQrCodeModal(false);
                                    toast.error(data.msg || 'Không thể lấy thông tin người dùng từ Zalo!');
                                    break;
                                case "ExitPageConnect":
                                    setQrCodeImage('');
                                    setIsOpenLoginQrCodeModal(false);
                                    toast.error(data.msg || 'Người dùng đã thoát trang đăng nhập Zalo!');
                                    break;
                                case "ProfileExists":
                                    setQrCodeImage('');
                                    setIsOpenLoginQrCodeModal(false);
                                    toast.error(data.msg || 'Người dùng đã tồn tại trên Zalo!');
                                    break;

                                case "LoginSuccess":
                                    setQrCodeImage('');
                                    setIsOpenLoginQrCodeModal(false);
                                    toast.success(data.msg || 'Đăng nhập Zalo thành công!');
                                    break;
                                default:
                                    break;
                            }
                        } catch (error) {
                            // console.error('Error parsing data:', error);
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error during Zalo login:', error);
            toast.error('Đăng nhập Zalo không thành công!');
        }
    };

    const getPagesZalo = async () => {
        try {
            const result = await getPages('zalo_personal');
            if (result.status === HTTPSTATUS.OK) {
                setPages(result.data as IPage[]);
            }
        } catch (error) {
            console.log('Lỗi lấy danh sách!')
        }
    }

    const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
        console.log('selectedRowKeys changed: ', newSelectedRowKeys);
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const rowSelection: TableRowSelection<DataType> = {
        selectedRowKeys,
        onChange: onSelectChange,
    };

    const hasSelected = selectedRowKeys.length > 0;

    useEffect(() => {
        getPagesZalo();
    }, []);

    const dataSource = pages.map<DataType>((page, i) => ({
        key: i,
        name: page.name,
        avatar: page.avatar,
        phone: page.phone,
        status: page.status,
    }));
    return (
        <PageContainer title={t("accounts_zalo_management")}
            className="flex flex-col">
            <Card className="flex-1 shadow border rounded-xl">
                <Alert
                    className="mb-3"
                    message={
                        <div>
                            {t('zalo_conncet_value_1')}
                        </div>
                    }
                    type="warning"
                    showIcon
                    closable
                />
                <div className="flex items-center justify-between gap-3">
                    <Form
                        name="basic"
                        autoComplete="off"
                        layout="horizontal"
                        labelAlign="left"
                        className="flex items-center gap-3"
                        initialValues={{
                            target: "PROFILE",
                            waitUntilCompleted: true,
                            delayTimeInSecond: 0,
                        }}
                    >
                        <Form.Item
                            style={{ marginBottom: 0 }}
                        >
                            <Input placeholder="Tìm kiếm" prefix={<SearchOutlined />} />
                        </Form.Item>

                        <Form.Item
                            name="waitUntilCompleted"
                            style={{ marginBottom: 0 }}
                        >
                            <Select style={{ width: 150 }}>
                                <Select.Option value={true}>
                                    {t("active") || "Hoạt động"}
                                </Select.Option>
                                <Select.Option value={false}>
                                    {t("inactive") || "Không hoạt động"}
                                </Select.Option>
                            </Select>
                        </Form.Item>

                        <Form.Item label=" " colon={false} style={{ marginBottom: 0 }}>
                            <Button type="primary" htmlType="submit">
                                {t("search") || "Tìm kiếm"}
                            </Button>
                        </Form.Item>
                    </Form>

                    <Button
                        className="bg-green-500 text-white border-transparent"
                        htmlType="button"
                        icon={<PlusOutlined />}
                        onClick={() => setIsOpenLoginQrCodeModal(true)}
                    >
                        {t('connect')}
                    </Button>
                </div>
                <Flex gap="middle" vertical className="mt-4">
                    {/* <Flex align="center" gap="middle">
                        <Button type="primary" onClick={start} disabled={!hasSelected} loading={loading}>
                            Reload
                        </Button>
                        {hasSelected ? `Selected ${selectedRowKeys.length} items` : null}
                    </Flex> */}
                    <Table<DataType> rowSelection={rowSelection} columns={columns} dataSource={dataSource} />

                </Flex>

            </Card>
            <LoginQrCodeModal isOpenModal={isOpenLoginQrCodeModal} onCloseModal={() => setIsOpenLoginQrCodeModal(false)}
                linkQr={qrCodeImage || ""}
                handleGenerateQR={handleGenerateQR}
            />

        </PageContainer>
    );
}
export default ZaloAccountManagerPage;