
import { ESocialProvider } from "src/constants/enum"
import { REQUEST_ACCEPT_HEADER } from "src/constants/variables"
import useAuthStore from "src/store/auth"
import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";
import { COOKIE_DOMAIN_FCHAT } from "src/constants";
import { chromeUtils } from "src/utils/chrome.util";
const igAxiosInstance = axios.create({
  baseURL: "https://www.instagram.com/graphql/query"
})

const threadsAxiosInstance = axios.create({
  baseURL: "https://www.threads.net/graphql/query"
})

const fbAxiosInstance = axios.create({
  baseURL: "https://www.facebook.com/api/graphql"
})

const xAxiosInstance = axios.create({
  baseURL: "https://x.com/i/api/graphql"
})


threadsAxiosInstance.interceptors.request.use((config) => {
  const { accounts } = useAuthStore.getState()
  const igAppId = accounts[ESocialProvider.THREADS]?.igAppId

  if (igAppId) {
    config.headers["x-ig-app-id"] = igAppId
  }
  config.headers["Accept"] = REQUEST_ACCEPT_HEADER
  return config
})

fbAxiosInstance.interceptors.request.use((config) => {
  config.headers["Accept"] = REQUEST_ACCEPT_HEADER

  return config
})

igAxiosInstance.interceptors.request.use((config) => {
  config.headers["Accept"] = REQUEST_ACCEPT_HEADER

  return config
})

xAxiosInstance.interceptors.request.use((config) => {
  const { accounts } = useAuthStore.getState()
  const xAccount = accounts[ESocialProvider.X]
  if (xAccount) {
    config.headers["authorization"] = xAccount.accessToken
    config.headers["x-csrf-token"] = xAccount.csrfToken
  }
  return config
})

const axiosClient = (baseURL: string | undefined, token?: string) => {
  const axiosInstance: AxiosInstance = axios.create({
    responseType: "json",
    baseURL: baseURL,
    headers: {
      "Content-Type": "application/json",
    }
  })

  axiosInstance.interceptors.request.use(
    async (config) => {
      const accessToken = token || await chromeUtils.getCookie(COOKIE_DOMAIN_FCHAT, 'accessToken');
      config.headers.set('Authorization', 'Bearer ' + accessToken);
      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    (error: AxiosError) => {
      // Xử lý lỗi ở đây, ví dụ như redirect đến trang login nếu token hết hạn
      if (error.response && error.response.status === 401) {
        //TODO
      }
      return Promise.reject(error);
    }
  );
  return axiosInstance;
}

export {
  threadsAxiosInstance,
  igAxiosInstance,
  fbAxiosInstance,
  xAxiosInstance,
  axiosClient
}
