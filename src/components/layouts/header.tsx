import React from 'react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ThemeSwitch } from '../theme-switch'

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  fixed?: boolean
  ref?: React.Ref<HTMLElement>
}

export const Header = ({
  className,
  fixed,
  children,
  ...props
}: HeaderProps) => {
  const [offset, setOffset] = React.useState(0)

  React.useEffect(() => {
    const content = document.getElementById('content')
    const onScroll = () => {
      setOffset(content?.scrollTop ?? 0)
    }
    content?.addEventListener('scroll', onScroll, { passive: true })
    return () => content?.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'bg-background flex h-14 items-center gap-3 p-4 sm:gap-4',
        fixed && 'header-fixed peer/header sticky top-0 z-50 w-[inherit] rounded-md',
        offset > 10 && fixed ? 'shadow' : 'shadow-none',
        className
      )}
      {...props}
    >
      <SidebarTrigger variant='outline' className='scale-125 sm:scale-100' />
      <Separator orientation='vertical' className='h-6' />
      {children}
      <div className='flex justify-end ml-auto'>
        <ThemeSwitch />
      </div>
    </header>
  )
}

Header.displayName = 'Header'
