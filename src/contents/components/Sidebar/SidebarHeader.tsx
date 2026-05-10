import React from 'react'
import { TypeAnimation } from 'react-type-animation'
import { EXTENSION_INFO } from 'src/constants'
import ToggerTheme from 'src/modules/shared/components/ToggerTheme'
import SwitchLanguage from 'src/modules/shared/components/SwitchLanguage'
import iconUrl from "url:assets/icon.png"

export const SidebarHeader: React.FC = () => {
    return (
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
    )
}
