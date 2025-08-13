import { useEffect, useState } from "react";
import { getCookie } from "../helpers/cookieHelpers";
import useAuthStore from "../stores/auth";

const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const cookies = await getCookie('https://www.facebook.com/', 'c_user');
        const user_id = await getCookie('https://fchat.ai', 'user_id');
        console.log('User ID:', user_id);
        if (cookies) {
          setIsAuthenticated(true);
          chrome.runtime.sendMessage({ action: 'FB_DTSG', c_user: cookies }, (response) => {
            if (response) {
              // setFB_DTSG(response);
            } else {
              console.log('Không thể lấy được token');
            }
          });
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking authentication', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  return { isAuthenticated, isLoading };
};



export default useAuth;
