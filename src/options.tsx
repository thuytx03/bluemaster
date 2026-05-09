import React from "react"
import "./style.css"

const Options = () => {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 text-center">
      <div className="max-w-md space-y-6">
        <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-primary/20">
          <span className="text-white font-bold text-3xl">XT</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
          Xthuy Social
        </h1>
        <p className="text-xl text-zinc-600 dark:text-zinc-400">
          Extension hiện đã được chuyển sang giao diện Sidebar trên tất cả các trang web.
        </p>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-left">
          <p className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">Cách sử dụng:</p>
          <ul className="list-disc list-inside space-y-2 text-zinc-600 dark:text-zinc-400">
            <li>Truy cập bất kỳ trang web nào (Facebook, Google,...)</li>
            <li>Tìm nút <span className="text-primary font-bold">XT</span> ở góc dưới bên phải màn hình.</li>
            <li>Nhấp vào nút để mở Sidebar và sử dụng các tính năng.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Options
