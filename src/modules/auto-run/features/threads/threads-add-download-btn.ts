import { onElementsAdded, closest } from '../../utils/dom-helper'

export function activate() {
    return onElementsAdded('video', nodes => {
        const className = 'xthuy-threads-video-download-btn'
        for (const video of Array.from(nodes) as HTMLVideoElement[]) {
            const container = closest(video, 'img')?.parentElement ?? video.parentElement
            if (!container || container.querySelector(`.${className}`)) continue

            const btn = document.createElement('button')
            btn.className = className
            btn.textContent = '⬇️'
            btn.title = 'Xthuy: Download video'
            btn.style.cssText = `position:absolute;top:10px;right:10px;width:40px;height:40px;background:#333;color:#fff;border-radius:5px;border:none;opacity:0.3;cursor:pointer;z-index:2147483647`
            btn.addEventListener('mouseenter', () => { btn.style.opacity = '1' })
            btn.addEventListener('mouseleave', () => { btn.style.opacity = '0.5' })
            btn.onclick = e => { window.open(video.src, '_blank'); e.stopPropagation() }
            container.appendChild(btn)
        }
    })
}
