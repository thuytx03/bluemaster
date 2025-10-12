import { useEffect, useState } from 'react';
import { getProfile, login as loginApi, logout as logoutApi } from 'src/services/auth.service';
import { getCookie, setCookie } from 'src/utils/chrome.util';
import { COOKIE_DOMAIN_FCHAT } from 'src/constants';
import useAuthStore from 'src/store/auth';
import { IUser, ILoginResponse } from 'src/interfaces/user.interface';

const useAuth = () => {
    const { auth, setAuth } = useAuthStore();
    const [loading, setLoading] = useState<boolean>(true);

    // Khởi động: lấy token từ cookie, gọi API lấy user nếu có token
    useEffect(() => {
        const rehydrate = async () => {
            setLoading(true);
            const accessToken = await getCookie(COOKIE_DOMAIN_FCHAT, 'accessToken');
            if (accessToken) {
                try {
                    const res = await getProfile<IUser>();
                    if (res.status === 200 && res.data) {
                        setAuth({ user: res.data, isAuthenticated: true });
                    } else {
                        setAuth({ user: undefined, isAuthenticated: false });
                    }
                } catch {
                    setAuth({ user: undefined, isAuthenticated: false });
                }
            } else {
                setAuth({ user: undefined, isAuthenticated: false });
            }
            setLoading(false);
        };
        rehydrate();
    }, [setAuth]);

    // Đăng nhập: gọi API, lưu token, cập nhật user vào global state
    const login = async (email: string, password: string, remember?: boolean) => {
        setLoading(true);
        try {
            const result = await loginApi<ILoginResponse>({ email, password });
            if (result.status === 200) {
                const { accessToken, refreshToken, user } = result.data;
                setCookie(COOKIE_DOMAIN_FCHAT, 'accessToken', accessToken, remember ? 7 : 0);
                setCookie(COOKIE_DOMAIN_FCHAT, 'refreshToken', refreshToken, remember ? 30 : 0);
                setAuth({ user, isAuthenticated: true });
                setLoading(false);
                return { success: true, user };
            } else {
                setAuth({ user: undefined, isAuthenticated: false });
                setLoading(false);
                return { success: false, message: result.message };
            }
        } catch (error: any) {
            setAuth({ user: undefined, isAuthenticated: false });
            setLoading(false);
            return { success: false, message: error?.response?.data?.message };
        }
    };

    // Đăng xuất: xóa token, reset global state
    const logout = async () => {
        setLoading(true);
        await logoutApi();
        setCookie(COOKIE_DOMAIN_FCHAT, 'accessToken', '', -1);
        setCookie(COOKIE_DOMAIN_FCHAT, 'refreshToken', '', -1);
        setAuth({ user: undefined, isAuthenticated: false });
        setLoading(false);
    };

    return {
        user: auth.user,
        isAuthenticated: !!auth.user && auth.isAuthenticated,
        loading,
        login,
        logout,
    };
};

export default useAuth;