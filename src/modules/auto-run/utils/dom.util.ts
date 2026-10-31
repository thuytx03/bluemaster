// DOM utility helpers ported from fb-aio helper.js

export interface NotifyOptions {
    msg?: string
    x?: number
    y?: number
    align?: 'left' | 'right' | 'center'
    styleText?: string
    duration?: number
    id?: string
}

export interface NotifyHandle {
    closeAfter: (time: number) => void
    remove: () => boolean
    setText: (text: string, duration?: number) => boolean
    setPosition: (x: number, y: number) => boolean
}

export function notify({
    msg = '',
    x = window.innerWidth / 2,
    y = window.innerHeight - 100,
    align = 'center',
    styleText = '',
    duration = 3000,
    id = 'bluemaster_notify_div',
}: NotifyOptions = {}): NotifyHandle {
    document.getElementById(id)?.remove()

    let div: HTMLDivElement | null = document.createElement('div')
    div.id = id
    div.style.cssText = [
        `position:fixed`,
        `left:${x}px`,
        `top:${y}px`,
        `padding:10px`,
        `background-color:#333`,
        `color:#fff`,
        `border-radius:5px`,
        `z-index:2147483647`,
        `transition:all 1s ease-out`,
        `max-width:400px`,
        `word-break:break-word`,
        align === 'right' ? 'transform:translateX(-100%)' : align === 'center' ? 'transform:translateX(-50%)' : '',
        styleText,
    ].filter(Boolean).join(';')
    div.textContent = msg
    ;(document.body || document.documentElement).appendChild(div)

    let timers: ReturnType<typeof setTimeout>[] = []

    function closeAfter(time: number) {
        timers.forEach(clearTimeout)
        timers = [
            setTimeout(() => { if (div) { div.style.opacity = '0'; div.style.top = `${y - 50}px` } }, time - 1000),
            setTimeout(() => { div?.remove() }, time),
        ]
    }

    if (duration > 0) closeAfter(duration)

    return {
        closeAfter,
        remove() { if (div) { div.remove(); div = null; return true } return false },
        setText(text, d?) { if (div) { div.textContent = text; if (d) closeAfter(d); return true } return false },
        setPosition(nx, ny) { if (div) { div.style.left = `${nx}px`; div.style.top = `${ny}px`; return true } return false },
    }
}

export function sleep(ms: number) {
    return new Promise<void>(resolve => setTimeout(resolve, ms))
}

export function onElementsAdded(selector: string, callback: (nodes: NodeList) => void, once?: boolean) {
    const initial = document.querySelectorAll(selector)
    if (initial.length) {
        callback(initial)
        if (once) return () => {}
    }

    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            for (const node of Array.from(mutation.addedNodes)) {
                if (node.nodeType !== 1) continue
                const el = node as Element
                const matched = el.matches(selector) ? [el] : Array.from(el.querySelectorAll(selector))
                if (matched.length) {
                    callback(el.matches(selector) ? el.parentElement!.querySelectorAll(selector) : el.querySelectorAll(selector))
                    if (once) { observer.disconnect(); return }
                }
            }
        }
    })
    observer.observe(document, { childList: true, subtree: true })
    return () => observer.disconnect()
}

export function onElementRemoved(element: Element, callback: (node: Node) => void) {
    if (!element.parentElement) throw new Error('element must have parent')
    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            for (const node of Array.from(mutation.removedNodes)) {
                if (node === element) { callback(node); observer.disconnect() }
            }
        }
    })
    observer.observe(element.parentElement, { childList: true })
    return () => observer.disconnect()
}

export function closest(element: Element | null, selector: string): Element | null {
    let el = element
    while (el !== null) {
        if (el.matches(selector)) return el
        const found = el.querySelector(selector)
        if (found) return found
        el = el.parentElement
    }
    return null
}

export function sanitizeName(name: string, modifyIfPossible = true): string {
    if (modifyIfPossible) {
        name = name
            .replaceAll('<', '‹').replaceAll('>', '›').replaceAll(':', '∶')
            .replaceAll('"', '″').replaceAll('/', '∕').replaceAll('\\', '∖')
            .replaceAll('|', '¦').replaceAll('?', '¿')
    }
    return name
        .replace(/[/?<>\\:*|"]/g, '')
        .replace(/[\x00-\x1f\x80-\x9f]/g, '')
        .replace(/^\.+$/, '')
        .replace(/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i, '')
        .replace(/[. ]+$/, '')
}

export function injectCssCode(code: string): HTMLStyleElement {
    const style = document.createElement('style')
    style.textContent = code
    ;(document.head || document.documentElement).appendChild(style)
    return style
}

export function downloadUrl(url: string, filename: string) {
    try {
        const a = document.createElement('a')
        a.href = url; a.download = filename; a.style.display = 'none'
        a.click(); a.remove()
    } catch {
        window.open(url, '_blank')
    }
}

export function downloadData(data: BlobPart, filename: string, type = 'text/plain') {
    const file = new Blob([data], { type })
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url; a.download = filename
    document.body.appendChild(a)
    a.click()
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url) }, 0)
}

const numberFormatCache: Record<string, Intl.NumberFormat> = {}

export function getNumberFormatter(optionSelect: 'compactLong' | 'standard' | 'compactShort' = 'compactShort', locale?: string): Intl.NumberFormat {
    if (!locale) {
        locale = document.documentElement.lang || navigator.language || 'en'
    }
    const notation = optionSelect === 'standard' ? 'standard' : 'compact'
    const compactDisplay = optionSelect === 'compactLong' ? 'long' : 'short'
    const key = locale + notation + compactDisplay
    if (!numberFormatCache[key]) {
        numberFormatCache[key] = new Intl.NumberFormat(locale, { notation, compactDisplay })
    }
    return numberFormatCache[key]
}

export function deepFind(obj: unknown, path: string | string[], once = true, exactPath = false): unknown {
    if (!obj || typeof obj !== 'object') return once ? null : []
    const paths = Array.isArray(path) ? path : path.split('.')
    const result: unknown[] = []
    const stack: Array<{ cur: unknown; idx: number; correct: boolean }> = [{ cur: obj, idx: 0, correct: false }]
    let foundFirst = false

    while (stack.length) {
        const { cur, idx, correct } = stack.pop()!
        if (idx === paths.length) {
            const res = !exactPath ? cur : correct ? cur : null
            if (once) return res
            result.push(res)
            continue
        }
        const key = paths[idx]
        if (cur && typeof cur === 'object') {
            const record = cur as Record<string, unknown>
            if (key in record) {
                foundFirst = true
                stack.push({ cur: record[key], idx: idx + 1, correct: true })
            }
            if (!exactPath || !foundFirst) {
                for (const [k, v] of Object.entries(record)) {
                    if (k !== key && typeof v === 'object' && v !== null) {
                        stack.push({ cur: v, idx, correct: false })
                    }
                }
            }
        }
    }
    return once ? null : result
}

export function parseSafe<T = unknown>(str = '', defaultValue: T = {} as T): T {
    try { return JSON.parse(str) }
    catch { return defaultValue }
}
