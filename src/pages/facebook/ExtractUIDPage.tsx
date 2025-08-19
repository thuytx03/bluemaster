import { Alert, Card, Tabs, Input, Button, Checkbox } from 'antd';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import PageContainer from 'src/components/shared/PageContainer';
import { EXTENSION_INFO } from 'src/constants';
import { copyTextToClipboard, onStartExtension } from 'src/utils/common.util';
import { getUserID } from 'src/utils/facebook.util';

const ExtractUIDPage = () => {
    const [linkGroup, setLinkGroup] = useState<string>("");
    const [linkPost, setLinkPost] = useState<string>("");
    const [linkProfile, setLinkProfile] = useState<string>("");

    const [postOptions, setPostOptions] = useState({
        comment: true,
        like: false,
        share: false,
    });

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
            if (postOptions.comment) options.push("comment");
            if (postOptions.like) options.push("like");
            if (postOptions.share) options.push("share");
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
        <PageContainer
            title="Lấy UID Facebook"
            className="flex flex-col">
            <Card className="flex-1 shadow border rounded-xl">
                <div className="space-y-2">
                    <Alert message="UID là mã định danh duy nhất dùng để nhận diện tài khoản, trang hoặc nhóm trên Facebook." type="info" showIcon />
                </div>
                <div className="mt-6 flex justify-center flex-col">
                    <Tabs
                        defaultActiveKey="group"
                        type="card"
                        items={[
                            {
                                label: "Nhóm",
                                key: "group",
                                children: (
                                    <Card>
                                        <div className="p-3">
                                            <div className="text-base font-semibold mb-1">Trích xuất UID từ nhóm</div>
                                            <div className="mb-2 text-gray-500">Nhập link nhóm Facebook để bắt đầu quét UID thành viên.</div>
                                            <div className="space-y-2 max-w-md">
                                                <Input
                                                    type="text"
                                                    value={linkGroup}
                                                    onChange={(e) => setLinkGroup(e.target.value)}
                                                    id="linkGroup"
                                                    placeholder="Nhập link group"
                                                    required
                                                />
                                                <Button type="primary" onClick={handExportUIDGroup}>
                                                    Quét ngay
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ),
                            },
                            {
                                label: "Bài viết",
                                key: "post",
                                children: (
                                    <Card>
                                        <div className="p-3">
                                            <div className="text-base font-semibold mb-1">Trích xuất UID từ bài viết</div>
                                            <div className="mb-2 text-gray-500">Nhập link bài viết Facebook để bắt đầu quét UID thành viên.</div>
                                            <div className="space-y-2 max-w-md">
                                                <Input
                                                    type="text"
                                                    value={linkPost}
                                                    onChange={(e) => setLinkPost(e.target.value)}
                                                    id="linkPost"
                                                    placeholder="Nhập link bài viết"
                                                    required
                                                />
                                                <div className="flex items-center gap-4 mb-4">
                                                    <Checkbox
                                                        checked={postOptions.comment}
                                                        onChange={e => setPostOptions(prev => ({ ...prev, comment: e.target.checked }))}
                                                    >
                                                        Comment
                                                    </Checkbox>
                                                    <Checkbox
                                                        checked={postOptions.like}
                                                        onChange={e => setPostOptions(prev => ({ ...prev, like: e.target.checked }))}
                                                    >
                                                        Like
                                                    </Checkbox>
                                                    <Checkbox
                                                        checked={postOptions.share}
                                                        onChange={e => setPostOptions(prev => ({ ...prev, share: e.target.checked }))}
                                                    >
                                                        Share
                                                    </Checkbox>
                                                </div>
                                                <Button type="primary" onClick={handExportUIDPost}>
                                                    Quét ngay
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ),
                            },
                            {
                                label: "Người dùng",
                                key: "profile",
                                children: (
                                    <Card>
                                        <div className="p-3">
                                            <div className="text-base font-semibold mb-1">Trích xuất UID từ người dùng</div>
                                            <div className="mb-2 text-gray-500">Nhập link người dùng Facebook để bắt đầu quét UID.</div>
                                            <div className="space-y-2 max-w-md">
                                                <Input
                                                    type="text"
                                                    value={linkProfile}
                                                    onChange={(e) => setLinkProfile(e.target.value)}
                                                    id="linkProfile"
                                                    placeholder="Nhập link người dùng"
                                                    required
                                                />
                                                <Button type="primary" onClick={handExportUIDProfile}>
                                                    Quét ngay
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ),
                            },
                        ]}
                    />
                </div>
            </Card>
        </PageContainer>
    );
};

export default ExtractUIDPage;