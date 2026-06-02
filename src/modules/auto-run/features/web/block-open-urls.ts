// Intercepts window.open and link clicks to warn about blacklisted URLs.
// Storage is read via a message to the isolated world since this runs in MAIN world.

let regexs: RegExp[] = []

// Receive regex list from isolated world
window.addEventListener('xthuy:block-urls-config', (e) => {
    const patterns: string[] = (e as CustomEvent).detail?.patterns ?? []
    regexs = patterns.map(p => { try { return new RegExp(p) } catch { return null } }).filter(Boolean) as RegExp[]
})

function confirmOpen(url: string, event: MouseEvent | null): boolean {
    if (!url || !regexs.some(r => r.test(url))) return true
    const value = prompt('Xthuy: Ads link detected. Are you sure you want to open this link?', url)
    const confirmed = value !== null
    if (!confirmed && event) {
        event.preventDefault()
        event.stopPropagation?.()
        event.stopImmediatePropagation?.()
    }
    return confirmed
}

let cleanup: (() => void) | null = null

export function activate() {
    const clickHandler = (event: MouseEvent) => {
        const target = event.target as HTMLElement
        if (target.tagName === 'A') {
            confirmOpen((target as HTMLAnchorElement).href, event)
        }
    }

    window.addEventListener('click', clickHandler)

    const originalOpen = window.open
    window.open = (url?: string | URL, target?: string, features?: string) => {
        const urlStr = url?.toString() ?? ''
        return confirmOpen(urlStr, null) ? originalOpen.call(window, url, target, features) : null
    }

    // Check current page URL
    if (regexs.some(r => r.test(window.location.href))) {
        const confirmed = confirm('Xthuy: Ads link detected.\n\nConfirm: close website. Cancel: continue browsing.')
        if (confirmed) { window.stop(); window.close() }
    }

    return () => {
        window.removeEventListener('click', clickHandler)
        window.open = originalOpen
        cleanup = null
    }
}
