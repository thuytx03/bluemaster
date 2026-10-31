import axios from "axios"

import { REQUEST_ACCEPT_HEADER } from "src/constants/app.constants"

/** Facebook GraphQL / page client used by facebook.service */
const fbAxiosInstance = axios.create({
  baseURL: "https://www.facebook.com/api/graphql"
})

fbAxiosInstance.interceptors.request.use((config) => {
  config.headers["Accept"] = REQUEST_ACCEPT_HEADER
  return config
})

export { fbAxiosInstance }
