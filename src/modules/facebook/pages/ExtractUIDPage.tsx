import { FileText, Link2, Pickaxe, ScanSearch, User, Users } from "lucide-react"
import { ReactNode, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { EStorageKey } from "src/constants/enum"
import { APP_ROUTES } from "src/constants/route.constants"
import PageContainer from "src/modules/shared/components/PageContainer"
import {
  Button,
  Callout,
  Checkbox,
  CopyButton,
  Field,
  Input,
  Surface,
  Tabs
} from "src/modules/shared/ui"
import { chromeUtils } from "src/utils/chrome.util"

import { onStartExtension } from "src/modules/facebook/hooks/useFacebookUIDScraper"
import { getUserID } from "src/modules/facebook/utils/facebook.util"

const Panel = ({
  title,
  description,
  children
}: {
  title: string
  description: string
  children: ReactNode
}) => (
  <Surface padding="md">
    <div className="bm-mb-3">
      <div className="bm-text-[13.5px] bm-font-semibold bm-text-fg">{title}</div>
      <div className="bm-text-[12px] bm-text-fg-muted">{description}</div>
    </div>
    <div className="bm-flex bm-flex-col bm-gap-3">{children}</div>
  </Surface>
)

const ExtractUIDPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [linkGroup, setLinkGroup] = useState<string>("")
  const [linkPost, setLinkPost] = useState<string>("")
  const [linkProfile, setLinkProfile] = useState<string>("")
  const [uidProfile, setUidProfile] = useState<string>("")
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [postOptions, setPostOptions] = useState({
    comment: true,
    like: false,
    share: false
  })

  const handExportUIDGroup = async () => {
    if (!linkGroup) return toast.error(t("error_enter_group_link"))
    try {
      await onStartExtension({ type: "group", url: linkGroup })
      navigate(APP_ROUTES.FACEBOOK.EXPORT_UID)
    } catch (error) {
      console.log("error", error)
      toast.error(t("error_occurred"))
    }
  }

  const handExportUIDPost = async () => {
    if (!linkPost) return toast.error(t("error_enter_post_link"))
    try {
      const options = []
      if (postOptions.comment) options.push("comment")
      if (postOptions.like) options.push("like")
      if (postOptions.share) options.push("share")
      await onStartExtension({ type: "post", options, url: linkPost })
      navigate(APP_ROUTES.FACEBOOK.EXPORT_UID)
    } catch (error) {
      toast.error(t("error_occurred"))
    }
  }

  const handExportUIDProfile = async () => {
    if (!linkProfile) return toast.error(t("error_enter_user_link"))
    try {
      setLoadingProfile(true)
      const key = EStorageKey.EXTRACTED_UID_FACEBOOK + linkProfile
      // Only trust a cached value that is an actual numeric id (older builds cached error text)
      const uid = await chromeUtils.getStorage<string>(key)
      if (uid && /^\d+$/.test(uid)) {
        setUidProfile(uid)
        return
      }
      if (uid) await chromeUtils.removeStorage(key)

      const res = await getUserID(linkProfile)
      if (res.status !== 200 || typeof res.data !== "string" || !/^\d+$/.test(res.data)) {
        toast.error(
          typeof res.data === "string" && res.data
            ? res.data
            : t("error_uid_not_found") || "Không tìm thấy UID"
        )
        return
      }
      setUidProfile(res.data)
      await chromeUtils.setStorage(key, res.data)
    } catch (error) {
      toast.error(t("error_occurred"))
    } finally {
      setLoadingProfile(false)
    }
  }

  return (
    <PageContainer
      title={t("extract_uid_title")}
      description={t("nav_scan_uid_desc")}
      icon={<Pickaxe size={20} />}
      accent="bm-bg-[#1877F2]/12 bm-text-[#1877F2]">
      <Callout tone="info" compact>
        {t("extract_uid_info")}
      </Callout>

      <Tabs
        defaultActiveKey="group"
        items={[
          {
            key: "group",
            label: t("extract_uid_tab_group"),
            icon: <Users size={14} />,
            content: (
              <Panel title={t("extract_uid_group_title")} description={t("extract_uid_group_desc")}>
                <Field label="Link">
                  <Input
                    prefix={<Link2 size={14} />}
                    value={linkGroup}
                    onChange={(e) => setLinkGroup(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handExportUIDGroup()}
                    id="linkGroup"
                    placeholder={t("extract_uid_group_placeholder")}
                    required
                  />
                </Field>
                <div className="bm-flex bm-justify-end">
                  <Button variant="primary" icon={<ScanSearch size={14} />} onClick={handExportUIDGroup}>
                    {t("scan_now")}
                  </Button>
                </div>
              </Panel>
            )
          },
          {
            key: "post",
            label: t("extract_uid_tab_post"),
            icon: <FileText size={14} />,
            content: (
              <Panel title={t("extract_uid_post_title")} description={t("extract_uid_post_desc")}>
                <Field label="Link">
                  <Input
                    prefix={<Link2 size={14} />}
                    value={linkPost}
                    onChange={(e) => setLinkPost(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handExportUIDPost()}
                    id="linkPost"
                    placeholder={t("extract_uid_post_placeholder")}
                    required
                  />
                </Field>
                <Field label={t("options")}>
                  <div className="bm-flex bm-flex-wrap bm-gap-x-5 bm-gap-y-2 bm-rounded-xl bm-bg-surface-2/60 bm-px-3 bm-py-2.5">
                    <Checkbox
                      checked={postOptions.comment}
                      onChange={(c) => setPostOptions((prev) => ({ ...prev, comment: c }))}
                      label={t("comment")}
                    />
                    <Checkbox
                      checked={postOptions.like}
                      onChange={(c) => setPostOptions((prev) => ({ ...prev, like: c }))}
                      label={t("like")}
                    />
                    <Checkbox
                      checked={postOptions.share}
                      onChange={(c) => setPostOptions((prev) => ({ ...prev, share: c }))}
                      label={t("share")}
                    />
                  </div>
                </Field>
                <div className="bm-flex bm-justify-end">
                  <Button variant="primary" icon={<ScanSearch size={14} />} onClick={handExportUIDPost}>
                    {t("scan_now")}
                  </Button>
                </div>
              </Panel>
            )
          },
          {
            key: "profile",
            label: t("extract_uid_tab_profile"),
            icon: <User size={14} />,
            content: (
              <Panel title={t("extract_uid_profile_title")} description={t("extract_uid_profile_desc")}>
                <Field label="Link">
                  <Input
                    prefix={<Link2 size={14} />}
                    value={linkProfile}
                    onChange={(e) => setLinkProfile(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handExportUIDProfile()}
                    id="linkProfile"
                    placeholder={t("extract_uid_profile_placeholder")}
                    required
                  />
                </Field>
                {uidProfile && (
                  <Field label={t("uid")} className="bm-animate-fade-in">
                    <div className="bm-flex bm-items-center bm-gap-2">
                      <Input value={uidProfile} readOnly mono className="bm-flex-1" />
                      <CopyButton
                        text={uidProfile}
                        variant="primary"
                        size="md"
                        onCopied={() => toast.success(t("copy_success"))}
                      />
                    </div>
                  </Field>
                )}
                <div className="bm-flex bm-justify-end">
                  <Button
                    variant="primary"
                    loading={loadingProfile}
                    icon={<ScanSearch size={14} />}
                    onClick={handExportUIDProfile}>
                    {t("scan_now")}
                  </Button>
                </div>
              </Panel>
            )
          }
        ]}
      />
    </PageContainer>
  )
}

export default ExtractUIDPage
