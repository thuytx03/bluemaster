import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useTheme } from './theme-provider'
import { MoonStar, Sun } from 'lucide-react'

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const themeColor = theme === 'dark' ? '#020817' : '#fff'
    const metaThemeColor = document.querySelector("meta[name='theme-color']")
    if (metaThemeColor) metaThemeColor.setAttribute('content', themeColor)
  }, [theme])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <Button
      variant='ghost'
      size='icon'
      className='scale-95 rounded-full'
      onClick={toggleTheme}
    >
      <Sun className='size-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90' />
      <MoonStar className='absolute size-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0' />
      <span className='sr-only'>Toggle theme</span>
    </Button>
  )
}
