import React, { useState } from 'react'
import type { PlasmoCSConfig, PlasmoGetShadowHostId } from "plasmo"
import cssText from "data-text:~style.css"
import { MemoryRouter } from "react-router-dom"
import { StyleProvider } from "@ant-design/cssinjs"
import { theme as AntdTheme, ConfigProvider, Button } from "antd"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from "sonner"
import { Toaster as ToasterHot } from 'react-hot-toast'
import AppRoutes from "../routes/AppRoutes"
import useExtensionState from "../store/extension-state"
import { X } from "lucide-react"
import ToggerTheme from '../modules/shared/components/ToggerTheme'
import SwitchLanguage from '../modules/shared/components/SwitchLanguage'
import FloatingBar from "../modules/extension/components/FloatingBar"
import '../i18n'

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

export const getStyle = (): HTMLStyleElement => {
  const styleElement = document.createElement("style")
  const baseFontSize = 16

  let updatedCssText = cssText.replaceAll(":root", ":host(plasmo-csui)")
  
  // Force the shadow host to have the highest possible z-index
  updatedCssText += `
    :host(plasmo-csui) {
      z-index: 2147483647 !important;
      position: fixed !important;
      top: 0 !important;
      right: 0 !important;
      pointer-events: none !important;
    }
    
    .xthuy-social-root {
      pointer-events: auto !important;
    }
  `

  updatedCssText = updatedCssText.replace(/([\d.]+)rem/g, (_, remValue) => {
    return `${parseFloat(remValue) * baseFontSize}px`
  })

  styleElement.textContent = updatedCssText
  return styleElement
}

export const getShadowHostId: PlasmoGetShadowHostId = () => "xthuy-social-sidebar"

const queryClient = new QueryClient()

const RootContent = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { extensionState: { theme } } = useExtensionState()
  const [container, setContainer] = useState<HTMLElement | null>(null)

  // Top Guard: Ensure our host is always the last child (renders on top of same-z-index elements)
  React.useEffect(() => {
    const host = document.getElementById(getShadowHostId() as string)
    if (!host) return

    const ensureOnTop = () => {
      if (host.parentElement && host.nextElementSibling !== null) {
        host.parentElement.appendChild(host)
      }
    }

    ensureOnTop()
    const observer = new MutationObserver(ensureOnTop)
    observer.observe(document.body, { childList: true })
    
    // Also check on interval as a fallback
    const interval = setInterval(ensureOnTop, 2000)

    return () => {
      observer.disconnect()
      clearInterval(interval)
    }
  }, [])

  return (
    <div ref={setContainer} className="xthuy-social-sidebar-container">
      {container && (
        <QueryClientProvider client={queryClient}>
          <ConfigProvider
            theme={{
              algorithm:
                theme === "light"
                  ? AntdTheme.defaultAlgorithm
                  : AntdTheme.darkAlgorithm,
              token: {
                fontFamily: 'Inter, system-ui, sans-serif'
              }
            }}>
            <StyleProvider container={container.shadowRoot || container} hashPriority="high">
              <div className={`xthuy-social-root ${theme}`}>
                {/* Toggle Button Set */}
                <FloatingBar 
                  isOpen={isOpen} 
                  onOpen={() => setIsOpen(true)} 
                  theme={theme} 
                />

                {/* Sidebar Overlay */}
                {isOpen && (
                   <div 
                      className="fixed inset-0 z-[2147483646] bg-black/20 backdrop-blur-sm transition-opacity"
                      onClick={() => setIsOpen(false)}
                   />
                )}

                {/* Sidebar Container */}
                <div 
                  className={`fixed top-0 right-0 h-full z-[2147483647] transition-all duration-300 shadow-2xl bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 flex flex-col ${isOpen ? 'translate-x-0 w-[400px]' : 'translate-x-full w-0'}`}
                  style={{ maxWidth: '90vw' }}
                >
                  {isOpen && (
                    <div className="flex flex-col h-full overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center justify-between p-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 z-10 shrink-0">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
                             <span className="text-white font-bold text-xs">XT</span>
                          </div>
                          <h2 className="text-base font-bold truncate">
                            Xthuy Social
                          </h2>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <ToggerTheme />
                          <SwitchLanguage />
                          <Button 
                            type="text" 
                            shape="circle"
                            icon={<X size={18} />} 
                            onClick={() => setIsOpen(false)}
                            className="ml-1"
                          />
                        </div>
                      </div>

                      {/* Main Content */}
                      <div className="flex-1 overflow-hidden relative">
                        <MemoryRouter>
                          <AppRoutes />
                        </MemoryRouter>
                      </div>

                      <Toaster position="top-center" expand={false} richColors />
                      <ToasterHot />
                    </div>
                  )}
                </div>
              </div>
            </StyleProvider>
          </ConfigProvider>
        </QueryClientProvider>
      )}
    </div>
  )
}

export default RootContent