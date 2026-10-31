import {
  createContext,
  RefObject,
  useContext,
  useEffect
} from "react"

/**
 * The "layer" is the element floating UI (popovers, menus, tooltips) is
 * portaled into. Inside the extension panel this is an absolutely
 * positioned overlay that lives in the same transformed container, so
 * coordinates stay correct even though the panel is translated.
 */
export const LayerContext = createContext<HTMLElement | null>(null)

export const useLayer = () => useContext(LayerContext)

/** Calls `onOutside` for pointer-downs outside every given ref (shadow DOM safe). */
export const useOutsideClick = (
  refs: RefObject<HTMLElement | null>[],
  onOutside: () => void,
  enabled = true
) => {
  useEffect(() => {
    if (!enabled) return
    const handler = (e: Event) => {
      const path = e.composedPath()
      const inside = refs.some((r) => r.current && path.includes(r.current))
      if (!inside) onOutside()
    }
    document.addEventListener("mousedown", handler, true)
    return () => document.removeEventListener("mousedown", handler, true)
  }, [enabled, onOutside, refs])
}

export const useEscape = (onEscape: () => void, enabled = true) => {
  useEffect(() => {
    if (!enabled) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEscape()
    }
    document.addEventListener("keydown", handler, true)
    return () => document.removeEventListener("keydown", handler, true)
  }, [enabled, onEscape])
}
