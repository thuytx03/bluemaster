import { Outlet, useLocation } from "react-router-dom"

import InitializeApp from "src/modules/shared/components/InitializeApp"

const MainLayout = () => {
  const location = useLocation()
  return (
    <InitializeApp>
      <div className="x-cq-panel bm-h-full bm-w-full bm-overflow-y-auto bm-overflow-x-hidden bm-bg-surface">
        <div
          key={location.pathname}
          className="bm-min-h-full bm-px-4 bm-py-4 bm-animate-fade-up pw-lg:bm-bg-app pw-lg:bm-px-6 pw-lg:bm-py-6">
          <div className="bm-mx-auto bm-w-full bm-max-w-[1040px]">
            <Outlet />
          </div>
        </div>
      </div>
    </InitializeApp>
  )
}

export default MainLayout
