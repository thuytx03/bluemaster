import { Alert, Card, Tabs, Input, Button, Checkbox } from 'antd';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import PageContainer from 'src/modules/shared/components/PageContainer';
import { EXTENSION_INFO } from 'src/constants';
import { copyTextToClipboard, onStartExtension } from 'src/utils/common.util';
import { getUserID } from 'src/modules/facebook/utils/facebook.util';
import { useTranslation } from 'react-i18next';


const ExtractUIDPage = () => {
    const { t } = useTranslation();
    const [linkGroup, setLinkGroup] = useState<string>("");
    const [linkPost, setLinkPost] = useState<string>("");
    const [linkProfile, setLinkProfile] = useState<string>("");

    const [postOptions, setPostOptions] = useState({
        comment: true,
        like: false,
        share: false,
    });

    const handExportUIDGroup = async () => {
        if (!linkGroup) return toast.error(t('error_enter_group_link'));
        try {
            chrome.tabs.create({ url: linkGroup });
            onStartExtension({ type: "group" });
        } catch (error) {
            console.log("error", error);
            toast.error(t('error_occurred'));
        }
    };

    const handExportUIDPost = async () => {
        if (!linkPost) return toast.error(t('error_enter_post_link'));
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
            toast.error(t('error_occurred'));
        }
    };

    const handExportUIDProfile = async () => {
        if (!linkProfile) return toast.error(t('error_enter_user_link'));
        try {
            await getUserID(linkProfile).then((res) => {
                toast.custom((tToast) => (
                    <div
                        className={`${tToast.visible ? 'animate-custom-enter' : 'animate-custom-leave'
                            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
                    >
                        <div className="flex-1 w-0 p-4">
                            <div className="flex items-start">
                                {t('uid')} {res.data}
                            </div>
                        </div>
                        <div className="flex border-l border-gray-200">
                            <button
                                onClick={() => {
                                    copyTextToClipboard(res.data)
                                    toast.success(t('copy_uid_success'))
                                }}
                                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {t('copy')}
                            </button>
                        </div>
                    </div>
                ))
            });
        } catch (error) {
            toast.error(t('error_occurred'));
        }
    };

    return (
        <PageContainer
            title={t('extract_uid_title')}
            className="flex flex-col">
            <Card className="flex-1 shadow border rounded-xl">
                <div className="space-y-2">
                    <Alert message={t('extract_uid_info')} type="info" showIcon />
                </div>
                <div className="mt-6 flex justify-center flex-col">
                    <Tabs
                        defaultActiveKey="group"
                        type="card"
                        items={[
                            {
                                label: t('extract_uid_tab_group'),
                                key: "group",
                                children: (
                                    <Card>
                                        <div className="p-3">
                                            <div className="text-base font-semibold mb-1">{t('extract_uid_group_title')}</div>
                                            <div className="mb-2 text-gray-500">{t('extract_uid_group_desc')}</div>
                                            <div className="space-y-2 max-w-md">
                                                <Input
                                                    type="text"
                                                    value={linkGroup}
                                                    onChange={(e) => setLinkGroup(e.target.value)}
                                                    id="linkGroup"
                                                    placeholder={t('extract_uid_group_placeholder')}
                                                    required
                                                />
                                                <Button type="primary" onClick={handExportUIDGroup}>
                                                    {t('scan_now')}
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ),
                            },
                            {
                                label: t('extract_uid_tab_post'),
                                key: "post",
                                children: (
                                    <Card>
                                        <div className="p-3">
                                            <div className="text-base font-semibold mb-1">{t('extract_uid_post_title')}</div>
                                            <div className="mb-2 text-gray-500">{t('extract_uid_post_desc')}</div>
                                            <div className="space-y-2 max-w-md">
                                                <Input
                                                    type="text"
                                                    value={linkPost}
                                                    onChange={(e) => setLinkPost(e.target.value)}
                                                    id="linkPost"
                                                    placeholder={t('extract_uid_post_placeholder')}
                                                    required
                                                />
                                                <div className="flex items-center gap-4 mb-4">
                                                    <Checkbox
                                                        checked={postOptions.comment}
                                                        onChange={e => setPostOptions(prev => ({ ...prev, comment: e.target.checked }))}
                                                    >
                                                        {t('comment')}
                                                    </Checkbox>
                                                    <Checkbox
                                                        checked={postOptions.like}
                                                        onChange={e => setPostOptions(prev => ({ ...prev, like: e.target.checked }))}
                                                    >
                                                        {t('like')}
                                                    </Checkbox>
                                                    <Checkbox
                                                        checked={postOptions.share}
                                                        onChange={e => setPostOptions(prev => ({ ...prev, share: e.target.checked }))}
                                                    >
                                                        {t('share')}
                                                    </Checkbox>
                                                </div>
                                                <Button type="primary" onClick={handExportUIDPost}>
                                                    {t('scan_now')}
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ),
                            },
                            {
                                label: t('extract_uid_tab_profile'),
                                key: "profile",
                                children: (
                                    <Card>
                                        <div className="p-3">
                                            <div className="text-base font-semibold mb-1">{t('extract_uid_profile_title')}</div>
                                            <div className="mb-2 text-gray-500">{t('extract_uid_profile_desc')}</div>
                                            <div className="space-y-2 max-w-md">
                                                <Input
                                                    type="text"
                                                    value={linkProfile}
                                                    onChange={(e) => setLinkProfile(e.target.value)}
                                                    id="linkProfile"
                                                    placeholder={t('extract_uid_profile_placeholder')}
                                                    required
                                                />
                                                <Button type="primary" onClick={handExportUIDProfile}>
                                                    {t('scan_now')}
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