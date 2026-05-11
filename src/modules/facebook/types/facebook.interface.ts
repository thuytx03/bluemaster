import { IMedia } from "src/modules/shared/types/common.interface"

export interface IFacebookStory extends IMedia {
  isVideo: boolean
  thumbnailUrl?: string
}

export interface IFacebookPost extends IMedia {
  isVideo: boolean
}
export interface IAccessTokenPage {
  tokenEAAB: string;
  tokenEAAGNO: string;
}
export type Member = {
  uid: string;
  name?: string;
  url?: string;
}

export type ExportState = {
  count: number;
  options: any[];
  arrUID: Member[];
  status: 'continue' | 'stop';
  success: boolean;
}
