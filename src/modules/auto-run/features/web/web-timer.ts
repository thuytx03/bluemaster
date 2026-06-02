// Tracks active time spent on websites and optionally shows time in page title.
// Runs in ISOLATED world (has access to chrome.storage and chrome.runtime).

const INTERVAL_UPDATE = 1     // seconds
const INTERVAL_SAVE = 10      // seconds
const IDLE_TIME = 60          // seconds before considered idle
const IDLE_TIME_IF_BLUR = 10  // seconds before considered idle when not focused

function throttle<T extends unknown[]>(fn: (...args: T) => void, delay: number) {
    let timer: ReturnType<typeof setTimeout> | null = null
    return (...args: T) => {
        if (!timer) {
            fn(...args)
            timer = setTimeout(() => { timer = null }, delay)
        }
    }
}

function padZero(n: number) { return n.toString().padStart(2, '0') }
function getToday() {
    const d = new Date()
    return `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())}`
}
function secondsToTime(s: number) {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
    return `${h ? h + ':' : ''}${h || m ? padZero(m) + ':' : ''}${padZero(sec)}`
}

async function getTodayTimer() {
    const host = location.hostname || location.href
    const today = getToday()
    const result = await chrome.storage.local.get(['web_timer'])
    let web_timer = result?.web_timer ?? {}
    if (typeof web_timer !== 'object') web_timer = {}
    if (!web_timer[today]) web_timer[today] = {}
    if (!web_timer[today][host]) web_timer[today][host] = 0
    return { web_timer, host, today, value: Math.floor(web_timer[today][host]) as number }
}

async function queryIdleState(threshold: number): Promise<string> {
    return new Promise(resolve => {
        chrome.runtime.sendMessage({ type: 'IDLE_QUERY_STATE', threshold }, (state) => {
            resolve(typeof state === 'string' ? state : 'idle')
        })
    })
}

let webTimerCleanup: (() => void) | null = null

export function activate() {
    if (webTimerCleanup) webTimerCleanup()

    const isMainFrame = window === window.top
    const cleanupFns: Array<() => void> = []

    function addEvt<K extends keyof WindowEventMap>(target: EventTarget, type: K, fn: (e: WindowEventMap[K]) => void, opts?: boolean | AddEventListenerOptions) {
        target.addEventListener(type as string, fn as EventListener, opts)
        cleanupFns.push(() => target.removeEventListener(type as string, fn as EventListener))
    }

    let needUpdate = true
    const updateLastActive = throttle(() => { needUpdate = true }, 1000 / 24)

    const EVENTS = ['pointerdown', 'pointermove', 'pointerup', 'click', 'contextmenu', 'touchstart', 'keydown', 'keyup', 'wheel', 'scroll', 'blur', 'focus'] as const

    if (isMainFrame) {
        EVENTS.forEach(ev => addEvt(window, ev as keyof WindowEventMap, updateLastActive))
        addEvt(window, 'message', (e: MessageEvent) => {
            if (e.data?.type === 'xthuy_web_timer_active') updateLastActive()
        })
        document.addEventListener('visibilitychange', () => { if (!document.hidden) updateLastActive() })
    cleanupFns.push(() => document.removeEventListener('visibilitychange', () => {}))
    } else {
        EVENTS.forEach(ev => {
            addEvt(window, ev as keyof WindowEventMap, throttle(() => {
                window.top?.postMessage({ type: 'xthuy_web_timer_active' }, '*')
            }, 1000 / 24))
        })
        return () => cleanupFns.forEach(fn => fn())
    }

    let lastActive = 0
    let savedValue = 0, currentValue = 0, focusValue = 0

    getTodayTimer().then(({ value }) => { savedValue = value })

    async function getIdleState() {
        const timeToCheck = document.hasFocus() ? IDLE_TIME : IDLE_TIME_IF_BLUR
        if (needUpdate) { lastActive = performance.now(); needUpdate = false }
        const elapsed = performance.now() - lastActive
        if (elapsed < timeToCheck * 1000) return false

        for (const media of Array.from(document.querySelectorAll('video, audio')) as HTMLMediaElement[]) {
            if (media.duration > 0 && !media.paused) return false
        }

        try {
            const t = Math.max(15, IDLE_TIME)
            const state = await queryIdleState(t)
            return state !== 'active'
        } catch {
            return elapsed > timeToCheck * 1000
        }
    }

    async function saveTimer() {
        const { web_timer, today, host } = await getTodayTimer()
        web_timer[today][host] = savedValue + focusValue
        savedValue = web_timer[today][host]
        focusValue = 0
        await chrome.storage.local.set({ web_timer })
    }

    async function makeTitle(revert?: boolean) {
        const invisible = '​'
        let title = document.title
        if (title.includes(invisible)) title = title.split(invisible)[1]
        const result = await chrome.storage.local.get(['web_timer_show_time_on_title'])
        if (result?.web_timer_show_time_on_title) {
            document.title = revert ? title : `${secondsToTime(currentValue)} ${invisible}${title}`
        } else {
            document.title = title
        }
    }

    const updateId = setInterval(async () => {
        const idle = await getIdleState()
        if (!document.hidden && !idle) {
            focusValue++
            currentValue = savedValue + focusValue
            makeTitle()
        }

        const now = new Date()
        if ((now.getHours() === 23 && now.getMinutes() === 59 && now.getSeconds() === 59) || (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() === 0)) {
            saveTimer()
        }
    }, INTERVAL_UPDATE * 1000)

    const saveId = setInterval(saveTimer, INTERVAL_SAVE * 1000)

    addEvt(window, 'beforeunload', saveTimer)

    cleanupFns.push(() => { clearInterval(updateId); clearInterval(saveId); setTimeout(() => makeTitle(true), INTERVAL_UPDATE * 1000) })

    webTimerCleanup = () => cleanupFns.forEach(fn => fn())
    return webTimerCleanup
}
