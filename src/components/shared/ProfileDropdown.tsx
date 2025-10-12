import React from 'react';
import { LoginOutlined, UserAddOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Dropdown, Space, Tooltip, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { APP_ROUTES } from 'src/constants/route';
import useAuth from 'src/hooks/useAuth';
import { logout } from 'src/services/auth.service';
import { setCookie } from 'src/utils/chrome.util';
import { COOKIE_DOMAIN_FCHAT } from 'src/constants';
import useAuthStore from 'src/store/auth';
import { IAuth } from 'src/interfaces/user.interface';

const ProfileDropdown: React.FC = () => {
    const { t } = useTranslation();
    const { isAuthenticated } = useAuth();
    const auth = useAuthStore(state => state.auth);
    const setAuth = useAuthStore(state => state.setAuth);
    const navigate = useNavigate();
    const handleLogout = async () => {
        await logout();
        setAuth({} as IAuth);
        setCookie(COOKIE_DOMAIN_FCHAT, 'accessToken', '', -1);
        setCookie(COOKIE_DOMAIN_FCHAT, 'refreshToken', '', -1);
        navigate(APP_ROUTES.AUTH.LOGIN);
    }
    return (
        <Dropdown
            menu={{
                items: isAuthenticated
                    ? [
                        {
                            key: 'logout',
                            onClick: handleLogout,
                            label: (
                                <span className=" dark:text-white">{t('logout') || 'Đăng xuất'}</span>
                            ),
                        },
                    ]
                    : [
                        {
                            key: 'login',
                            icon: <LoginOutlined className=" dark:text-white" />,
                            label: (
                                <Link to={APP_ROUTES.AUTH.LOGIN} rel="noopener noreferrer" className=" dark:text-white">
                                    {t('login') || 'Đăng nhập'}
                                </Link>
                            ),
                        },
                        {
                            key: 'register',
                            icon: <UserAddOutlined className=" dark:text-white" />,
                            label: (
                                <Link to={APP_ROUTES.AUTH.REGISTER} rel="noopener noreferrer" className=" dark:text-white">
                                    {t('register') || 'Đăng ký'}
                                </Link>
                            ),
                        },
                    ]
            }}
            arrow
            placement="bottomRight"
        >
            <a onClick={e => e.preventDefault()}>
                <Space>
                    <div className="hidden md:flex flex-col">
                        <Tooltip title={isAuthenticated ? (auth.user?.full_name || auth.user?.email) : t('login')} placement="bottom">
                            <Typography.Text
                                strong
                                className=" dark:text-white"
                                style={{
                                    fontSize: 16,
                                    maxWidth: 120,
                                    display: 'block',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {isAuthenticated ? (auth.user?.full_name || auth.user?.email) : t('login')}
                            </Typography.Text>
                        </Tooltip>
                        {isAuthenticated && (
                            <Tooltip title={auth.user?.email} placement="bottom">
                                <Typography.Text
                                    type="secondary"
                                    className="text-gray-500 dark:text-white"
                                    style={{
                                        fontSize: 13,
                                        maxWidth: 120,
                                        display: 'block',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {auth.user?.email}
                                </Typography.Text>
                            </Tooltip>
                        )}
                    </div>
                    <Avatar
                        size={40}
                        src={isAuthenticated ? auth.user?.avatar : undefined}
                        icon={<UserOutlined />}
                        className="border-2 border-blue-100 dark:border-[#23244a] shadow dark:shadow-lg"
                        style={{
                            boxShadow: '0 2px 8px rgba(60,60,120,0.10)'
                        }}
                    />
                </Space>
            </a>
        </Dropdown>
    );
}

export default ProfileDropdown;