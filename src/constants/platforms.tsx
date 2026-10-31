import { ComponentType, SVGProps } from "react"

import { FacebookIcon } from "src/assets/icons"
import { ESocialProvider } from "src/constants/enum"

export interface IPlatformMeta {
  label: string
  /** Brand SVG icon (full colour) */
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  /** Tailwind classes for a tinted icon tile */
  tile: string
  /** Tailwind gradient classes for hero accents */
  gradient: string
  /** Solid brand colour (hex) */
  color: string
  /** Classes applied to the brand SVG so monochrome logos stay visible in dark mode */
  iconClass?: string
}

export const PLATFORM_META: Record<ESocialProvider, IPlatformMeta> = {
  [ESocialProvider.FACEBOOK]: {
    label: "Facebook",
    Icon: FacebookIcon,
    tile: "bm-bg-[#1877F2]/10 bm-text-[#1877F2]",
    gradient: "bm-from-[#1877F2] bm-to-[#0ea5e9]",
    color: "#1877F2"
  }
}

export const PLATFORM_ORDER: ESocialProvider[] = [ESocialProvider.FACEBOOK]
