import {
  DownloadIcon,
  FacebookIcon,
  InstagramIcon,
  SettingIcon,
  ThreadsIcon,
  UserIcon,
  XIcon
} from "src/assets/icons"
import { MenuProps } from "antd"
import { Link } from "react-router-dom"
import { APP_ROUTES } from "src/constants/route"
import { Braces, Cookie, Pickaxe } from "lucide-react"
type MenuItem = Required<MenuProps>["items"][number]

export const menuItems: MenuItem[] = [
  {
    key: "facebook",
    icon: <FacebookIcon className="size-4" />,
    label: "Facebook",
    children: [
      {
        key: APP_ROUTES.FACEBOOK.ACCESS_TOKEN,
        icon: <Braces  className="size-4" />,
        label: <Link to={APP_ROUTES.FACEBOOK.ACCESS_TOKEN}>Access Token</Link>
      },
      {
        key: APP_ROUTES.FACEBOOK.COOKIE,
        icon: <Cookie className="size-4" />,
        label: <Link to={APP_ROUTES.FACEBOOK.COOKIE}>Cookies</Link>
      },
      {
        key: APP_ROUTES.FACEBOOK.EXTRACT_UID,
        icon: <Pickaxe className="size-4" />,
        label: <Link to={APP_ROUTES.FACEBOOK.EXTRACT_UID}>Quét UID</Link>
      },
      {
        key: APP_ROUTES.DOWNLOAD_SEPERATE,
        icon: <DownloadIcon className="size-4" />,
        label: <Link to={APP_ROUTES.DOWNLOAD_SEPERATE}>Tải riêng lẻ</Link>
      },
      {
        key: APP_ROUTES.DOWNLOAD_ALL.FACEBOOK,
        icon: <DownloadIcon className="size-4" />,
        label: <Link to={APP_ROUTES.DOWNLOAD_ALL.FACEBOOK}>Tải hàng loạt</Link>
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
        label: <Link to={APP_ROUTES.DOWNLOAD_SEPERATE}>Tải riêng lẻ</Link>
      },
      {
        key: APP_ROUTES.DOWNLOAD_ALL.INSTAGRAM,
        icon: <DownloadIcon className="size-4" />,
        label: <Link to={APP_ROUTES.DOWNLOAD_ALL.INSTAGRAM}>Tải hàng loạt</Link>
      },
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
        label: <Link to={APP_ROUTES.DOWNLOAD_SEPERATE}>Tải riêng lẻ</Link>
      },
      {
        key: APP_ROUTES.DOWNLOAD_ALL.THREADS,
        icon: <DownloadIcon className="size-4" />,
        label: <Link to={APP_ROUTES.DOWNLOAD_ALL.THREADS}>Tải hàng loạt</Link>
      },

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
        label: <Link to={APP_ROUTES.DOWNLOAD_SEPERATE}>Tải riêng lẻ</Link>
      },
      {
        key: APP_ROUTES.DOWNLOAD_ALL.X,
        icon: <DownloadIcon className="size-4" />,
        label: <Link to={APP_ROUTES.DOWNLOAD_ALL.X}>Tải hàng loạt</Link>
      },

    ]
  },
  {
    key: APP_ROUTES.ACCOUNTS, // Đặt key là pathname của trang tài khoản
    icon: <UserIcon className="size-4" />,
    label: <Link to={APP_ROUTES.ACCOUNTS}>Tài Khoản</Link>
  },
  {
    key: APP_ROUTES.SETTINGS,
    icon: <SettingIcon className="size-4" />,
    label: <Link to={APP_ROUTES.SETTINGS}>Cài đặt</Link>
  }
]
