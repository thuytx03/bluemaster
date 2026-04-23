import "./style.css"
import './i18n'
import { StyleProvider } from "@ant-design/cssinjs"
import { theme as AntdTheme, ConfigProvider } from "antd"
import { HashRouter } from "react-router-dom"
import { Toaster } from "sonner"
import { Toaster as ToasterHot } from 'react-hot-toast'
import AppRoutes from "src/routes/AppRoutes"
import useExtensionState from "src/store/extension-state"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
const Options = () => {
  const queryClient = new QueryClient()
  const { extensionState: { theme } } = useExtensionState()

  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <ConfigProvider
          theme={{
            algorithm:
              theme === "light"
                ? AntdTheme.defaultAlgorithm
                : AntdTheme.darkAlgorithm
          }}>
          <StyleProvider hashPriority="high">
            <AppRoutes />
            <Toaster />
            <ToasterHot />
          </StyleProvider>
        </ConfigProvider>
      </HashRouter>
    </QueryClientProvider>
  )
}

export default Options
