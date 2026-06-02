import React, { useEffect, useState } from 'react'
import type { PlasmoCSConfig, PlasmoGetShadowHostId } from "plasmo"
import cssText from "data-text:~style.css"
import sonnerStyles from "data-text:sonner/dist/styles.css"
import { MemoryRouter, useNavigate } from "react-router-dom"
import { StyleProvider } from "@ant-design/cssinjs"
import { theme as AntdTheme, ConfigProvider, App } from "antd"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from "sonner"
import AppRoutes from "../routes/AppRoutes"
import useExtensionState from "../store/extension-state"
import FloatingBar from "../modules/extension/components/FloatingBar"
import '../i18n'
import { NavMenu } from "./components/Sidebar/NavMenu"
import { SidebarHeader } from "./components/Sidebar/SidebarHeader"
import Footer from "../modules/shared/layouts/Footer"
import ErrorBoundary from "../modules/shared/components/ErrorBoundary"
import { chromeUtils } from "../utils/chrome.util"
import { EStorageKey } from "../constants/enum"
import { APP_ROUTES } from "../constants/route"

const AutoNavToScraper = () => {
    const navigate = useNavigate()
    useEffect(() => {
        chromeUtils.getStorage<any>(EStorageKey.FB_SCRAPER_DATA).then((data) => {
            if (data?.active) {
                navigate(APP_ROUTES.FACEBOOK.EXPORT_UID)
            }
        })
    }, [])
    return null
}

export const config: PlasmoCSConfig = {
    //   matches: ["<all_urls>"]
    matches: ["https://www.facebook.com/*"]
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
      width: 0 !important;
      height: 0 !important;
      overflow: visible !important;
      pointer-events: none !important;
    }
    
    .xthuy-social-sidebar-container,
    .xthuy-social-root {
      position: absolute !important;
      top: 0 !important;
      right: 0 !important;
      pointer-events: auto !important;
    }
  `

    updatedCssText = updatedCssText.replace(/([\d.]+)rem/g, (_, remValue) => {
        return `${parseFloat(remValue) * baseFontSize}px`
    })

    updatedCssText += `
    ${sonnerStyles}
    
    /* Ensure sonner toasts are visible in shadow dom */
    [data-sonner-toaster] {
      position: fixed !important;
      z-index: 2147483647 !important;
    }
    `

    styleElement.textContent = updatedCssText
    return styleElement
}

export const getShadowHostId: PlasmoGetShadowHostId = () => "xthuy-social-sidebar"

const queryClient = new QueryClient()

// console.log("[Xthuy Debug] Component check:", {
//     FloatingBar: typeof FloatingBar,
//     NavMenu: typeof NavMenu,
//     SidebarHeader: typeof SidebarHeader,
//     Footer: typeof Footer,
//     AppRoutes: typeof AppRoutes,
//     Toaster: typeof Toaster,
//     ErrorBoundary: typeof ErrorBoundary,
//     MemoryRouter: typeof MemoryRouter,
//     StyleProvider: typeof StyleProvider,
//     ConfigProvider: typeof ConfigProvider,
//     App: typeof App,
//     QueryClientProvider: typeof QueryClientProvider,
// })

const RootContent = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [width, setWidth] = useState(450)
    const [isResizing, setIsResizing] = useState(false)
    const [layoutMode, setLayoutMode] = useState<'overlay' | 'push'>('overlay')
    const { extensionState: { theme } } = useExtensionState()
    const [container, setContainer] = useState<HTMLElement | null>(null)

    React.useEffect(() => {
        console.log("Xthuy Social Content Script Mounted")
    }, [])

    // Handle resizing
    const startResizing = React.useCallback((e: React.MouseEvent) => {
        setIsResizing(true)
        e.preventDefault()
    }, [])

    const stopResizing = React.useCallback(() => {
        setIsResizing(false)
    }, [])

    const resize = React.useCallback((e: MouseEvent) => {
        if (isResizing) {
            const newWidth = window.innerWidth - e.clientX - 72 // Account for NavMenu width
            const maxWidth = window.innerWidth - 100
            if (newWidth > 300 && newWidth < maxWidth) {
                setWidth(newWidth)
            }
        }
    }, [isResizing])

    React.useEffect(() => {
        const fullWidth = width + 72
        // While resizing, always behave like 'overlay' for smooth performance
        if (isOpen && layoutMode === 'push' && !isResizing) {
            document.documentElement.style.transition = 'margin-right 0.3s ease-in-out, width 0.3s ease-in-out'
            document.documentElement.style.marginRight = `${fullWidth}px`
            document.documentElement.style.width = `calc(100% - ${fullWidth}px)`
            document.documentElement.style.position = 'relative'
        } else {
            // When resizing starts, the website returns to full width (overlay behavior)
            document.documentElement.style.transition = 'margin-right 0.3s ease-in-out, width 0.3s ease-in-out'
            document.documentElement.style.marginRight = '0'
            document.documentElement.style.width = '100%'
        }

        return () => {
            document.documentElement.style.marginRight = '0'
            document.documentElement.style.width = '100%'
        }
    }, [isOpen, layoutMode, width, isResizing])

    React.useEffect(() => {
        window.addEventListener('mousemove', resize)
        window.addEventListener('mouseup', stopResizing)
        return () => {
            window.removeEventListener('mousemove', resize)
            window.removeEventListener('mouseup', stopResizing)
        }
    }, [resize])

    // Top Guard: Ensure our host is always the last child
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

        const interval = setInterval(ensureOnTop, 2000)

        return () => {
            observer.disconnect()
            clearInterval(interval)
        }
    }, [])

    const popupRef = React.useRef<HTMLDivElement>(null)

    return (
        <div ref={setContainer} className="xthuy-social-sidebar-container">
            {container && (
                <ErrorBoundary name="Root">
                    <QueryClientProvider client={queryClient}>
                        <StyleProvider container={container.shadowRoot || container} hashPriority="high">
                            <ConfigProvider
                                theme={{
                                    algorithm:
                                        theme === "light"
                                            ? AntdTheme.defaultAlgorithm
                                            : AntdTheme.darkAlgorithm,
                                    token: {
                                        fontFamily: 'Inter, system-ui, sans-serif'
                                    }
                                }}
                                getPopupContainer={() => popupRef.current || container}
                            >
                                <App>
                                    <MemoryRouter>
                                        <AutoNavToScraper />
                                        <div
                                            className={`xthuy-social-root ${isResizing ? 'select-none' : ''}`}
                                            data-xthuy-theme={theme || 'light'}
                                        >
                                            {/* Toggle Button Set */}
                                            <ErrorBoundary name="FloatingBar">
                                                <FloatingBar
                                                    isOpen={isOpen}
                                                    onOpen={() => setIsOpen(true)}
                                                    theme={theme}
                                                />
                                            </ErrorBoundary>

                                            {/* Main Layout Container */}
                                            <div
                                                ref={popupRef}
                                                className={`fixed top-0 right-0 h-full z-[2147483647] flex transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                                                style={{ width: `${width + 72}px`, pointerEvents: 'auto' }}
                                            >
                                                {/* Resize Handle */}
                                                {isOpen && (
                                                    <div
                                                        onMouseDown={startResizing}
                                                        className={`w-1 h-full cursor-col-resize hover:bg-primary/50 transition-colors shrink-0 z-10 ${isResizing ? 'bg-primary' : ''}`}
                                                    />
                                                )}

                                                <div className="flex w-full h-full shadow-2xl bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800">
                                                    {/* Content Area (Left) */}
                                                    <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 border-r border-zinc-100 dark:border-zinc-900">
                                                        <ErrorBoundary name="SidebarHeader">
                                                            <SidebarHeader />
                                                        </ErrorBoundary>

                                                        {/* Main Content Area */}
                                                        <div className="flex-1 overflow-hidden relative bg-zinc-50/30 dark:bg-zinc-900/10">
                                                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.05),transparent_40%)] pointer-events-none" />
                                                            <ErrorBoundary name="AppRoutes">
                                                                <AppRoutes />
                                                            </ErrorBoundary>
                                                        </div>
                                                        <ErrorBoundary name="Footer">
                                                            <Footer />
                                                        </ErrorBoundary>
                                                    </div>

                                                    <ErrorBoundary name="NavMenu">
                                                        <NavMenu
                                                            theme={theme}
                                                            onOpen={() => setIsOpen(true)}
                                                            setIsOpen={setIsOpen}
                                                            layoutMode={layoutMode}
                                                            setLayoutMode={setLayoutMode}
                                                        />
                                                    </ErrorBoundary>
                                                </div>
                                            </div>
                                        </div>
                                        <Toaster position="top-center" expand={false} richColors />
                                    </MemoryRouter>
                                </App>
                            </ConfigProvider>
                        </StyleProvider>
                    </QueryClientProvider>
                </ErrorBoundary>
            )}
        </div>
    )
}

export default RootContent