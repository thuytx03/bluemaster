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
import { FacebookIcon } from 'src/assets/icons'

interface FloatingBarProps {
  isOpen: boolean
  onOpen: () => void
  theme: 'light' | 'dark'
}

const FloatingBar: React.FC<FloatingBarProps> = ({ isOpen, onOpen, theme }) => {
  if (isOpen) return null

  const items = [
    { icon: <Plus size={20} />, color: 'text-zinc-400', bg: 'bg-zinc-50' },
    { icon: <BookOpen size={20} />, color: 'text-zinc-600', bg: 'bg-white' },
    { icon: <Languages size={20} />, color: 'text-zinc-600', bg: 'bg-white' },
    { icon: <Radio size={20} />, color: 'text-zinc-600', bg: 'bg-white' },
    { 
      icon: (
        <div className="relative">
          <LayoutGrid size={20} className="text-zinc-600" />
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
             <FacebookIcon className="size-3" />
          </div>
        </div>
      ), 
      bg: 'bg-white' 
    },
    { 
      icon: (
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-blue-500 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform cursor-pointer">
           <div className="w-5 h-5 bg-white rounded-sm flex items-center justify-center rotate-45">
              <div className="w-2 h-2 bg-black rounded-full -rotate-45" />
           </div>
        </div>
      ),
      isAction: true
    },
    { icon: <Settings size={20} />, color: 'text-zinc-400', bg: 'bg-white' },
  ]

  return (
    <div className={`fixed right-2 bottom-1/2 translate-y-1/2 flex flex-col gap-3 z-[2147483647] transition-all duration-500 animate-in fade-in slide-in-from-right-10 ${theme === 'dark' ? 'dark' : ''}`}>
      {items.map((item, index) => (
        <div
          key={index}
          onClick={onOpen}
          className={`
            group relative flex items-center justify-center
            ${item.isAction ? '' : 'w-11 h-11 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.15)] transition-all duration-300 cursor-pointer border border-white/50 dark:border-zinc-800/50'}
            ${item.bg || 'bg-white dark:bg-zinc-900'}
            ${item.color || 'dark:text-zinc-400'}
            hover:-translate-x-1 active:scale-95
          `}
        >
          {item.icon}
          
          <div className="absolute right-full mr-3 px-2.5 py-1.5 bg-zinc-900/90 backdrop-blur-md text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-x-2 group-hover:translate-x-0 shadow-xl whitespace-nowrap">
            {index === 0 ? 'Phím tắt' : index === 5 ? 'Mở Menu' : 'Tính năng'}
          </div>
        </div>
      ))}
      
      {/* Small drag/indicator arrow */}
      <div 
        onClick={onOpen}
        className="flex items-center justify-center w-5 h-8 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-l-full shadow-sm border border-r-0 border-zinc-200 dark:border-zinc-800 absolute -left-5 top-1/2 -translate-y-1/2 cursor-pointer hover:bg-white dark:hover:bg-zinc-800 transition-colors"
      >
        <ChevronRight size={12} className="text-zinc-400 rotate-180" />
      </div>
    </div>
  )
}

export default FloatingBar
