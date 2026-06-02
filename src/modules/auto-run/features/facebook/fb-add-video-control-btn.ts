import { onElementsAdded, closest } from '../../utils/dom-helper'

export function activate() {
    return onElementsAdded('video', nodes => {
        const className = 'xthuy-fb-video-control-btn'
        for (const video of Array.from(nodes) as HTMLVideoElement[]) {
            const container =
                closest(video, '[data-video-id]') ||
                closest(video, '[data-visualcompletion="ignore"]') ||
                video.parentElement
            if (!container || container.querySelector(`.${className}`)) continue

            const overlay = closest(video, '[data-instancekey]')
            const overlay2 = closest(video, '[data-video-id]')?.parentElement?.nextElementSibling ?? null

            const btn = document.createElement('button')
            btn.className = className
            btn.textContent = '🕹️'
            btn.title = 'Xthuy: Toggle video controls'
            btn.style.cssText = `position:absolute;top:60px;right:55px;width:40px;height:40px;background:#333;color:#fff;border-radius:5px;border:none;opacity:0.3;cursor:pointer;z-index:2147483647`
            btn.addEventListener('mouseenter', () => { btn.style.opacity = '1' })
            btn.addEventListener('mouseleave', () => { btn.style.opacity = '0.5' })
            btn.onclick = e => {
                const overlays = [overlay, overlay2].filter((el): el is Element => !!el) as HTMLElement[]
                if (video.hasAttribute('controls')) {
                    video.removeAttribute('controls')
                    overlays.forEach(el => { el.style.display = 'block' })
                } else {
                    video.setAttribute('controls', '')
                    overlays.forEach(el => { el.style.display = 'none' })
                }
                e.stopPropagation()
            }
            container.appendChild(btn)
        }
    })
}
