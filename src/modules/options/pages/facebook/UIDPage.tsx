import { CircleQuestionMark } from "lucide-react";
import { Main } from "../../components/layout/main";
import { Alert } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { copyTextToClipboard, getUserID, onStartExtension } from "@/helpers/functionHelpers";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import toast from "react-hot-toast";

export default function UIDPage() {
  const [linkGroup, setLinkGroup] = useState<string>("");
  const [linkPost, setLinkPost] = useState<string>("");
  const [linkProfile, setLinkProfile] = useState<string>("");

  const handExportUIDGroup = async () => {
    if (!linkGroup) return toast.error("Vui lòng nhập link nhóm");
    try {
      chrome.tabs.create({ url: linkGroup });
      onStartExtension({ type: "group" });
    } catch (error) {
      console.log("error", error);
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    }
  };
  const handExportUIDPost = async () => {
    if (!linkPost) return toast.error('Vui lòng nhập link bài viết!');
    try {
      chrome.tabs.create({ url: linkPost });
      const options = [];
      const commentCheckbox = document.getElementById('comment') as HTMLInputElement;
      const likeCheckbox = document.getElementById('like') as HTMLInputElement;
      const shareCheckbox = document.getElementById('share') as HTMLInputElement;

      if (commentCheckbox.checked) options.push("comment");
      if (likeCheckbox.checked) options.push("like");
      if (shareCheckbox.checked) options.push("share");
      await onStartExtension({
        type: "post",
        options: options
      });
    } catch (error) {
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    }
  };
  const handExportUIDProfile = async () => {
    if (!linkProfile) return toast.error('Vui lòng nhập link người dùng');
    try {
      await getUserID(linkProfile).then((res) => {
        toast.custom((t) => (
          <div
            className={`${t.visible ? 'animate-custom-enter' : 'animate-custom-leave'
              } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                UID: {res.data}
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => {
                  copyTextToClipboard(res.data)
                  toast.success('Copy UID thành công!')
                }}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Copy
              </button>
            </div>
          </div>
        ))
      });
    } catch (error) {
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    }
  };
  return (
    <Main>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Lấy UID</h2>
        <p className="text-sm text-muted-foreground">
          Công cụ giúp bạn trích xuất UID từ Facebook một cách nhanh chóng và an toàn.
        </p>
      </div>

      {/* Alert Info */}
      <div className="space-y-3">
        <Alert className="flex items-start gap-2 bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950 dark:border-blue-400 dark:text-blue-200">
          <CircleQuestionMark className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            UID là mã định danh duy nhất dùng để nhận diện tài khoản, trang hoặc nhóm trên Facebook.
          </span>
        </Alert>


      </div>

      {/* Tabs */}
      <div className="mt-6 flex justify-center flex-col">
        <Tabs defaultValue="group" className="  ">
          <TabsList className="dark:bg-slate-800 ">
            <TabsTrigger value="group">Nhóm</TabsTrigger>
            <TabsTrigger value="post">Bài viết</TabsTrigger>
            <TabsTrigger value="profile">Người dùng</TabsTrigger>
          </TabsList>

          {/* Tab group */}
          <TabsContent value="group" className="mt-4">
            <Card className="">
              <CardHeader className="p-3">
                <CardTitle className="text-base">Trích xuất UID từ nhóm</CardTitle>
                <CardDescription>
                  Nhập link nhóm Facebook để bắt đầu quét UID thành viên.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 max-w-md px-3">
                <div className="grid gap-2">
                  <Input
                    type="text"
                    value={linkGroup}
                    onChange={(e) => setLinkGroup(e.target.value)}
                    id="linkGroup"
                    placeholder="Nhập link group"
                    required
                  />
                </div>
                <Button type="button" onClick={handExportUIDGroup} className="">
                  Quét ngay
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab post */}
          <TabsContent value="post" className="mt-4">
            <Card className="">
              <CardHeader className="p-3">
                <CardTitle className="text-base">Trích xuất UID từ bài viết</CardTitle>
                <CardDescription>
                  Nhập link bài viết Facebook để bắt đầu quét UID thành viên.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 max-w-md px-3">
                <div className="grid gap-2">
                  <Input
                    type="text"
                    value={linkPost}
                    onChange={(e) => setLinkPost(e.target.value)}
                    id="linkPost"
                    placeholder="Nhập link bài viết"
                    required
                  />
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center">
                      <input id="comment" type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded" />
                      <label htmlFor="comment" className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">Comment</label>
                    </div>
                    <div className="flex items-center">
                      <input id="like" type="checkbox" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded" />
                      <label htmlFor="like" className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">Like</label>
                    </div>
                    <div className="flex items-center">
                      <input id="share" type="checkbox" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded" />
                      <label htmlFor="share" className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">Share</label>
                    </div>
                  </div>
                </div>
                <Button type="button" onClick={handExportUIDPost} className="">
                  Quét ngay
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab profile */}
          <TabsContent value="profile" className="mt-4">
            <Card className="">
              <CardHeader className="p-3">
                <CardTitle className="text-base">Trích xuất UID từ người dùng</CardTitle>
                <CardDescription>
                  Nhập link người dùng Facebook để bắt đầu quét UID.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 max-w-md px-3">
                <div className="grid gap-2">
                  <Input
                    type="text"
                    value={linkProfile}
                    onChange={(e) => setLinkProfile(e.target.value)}
                    id="linkProfile"
                    placeholder="Nhập link người dùng"
                    required
                  />

                </div>
                <Button type="button" onClick={handExportUIDProfile} className="">
                  Quét ngay
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </Main>
  );
}
