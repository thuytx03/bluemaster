import React from 'react';
import { Button, Checkbox, Form, Input } from 'antd';
import { LogoIcon } from 'src/assets/icons';
import { COOKIE_DOMAIN_FCHAT, EXTENSION_INFO } from 'src/constants';
import { HTTPSTATUS } from 'src/constants/http';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getCookie, setCookie } from 'src/utils/chrome.util';
import useAuth from 'src/hooks/useAuth';
import { ILoginResponse } from 'src/interfaces/user.interface';
import useAuthStore from 'src/store/auth';

type FieldType = {
    email: string;
    password: string;
    remember?: string;
};

const LoginPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { login, loading } = useAuth();

    const onSubmit = async (values: FieldType) => {
        const res = await login(values.email, values.password, true);
        if (res.success) {
            toast.success(t('login_success') || "Đăng nhập thành công!");
            navigate('/');
        } else {
            toast.error(res.message || t('login_failed') || "Đăng nhập thất bại!");
        }
    };

    return (
        <div className="flex items-center justify-center">
            <div className="bg-white dark:bg-[#18192b] px-9 py-10 rounded-2xl shadow-xl dark:shadow-2xl min-w-[350px] w-full max-w-md border-2 border-blue-100 dark:border-[#23244a] transition-all">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-3">
                        <LogoIcon className="size-14" />
                    </div>
                    <h2 className="m-0 font-bold text-2xl text-indigo-900 dark:text-blue-100 tracking-wide">{t('login')}</h2>
                    <p className="text-gray-500 dark:text-blue-300 mt-2 text-base">
                        {t('welcome_back')}
                        <span className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-300 dark:to-blue-500 ml-1">
                            {EXTENSION_INFO.displayName}
                        </span>
                    </p>
                </div>
                <Form
                    name="basic"
                    labelCol={{ span: 0 }}
                    wrapperCol={{ span: 24 }}
                    initialValues={{ remember: true }}
                    onFinish={onSubmit}
                    autoComplete="off"
                    layout="vertical"
                >
                    <Form.Item<FieldType>
                        label={t('email')}
                        name="email"
                        rules={[
                            { required: true, message: t('please_enter_email') || 'Vui lòng nhập email!' },
                            { type: 'email', message: t('invalid_email') || 'Email không hợp lệ!' }
                        ]}
                    >
                        <Input
                            size="large"
                            placeholder={t('email')}
                            className="rounded-xl text-base py-2 px-3 border border-blue-100 dark:border-[#23244a] dark:bg-[#23244a] dark:text-blue-100 transition-all"
                        />
                    </Form.Item>

                    <Form.Item<FieldType>
                        label={t('password')}
                        name="password"
                        rules={[{ required: true, message: t('please_enter_password') || 'Vui lòng nhập mật khẩu!' }]}
                    >
                        <Input.Password
                            size="large"
                            placeholder={t('password')}
                            className="rounded-xl text-base py-2 px-3 border border-blue-100 dark:border-[#23244a] dark:bg-[#23244a] dark:text-blue-100 transition-all"
                        />
                    </Form.Item>

                    <div className="flex justify-between items-center mb-4">
                        <Form.Item<FieldType> name="remember" valuePropName="checked" noStyle>
                            <Checkbox className="text-base dark:text-blue-100">{t('remember_me')}</Checkbox>
                        </Form.Item>
                        <a
                            href="#"
                            className="text-base text-indigo-900 dark:text-blue-400 font-medium hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
                        >
                            {t('forgot_password')}
                        </a>
                    </div>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            block
                            loading={loading}
                            className="h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 dark:from-[#23244a] dark:to-blue-600 border-none shadow hover:from-blue-400 hover:to-blue-600 dark:hover:from-blue-600 dark:hover:to-[#23244a] transition-all"
                        >
                            {t('login')}
                        </Button>
                    </Form.Item>
                </Form>
                <div className="text-center mt-4">
                    <span className="text-gray-500 dark:text-blue-300 text-base">{t('no_account')} </span>
                    <a
                        href="#"
                        className="text-indigo-900 dark:text-blue-400 font-semibold text-base hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
                    >
                        {t('register')}
                    </a>
                </div>
            </div>
        </div>
    )
}

export default LoginPage;