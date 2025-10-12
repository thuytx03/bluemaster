export type DataResponseType<T> = {
    success: boolean
    errors: any
    data: T
    status: number
    message: string
}
