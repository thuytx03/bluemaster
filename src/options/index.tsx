import React from 'react'
import ReactDOM from 'react-dom/client'
import { Options } from './Options'
import { ThemeProvider } from "@/hooks/use-theme"

import '@/index.css'
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Options />
    </ThemeProvider>
  </React.StrictMode>,
)
