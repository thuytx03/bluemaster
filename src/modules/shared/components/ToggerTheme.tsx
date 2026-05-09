import { MoonOutlined, SunOutlined } from '@ant-design/icons'
import React from 'react'

import { TTheme } from "src/modules/shared/types/common.interface"
import useExtensionState from "src/store/extension-state"

const ToggerTheme = () => {
  const {
    extensionState: { theme },
    setTheme
  } = useExtensionState()

  const handleThemeChange = async () => {
    const newTheme: TTheme = theme === "dark" ? "light" : "dark"
    await setTheme(newTheme)
  }

  return (
      <span
        style={{ cursor: 'pointer', fontSize: 16 }}
        onClick={handleThemeChange}
        title={theme === 'dark' ? 'Chuyển sang Light' : 'Chuyển sang Dark'}
      >
        {theme === 'dark' ? <MoonOutlined /> : <SunOutlined />}
      </span>
  )
}

export default ToggerTheme