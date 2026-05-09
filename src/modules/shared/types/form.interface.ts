import { EDownloadSeperateType } from "src/constants/enum"
import { IDownloadAllOptions } from "src/modules/shared/types/common.interface"
import {
  TFacebookDownloadAllType,
  TIgDownloadAllType,
  TThreadsDownloadAllType,
  TXDownloadAllType
} from "src/modules/shared/types/download-process.interface"

export interface IDownloadAllForm<T> extends IDownloadAllOptions {
  username: string
  type: T
}

export interface IIgDownloadAllForm
  extends IDownloadAllForm<TIgDownloadAllType> {}

export interface IThreadsDownloadAllForm
  extends IDownloadAllForm<TThreadsDownloadAllType> {}

export interface IFacebookDownloadAllForm
  extends IDownloadAllForm<TFacebookDownloadAllType> {
  target: "PROFILE" | "GROUP"
}

export interface IXDownloadAllForm
  extends IDownloadAllForm<TXDownloadAllType> {}

export interface IDownloadSeperateForm {
  url: string
  type: EDownloadSeperateType
}
