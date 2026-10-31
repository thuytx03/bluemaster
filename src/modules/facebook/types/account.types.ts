import { ESocialProvider } from "src/constants/enum"

export interface IAccountData {
  id: string
  name: string
  username: string
  avatar: string
  cookies: string
}

export interface IFacebookAccount extends IAccountData {
  fbDtsg: string
}

export interface IAccounts {
  [ESocialProvider.FACEBOOK]: IFacebookAccount | null
}
