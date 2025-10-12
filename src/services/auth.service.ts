import { axiosClient } from "src/configs/axios.config";
import { API_BASE_URL, EP } from "src/constants/api";
import { DataResponseType } from "src/interfaces/index.interface";
import { getApiEndpoint } from "src/utils/common.util";

export const login = async<T>(payload: { email: string, password: string }) => {
    const { data } = await axiosClient(API_BASE_URL)
        .post<DataResponseType<T>>(getApiEndpoint([EP.API, EP.V1, EP.AUTH, EP.LOGIN]), payload);
    return data;
}
export const getProfile = async<T>() => {
    const { data } = await axiosClient(API_BASE_URL)
        .get<DataResponseType<T>>(getApiEndpoint([EP.API, EP.V1, EP.AUTH, EP.PROFILE]));
    return data;
}
export const logout = async<T>() => {
    const { data } = await axiosClient(API_BASE_URL)
        .post<DataResponseType<T>>(getApiEndpoint([EP.API, EP.V1, EP.AUTH, EP.LOGOUT]));
    return data;
}