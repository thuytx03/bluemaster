import {
  CSSProperties,
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from "react"
import { createPortal } from "react-dom"

import { cn } from "./cn"
import { useEscape, useLayer, useOutsideClick } from "./layer"

export type TPlacement =
  | "bottom-start"
  | "bottom-end"
  | "top-start"
  | "top-end"
  | "left-start"
  | "right-start"

interface PopoverProps {
  open: boolean
  onClose: () => void
  anchorRef: RefObject<HTMLElement | null>
  placement?: TPlacement
  matchWidth?: boolean
  offset?: number
  className?: string
  children: ReactNode
  closeOnOutside?: boolean
  /** Extra elements that should not count as "outside" */
  ignoreRefs?: RefObject<HTMLElement | null>[]
  /** Called when the pointer enters/leaves the floating content (hover popovers) */
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

const Popover = ({
  open,
  onClose,
  anchorRef,
  placement = "bottom-start",
  matchWidth,
  offset = 6,
  className,
  children,
  closeOnOutside = true,
  ignoreRefs = [],
  onMouseEnter,
  onMouseLeave
}: PopoverProps) => {
  const layer = useLayer()
  const contentRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{
    top: number
    left: number
    width?: number
    ready: boolean
  }>({ top: 0, left: 0, ready: false })

  const update = useCallback(() => {
    const anchor = anchorRef.current
    const content = contentRef.current
    if (!anchor || !content) return
    // The panel may be scaled with CSS `zoom`; client rects are reported in
    // rendered pixels while absolute positioning inside the zoomed layer uses
    // unscaled CSS pixels, so divide rects by the effective zoom.
    const z = (layer && (layer as HTMLElement & { currentCSSZoom?: number }).currentCSSZoom) || 1
    const scale = (r: DOMRect) => new DOMRect(r.left / z, r.top / z, r.width / z, r.height / z)
    const base = layer
      ? scale(layer.getBoundingClientRect())
      : new DOMRect(0, 0, window.innerWidth, window.innerHeight)
    const a = scale(anchor.getBoundingClientRect())
    const cw = content.offsetWidth
    const ch = content.offsetHeight
    const ax = a.left - base.left
    const ay = a.top - base.top
    let top = 0
    let left = 0
    switch (placement) {
      case "bottom-start":
        top = ay + a.height + offset
        left = ax
        break
      case "bottom-end":
        top = ay + a.height + offset
        left = ax + a.width - cw
        break
      case "top-start":
        top = ay - ch - offset
        left = ax
        break
      case "top-end":
        top = ay - ch - offset
        left = ax + a.width - cw
        break
      case "left-start":
        top = ay
        left = ax - cw - offset
        break
      case "right-start":
        top = ay
        left = ax + a.width + offset
        break
    }
    const isBottom = placement.startsWith("bottom")
    const isTop = placement.startsWith("top")
    if (isBottom && top + ch > base.height - 8 && ay - ch - offset > 8) {
      top = ay - ch - offset
    }
    if (isTop && top < 8) {
      top = ay + a.height + offset
    }
    left = Math.max(8, Math.min(left, base.width - cw - 8))
    top = Math.max(8, Math.min(top, base.height - ch - 8))
    setPos({
      top,
      left,
      width: matchWidth ? a.width : undefined,
      ready: true
    })
  }, [anchorRef, layer, matchWidth, offset, placement])

  useLayoutEffect(() => {
    if (!open) {
      setPos((p) => ({ ...p, ready: false }))
      return
    }
    update()
  }, [open, update, children])

  useEffect(() => {
    if (!open) return
    window.addEventListener("resize", update)
    window.addEventListener("scroll", update, true)
    return () => {
      window.removeEventListener("resize", update)
      window.removeEventListener("scroll", update, true)
    }
  }, [open, update])

  useOutsideClick(
    [contentRef, anchorRef, ...ignoreRefs],
    onClose,
    open && closeOnOutside
  )
  useEscape(onClose, open)

  if (!open) return null

  const style: CSSProperties = {
    position: layer ? "absolute" : "fixed",
    top: pos.top,
    left: pos.left,
    width: pos.width,
    visibility: pos.ready ? "visible" : "hidden",
    zIndex: 1000,
    pointerEvents: "auto"
  }

  const node = (
    <div
      ref={contentRef}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "bm-rounded-xl2 bm-border bm-border-line bm-bg-surface bm-shadow-pop",
        pos.ready && "bm-animate-pop-in",
        className
      )}>
      {children}
    </div>
  )

  return createPortal(node, layer ?? document.body)
}

export default Popover
