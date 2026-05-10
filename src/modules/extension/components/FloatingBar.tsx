import React from 'react'
import {
  Plus,
  BookOpen,
  Languages,
  Radio,
  LayoutGrid,
  Settings,
  ChevronRight
} from 'lucide-react'
import iconUrl from "url:assets/icon.png"

interface FloatingBarProps {
  isOpen: boolean
  onOpen: () => void
  theme: 'light' | 'dark'
}

const FloatingBar: React.FC<FloatingBarProps> = ({ isOpen, onOpen, theme }) => {
  if (isOpen) return null

  return (
    <div
      className={`fixed right-0 bottom-8 z-[2147483647] flex flex-col items-center gap-2.5 pointer-events-auto`}
      data-xthuy-theme={theme || 'light'}
    >
      <div className="flex flex-col items-center gap-2">
        {/* Plus Button */}
        <button className="w-9 h-9 rounded-full bg-[#efefff] dark:bg-indigo-950/50 flex items-center justify-center shadow-md hover:scale-110 transition-all border border-white/50 text-[#7c7cfc]">
          <Plus size={18} />
        </button>

        {/* Translation Button */}
        <button className="w-9 h-9 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center shadow-md hover:scale-110 transition-all border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
          <Languages size={16} />
        </button>

        {/* Apps Button with Badge */}
        <div className="relative">
          <button className="w-9 h-9 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center shadow-md hover:scale-110 transition-all border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
            <LayoutGrid size={16} />
          </button>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white p-0.5 shadow-sm border border-zinc-100">
            <img src="https://www.facebook.com/favicon.ico" alt="fb" className="w-full h-full rounded-full" />
          </div>
        </div>
      </div>

      {/* Main Toggle Button (Pill Style) */}
      <div
        onClick={onOpen}
        className="relative flex items-center justify-end w-[50px] h-[44px] bg-white/90 dark:bg-zinc-900/90
         backdrop-blur-md rounded-l-full shadow-[-4px_0_20px_rgba(0,0,0,0.1)] border border-r-0 border-zinc-200 dark:border-zinc-800 cursor-pointer group hover:w-18 transition-all duration-300"
      >
        <div className="mr-2 relative w-8 h-8 rounded-full p-[1.5px] group-hover:scale-110 transition-transform">
          <div className="w-full h-full rounded-full bg-white dark:bg-zinc-950 flex items-center justify-center overflow-hidden">
            <div className="flex items-center gap-[1px] text-zinc-800 dark:text-white">
              <img src={iconUrl} alt="logo" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      </div>

      {/* Settings Button */}
      <button className="w-9 h-9 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center shadow-md hover:scale-110 transition-all border border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
        <Settings size={16} />
      </button>
    </div>
  )
}

export default FloatingBar
