import React from 'react'
import ReactDOM from 'react-dom/client'
import { Options } from './Options'

import '@/index.css'
import { ThemeProvider } from '@/hooks/use-theme'
ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Options />
    </ThemeProvider>
  </React.StrictMode>,
)
