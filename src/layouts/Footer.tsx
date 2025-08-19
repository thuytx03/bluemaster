import { Typography } from "antd"
import { Link } from "react-router-dom"
import { EXTENSION_INFO } from "src/constants"

const Footer = () => {
  return (
    <div className="flex gap-2 mx-auto items-center justify-center">
      <Typography>
        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800 text-center">
          <div className="text-gray-500 text-sm">Copyright © 2024 — {new Date().getFullYear()} phát triển bởi
            <Link className="text-blue-500 pl-1" to={'#'}>{EXTENSION_INFO.author}</Link>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 ">
            Cảm ơn{' '}
            <Link
              to="https://chatgpt.com/"
              className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors"
            >
              ChatGPT
            </Link>,{' '}
            <Link
              to="https://www.plasmo.com/"
              className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors"
            >
              Plasmo
            </Link>,{' '}
            <Link
              to="https://react.dev/"
              className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors"
            >
              ReactJS
            </Link>,{' '}
            <Link
              to="https://ant.design/"
              className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors"
            >
              Ant Design
            </Link>,{' '}
            <Link
              to="https://tailwindcss.com/"
              className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors"
            >
              TailwindCSS
            </Link>{' '}
            đã hỗ trợ mình trong quá trình xây dựng extension này.
          </div>
        </div>
      </Typography>

    </div>
  )
}

export default Footer
