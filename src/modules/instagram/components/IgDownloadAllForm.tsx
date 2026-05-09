import {
  Alert,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Table,
  Tag,
  type TableColumnsType
} from "antd"
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { v4 as uuidv4 } from "uuid"

import { useTranslation } from "react-i18next"
import { ESocialProvider } from "src/constants/enum"
import { APP_ROUTES } from "src/constants/route"
import {
  DOWNLOAD_TYPE_TAG_COLOR,
  IG_DOWNLOAD_ALL_TYPE,
  PROCESS_STATUS_TAG_COLOR,
  PROCESS_TEXT
} from "src/constants/variables"
import useDownloadIgActiveStories from "src/modules/instagram/hooks/useDownloadIgActiveStories"
import useDownloadIgHighlight from "src/modules/instagram/hooks/useDownloadIgHighlight"
import useDownloadIgPost from "src/modules/instagram/hooks/useDownloadIgPost"
import useDownloadIgReel from "src/modules/instagram/hooks/useDownloadIgReel"
import {
  IDownloadProcessDetail,
  TIgDownloadAllType,
  TProcessStatus
} from "src/modules/shared/types/download-process.interface"
import { IIgDownloadAllForm } from "src/modules/shared/types/form.interface"
import instagramService from "src/modules/instagram/services/instagram.service"
import useDownloadProcess from "src/modules/download/store/download-process"
import { isVerifyAccount } from "src/utils/common.util"
import { showErrorToast } from "src/utils/toast.util"

const IgDownloadAllForm = () => {
  const { t } = useTranslation()
  const { getDownloadProcessBySocial, removeProcess, addProcess } = useDownloadProcess()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form] = Form.useForm<IIgDownloadAllForm>()
  const downloadType = Form.useWatch("type", form)
  const { startDownloadAllPosts } = useDownloadIgPost()
  const { startDownloadAllReels } = useDownloadIgReel()
  const { startDownloadAllHightlights } = useDownloadIgHighlight()
  const { downloadActiveStories } = useDownloadIgActiveStories()

  const isWaitUntilCompleted = Form.useWatch("waitUntilCompleted", form)
  const igDownloadProcesses = getDownloadProcessBySocial(ESocialProvider.INSTAGRAM)

  const handleSubmit = async (values: IIgDownloadAllForm) => {
    try {
      setIsSubmitting(true)
      if (!isVerifyAccount(ESocialProvider.INSTAGRAM)) {
        throw new Error(t("please_verify_instagram_before_download") || "Vui lòng xác thực tài khoản Instagram trước khi tải xuống!")
      }
      await instagramService.getInstagramIdAndAvatarByUsername(values.username)
      setIsSubmitting(false)
      const processId = uuidv4()
      addProcess(ESocialProvider.INSTAGRAM, {
        id: processId,
        username: values.username,
        downloadType: values.type,
        totalDownloadedItems: 0,
        status: "RUNNING"
      })
      if (values.type === "POST") {
        await startDownloadAllPosts(values.username, processId, { ...values })
      }
      if (values.type === "REEL") {
        await startDownloadAllReels(values.username, processId, { ...values })
      }
      if (values.type === "HIGHLIGHT") {
        await startDownloadAllHightlights(values.username, processId, { ...values })
      }
      if (values.type === "STORY") {
        await downloadActiveStories(values.username, processId)
      }
    } catch (error) {
      showErrorToast((error as Error).message)
      setIsSubmitting(false)
    }
  }

  const tableColumns: TableColumnsType<IDownloadProcessDetail<TIgDownloadAllType>> = useMemo(
    () => [
      {
        title: t("ordinal_number") || "STT",
        dataIndex: "ordinalNumber",
        key: "ordinalNumber",
        width: 70,
        render: (_, __, index) => index + 1
      },
      {
        title: t("download_type") || "Loại tải",
        dataIndex: "downloadType",
        key: "downloadType",
        render: (downloadType: TIgDownloadAllType) => (
          <Tag color={DOWNLOAD_TYPE_TAG_COLOR[downloadType]}>
            {downloadType}
          </Tag>
        )
      },
      {
        title: t("username") || "Username",
        dataIndex: "username",
        key: "username",
        render: (username: string) => (
          <p className="font-bold text-blue-700">{username}</p>
        )
      },
      {
        title: t("downloaded_count") || "Số lượng đã tải",
        dataIndex: "totalDownloadedItems",
        key: "totalDownloadedItems"
      },
      {
        title: t("status") || "Trạng thái",
        dataIndex: "status",
        key: "status",
        render: (status: TProcessStatus) => (
          <Tag color={PROCESS_STATUS_TAG_COLOR[status]}>
            {PROCESS_TEXT[status]}
          </Tag>
        )
      },
      {
        title: t("action") || "Hành động",
        key: "action",
        render: (record: IDownloadProcessDetail<TIgDownloadAllType>) =>
          record.status === "RUNNING" ? (
            <Button
              type="primary"
              danger
              onClick={() => removeProcess(ESocialProvider.INSTAGRAM, record.id)}>
              {t("cancel") || "Hủy"}
            </Button>
          ) : null
      }
    ],
    [t]
  )

  return (
    <div>
      <Alert
        className="mb-3"
        message={
          <div>
            {t("ensure_instagram_verified") || "Hãy đảm bảo rằng bạn đã xác thực tài khoản Instagram"} (
            <span>
              <Link to={APP_ROUTES.ACCOUNTS}>{t("here") || "tại đây"}</Link>
            </span>
            ) {t("before_using_features") || "trước khi sử dụng các tính năng dưới đây!"}
          </div>
        }
        type="warning"
        showIcon
        closable
      />
      <Form
        form={form}
        name="basic"
        autoComplete="off"
        onFinish={handleSubmit}
        layout="vertical"
        labelAlign="left">
        <div className="flex gap-3 items-center">
          <Form.Item<IIgDownloadAllForm>
            label={t("download_type_label") || "Loại tải:"}
            name="type"
            rules={[{
              required: true,
              message: t("please_select_download_type") || "Vui lòng chọn loại tải!"
            }]}
            style={{ flex: 4 }}>
            <Select>
              {IG_DOWNLOAD_ALL_TYPE.map((v) => (
                <Select.Option key={v.value} value={v.value}>
                  {t(v.label)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item<IIgDownloadAllForm>
            label={t("username_label") || "Username:"}
            name="username"
            rules={[{ required: true, message: t("please_enter_username") || "Vui lòng nhập username!" }]}
            style={{ flex: 4 }}>
            <Input />
          </Form.Item>
        </div>
        <div className="flex gap-3 items-center">
          {downloadType === "POST" || downloadType === "HIGHLIGHT" ? (
            <Form.Item<IIgDownloadAllForm>
              label={t("download_option_label") || "Tùy chọn tải xuống:"}
              name="isMergeIntoOneFolder"
              initialValue={false}
              style={{ flex: 8 }}>
              <Select>
                <Select.Option value={false}>
                  {downloadType === "POST"
                    ? t("separate_post_folder") || "Tạo riêng thư mục cho từng bài viết"
                    : t("separate_highlight_folder") || "Tạo riêng thư mục cho từng hightlight"}
                </Select.Option>
                <Select.Option value={true}>
                  {t("merge_folder") || "Gộp ảnh và video vào chung một thư mục"}
                </Select.Option>
              </Select>
            </Form.Item>
          ) : null}
          <Form.Item<IIgDownloadAllForm>
            label={t("download_process_option") || "Tùy chọn cho tiến trình tải:"}
            name="waitUntilCompleted"
            initialValue={true}
            style={{ flex: 8 }}>
            <Select>
              <Select.Option value={true}>
                {t("wait_until_previous_complete") || "Chờ đợi cho đến khi lượt tải xuống trước đó hoàn thành"}
              </Select.Option>
              <Select.Option value={false}>
                {t("set_delay_between_downloads") || "Thiết lập thời gian delay giữa các lần tải"}
              </Select.Option>
            </Select>
          </Form.Item>
          {!isWaitUntilCompleted ? (
            <Form.Item<IIgDownloadAllForm>
              label={t("delay_time_label") || "Thời gian delay:"}
              name="delayTimeInSecond"
              initialValue={0}
              style={{ flex: 3 }}>
              <InputNumber
                min={0}
                addonAfter={t("seconds") || "giây"}
                style={{ width: "100%" }}
              />
            </Form.Item>
          ) : null}
        </div>

        <Form.Item wrapperCol={{ span: 24 }}>
          <Button type="primary" htmlType="submit" loading={isSubmitting}>
            {t("download") || "Tải"}
          </Button>
        </Form.Item>
      </Form>
      <Table
        columns={tableColumns}
        dataSource={igDownloadProcesses}
        pagination={{ pageSize: 5 }}
      />
    </div>
  )
}

export default IgDownloadAllForm
