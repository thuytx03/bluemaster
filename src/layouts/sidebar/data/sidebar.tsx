import React from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import type { MenuProps } from "antd"
import { APP_ROUTES } from "src/constants/route"

// icons
import {
  DownloadIcon,
  FacebookIcon,
  InstagramIcon,
  SettingIcon,
  ThreadsIcon,
  TiktokIcon,
  UserIcon,
  XIcon
} from "src/assets/icons"
import { Braces, Cookie, Pickaxe } from "lucide-react"

type MenuItem = Required<MenuProps>["items"][number]

export const useMenuItems = (): MenuItem[] => {
  const { t } = useTranslation()

  return [
    {
      key: "facebook",
      icon: <FacebookIcon className="size-4" />,
      label: "Facebook",
      children: [
        {
          key: APP_ROUTES.FACEBOOK.ACCESS_TOKEN,
          icon: <Braces className="size-4" />,
          label: <Link to={APP_ROUTES.FACEBOOK.ACCESS_TOKEN}>Access Token</Link>
        },
        {
          key: APP_ROUTES.FACEBOOK.EXTRACT_UID,
          icon: <Pickaxe className="size-4" />,
          label: <Link to={APP_ROUTES.FACEBOOK.EXTRACT_UID}>{t("scan_uid")}</Link>
        },
        {
          key: APP_ROUTES.DOWNLOAD_SEPERATE,
          icon: <DownloadIcon className="size-4" />,
          label: (
            <Link to={APP_ROUTES.DOWNLOAD_SEPERATE}>
              {t("download_individually")}
            </Link>
          )
        },
        {
          key: APP_ROUTES.DOWNLOAD_ALL.FACEBOOK,
          icon: <DownloadIcon className="size-4" />,
          label: (
            <Link to={APP_ROUTES.DOWNLOAD_ALL.FACEBOOK}>
              {t("batch_download")}
            </Link>
          )
        }
      ]
    },
    {
      key: "instagram",
      icon: <InstagramIcon className="size-4" />,
      label: "Instagram",
      children: [
        {
          key: APP_ROUTES.DOWNLOAD_SEPERATE,
          icon: <DownloadIcon className="size-4" />,
          label: (
            <Link to={APP_ROUTES.DOWNLOAD_SEPERATE}>
              {t("download_individually")}
            </Link>
          )
        },
        {
          key: APP_ROUTES.DOWNLOAD_ALL.INSTAGRAM,
          icon: <DownloadIcon className="size-4" />,
          label: (
            <Link to={APP_ROUTES.DOWNLOAD_ALL.INSTAGRAM}>
              {t("batch_download")}
            </Link>
          )
        }
      ]
    },
    {
      key: "threads",
      icon: <ThreadsIcon className="size-4" />,
      label: "Threads",
      children: [
        {
          key: APP_ROUTES.DOWNLOAD_SEPERATE,
          icon: <DownloadIcon className="size-4" />,
          label: (
            <Link to={APP_ROUTES.DOWNLOAD_SEPERATE}>
              {t("download_individually")}
            </Link>
          )
        },
        {
          key: APP_ROUTES.DOWNLOAD_ALL.THREADS,
          icon: <DownloadIcon className="size-4" />,
          label: (
            <Link to={APP_ROUTES.DOWNLOAD_ALL.THREADS}>
              {t("batch_download")}
            </Link>
          )
        }
      ]
    },
    {
      key: "x",
      icon: <XIcon className="size-4" />,
      label: "X",
      children: [
        {
          key: APP_ROUTES.DOWNLOAD_SEPERATE,
          icon: <DownloadIcon className="size-4" />,
          label: (
            <Link to={APP_ROUTES.DOWNLOAD_SEPERATE}>
              {t("download_individually")}
            </Link>
          )
        },
        {
          key: APP_ROUTES.DOWNLOAD_ALL.X,
          icon: <DownloadIcon className="size-4" />,
          label: (
            <Link to={APP_ROUTES.DOWNLOAD_ALL.X}>
              {t("batch_download")}
            </Link>
          )
        }
      ]
    },
    {
      key: APP_ROUTES.COOKIES,
      icon: <Cookie className="size-4" />,
      label: <Link to={APP_ROUTES.COOKIES}>Cookies</Link>
    },
    {
      key: APP_ROUTES.ACCOUNTS,
      icon: <UserIcon className="size-4" />,
      label: <Link to={APP_ROUTES.ACCOUNTS}>{t("accounts")}</Link>
    },
    {
      key: APP_ROUTES.SETTINGS,
      icon: <SettingIcon className="size-4" />,
      label: <Link to={APP_ROUTES.SETTINGS}>{t("settings")}</Link>
    }
  ]
}
