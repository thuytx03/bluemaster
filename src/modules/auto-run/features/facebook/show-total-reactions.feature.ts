import { hookXHR } from 'src/modules/auto-run/utils/ajax-hook.util'
import { notify, getNumberFormatter } from 'src/modules/auto-run/utils/dom.util'
import { fetchGraphQl, getFbdtsg } from 'src/modules/auto-run/utils/fb.util'

const CACHED: Record<string, 'loading' | { total: number; each: Record<string, number> }> = {}

const ReactionId: Record<string, string> = {
    '👍': '1635855486666999',
    '💖': '1678524932434102',
    '🥰': '613557422527858',
    '😆': '115940658764963',
    '😲': '478547315650144',
    '😔': '908563459236466',
    '😡': '444813342392137',
}

async function getPostReactionsCount(id: string, reactionId: string): Promise<number> {
    const res = await fetchGraphQl(
        {
            fb_api_caller_class: 'RelayModern',
            fb_api_req_friendly_name: 'CometUFIReactionIconTooltipContentQuery',
            variables: { feedbackTargetID: id, reactionID: reactionId },
            doc_id: '6235145276554312',
        },
        (await getFbdtsg()) ?? undefined,
    )
    const json = JSON.parse(res || '{}')
    return json?.data?.feedback?.reactors?.count ?? 0
}

async function getTotalReactionCount(id: string) {
    if (CACHED[id] === 'loading') return

    const { setText, closeAfter } = notify({ msg: '❤️ Bluemaster: Counting reactions...', duration: 10000 })
    const fmt = getNumberFormatter('standard')

    if (!CACHED[id]) {
        CACHED[id] = 'loading'
        const res: { total: number; each: Record<string, number> } = { total: 0, each: {} }
        for (const [name, reactionId] of Object.entries(ReactionId)) {
            const count = await getPostReactionsCount(id, reactionId)
            res.total += count
            res.each[name] = count
            setText(`❤️ Bluemaster: Counting ${name}... Total: ${fmt.format(res.total)}`)
        }
        CACHED[id] = res
    }

    const result = CACHED[id] as { total: number; each: Record<string, number> }
    const breakdown = Object.entries(result.each)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => `${fmt.format(v)}${k}`)
        .join(', ')
    setText(`Total ${fmt.format(result.total)} reactions. Includes: ${breakdown}`)
    closeAfter(10000)
}

export function activate() {
    return hookXHR({
        onAfterSend(_, dataSend, response) {
            const s = dataSend?.toString?.() ?? ''
            if (
                s.includes('CometUFIReactionsCountTooltipContentQuery') ||
                s.includes('CometUFIReactionIconTooltipContentQuery')
            ) {
                try {
                    const json = JSON.parse(response)
                    if (json?.data?.feedback?.reaction_display_config?.reaction_display_strategy === 'HIDE_COUNTS') {
                        getTotalReactionCount(json.data.feedback.id)
                    }
                } catch { /* ignore */ }
            }
        },
    })
}
