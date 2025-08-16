import React from 'react'
import ReactDOM from 'react-dom/client'
import { Panel } from './Panel'
import { ThemeProvider } from "@/hooks/use-theme"

import '@/index.css'
ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Panel />

    </ThemeProvider>
  </React.StrictMode>,
)
