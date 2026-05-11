import { Alert, Card, Tabs, Input, Button, Checkbox } from 'antd';
import React, { useState } from 'react';
import { toast } from 'sonner';
import PageContainer from '../../shared/components/PageContainer';
import { copyTextToClipboard } from '../../../utils/common.util';
import { onStartExtension } from '../hooks/useFacebookUIDScraper';
import { getUserID } from '../utils/facebook.util';
import { useTranslation } from 'react-i18next';
import { chromeUtils } from 'src/utils/chrome.util';
import { EStorageKey } from 'src/constants/enum';


const ExtractUIDPage = () => {
    const { t } = useTranslation();
    const [linkGroup, setLinkGroup] = useState<string>("");
    const [linkPost, setLinkPost] = useState<string>("");
    const [linkProfile, setLinkProfile] = useState<string>("");
    const [uidProfile, setUidProfile] = useState<string>("");
    const [postOptions, setPostOptions] = useState({
        comment: true,
        like: false,
        share: false,
    });

    const handExportUIDGroup = async () => {
        if (!linkGroup) return toast.error(t('error_enter_group_link'));
        try {
            await onStartExtension({ type: "group" });
            chromeUtils.openNewTab({ url: linkGroup });
        } catch (error) {
            console.log("error", error);
            toast.error(t('error_occurred'));
        }
    };

    const handExportUIDPost = async () => {
        if (!linkPost) return toast.error(t('error_enter_post_link'));
        try {
            const options = [];
            if (postOptions.comment) options.push("comment");
            if (postOptions.like) options.push("like");
            if (postOptions.share) options.push("share");
            await onStartExtension({ type: "post", options });
            chromeUtils.openNewTab({ url: linkPost });
        } catch (error) {
            toast.error(t('error_occurred'));
        }
    };

    const handExportUIDProfile = async () => {
        if (!linkProfile) return toast.error(t('error_enter_user_link'));
        try {
            const key = EStorageKey.EXTRACTED_UID_FACEBOOK + linkProfile
            const uid = await chromeUtils.getStorage(key)
            if (uid) {
                setUidProfile(uid as string)
                return;
            }

            await getUserID(linkProfile).then((res: any) => {
                if (!res || !res.data) {
                    toast.error(t('error_uid_not_found') || 'Không tìm thấy UID');
                    return;
                }
                const uidValue = res.data?.id || res.data?.uid || (typeof res.data === 'object' ? JSON.stringify(res.data) : res.data);
                if (uidValue) {
                    setUidProfile(uidValue)
                    chromeUtils.setStorage(key, uidValue)
                } else {
                    toast.error(t('error_uid_not_found') || 'Không tìm thấy UID');
                }
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
                                                {
                                                    uidProfile && (
                                                        <div>
                                                            <div className="text-base font-semibold mb-1">{t('uid')}</div>
                                                            <div className='flex items-center justify-end gap-4'>
                                                                <Input
                                                                    type="text"
                                                                    value={uidProfile}
                                                                    disabled
                                                                    readOnly
                                                                    className="w-full"
                                                                />
                                                                <Button type="primary" onClick={() => {
                                                                    copyTextToClipboard(uidProfile)
                                                                    toast.success(t('copy_success'))
                                                                }}>
                                                                    {t('copy')}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )
                                                }
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