import { ArrowRight, Download, Inbox, KeyRound, MousePointerClick, Pickaxe } from "lucide-react"
import React from "react"

import "./style.css"

import iconUrl from "url:assets/icon.png"

import { EXTENSION_INFO } from "src/constants"

const STEPS = [
  { title: "Mở Facebook", desc: "Truy cập facebook.com trên trình duyệt." },
  { title: "Tìm nút nổi", desc: "Nút Bluemaster ở mép phải màn hình, phía dưới." },
  { title: "Mở bảng công cụ", desc: "Nhấp vào nút để mở sidebar và dùng các tính năng." }
]

const FEATURES = [
  { icon: <Download size={16} />, label: "Tải media hàng loạt" },
  { icon: <Pickaxe size={16} />, label: "Quét UID nhóm / bài viết" },
  { icon: <Inbox size={16} />, label: "Auto inbox khách hàng" },
  { icon: <KeyRound size={16} />, label: "Lấy Access Token & Cookies" }
]

const Options = () => {
  return (
    <div className="bluemaster-root bm-min-h-screen bm-w-full bm-bg-app bm-text-fg x-dots">
      <div className="bm-mx-auto bm-flex bm-min-h-screen bm-max-w-2xl bm-flex-col bm-items-center bm-justify-center bm-gap-8 bm-px-6 bm-py-12">
        <div className="bm-flex bm-flex-col bm-items-center bm-text-center">
          <span className="bm-inline-flex bm-h-20 bm-w-20 bm-items-center bm-justify-center bm-rounded-3xl x-gradient bm-p-[3px] bm-shadow-glow">
            <span className="bm-inline-flex bm-h-full bm-w-full bm-items-center bm-justify-center bm-overflow-hidden bm-rounded-lg bm-bg-surface">
              <img src={iconUrl} alt="logo" className="bm-h-12 bm-w-12 bm-object-contain" />
            </span>
          </span>
          <h1 className="bm-mt-5 bm-text-4xl bm-font-extrabold bm-tracking-tight">
            <span className="x-gradient-text">{EXTENSION_INFO.displayName}</span>
          </h1>
          <p className="bm-mt-2 bm-max-w-md bm-text-[15px] bm-leading-relaxed bm-text-fg-muted">
            Extension hoạt động dưới dạng sidebar ngay trên Facebook. Không cần mở trang này — hãy
            mở facebook.com và dùng nút nổi ở góc phải.
          </p>
          <span className="bm-mt-3 bm-inline-flex bm-h-6 bm-items-center bm-rounded-lg bm-bg-surface-2 bm-px-2.5 bm-font-mono bm-text-[12px] bm-font-medium bm-text-fg-muted">
            v{EXTENSION_INFO.version}
          </span>
        </div>

        <div className="bm-grid bm-w-full bm-gap-4 sm:bm-grid-cols-[1.2fr_1fr]">
          <div className="bm-rounded-xl3 bm-border bm-border-line bm-bg-surface bm-p-5 bm-shadow-card">
            <div className="bm-mb-4 bm-flex bm-items-center bm-gap-2 bm-text-[13px] bm-font-semibold">
              <MousePointerClick size={16} className="bm-text-brand-ink" /> Cách sử dụng
            </div>
            <ol className="bm-flex bm-flex-col bm-gap-3">
              {STEPS.map((s, i) => (
                <li key={i} className="bm-flex bm-items-start bm-gap-3">
                  <span className="bm-inline-flex bm-h-7 bm-w-7 bm-shrink-0 bm-items-center bm-justify-center bm-rounded-full bm-bg-brand bm-text-[12px] bm-font-bold bm-text-brand-fg">
                    {i + 1}
                  </span>
                  <span>
                    <span className="bm-block bm-text-[14px] bm-font-semibold">{s.title}</span>
                    <span className="bm-block bm-text-[12.5px] bm-text-fg-muted">{s.desc}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="bm-rounded-xl3 bm-border bm-border-line bm-bg-surface bm-p-5 bm-shadow-card">
            <div className="bm-mb-4 bm-text-[13px] bm-font-semibold">Tính năng</div>
            <ul className="bm-flex bm-flex-col bm-gap-2">
              {FEATURES.map((f, i) => (
                <li key={i} className="bm-flex bm-items-center bm-gap-2.5 bm-rounded-xl bm-bg-surface-2/70 bm-px-3 bm-py-2 bm-text-[13px]">
                  <span className="bm-inline-flex bm-h-7 bm-w-7 bm-items-center bm-justify-center bm-rounded-lg bm-bg-brand-soft bm-text-brand-ink">
                    {f.icon}
                  </span>
                  {f.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <a
          href="https://www.facebook.com/"
          className="bm-inline-flex bm-h-11 bm-items-center bm-gap-2 bm-rounded-xl bm-bg-brand bm-px-5 bm-text-[14px] bm-font-semibold bm-text-brand-fg bm-shadow-glow bm-transition-colors hover:bm-bg-brand-hover hover:bm-no-underline">
          Mở Facebook <ArrowRight size={16} />
        </a>
      </div>
    </div>
  )
}

export default Options
