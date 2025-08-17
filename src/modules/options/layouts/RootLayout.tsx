

import Loader from '@/components/loader'
import { SidebarProvider } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { Outlet } from 'react-router-dom'
import { AppSidebar } from '../components/app-sidebar'
import { Header } from '../components/layout/header'

const RootLayout = () => {
  // const { appearance, loading, updateAppearance } = useSettings()

  // if (loading) {
  //     return (
  //         <div className="flex flex-col h-screen bg-background">
  //             <div className="flex-1 flex items-center justify-center">
  //                 <Loader />
  //             </div>
  //         </div>
  //     )
  // }

  return (
    <div className="flex flex-col h-screen bg-background">
      <SidebarProvider>
        <AppSidebar />
        <div
          id='content'
          className={cn(
            'ml-auto w-full max-w-full h-screen overflow-y-auto',
          )}
        >
          <Header fixed>
          </Header>
          <Outlet />
        </div>
      </SidebarProvider>
    </div>
  )
}

export default RootLayout
