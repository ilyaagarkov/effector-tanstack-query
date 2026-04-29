// Local replacements for @tanstack/query-test-utils — only the helpers we use.

let queryKeyCount = 0

/** Returns a fresh, unique query key per call (process-scoped counter). */
export const queryKey = (): Array<string> => {
  queryKeyCount++
  return [`query_${queryKeyCount}`]
}

/** Promise-based delay; works with vi.useFakeTimers + advanceTimersByTimeAsync. */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
