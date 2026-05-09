import {
  Alert,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Table,
  TableColumnsType,
  Tag
} from "antd"
import { useMemo } from "react"
import { Link } from "react-router-dom"
import { v4 as uuidv4 } from "uuid"

import { useTranslation } from "react-i18next"
import { ESocialProvider } from "src/constants/enum"
import { APP_ROUTES } from "src/constants/route"
import {
  DOWNLOAD_TYPE_TAG_COLOR,
  PROCESS_STATUS_TAG_COLOR,
  PROCESS_TEXT,
  X_DOWNLOAD_ALL_TYPE
} from "src/constants/variables"
import useDownloadXMedia from "src/modules/x/hooks/useDownloadXMedia"
import {
  IDownloadProcessDetail,
  TProcessStatus,
  TXDownloadAllType
} from "src/modules/shared/types/download-process.interface"
import { IXDownloadAllForm } from "src/modules/shared/types/form.interface"
import useDownloadProcesses from "src/modules/download/store/download-process"
import { isVerifyAccount } from "src/utils/common.util"
import { showErrorToast } from "src/utils/toast.util"


const XDownloadAllForm = () => {
  const { t } = useTranslation()
  const { removeProcess, addProcess, getDownloadProcessBySocial } = useDownloadProcesses()
  const [form] = Form.useForm<IXDownloadAllForm>()
  const { startDownloadAllMedia } = useDownloadXMedia()

  const isWaitUntilCompleted = Form.useWatch("waitUntilCompleted", form)
  const xDownloadProcesses = getDownloadProcessBySocial(ESocialProvider.X)

  const handleSubmit = async (values: IXDownloadAllForm) => {
    try {
      if (!isVerifyAccount(ESocialProvider.X)) {
        throw new Error(t("please_verify_x_before_download") || "Vui lòng xác thực tài khoản X trước khi tải xuống!")
      }
      const processId = uuidv4()
      addProcess(ESocialProvider.X, {
        id: processId,
        username: values.username,
        downloadType: values.type,
        totalDownloadedItems: 0,
        status: "RUNNING"
      })
      if (values.type === "MEDIA") {
        await startDownloadAllMedia(values.username, processId, { ...values })
      }
    } catch (error) {
      showErrorToast((error as Error).message)
    }
  }

  const tableColumns: TableColumnsType<IDownloadProcessDetail<TXDownloadAllType>> = useMemo(
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
        render: (downloadType: TXDownloadAllType) => (
          <Tag color={DOWNLOAD_TYPE_TAG_COLOR[downloadType]}>
            {downloadType}
          </Tag>
        )
      },
      {
        title: t("username_label") || "Username:",
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
        render: (record: IDownloadProcessDetail<TXDownloadAllType>) =>
          record.status === "RUNNING" ? (
            <Button
              type="primary"
              danger
              onClick={() => removeProcess(ESocialProvider.X, record.id)}>
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
            {t("ensure_x_verified") || "Hãy đảm bảo rằng bạn đã xác thực tài khoản X"} (
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
          <Form.Item<IXDownloadAllForm>
            label={t("x_download_type_label") || t("download_type_label") || "Loại tải:"}
            name="type"
            rules={[{ required: true, message: t("please_select_x_download_type") || t("please_select_download_type") || "Vui lòng chọn loại tải!" }]}
            initialValue="MEDIA"
            style={{ flex: 4 }}>
            <Select>
              {X_DOWNLOAD_ALL_TYPE.map((v) => (
                <Select.Option key={v.value} value={v.value}>
                  {t(v.label)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item<IXDownloadAllForm>
            label={t("x_username_label") || t("username_label") || "Username:"}
            name="username"
            rules={[{ required: true, message: t("please_enter_x_username") || t("please_enter_username") || "Vui lòng nhập username!" }]}
            style={{ flex: 8 }}>
            <Input addonBefore="https://x.com/" />
          </Form.Item>
          <Form.Item<IXDownloadAllForm>
            label={t("x_download_process_option") || t("download_process_option") || "Tùy chọn cho tiến trình tải:"}
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
            <Form.Item<IXDownloadAllForm>
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
          <Button type="primary" htmlType="submit">
            {t("download") || "Tải"}
          </Button>
        </Form.Item>
      </Form>
      <Table
        columns={tableColumns}
        dataSource={xDownloadProcesses}
        pagination={{ pageSize: 5 }}
      />
    </div>
  )
}

export default XDownloadAllForm
