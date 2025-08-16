
// import { useSettings } from '@/hooks/useSettings'

import Loader from '@/components/loader'
import { Outlet } from 'react-router-dom'

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
      {/* Header */}

      {/* Content */}
      <div className="flex-1 overflow-hidden mt-1">
        <Outlet />
      </div>

    </div>
  )
}

export default RootLayout
