import { onElementsAdded, closest } from 'src/modules/auto-run/utils/dom.util'

function getVideoId(videoEl: HTMLVideoElement): string | null {
    try {
        const parent = videoEl.parentElement
        if (!parent) return null
        const reactKey = Object.keys(parent).find(k => k.startsWith('__reactProps'))
        if (!reactKey) return null
        const props = (parent as unknown as Record<string, { children?: { props?: { videoFBID?: string; coreVideoPlayerMetaData?: { videoFBID?: string } } } }>)[reactKey]?.children?.props
        return props?.videoFBID ?? props?.coreVideoPlayerMetaData?.videoFBID ?? null
    } catch {
        return null
    }
}

export function activate() {
    return onElementsAdded('video', nodes => {
        const className = 'bluemaster-fb-video-download-btn'
        for (const video of Array.from(nodes) as HTMLVideoElement[]) {
            const container =
                closest(video, '[data-video-id]') ||
                closest(video, '[data-visualcompletion="ignore"]') ||
                video.parentElement
            if (!container || container.querySelector(`.${className}`)) continue

            const btn = document.createElement('button')
            btn.className = className
            btn.textContent = '⬇️'
            btn.title = 'Bluemaster: Download video'
            btn.style.cssText = `position:absolute;top:60px;right:10px;width:40px;height:40px;background:#333;color:#fff;border-radius:5px;border:none;opacity:0.3;cursor:pointer;z-index:2147483647`
            btn.addEventListener('mouseenter', () => { btn.style.opacity = '1' })
            btn.addEventListener('mouseleave', () => { btn.style.opacity = '0.5' })
            btn.onclick = e => {
                const id = getVideoId(video)
                if (id) window.open(`https://www.facebook.com/videos/${id}`, '_blank')
                e.stopPropagation()
            }
            container.appendChild(btn)
        }
    })
}
