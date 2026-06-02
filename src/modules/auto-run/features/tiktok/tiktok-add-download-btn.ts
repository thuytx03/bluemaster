import { hookFetch } from '../../utils/ajax-hook'
import { notify, downloadData, closest, sanitizeName, injectCssCode } from '../../utils/dom-helper'

// Shared map: video ID → video data (accessible within MAIN world)
const videoById = new Map<string, unknown>()

interface TikTokVideo {
    id?: string
    desc?: string
    video?: { id?: string; playAddr?: string; downloadAddr?: string }
    music?: { id?: string; title?: string; playUrl?: string }
}

function createDownloadButton(video: TikTokVideo, opts: { btnStyle?: string; containerStyle?: string; contentStyle?: string } = {}) {
    const btnId = 'xthuy-tiktok-download-btn'
    const container = document.createElement('div')
    container.dataset.id = video?.id
    container.classList.add('xthuy-tiktok-trigger', btnId)
    container.style.cssText = opts.containerStyle ?? ''

    const triggerBtn = document.createElement('button')
    triggerBtn.style.cssText = opts.btnStyle ?? ''
    triggerBtn.textContent = '⬇️'
    triggerBtn.title = 'Xthuy: Download TikTok video'
    container.appendChild(triggerBtn)

    const content = document.createElement('div')
    content.classList.add('xthuy-tiktok-content')
    content.style.cssText = opts.contentStyle ?? ''

    const filename = sanitizeName(video.desc?.slice(0, 50) || video?.id || 'tiktok_video')
    const info = document.createElement('p')
    info.textContent = filename
    content.appendChild(info)

    const actions = [
        { text: '🎬 Video (no watermark)', onClick: () => { if (video.video?.playAddr) window.open(video.video.playAddr, '_blank') } },
        { text: '🎬 Video (watermark)', onClick: () => { if (video.video?.downloadAddr) window.open(video.video.downloadAddr, '_blank') } },
        video.music?.id ? { text: `🎧 ${video.music.title}`, onClick: () => { if (video.music?.playUrl) window.open(video.music.playUrl, '_blank') } } : null,
        { text: '📝 JSON Data', onClick: () => { downloadData(JSON.stringify(video, null, 2), filename + '.json') } },
        { text: `📝 All ${videoById.size} videos (JSON)`, onClick: () => { downloadData(JSON.stringify(Array.from(videoById.values()), null, 2), `${videoById.size}_tiktok_videos.json`) } },
    ].filter(Boolean) as Array<{ text: string; onClick: () => void }>

    for (const action of actions) {
        const btn = document.createElement('button')
        btn.textContent = action.text
        btn.addEventListener('click', action.onClick)
        content.appendChild(btn)
    }
    container.appendChild(content)
    return container
}

function hasDownloadBtn(el: Element, vidId?: string) {
    const target = el.querySelector('.xthuy-tiktok-download-btn') as HTMLElement | null
    return target && (!vidId || target.dataset.id === vidId)
}

function removeDownloadBtn(el: Element) {
    el.querySelector('.xthuy-tiktok-download-btn')?.remove()
}

export function activate() {
    injectCssCode(`
        .xthuy-tiktok-trigger { position:relative; color:white; z-index:2; }
        .xthuy-tiktok-trigger button { background:#ffffff1f; color:white; border:none; cursor:pointer; }
        .xthuy-tiktok-trigger button:hover { background:#ffffff3f !important; }
        .xthuy-tiktok-content { display:none; position:absolute; top:100%; left:0; border-radius:10px; padding:5px; background:#333; min-width:200px; z-index:100; }
        .xthuy-tiktok-content button { width:100%; padding:5px; text-align:left; }
        .xthuy-tiktok-trigger:hover .xthuy-tiktok-content, .xthuy-tiktok-content:hover { display:block; }
    `)

    const unsubFetch = hookFetch({
        onAfter: async (_url, _options, response) => {
            const url = _url
            if (!url.includes('item_list/') && !url.includes('api/search')) return undefined
            try {
                const json = await response.clone().json()
                const list: unknown[] = json?.itemList ?? json?.item_list ?? json?.data ?? []
                let count = 0
                for (const item of list) {
                    const v = (item as { item?: TikTokVideo } & TikTokVideo)?.item ?? (item as TikTokVideo)
                    if (v?.video?.id) { videoById.set(v.video.id, v); count++ }
                }
                if (count > 0) notify({ msg: `Xthuy TikTok: Found ${count} videos (Total: ${videoById.size})` })
            } catch { /* ignore */ }
        },
    })

    // DOM: add download buttons via polling
    const intervalId = setInterval(() => {
        const addBtn = 'xthuy-tiktok-download-all-btn'
        const userBtnRow = document.querySelector('[data-e2e="user-page"] [class*="DivButtonPanelWrapper"]')
        if (userBtnRow && !userBtnRow.querySelector(`#${addBtn}`)) {
            const btn = document.createElement('button')
            btn.id = addBtn
            btn.textContent = '⬇️ Download all'
            btn.style.cssText = 'padding:10px;background:#2c68dc;border-radius:5px;color:white;border:none;cursor:pointer'
            btn.addEventListener('click', () => {
                downloadData(JSON.stringify(Array.from(videoById.values()), null, 2), `${videoById.size}_tiktok_videos.json`)
            })
            userBtnRow.append(btn)
        }

        // Feed videos
        for (const feed of Array.from(document.querySelectorAll('[data-e2e="feed-video"]'))) {
            const bar = closest(feed, '[class*="SectionActionBarContainer"]')
            if (bar && !hasDownloadBtn(bar)) {
                const vidId = feed.querySelector('[id*=xgwrapper-0]')?.id?.split('-').at(-1)
                if (vidId && videoById.has(vidId)) {
                    bar.prepend(createDownloadButton(videoById.get(vidId) as TikTokVideo, { btnStyle: 'width:48px;height:48px;border-radius:50%', containerStyle: 'margin-bottom:15px' }))
                }
            }
        }

        // Detail video
        for (const detail of Array.from(document.querySelectorAll('[data-e2e="detail-video"]'))) {
            const vidId = detail.querySelector('[id*="xgwrapper"]')?.id?.split('-').at(-1)
            if (!hasDownloadBtn(detail, vidId)) {
                if (vidId && videoById.has(vidId)) {
                    removeDownloadBtn(detail)
                    detail.appendChild(createDownloadButton(videoById.get(vidId) as TikTokVideo, { btnStyle: 'width:48px;height:48px;border-radius:10px', containerStyle: 'position:absolute;top:0;left:0' }))
                }
            }
        }
    }, 1000)

    // Rehydration data on load
    window.addEventListener('load', () => {
        const checkId = setInterval(() => {
            const el = document.getElementById('__UNIVERSAL_DATA_FOR_REHYDRATION__')
            if (!el) return
            try {
                const data = JSON.parse(el.textContent ?? '{}')
                const vidData = data?.__DEFAULT_SCOPE__?.['webapp.video-detail']?.itemInfo?.itemStruct as TikTokVideo
                const id = vidData?.video?.id ?? vidData?.id
                if (id) { videoById.set(id, vidData); clearInterval(checkId) }
            } catch { /* ignore */ }
        }, 1000)
    })

    return () => { unsubFetch(); clearInterval(intervalId) }
}
