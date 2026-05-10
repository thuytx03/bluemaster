import React, { useState } from 'react'
import type { PlasmoCSConfig, PlasmoGetShadowHostId } from "plasmo"
import cssText from "data-text:~style.css"
import sonnerStyles from "data-text:sonner/dist/styles.css"
import { MemoryRouter, useNavigate, useLocation } from "react-router-dom"
import { StyleProvider } from "@ant-design/cssinjs"
import { theme as AntdTheme, ConfigProvider, Button, Tooltip, Popover, App } from "antd"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from "sonner"
import AppRoutes from "../routes/AppRoutes"
import useExtensionState from "../store/extension-state"
import { X, BookOpen, Languages, Radio, HelpCircle, Layout, Columns, Maximize2, ChevronRight } from "lucide-react"
import ToggerTheme from '../modules/shared/components/ToggerTheme'
import SwitchLanguage from '../modules/shared/components/SwitchLanguage'
import FloatingBar from "../modules/extension/components/FloatingBar"
import { useMenuItems } from '../modules/shared/layouts/sidebar/data/sidebar'
import { TypeAnimation } from 'react-type-animation'
import { EXTENSION_INFO } from 'src/constants'
import iconUrl from "url:assets/icon.png"
import '../i18n'

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

const NavMenu = ({ theme, onOpen, setIsOpen, layoutMode, setLayoutMode }: {
    theme: string,
    onOpen: () => void,
    setIsOpen: (v: boolean) => void,
    layoutMode: 'overlay' | 'push',
    setLayoutMode: (m: 'overlay' | 'push') => void
}) => {
    const menuItems = useMenuItems()
    const navigate = useNavigate()
    const location = useLocation()

    // Helper to render a menu item in the new style
    const NavItem = ({ item, isActive, onClick }: { item: any, isActive: boolean, onClick?: () => void }) => (
        <div
            onClick={onClick}
            className="group flex flex-col items-center gap-0.5 cursor-pointer w-full py-0.5"
        >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 
                ${isActive ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400 group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800/50 group-hover:text-zinc-900 dark:group-hover:text-white'}`}
            >
                <div className="transition-transform duration-200 group-hover:scale-105 flex items-center justify-center scale-90">
                    {item.icon}
                </div>
                {item.isNew && (
                    <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-red-500 text-white text-[7px] font-bold px-1 rounded-sm shadow-sm border border-white dark:border-zinc-900">
                        New
                    </div>
                )}
            </div>
            <span className={`text-[9px] font-medium transition-colors text-center px-1 leading-tight ${isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white'}`}>
                {item.labelString || (typeof item.label === 'string' ? item.label : item.label.props?.children)}
            </span>
        </div>
    )

    return (
        <div className="w-[72px] h-full flex flex-col items-center bg-[#fafafa] dark:bg-zinc-950 shrink-0 border-l border-zinc-200 dark:border-zinc-800 shadow-[-1px_0_10px_rgba(0,0,0,0.02)]">
            {/* Top Header Icons */}
            <div className="w-full flex flex-col items-center gap-2 py-4 mb-2">
                <div className="flex items-center justify-center gap-1.5 mb-2">
                    <Tooltip title="Overlay Mode">
                        <Button
                            type={layoutMode === 'overlay' ? 'primary' : 'text'}
                            shape="circle"
                            size="small"
                            icon={<Layout size={14} />}
                            onClick={() => setLayoutMode('overlay')}
                            className={layoutMode === 'overlay' ? 'bg-primary' : 'text-zinc-400'}
                        />
                    </Tooltip>
                    <Tooltip title="Push Mode">
                        <Button
                            type={layoutMode === 'push' ? 'primary' : 'text'}
                            shape="circle"
                            size="small"
                            icon={<Columns size={14} />}
                            onClick={() => setLayoutMode('push')}
                            className={layoutMode === 'push' ? 'bg-primary' : 'text-zinc-400'}
                        />
                    </Tooltip>
                </div>

                <div className="w-full flex items-center justify-center gap-2 px-2">
                    <Button
                        type="text"
                        shape="circle"
                        size="small"
                        icon={<Maximize2 size={14} />}
                        onClick={onOpen}
                        className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    />
                    <Button
                        type="text"
                        shape="circle"
                        size="small"
                        icon={<X size={14} />}
                        onClick={() => setIsOpen(false)}
                        className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    />
                </div>
            </div>

            {/* Main Navigation Scroll Area */}
            <div className="flex-1 w-full overflow-y-auto no-scrollbar flex flex-col items-center gap-2.5 px-1">
                {menuItems.map((item: any) => {
                    const isActive = location.pathname === item.key || (item.children && item.children.some((child: any) => location.pathname === child.key))

                    if (!item.children) {
                        return (
                            <NavItem
                                key={item.key}
                                item={item}
                                isActive={isActive}
                                onClick={() => typeof item.key === 'string' && item.key.startsWith('/') && navigate(item.key)}
                            />
                        )
                    }

                    return (
                        <Popover
                            key={item.key}
                            overlayClassName="premium-submenu"
                            overlayInnerStyle={{
                                padding: 0,
                                borderRadius: '16px',
                                overflow: 'hidden',
                                border: '1px solid rgba(128,128,128,0.1)',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                                zIndex: 10000
                            }}
                            content={
                                <div className="flex flex-col min-w-[150px] p-2 bg-white dark:bg-zinc-900">

                                    <div className="grid gap-1">
                                        {item.children.map((child: any) => {
                                            const isChildActive = location.pathname === child.key
                                            return (
                                                <div
                                                    key={child.key}
                                                    onClick={() => {
                                                        if (child.key) navigate(child.key)
                                                    }}
                                                    className={`flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group/sub
                                                        ${isChildActive
                                                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium'
                                                            : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
                                                >
                                                    <span className={`transition-colors duration-200 ${isChildActive ? 'text-primary' : 'text-zinc-400 group-hover/sub:text-primary'}`}>
                                                        {child.icon}
                                                    </span>
                                                    <span className="text-[13px] whitespace-nowrap">
                                                        {child.label.props?.children || child.label}
                                                    </span>
                                                    {isChildActive && (
                                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            }
                            placement="leftTop"
                            trigger="hover"
                            mouseEnterDelay={0.05}
                            mouseLeaveDelay={0.1}
                        >
                            <div className="w-full">
                                <NavItem item={item} isActive={isActive} />
                            </div>
                        </Popover>
                    )
                })}

                <div className="w-8 h-px bg-zinc-200 dark:bg-zinc-800 my-2 shrink-0" />

                {/* More / Extra items placeholder matching the image style */}
                <NavItem item={{ icon: <BookOpen size={20} />, labelString: 'Memo' }} isActive={false} />
                <NavItem item={{ icon: <div className="w-6 h-6 border-2 border-zinc-400 rounded-full flex items-center justify-center font-bold text-xs">+</div>, labelString: 'More' }} isActive={false} />
            </div>

            {/* Footer Static Icons */}
            <div className="w-full flex flex-col items-center gap-4 py-4 mt-auto border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20">
                <div className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors"><Radio size={16} /></div>
                <div className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors"><Languages size={16} /></div>
                <div className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors"><HelpCircle size={16} /></div>
                <div className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors"><div className="w-4 h-4 border-2 border-zinc-400 rounded-md" /></div>
                <div className="w-6 h-6 rounded-full overflow-hidden border border-zinc-200 cursor-pointer hover:border-primary transition-all">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Xthuy" alt="avatar" className="w-full h-full object-cover" />
                </div>
            </div>
        </div>
    )
}

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
                                    <div
                                        className={`xthuy-social-root ${isResizing ? 'select-none' : ''}`}
                                        data-xthuy-theme={theme || 'light'}
                                    >
                                        {/* Toggle Button Set */}
                                        <FloatingBar
                                            isOpen={isOpen}
                                            onOpen={() => setIsOpen(true)}
                                            theme={theme}
                                        />

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
                                                    {/* Header */}
                                                    <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 z-10 shrink-0">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-sm border border-zinc-100 dark:border-zinc-800">
                                                                <img src={iconUrl} alt="logo" className="w-full h-full object-contain" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <h2 className="text-[15px] font-bold truncate leading-tight flex items-center gap-2">
                                                                    {EXTENSION_INFO.displayName}
                                                                </h2>
                                                                <div className="text-[11px] font-medium tracking-tight">
                                                                    <TypeAnimation
                                                                        sequence={[
                                                                            `Powering Social interactions`,
                                                                            1500,
                                                                            `Facebook Tools & Automation`,
                                                                            1500,
                                                                            `Premium User Experience`,
                                                                            1500,
                                                                        ]}
                                                                        wrapper="span"
                                                                        cursor={true}
                                                                        repeat={Infinity}
                                                                        className="bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text font-bold"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <ToggerTheme />
                                                            <SwitchLanguage />
                                                        </div>
                                                    </div>

                                                    {/* Main Content Area */}
                                                    <div className="flex-1 overflow-hidden relative bg-zinc-50/30 dark:bg-zinc-900/10">
                                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.05),transparent_40%)] pointer-events-none" />
                                                        <AppRoutes />
                                                    </div>

                                                </div>

                                                <NavMenu
                                                    theme={theme}
                                                    onOpen={() => setIsOpen(true)}
                                                    setIsOpen={setIsOpen}
                                                    layoutMode={layoutMode}
                                                    setLayoutMode={setLayoutMode}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <Toaster position="top-center" expand={false} richColors />
                                </MemoryRouter>
                            </App>
                        </ConfigProvider>
                    </StyleProvider>
                </QueryClientProvider>
            )}
        </div>
    )
}

export default RootContent