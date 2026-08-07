import { Writable } from 'node:stream'
import { describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import { renderToPipeableStream } from 'react-dom/server'
import { Provider } from 'effector-react'
import { fork } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import { createQuery } from '@effector-tanstack-query/core'
import { queryKey } from './test-utils'
import { useQuery, useSuspenseQuery } from '..'
import type { Scope, StoreWritable } from 'effector'

// Same bridge as `suspense.test.tsx`: the public interfaces expose these as
// read-only `Store<T>` while `fork({ values })` wants `StoreWritable<T>` —
// at runtime they are one and the same store.
type StoreSeed = [StoreWritable<any>, any]

/**
 * Streaming-SSR harness, shaped like the Next.js App Router pass over a
 * `'use client'` subtree: render into a Node stream, wait for every
 * Suspense boundary to settle (`onAllReady`), collect the HTML and every
 * error React reported.
 *
 * `onAllReady` is deliberate — it is also the assertion that the render
 * TERMINATES. A hook that "suspends forever" on the server (throwing a
 * never-resolving promise) would emit the shell but never complete the
 * stream; here that shows up as a test timeout instead of a green run.
 */
async function renderToHtml(
  scope: Scope,
  ui: React.ReactElement,
): Promise<{ html: string; errors: unknown[] }> {
  const errors: unknown[] = []
  let html = ''

  await new Promise<void>((resolve, reject) => {
    const sink = new Writable({
      write(chunk, _enc, cb) {
        html += chunk.toString()
        cb()
      },
      final(cb) {
        cb()
        resolve()
      },
    })

    const { pipe } = renderToPipeableStream(
      <Provider value={scope}>{ui}</Provider>,
      {
        onError(error) {
          errors.push(error)
        },
        onAllReady() {
          pipe(sink)
        },
        onShellError(error) {
          reject(error)
        },
      },
    )
  })

  // React sprinkles `<!-- -->` separators between text nodes and `<!--$-->`
  // boundary markers into the stream; strip them so assertions can match the
  // rendered text as written in the component.
  return { html: html.replace(/<!--.*?-->/g, ''), errors }
}

const POKEMON = { name: 'bulbasaur' }

function makeQuery(name: string) {
  // No explicit QueryClient — the factory resolves it from `$queryClient`
  // in the rendering scope, exactly like the SSR example's queries.
  return createQuery<typeof POKEMON>({
    name,
    queryKey: queryKey(),
    queryFn: () => Promise.resolve(POKEMON),
  })
}

function Page({ query }: { query: ReturnType<typeof makeQuery> }) {
  const { data } = useSuspenseQuery(query)
  return <span>data: {data.name}</span>
}

function tree(query: ReturnType<typeof makeQuery>) {
  return (
    <React.Suspense fallback={<span>loading</span>}>
      <Page query={query} />
    </React.Suspense>
  )
}

describe('useSuspenseQuery — server render (issue #15)', () => {
  it('streams data when the rendering scope carries a QueryClient', async () => {
    const query = makeQuery('ssr.withClient')
    const scope = fork({
      values: [[query.$queryClient, new QueryClient()]] as StoreSeed[],
    })

    const { html, errors } = await renderToHtml(scope, tree(query))

    expect(errors).toEqual([])
    expect(html).toContain('data: bulbasaur')
  })

  it('serves prefetched stores when the scope has no QueryClient', async () => {
    // What `prefetchQueries` + `serialize(scope)` produce today: the
    // instance stores are gone (`serialize: 'ignore'`) but `$status` /
    // `$data` arrived, so the hook returns synchronously.
    const query = makeQuery('ssr.prefetched')
    const scope = fork({
      values: [
        [query.$data, POKEMON],
        [query.$status, 'success'],
      ] as StoreSeed[],
    })

    const { html, errors } = await renderToHtml(scope, tree(query))

    expect(errors).toEqual([])
    expect(html).toContain('data: bulbasaur')
  })

  // Issue #15 with neither channel wired — a query meant to run in the browser
  // only. `<EffectorNext values={serialize(scope)}>` drops `$queryClient`, and
  // without a prefetch `$status` is still 'pending', so nothing can be fetched
  // here. The hook throws a bail-out: the `<Suspense>` fallback goes into the
  // HTML and React re-renders the boundary on the client, where the scope's
  // client is set. Nothing is fetched on the server.
  //
  // The environment check is `typeof window === 'undefined'`, so the jsdom
  // default has to be removed for this render to take the server branch.
  it('bails out to the client when there is neither a QueryClient nor prefetched data', async () => {
    const query = makeQuery('ssr.noClientNoPrefetch')
    const scope = fork()

    vi.stubGlobal('window', undefined)
    let result: Awaited<ReturnType<typeof renderToHtml>>
    try {
      result = await renderToHtml(scope, tree(query))
    } finally {
      vi.unstubAllGlobals()
    }

    // Next skips logging errors carrying this digest (`isBailoutToCSRError`)
    // and keeps React's normal fallback-then-client-render recovery, so a
    // client-only query costs no application error in the server logs.
    expect(
      result.errors.map((e) => (e as { digest?: string }).digest),
    ).toEqual(['BAILOUT_TO_CLIENT_SIDE_RENDERING'])
    expect(String(result.errors[0])).toMatch(
      /Bail out to client-side rendering.*useSuspenseQuery/,
    )
    expect(result.html).toContain('loading')
    expect(result.html).not.toContain('data: bulbasaur')
  })

  it('keeps the loud, actionable error on the client', async () => {
    // Same state in the browser is a real misconfiguration: nothing will ever
    // fetch, so the message has to name the fix instead of bailing out.
    const query = makeQuery('ssr.noClientOnTheClient')

    const { errors } = await renderToHtml(fork(), tree(query))

    expect(String(errors[0])).toMatch(/no QueryClient is set/)
    expect((errors[0] as { digest?: string }).digest).toBeUndefined()
  })

  // Contrast: the non-suspense hook survives the exact same scope, because
  // 'pending' is a value it can return instead of a state it has to throw.
  it('useQuery renders its pending branch in the same client-less scope', async () => {
    const query = makeQuery('ssr.plainUseQuery')
    const scope = fork()

    function PlainPage() {
      const { data, isPending } = useQuery(query)
      return <span>{isPending ? 'pending' : `data: ${data?.name}`}</span>
    }

    const { html, errors } = await renderToHtml(scope, <PlainPage />)

    expect(errors).toEqual([])
    expect(html).toContain('pending')
  })

})
