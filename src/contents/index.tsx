import cssText from "data-text:~style.css"
import sonnerStyles from "data-text:sonner/dist/styles.css"
import type { PlasmoCSConfig, PlasmoGetShadowHostId } from "plasmo"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { MemoryRouter, useNavigate } from "react-router-dom"
import { Toaster } from "sonner"

import "src/i18n"

import { EStorageKey } from "src/constants/enum"
import { APP_ROUTES } from "src/constants/route.constants"
import FloatingBar from "src/contents/components/FloatingBar"
import ErrorBoundary from "src/modules/shared/components/ErrorBoundary"
import { cn, LayerContext } from "src/modules/shared/ui"
import AppRoutes from "src/routes/AppRoutes"
import useExtensionState from "src/stores/extension-state.store"
import { chromeUtils } from "src/utils/chrome.util"
import { NAV_RAIL_WIDTH, NavMenu } from "src/contents/components/sidebar/NavMenu"

const AutoNavToScraper = () => {
  const navigate = useNavigate()
  useEffect(() => {
    chromeUtils.getStorage<any>(EStorageKey.FB_SCRAPER_DATA).then((data) => {
      if (data?.active) {
        navigate(APP_ROUTES.FACEBOOK.EXPORT_UID)
      }
    })
  }, [navigate])
  return null
}

export const config: PlasmoCSConfig = {
  //   matches: ["<all_urls>"]
  matches: ["https://www.facebook.com/*"]
}

export const getStyle = (): HTMLStyleElement => {
  const styleElement = document.createElement("style")
  const baseFontSize = 16

  let updatedCssText = cssText.replaceAll(":root", ":host(plasmo-csui)")

  // Force the shadow host to have the highest possible z-index
  updatedCssText += `
    :host(plasmo-csui) {
      z-index: 2147483647 !important;
      position: fixed !important;
      top: 0 !important;
      right: 0 !important;
      width: 0 !important;
      height: 0 !important;
      overflow: visible !important;
      pointer-events: none !important;
    }

    .bluemaster-sidebar-container,
    .bluemaster-root {
      position: absolute !important;
      top: 0 !important;
      right: 0 !important;
      pointer-events: auto !important;
    }
  `

  // The host page may change the root font-size; pin rem units to 16px.
  updatedCssText = updatedCssText.replace(/([\d.]+)rem/g, (_, remValue) => {
    return `${parseFloat(remValue) * baseFontSize}px`
  })

  updatedCssText += `
    ${sonnerStyles}

    /* Ensure sonner toasts are visible in shadow dom */
    [data-sonner-toaster] {
      position: fixed !important;
      z-index: 2147483647 !important;
    }
  `

  styleElement.textContent = updatedCssText
  return styleElement
}

export const getShadowHostId: PlasmoGetShadowHostId = () =>
  "bluemaster-sidebar"

const MIN_WIDTH = 320
const DIALOG_DEFAULT_WIDTH = 1200
const DIALOG_MIN = { w: 520, h: 400 }
const DEFAULT_WIDTH = 440
const EXPANDED_WIDTH = () =>
  Math.max(DEFAULT_WIDTH, Math.round(window.innerWidth * 0.6))

const RootContent = () => {
  const [isOpen, setIsOpen] = useState(false)
  // Transitions stay off until the panel is first opened. Otherwise, when the saved
  // position (center/full) replaces the default (right) during hydration, the closed
  // panel animates from opacity 1 to 0 and its white surface flashes over the page.
  const [animated, setAnimated] = useState(false)
  const openPanel = useCallback(() => {
    setAnimated(true)
    setIsOpen(true)
  }, [])
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [isResizing, setIsResizing] = useState(false)

  // "Expanded" means any size other than the default (dragged or maximised),
  // so the rail button can always bring the panel back to its original size.
  const {
    extensionState: { theme, layoutMode, uiScale, panelPosition }
  } = useExtensionState()
  const docked = panelPosition === "left" || panelPosition === "right"
  const isLeft = panelPosition === "left"
  const isCenter = panelPosition === "center"

  // ---- Centre dialog size (persisted) -------------------------------------
  type TDialogSize = { w: number; h: number }
  const [dialogSize, setDialogSize] = useState<TDialogSize | null>(null)
  const dialogSizeRef = useRef<TDialogSize | null>(null)
  useEffect(() => {
    dialogSizeRef.current = dialogSize
  })
  useEffect(() => {
    chromeUtils.getStorage<TDialogSize>(EStorageKey.DIALOG_SIZE).then((s) => {
      if (s && typeof s.w === "number" && typeof s.h === "number")
        setDialogSize(s)
    })
  }, [])
  const dialog = {
    w: Math.min(dialogSize?.w ?? DIALOG_DEFAULT_WIDTH, window.innerWidth - 40),
    h: Math.min(
      dialogSize?.h ?? Math.round(window.innerHeight * 0.9),
      window.innerHeight - 40
    )
  }

  const expanded = isCenter ? dialogSize !== null : width !== DEFAULT_WIDTH
  const resetWidth = useCallback(() => {
    if (isCenter) {
      setDialogSize(null)
      chromeUtils.removeStorage(EStorageKey.DIALOG_SIZE)
    } else {
      setWidth(DEFAULT_WIDTH)
    }
  }, [isCenter])
  const toggleExpand = useCallback(() => {
    if (isCenter) {
      if (dialogSizeRef.current) {
        setDialogSize(null)
        chromeUtils.removeStorage(EStorageKey.DIALOG_SIZE)
      } else {
        const max = { w: window.innerWidth - 48, h: window.innerHeight - 48 }
        setDialogSize(max)
        chromeUtils.setStorage(EStorageKey.DIALOG_SIZE, max)
      }
      return
    }
    setWidth((w) => (w !== DEFAULT_WIDTH ? DEFAULT_WIDTH : EXPANDED_WIDTH()))
  }, [isCenter])
  const [container, setContainer] = useState<HTMLElement | null>(null)
  const [layerEl, setLayerEl] = useState<HTMLElement | null>(null)

  useEffect(() => {
    console.log("Bluemaster Content Script Mounted")
  }, [])

  // ---- Resizing -----------------------------------------------------------
  const startResizing = useCallback((e: React.MouseEvent) => {
    setIsResizing(true)
    e.preventDefault()
  }, [])

  const stopResizing = useCallback(() => {
    setIsResizing((was) => {
      if (was && dialogSizeRef.current) {
        chromeUtils.setStorage(EStorageKey.DIALOG_SIZE, dialogSizeRef.current)
      }
      return false
    })
  }, [])

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        if (isCenter) {
          // Resize from the bottom-right corner while staying centred
          const w = Math.max(
            DIALOG_MIN.w,
            Math.min(
              (e.clientX - window.innerWidth / 2) * 2,
              window.innerWidth - 40
            )
          )
          const h = Math.max(
            DIALOG_MIN.h,
            Math.min(
              (e.clientY - window.innerHeight / 2) * 2,
              window.innerHeight - 40
            )
          )
          setDialogSize({ w, h })
          return
        }
        const newWidth = isLeft
          ? e.clientX - NAV_RAIL_WIDTH
          : window.innerWidth - e.clientX - NAV_RAIL_WIDTH
        const maxWidth = window.innerWidth - 100
        if (newWidth > MIN_WIDTH && newWidth < maxWidth) {
          setWidth(newWidth)
        }
      }
    },
    [isResizing, isLeft, isCenter]
  )

  // ---- Push mode: shrink the host page -----------------------------------
  useEffect(() => {
    const fullWidth = width + NAV_RAIL_WIDTH
    // While resizing, always behave like 'overlay' for smooth performance
    const root = document.documentElement.style
    root.transition =
      "margin-right 0.3s ease-in-out, margin-left 0.3s ease-in-out, width 0.3s ease-in-out"
    if (isOpen && docked && layoutMode === "push" && !isResizing) {
      root.marginRight = isLeft ? "0" : `${fullWidth}px`
      root.marginLeft = isLeft ? `${fullWidth}px` : "0"
      root.width = `calc(100% - ${fullWidth}px)`
      root.position = "relative"
    } else {
      root.marginRight = "0"
      root.marginLeft = "0"
      root.width = "100%"
    }

    return () => {
      root.marginRight = "0"
      root.marginLeft = "0"
      root.width = "100%"
    }
  }, [isOpen, layoutMode, width, isResizing, docked, isLeft])

  useEffect(() => {
    window.addEventListener("mousemove", resize)
    window.addEventListener("mouseup", stopResizing)
    return () => {
      window.removeEventListener("mousemove", resize)
      window.removeEventListener("mouseup", stopResizing)
    }
  }, [resize, stopResizing])

  // ---- Top guard: keep our host as the last child of <body> ---------------
  useEffect(() => {
    const host = document.getElementById(getShadowHostId() as string)
    if (!host) return

    const ensureOnTop = () => {
      if (host.parentElement && host.nextElementSibling !== null) {
        host.parentElement.appendChild(host)
      }
    }

    ensureOnTop()
    const observer = new MutationObserver(ensureOnTop)
    observer.observe(document.body, { childList: true })

    const interval = setInterval(ensureOnTop, 2000)

    return () => {
      observer.disconnect()
      clearInterval(interval)
    }
  }, [])

  // ---- Keyboard: Alt+X toggles, Esc closes --------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.code === "KeyX" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setAnimated(true)
        setIsOpen((o) => !o)
        return
      }
      if (e.key === "Escape" && !e.defaultPrevented) setIsOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const panelRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={setContainer} className="bluemaster-sidebar-container">
      {container && (
        <ErrorBoundary name="Root">
            <MemoryRouter>
              <AutoNavToScraper />
              <div
                className={`bluemaster-root ${isResizing ? "bm-select-none" : ""}`}
                data-bluemaster-theme={theme || "light"}>
                <ErrorBoundary name="FloatingBar">
                  <FloatingBar
                    isOpen={isOpen}
                    onOpen={openPanel}
                    theme={theme}
                    side={isLeft ? "left" : "right"}
                  />
                </ErrorBoundary>

                {/* Panel */}
                <div
                  ref={panelRef}
                  aria-hidden={!isOpen}
                  className={cn(
                    "bm-fixed bm-z-[2147483647] bm-flex",
                    animated &&
                      !isResizing &&
                      "bm-transition-[transform,opacity] bm-duration-300 bm-ease-out",
                    panelPosition === "right" &&
                      cn(
                        "bm-inset-y-0 bm-right-0",
                        isOpen ? "bm-translate-x-0" : "bm-translate-x-full"
                      ),
                    panelPosition === "left" &&
                      cn(
                        "bm-inset-y-0 bm-left-0 bm-flex-row-reverse",
                        isOpen ? "bm-translate-x-0" : "-bm-translate-x-full"
                      ),
                    panelPosition === "center" &&
                      cn(
                        "bm-inset-0 bm-items-center bm-justify-center bm-p-5",
                        !isOpen && "bm-opacity-0"
                      ),
                    panelPosition === "full" &&
                      cn(
                        "bm-inset-0",
                        !isOpen && "bm-opacity-0 bm-translate-y-4"
                      )
                  )}
                  style={{
                    width: docked ? `${width + NAV_RAIL_WIDTH}px` : undefined,
                    pointerEvents: isOpen || docked ? "auto" : "none"
                  }}>
                  {/* Dialog backdrop */}
                  {panelPosition === "center" && (
                    <div
                      onClick={() => setIsOpen(false)}
                      className="bm-absolute bm-inset-0 bm-bg-black/45 bm-backdrop-blur-[2px]"
                    />
                  )}
                  {/* Resize handle */}
                  {isOpen && docked && (
                    <div
                      onMouseDown={startResizing}
                      onDoubleClick={resetWidth}
                      title="Kéo để thay đổi kích thước · Nhấp đúp để về mặc định"
                      className={cn(
                        "bm-group bm-relative bm-z-10 bm-w-2 bm-shrink-0 bm-cursor-col-resize",
                        isLeft ? "-bm-ml-1" : "-bm-mr-1"
                      )}>
                      <span
                        className={cn(
                          "bm-absolute bm-inset-y-0 bm-w-[3px] bm-transition-colors",
                          isLeft
                            ? "bm-left-0 bm-rounded-r-full"
                            : "bm-right-0 bm-rounded-l-full",
                          isResizing
                            ? "bm-bg-brand"
                            : "bm-bg-transparent group-hover:bm-bg-brand/60"
                        )}
                      />
                    </div>
                  )}

                  <div
                    style={{
                      zoom: uiScale,
                      ...(isCenter
                        ? {
                            width: dialog.w / uiScale,
                            height: dialog.h / uiScale
                          }
                        : {})
                    }}
                    className={cn(
                      "bm-relative bm-flex bm-overflow-hidden bm-border-line bm-bg-surface bm-text-fg bm-transition-transform bm-duration-300",
                      panelPosition === "right" &&
                        "bm-h-full bm-w-full bm-border-l bm-shadow-panel",
                      panelPosition === "left" &&
                        "bm-h-full bm-w-full bm-flex-row-reverse bm-border-r bm-shadow-[16px_0_48px_-12px_hsl(var(--x-shadow)/0.35)]",
                      panelPosition === "center" &&
                        cn(
                          "bm-max-h-full bm-max-w-full bm-rounded-2xl bm-border bm-shadow-pop",
                          !isOpen && "bm-scale-95"
                        ),
                      panelPosition === "full" && "bm-h-full bm-w-full"
                    )}>
                    <LayerContext.Provider value={layerEl}>
                      {/* Content column */}
                      <div className="bm-flex bm-h-full bm-min-w-0 bm-flex-1 bm-flex-col bm-bg-surface">
                        <div className="bm-relative bm-min-h-0 bm-flex-1 bm-overflow-hidden">
                          <ErrorBoundary name="AppRoutes">
                            <AppRoutes />
                          </ErrorBoundary>
                        </div>
                      </div>

                      <ErrorBoundary name="NavMenu">
                        <NavMenu
                          theme={theme}
                          onClose={() => setIsOpen(false)}
                          expanded={expanded}
                          onToggleExpand={toggleExpand}
                          docked={docked}
                          canResize={docked || isCenter}
                        />
                      </ErrorBoundary>

                      {/* Floating layer for popovers, menus and tooltips */}
                      <div
                        ref={setLayerEl}
                        className="bm-pointer-events-none bm-absolute bm-inset-0 bm-z-[1000]"
                      />

                      {/* Corner grip: resize the centred dialog */}
                      {isCenter && (
                        <div
                          onMouseDown={startResizing}
                          onDoubleClick={resetWidth}
                          title="Kéo để đổi kích thước · Nhấp đúp để về mặc định"
                          className="bm-group bm-absolute bm-bottom-0 bm-right-0 bm-z-[1001] bm-flex bm-h-5 bm-w-5 bm-cursor-nwse-resize bm-items-end bm-justify-end bm-p-1">
                          <span
                            className={cn(
                              "bm-h-2.5 bm-w-2.5 bm-rounded-br-md bm-border-b-2 bm-border-r-2 bm-transition-colors",
                              isResizing
                                ? "bm-border-brand"
                                : "bm-border-fg-subtle group-hover:bm-border-brand"
                            )}
                          />
                        </div>
                      )}
                    </LayerContext.Provider>
                  </div>
                </div>
              </div>
              <Toaster
                position="top-center"
                expand={false}
                richColors
                theme={theme === "dark" ? "dark" : "light"}
              />
            </MemoryRouter>
        </ErrorBoundary>
      )}
    </div>
  )
}

export default RootContent
