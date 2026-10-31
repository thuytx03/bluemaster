import { useState } from "react"

import { cn } from "./cn"

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: number
  className?: string
  rounded?: "full" | "xl"
}

const COLORS = [
  "bm-from-indigo-500 bm-to-violet-500",
  "bm-from-sky-500 bm-to-cyan-500",
  "bm-from-emerald-500 bm-to-teal-500",
  "bm-from-amber-500 bm-to-orange-500",
  "bm-from-pink-500 bm-to-rose-500",
  "bm-from-fuchsia-500 bm-to-purple-500"
]

const hash = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

const Avatar = ({ src, name, size = 36, className, rounded = "full" }: AvatarProps) => {
  const [failed, setFailed] = useState(false)
  const initials = (name ?? "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
  const showImg = !!src && !failed
  return (
    <span
      className={cn(
        "bm-relative bm-inline-flex bm-shrink-0 bm-select-none bm-items-center bm-justify-center bm-overflow-hidden bm-bg-gradient-to-br bm-font-semibold bm-text-white bm-ring-1 bm-ring-black/5 dark:bm-ring-white/10",
        rounded === "full" ? "bm-rounded-full" : "bm-rounded-xl",
        !showImg && COLORS[hash(name ?? "") % COLORS.length],
        className
      )}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.38) }}>
      {showImg ? (
        <img
          src={src ?? undefined}
          alt={name ?? ""}
          onError={() => setFailed(true)}
          className="bm-h-full bm-w-full bm-object-cover"
        />
      ) : (
        initials || "?"
      )}
    </span>
  )
}

export default Avatar
