import { axiosClient } from "src/configs/axios.config";
import { API_BASE_URL, EP, QUERY } from "src/constants/api";
import { DataResponseType } from "src/interfaces/index.interface";
import { getApiEndpoint } from "src/utils/common.util";


export const getPages = async<T>(platform: string) => {
    const { data } = await axiosClient(API_BASE_URL)
        .get<DataResponseType<T>>(getApiEndpoint([EP.API, EP.V1, EP.PAGE, EP.GETS],{
            [QUERY.PLATFORM]: platform
        }));
    return data;
}