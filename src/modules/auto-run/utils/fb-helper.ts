// Facebook GraphQL / DTSG utilities ported from fb-aio fb-helper.js

import { deepFind } from './dom-helper'

export function wrapGraphQlParams(params: Record<string, unknown>): string {
    return Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(typeof v === 'string' ? v : JSON.stringify(v))}`)
        .join('&')
}

export async function fetchGraphQl(params: Record<string, unknown> | string, fb_dtsg?: string): Promise<string> {
    const dtsg = fb_dtsg ?? (await getFbdtsg())
    const host = location.hostname.includes('facebook.com') ? location.hostname : 'www.facebook.com'

    let form: string
    if (typeof params === 'string') {
        form = `fb_dtsg=${encodeURIComponent(dtsg ?? '')}&q=${encodeURIComponent(params)}`
    } else {
        form = wrapGraphQlParams({
            dpr: 1,
            __a: 1,
            __aaid: 0,
            __ccg: 'GOOD',
            __comet_req: 15,
            server_timestamps: true,
            fb_dtsg: dtsg ?? '',
            ...params,
        })
    }

    const res = await fetch(`https://${host}/api/graphql/`, {
        method: 'POST',
        body: form,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        credentials: 'include',
    })
    return res.text()
}

export async function getFbdtsg(): Promise<string | null> {
    // Try Facebook's internal module system first (MAIN world only)
    const fbRequire = (globalThis as unknown as Record<string, unknown>)['require'] as ((m: string) => unknown) | undefined

    const methods: Array<() => Promise<string | null> | string | null> = [
        () => {
            try { return (fbRequire?.('DTSGInitData') as { token?: string })?.token ?? null }
            catch { return null }
        },
        () => {
            try { return (fbRequire?.('DTSG') as { getToken?: () => string })?.getToken?.() ?? null }
            catch { return null }
        },
        () => {
            const m = /"DTSGInitialData",\[],{"token":"(.+?)"/.exec(document.documentElement.innerHTML)
            return m?.[1] ?? null
        },
        async () => {
            try {
                const res = await fetch('https://mbasic.facebook.com/photos/upload/')
                const text = await res.text()
                return /name="fb_dtsg" value="(.*?)"/.exec(text)?.[1] ?? null
            } catch { return null }
        },
        async () => {
            try {
                const res = await fetch('https://m.facebook.com/home.php', { headers: { Accept: 'text/html' } })
                const text = await res.text()
                return /"dtsg":\{"token":"([^"]+)"/.exec(text)?.[1] ?? /"name":"fb_dtsg","value":"([^"]+)/.exec(text)?.[1] ?? null
            } catch { return null }
        },
    ]

    for (const m of methods) {
        try {
            const d = await m()
            if (d) return d
        } catch { /* try next */ }
    }
    return null
}

export const TargetType = {
    User: 'user',
    Page: 'page',
    Group: 'group',
    IGUser: 'ig_user',
    TikTokUser: 'tiktok_user',
    ThreadsUser: 'threads_user',
} as const

export async function getEntityAbout(entityID: string, context = 'DEFAULT') {
    const res = await fetchGraphQl({
        fb_api_req_friendly_name: 'CometHovercardQueryRendererQuery',
        variables: { actionBarRenderLocation: 'WWW_COMET_HOVERCARD', context, entityID, scale: 2 },
        doc_id: '27838033792508877',
    })
    const json = JSON.parse(res)
    const node = json?.data?.node
    if (!node) return null

    const typeText: string = node.__typename.toLowerCase()
    if (!Object.values(TargetType).includes(typeText as never)) return null

    const card = node.comet_hovercard_renderer[typeText]
    let type: string
    if (typeText === 'page') type = TargetType.Page
    else if (typeText !== 'user') type = TargetType.Group
    else if (card.profile_plus_transition_path?.startsWith('PAGE') || card.profile_plus_transition_path === 'ADDITIONAL_PROFILE_CREATION') type = TargetType.Page
    else type = TargetType.User

    return {
        type,
        pageId: deepFind(card, 'delegate_page_id'),
        uid: node.id || card.id,
        name: card.name as string,
        avatar: card.profile_picture?.uri as string,
        url: (card.profile_url || card.url) as string,
        raw: json,
    }
}
