import { Layout, Menu } from "antd"
import { useState } from "react"
import { useLocation } from "react-router-dom"
import "./Sidebar.scss"
import { LogoIcon } from "src/assets/icons"
import { EXTENSION_INFO } from "src/constants"
import { useMenuItems } from "./data/sidebar"

const { Sider } = Layout


const Sidebar = () => {
  const menuItems = useMenuItems()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      theme="light"
      collapsedWidth={64}
      style={{
        height: "100vh",
        position: "sticky",
        top: 0,
        overflow: "auto",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)"
      }}
      width={256}>
      <div className="p-4 flex items-center gap-3">
        <LogoIcon className={`size-8`} />
        {!collapsed && <p className="font-semibold text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">{EXTENSION_INFO.displayName}</p>}
      </div>

      <Menu
        className="SidebarMenu"
        mode="inline"
        defaultOpenKeys={["download_all"]}
        selectedKeys={[location.pathname]}
        items={menuItems}
        style={{
          paddingLeft: "8px",
          borderRight: "none",
          paddingRight: "8px"
        }}
      />
    </Sider>
  )
}

export default Sidebar
