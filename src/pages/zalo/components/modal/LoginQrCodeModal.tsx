import React from 'react';
import { Button, Form, Input, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { GlobalOutlined, QrcodeOutlined, SettingOutlined } from '@ant-design/icons';

interface LoginQrCodeModalProps {
    isOpenModal: boolean;
    linkQr: string;
    onCloseModal: () => void;
    handleGenerateQR: (proxy: string) => void;

}
const LoginQrCodeModal: React.FC<LoginQrCodeModalProps> = ({ isOpenModal, linkQr, onCloseModal, handleGenerateQR }) => {
    const { t } = useTranslation()
    const [proxy, setProxy] = React.useState<string>("");

    return (
        <>

            <Modal
                title={t("login_qr_code_with_zalo")}
                closable={{ 'aria-label': 'Custom Close Button' }}
                open={isOpenModal}
                onCancel={onCloseModal}
                width={{
                    xs: '90%',
                    sm: '80%',
                    md: '70%',
                    lg: '60%',
                    xl: '50%',
                    xxl: '40%',
                }}
                footer={null} // ⬅️ Ẩn nút OK và Cancel

            >
                <Form
                    name="basic"
                    autoComplete="off"
                    layout="vertical"
                    labelAlign="left"
                    initialValues={{
                        delayTimeInSecond: 0
                    }}>
                    <div className="flex gap-3 items-center">
                        <Form.Item
                            label={t("setup_proxy")}
                            name="target"
                            rules={[{ message: t("setup_proxy") }]}
                            style={{ flex: 1 }}>

                            <Input placeholder="http://user:pass@host:port"
                                value={proxy}
                                onChange={(e) => setProxy(e.target.value)}
                                prefix={<GlobalOutlined />} />

                        </Form.Item>
                        <Form.Item wrapperCol={{ span: 24 }}
                            label={" "}
                        >
                            <Button type="primary" onClick={() => handleGenerateQR(proxy)} icon={<QrcodeOutlined />}>
                                {t("generate_qr_code")}
                            </Button>
                        </Form.Item>
                    </div>



                </Form>
                {(isOpenModal && linkQr) && (
                    <div className="flex items-center justify-between ">
                        <img src={linkQr} alt="QR Code" className="w-64 h-64 mb-4" />
                        <div className="text-left justify-center h-full ">
                            <h2 className="text-[22px] mb-2 text-gray-900 dark:text-gray-100">{t('scan_qr_to_connect_zalo_with_xthuy_social')}</h2>
                            <div className="text-left mb-4 border-b border-gray-200">
                                <div className="flex text-[16px] text-gray-500 mb-2">
                                    1. {t('open_zalo_application')}
                                    <img
                                        src="https://cdn.fchat.vn/assets/images/Logo_Zalo.png"
                                        width="20px"
                                        className="rounded-[4px] bg-gray-200 mx-1 mt-[2px]"
                                        alt="Zalo"
                                    />
                                    {t('on_mobile')}.
                                </div>
                                <div className="flex items-center text-[16px] text-gray-500 mb-2">
                                    2. {t('in_the_section')}
                                    <span className='mx-1'><SettingOutlined width={16} height={16} /></span>
                                    {t('install_press_qr_scan_button')}
                                    <span className='mx-1'><QrcodeOutlined width={16} height={16} /></span>
                                </div>
                                <div className="flex text-[16px] text-gray-500 mb-2">
                                    3. {t('scan_qr_code_to_login')}.
                                </div>
                            </div>
                            <div className="mt-4 text-[12px] text-gray-500 w-[350px] flex line-[2px]">
                                {t('zalo_conncet_value_1')}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default LoginQrCodeModal;