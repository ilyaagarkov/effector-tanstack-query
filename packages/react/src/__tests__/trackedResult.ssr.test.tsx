// @vitest-environment node
//
// Node env (no jsdom): `renderToString` drives `useSyncExternalStore` down its
// server path, so the tracked result (the default) must read the rendering scope through
// `getServerSnapshot`.
import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { Provider } from 'effector-react'
import { fork } from 'effector'
import type { StoreWritable } from 'effector'
import { createQuery } from '@effector-tanstack-query/core'
import { useQuery } from '..'

type StoreSeed = [StoreWritable<any>, any]

describe('useQuery — tracked result (SSR)', () => {
  it('renders the values of a scope rebuilt from serialize()', () => {
    const query = createQuery<string>({
      name: 'tracked.ssr',
      queryKey: ['tracked-ssr'],
      queryFn: async () => 'client',
    })
    // What `prefetchQueries` + `serialize(scope)` leave: data and status,
    // no `$queryClient` / `$observer`.
    const scope = fork({
      values: [
        [query.$data, 'prefetched'],
        [query.$status, 'success'],
      ] as StoreSeed[],
    })

    function Consumer() {
      const { data, status } = useQuery(query)
      return (
        <span>
          {status}:{data}
        </span>
      )
    }

    const html = renderToString(
      <Provider value={scope}>
        <Consumer />
      </Provider>,
    )

    expect(html).toContain('success<!-- -->:<!-- -->prefetched')
  })

  it('keeps concurrent scopes apart', () => {
    const query = createQuery<string>({
      name: 'tracked.ssr.concurrent',
      queryKey: ['tracked-ssr-concurrent'],
      queryFn: async () => 'client',
    })

    function Consumer() {
      const { data } = useQuery(query)
      return <span>{data}</span>
    }

    const htmls = ['alpha', 'beta'].map((value) =>
      renderToString(
        <Provider
          value={fork({
            values: [
              [query.$data, value],
              [query.$status, 'success'],
            ] as StoreSeed[],
          })}
        >
          <Consumer />
        </Provider>,
      ),
    )

    expect(htmls[0]).toContain('alpha')
    expect(htmls[1]).toContain('beta')
  })
})
