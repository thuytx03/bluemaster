import { Layout } from "antd"
import { Outlet } from "react-router-dom"

import InitializeApp from "../components/InitializeApp"

const { Content } = Layout

const MainLayout = () => {
  return (
    <InitializeApp>
      <Layout className="bg-transparent h-full">
        <Content className="bg-transparent h-full">
          <div className="p-2 h-full">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </InitializeApp>
  )
}

export default MainLayout
