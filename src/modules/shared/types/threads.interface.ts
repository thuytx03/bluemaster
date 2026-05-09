import { IMedia } from "src/modules/shared/types/common.interface"
import { IIGPost } from "src/modules/instagram/types/instagram.interface"

export interface IThreadsPost extends IIGPost {
  audioCount: number
  audios: IMedia[]
}
