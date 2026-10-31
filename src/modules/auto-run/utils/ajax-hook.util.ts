// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any
type HookEntry = { fn: AnyFn; id: string }

function randId() { return Math.random().toString(36).slice(2) }

function hook(configs: Array<{ fn: AnyFn | undefined; arr: HookEntry[] }>) {
    const unsubs: Array<() => void> = []
    for (const { fn, arr } of configs) {
        if (typeof fn !== 'function') continue
        const id = randId()
        arr.push({ fn, id })
        unsubs.push(() => { const i = arr.findIndex(e => e.id === id); if (i !== -1) arr.splice(i, 1) })
    }
    return () => unsubs.forEach(f => f())
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

type FetchRequest = { url: string; options?: RequestInit }
export type FetchBeforeFn = (url: string, options?: RequestInit) => Promise<FetchRequest | null | undefined> | FetchRequest | null | undefined
export type FetchAfterFn = (url: string, options: RequestInit | undefined, response: Response) => Promise<Response | null | undefined> | Response | null | undefined

const onBeforeFetchFn: HookEntry[] = []
const onAfterFetchFn: HookEntry[] = []
let fetchReady = false

function initFetch() {
    const orig = window.fetch
    window.fetch = async function (urlOrRequest: RequestInfo | URL, initOptions?: RequestInit) {
        let url = urlOrRequest instanceof URL ? urlOrRequest.href : typeof urlOrRequest === 'string' ? urlOrRequest : (urlOrRequest as Request).url
        let opts = initOptions

        if (urlOrRequest instanceof Request) {
            opts = initOptions || {}
            const req = urlOrRequest as Request
            for (const k of ['method', 'mode', 'credentials', 'cache', 'redirect', 'referrer', 'integrity'] as const) {
                if (req[k] !== undefined) (opts as Record<string, unknown>)[k] = req[k]
            }
        }

        let req: FetchRequest = { url, options: opts }
        for (const { fn } of onBeforeFetchFn) {
            const res: FetchRequest | null | undefined = await fn(req.url, req.options)
            if (res === null) return new Response(null, { status: 0 })
            if (res) req = res
        }

        if (urlOrRequest instanceof Request && (urlOrRequest as Request).url !== req.url) {
            urlOrRequest = new Request(req.url, urlOrRequest as Request)
        }

        let response = await orig(urlOrRequest, opts)
        for (const { fn } of onAfterFetchFn) {
            const res: Response | null | undefined = await fn(req.url, req.options, response)
            if (res === null) return new Response(null, { status: 0 })
            if (res) response = res
        }
        return response
    }
}

export function hookFetch({ onBefore, onAfter }: { onBefore?: FetchBeforeFn; onAfter?: FetchAfterFn } = {}) {
    if (!fetchReady) { initFetch(); fetchReady = true }
    return hook([
        { fn: onBefore as AnyFn | undefined, arr: onBeforeFetchFn },
        { fn: onAfter as AnyFn | undefined, arr: onAfterFetchFn },
    ])
}

// ─── XHR ─────────────────────────────────────────────────────────────────────

export type XHROpenParams = { method: string; url: string; async: boolean; user?: string | null; password?: string | null }
type XHRBody = Document | XMLHttpRequestBodyInit | null | undefined

export type XHROpenFn = (params: XHROpenParams) => Promise<XHROpenParams | null | void> | XHROpenParams | null | void
export type XHRSendFn = (params: XHROpenParams, data: XHRBody) => Promise<XHRBody | null | void> | XHRBody | null | void
export type XHRAfterFn = (params: XHROpenParams, data: XHRBody, response: string) => void

const onBeforeOpenXHRFn: HookEntry[] = []
const onBeforeSendXHRFn: HookEntry[] = []
const onAfterSendXHRFn: HookEntry[] = []
let xhrReady = false

function initXhr() {
    const OrigXHR = window.XMLHttpRequest
    // @ts-ignore — replacing constructor intentionally
    window.XMLHttpRequest = new Proxy(OrigXHR, {
        construct(target: typeof XMLHttpRequest, args: unknown[]) {
            const inst = new target(...(args as [])) as XMLHttpRequest & {
                open: (...a: unknown[]) => void
                send: (d?: XHRBody) => void
            }
            let p: XHROpenParams = { method: 'GET', url: '', async: true }

            // @ts-ignore — overriding open with async version intentionally
            inst.open = async function (method: string, url: string, isAsync: boolean, user?: string | null, pw?: string | null) {
                p = { method, url, async: isAsync ?? true, user, password: pw }
                for (const { fn } of onBeforeOpenXHRFn) {
                    const res: XHROpenParams | null | void = await fn(p)
                    if (res === null) return
                    if (res) p = res
                }
                ;(XMLHttpRequest.prototype.open as AnyFn).call(inst, p.method, p.url, p.async, p.user ?? null, p.password ?? null)
            }

            const origSend = inst.send.bind(inst)
            inst.send = async function (dataSend?: XHRBody) {
                for (const { fn } of onBeforeSendXHRFn) {
                    const res: XHRBody | null | void = await fn(p, dataSend)
                    if (res === null) return
                    if (res !== undefined) dataSend = res as XHRBody
                }
                inst.addEventListener('load', function () {
                    for (const { fn } of onAfterSendXHRFn) fn(p, dataSend, inst.response)
                })
                origSend(dataSend)
            }
            return inst
        },
    })
}

export function hookXHR({ onBeforeOpen, onBeforeSend, onAfterSend }: { onBeforeOpen?: XHROpenFn; onBeforeSend?: XHRSendFn; onAfterSend?: XHRAfterFn } = {}) {
    if (!xhrReady) { initXhr(); xhrReady = true }
    return hook([
        { fn: onBeforeOpen as AnyFn | undefined, arr: onBeforeOpenXHRFn },
        { fn: onBeforeSend as AnyFn | undefined, arr: onBeforeSendXHRFn },
        { fn: onAfterSend as AnyFn | undefined, arr: onAfterSendXHRFn },
    ])
}

// ─── WebSocket (experimental) ─────────────────────────────────────────────────

export type WSModifyUrlFn = (url: string) => string | null | void
export type WSBeforeFn = (data: unknown, url: string, ws: WebSocket) => unknown | null | void
export type WSAfterFn = (event: MessageEvent, url: string, ws: WebSocket) => MessageEvent | null | void

const modifyUrlWsFn: HookEntry[] = []
const onBeforeWSFn: HookEntry[] = []
const onAfterWSFn: HookEntry[] = []
let wsReady = false

const wsOrigSend = new WeakMap<WebSocket, WebSocket['send']>()
const wsOrigAddEventListener = new WeakMap<WebSocket, WebSocket['addEventListener']>()

function initWS() {
    const _WS = WebSocket
    // @ts-ignore — replacing constructor intentionally
    window.WebSocket = function (url: string, protocols?: string | string[]) {
        let modUrl = url
        for (const { fn } of modifyUrlWsFn) {
            const r: string | null | void = fn(modUrl)
            if (r === null) return null
            if (r) modUrl = r
        }

        const ws = protocols ? new _WS(modUrl, protocols) : new _WS(modUrl)
        wsOrigSend.set(ws, ws.send.bind(ws))
        wsOrigAddEventListener.set(ws, ws.addEventListener.bind(ws))

        ws.send = function (data: string | ArrayBuffer | Blob | ArrayBufferView) {
            let arg: unknown = data
            for (const { fn } of onBeforeWSFn) {
                const r: unknown = fn(arg, ws.url, ws)
                if (r === null) return
                if (r !== undefined) arg = r
            }
            wsOrigSend.get(ws)!(arg as string)
        }

        const origAEL = wsOrigAddEventListener.get(ws)!
        ws.addEventListener = function (type: string, listener: EventListenerOrEventListenerObject, opts?: boolean | AddEventListenerOptions) {
            if (type === 'message') {
                const userFn = typeof listener === 'function' ? listener : listener.handleEvent.bind(listener)
                const wrapped = async (ev: Event) => {
                    let e = ev as MessageEvent
                    for (const { fn } of onAfterWSFn) {
                        const r: MessageEvent | null | void = await fn(e, ws.url, ws)
                        if (r === null) return
                        if (r) e = r
                    }
                    userFn(e)
                }
                origAEL(type, wrapped as EventListener, opts)
                return
            }
            origAEL(type, listener, opts)
        } as WebSocket['addEventListener']

        return ws
    }
}

export function hookWS({ modifyUrl, onBefore, onAfter }: { modifyUrl?: WSModifyUrlFn; onBefore?: WSBeforeFn; onAfter?: WSAfterFn } = {}) {
    if (!wsReady) { initWS(); wsReady = true }
    return hook([
        { fn: modifyUrl as AnyFn | undefined, arr: modifyUrlWsFn },
        { fn: onBefore as AnyFn | undefined, arr: onBeforeWSFn },
        { fn: onAfter as AnyFn | undefined, arr: onAfterWSFn },
    ])
}

// ─── WebSocket.prototype.send (prototype patch, keeps the native constructor) ─

export type WSSendFn = (data: unknown, url: string, ws: WebSocket) => unknown | null | void

const onBeforeWSSendFn: HookEntry[] = []
let wsSendReady = false

function initWSSend() {
    const proto = WebSocket.prototype
    const origSend = proto.send
    proto.send = function (this: WebSocket, data: string | ArrayBufferLike | Blob | ArrayBufferView) {
        let arg: unknown = data
        for (const { fn } of onBeforeWSSendFn) {
            const r: unknown = fn(arg, this.url, this)
            if (r === null) return // dropped
            if (r !== undefined) arg = r
        }
        return origSend.call(this, arg as string)
    }
}

/** Intercept outgoing WebSocket frames. Return null from the callback to drop a frame. */
export function hookWSSend(onBefore: WSSendFn) {
    if (!wsSendReady) { initWSSend(); wsSendReady = true }
    return hook([{ fn: onBefore as AnyFn, arr: onBeforeWSSendFn }])
}

const wsDecoder = new TextDecoder('utf-8', { fatal: false })

/** Best-effort text view of a WebSocket frame (binary MQTT frames included); Blobs are skipped. */
export function wsFrameToString(data: unknown): string {
    if (typeof data === 'string') return data
    if (data instanceof ArrayBuffer) return wsDecoder.decode(data)
    if (ArrayBuffer.isView(data)) return wsDecoder.decode(data as ArrayBufferView)
    return ''
}
