import { Typography } from "antd"
import { Link } from "react-router-dom"
import { EXTENSION_INFO } from "src/constants"
import { useTranslation, Trans } from "react-i18next"

const Footer = () => {
  const { t } = useTranslation()
  const year = new Date().getFullYear()
  return (
    <div className="flex gap-2 mx-auto items-center justify-center">
      <Typography>
        <div className=" pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
          <div className="text-gray-500 text-sm">
            {t("footer_copyright", { year, author: EXTENSION_INFO.author })} - v{EXTENSION_INFO.version}
          </div>
          {/* <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 ">
            <Trans i18nKey="footer_thank"
              components={{
                chatgpt: <Link to="https://chatgpt.com/" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors" />,
                plasmo: <Link to="https://www.plasmo.com/" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors" />,
                reactjs: <Link to="https://react.dev/" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors" />,
                antdesign: <Link to="https://ant.design/" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors" />,
                tailwindcss: <Link to="https://tailwindcss.com/" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors" />
              }}
            />
          </div> */}
        </div>
      </Typography>
    </div>
  )
}

export default Footer
