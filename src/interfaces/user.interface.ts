export interface IUser {
    id: string
    full_name: string
    email: string
    phone: any
    avatar: any
    address: any
    description: any
    user_name: string
    ip: string[]
    last_login: string
    status: number
    gender: any
    birthday: any
    ref: any
    google_id: any
    facebook_id: any
    src: any
    socials: any
    note: any
    created_by: any
    updated_by: any
    created_at: string
    updated_at: string
}
export interface IAuth{
    user: IUser
    isAuthenticated: boolean
}
export interface ILoginResponse {
    accessToken: string
    refreshToken: string
    user: IUser
}