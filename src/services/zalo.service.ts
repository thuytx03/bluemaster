// import { EP, QUERY } from "@/constants";
// import { getApiEndpoint } from "@/helpers/handleApiUrl";
// import axiosClient from "@/libs/axiosClient";
// import { DataResponseType } from "@/types";
// import { PayloadConnectPage, PayloadDisconnectPage } from "@/types/page";

// export const getPageInPlatform = async<T>(platform: string) => {
//     const { data } = await axiosClient(import.meta.env.VITE_FCHAT_AI_API_SALEKIT)
//         .get<DataResponseType<T>>(getApiEndpoint([EP.API, EP.V1, EP.PAGE, EP.PLATFORM], {
//             [QUERY.PLATFORM]: platform
//         }));
//     return data;
// }
// export const connectPage = async<T>(payload: PayloadConnectPage) => {
//     const { data } = await axiosClient(import.meta.env.VITE_FCHAT_AI_API_SALEKIT)
//         .post<DataResponseType<T>>(getApiEndpoint([EP.API, EP.V1, EP.PAGE, EP.CONNECT]), payload);
//     return data;
// }
// export const disconnectPage = async<T>(payload: PayloadDisconnectPage) => {
//     const { data } = await axiosClient(import.meta.env.VITE_FCHAT_AI_API_SALEKIT)
//         .post<DataResponseType<T>>(getApiEndpoint([EP.API, EP.V1, EP.PAGE, EP.DISCONNECT]), payload);
//     return data;
// }
// export const getPages = async<T>() => {
//     const { data } = await axiosClient(import.meta.env.VITE_FCHAT_AI_API_SALEKIT)
//         .get<DataResponseType<T>>(getApiEndpoint([EP.API, EP.V1, EP.PAGE, EP.GETS]));
//     return data;
// }