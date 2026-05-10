import React from 'react'
import { useNavigate, useLocation } from "react-router-dom"
import { Button, Tooltip, Popover } from "antd"
import { X, BookOpen, Languages, Radio, HelpCircle, Layout, Columns, Maximize2 } from "lucide-react"
import { useMenuItems } from 'src/modules/shared/layouts/sidebar/data/sidebar'

interface NavMenuProps {
    theme: string
    onOpen: () => void
    setIsOpen: (v: boolean) => void
    layoutMode: 'overlay' | 'push'
    setLayoutMode: (m: 'overlay' | 'push') => void
}

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

export const NavMenu: React.FC<NavMenuProps> = ({ theme, onOpen, setIsOpen, layoutMode, setLayoutMode }) => {
    const menuItems = useMenuItems()
    const navigate = useNavigate()
    const location = useLocation()

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
