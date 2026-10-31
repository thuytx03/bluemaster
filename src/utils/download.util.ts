import { ESocialProvider } from "src/constants/enum"
import useDownloadProcesses from "src/stores/download-process.store"

export const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

interface IDownloadInBatchesParams<T> {
  items: T[]
  /** `order` is 1-based across the whole list */
  processItem: (item: T, order: number) => Promise<unknown>
  batchSize?: number
  onBatchCompleted?: (processedCount: number) => void | Promise<void>
  delayBetweenBatchesMs?: number
}

/**
 * Process `items` in chunks of `batchSize`; every chunk runs concurrently and
 * a failing item never aborts its siblings (allSettled).
 */
export const downloadInBatches = async <T>({
  items,
  processItem,
  batchSize = 1,
  onBatchCompleted,
  delayBetweenBatchesMs = 0
}: IDownloadInBatchesParams<T>) => {
  const size = Math.max(1, batchSize)
  for (let i = 0; i < items.length; i += size) {
    const to = Math.min(i + size, items.length)
    const slice = items.slice(i, to)
    await Promise.allSettled(slice.map((item, idx) => processItem(item, i + idx + 1)))
    if (onBatchCompleted) await onBatchCompleted(to)
    if (delayBetweenBatchesMs > 0 && to < items.length) {
      await delay(delayBetweenBatchesMs)
    }
  }
}

interface IPromisePoolParams<T> {
  items: T[]
  concurrency: number
  worker: (item: T, index: number) => Promise<unknown>
}

/** Run `worker` over `items` with at most `concurrency` in flight at once. */
export const promisePool = async <T>({ items, concurrency, worker }: IPromisePoolParams<T>) => {
  let next = 0
  const run = async (): Promise<void> => {
    const index = next++
    if (index >= items.length) return
    try {
      await worker(items[index], index)
    } catch {
      // errors are reported by the worker itself
    }
    await run()
  }
  const lanes = Array.from({ length: Math.max(1, Math.min(concurrency, items.length)) }, run)
  await Promise.all(lanes)
}

interface IRetryOptions<T> {
  maxRetries?: number
  delayMs?: number
  shouldRetry?: (result: T) => boolean
}

export const retryWrapper = async <T>(
  fn: () => Promise<T>,
  { maxRetries = 15, delayMs = 0, shouldRetry }: IRetryOptions<T> = {}
): Promise<T> => {
  let lastError: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn()
      if (shouldRetry && shouldRetry(result)) {
        if (attempt === maxRetries) break
        if (delayMs > 0) await delay(delayMs)
        continue
      }
      return result
    } catch (error) {
      lastError = error
      if (attempt === maxRetries) throw error
      if (delayMs > 0) await delay(delayMs)
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Max retries exceeded")
}

export const isBulkDownloadProcessExist = (
  provider: ESocialProvider,
  processId: string
) =>
  useDownloadProcesses
    .getState()
    .getBulkProcessesBySocial(provider)
    .some((p) => p.id === processId)

export const isSingleDownloadProcessExist = (processId: string) =>
  useDownloadProcesses
    .getState()
    .singleProcesses.some((p) => p.id === processId)
