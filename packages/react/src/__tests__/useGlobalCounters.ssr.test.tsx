// @vitest-environment node
//
// Node env (no jsdom): `renderToString` drives `useSyncExternalStore` down its
// server path, exercising the `getServerSnapshot` (`() => 0`) argument of
// useIsFetching / useIsMutating. On the server there is no subscription — the
// snapshot is read once and must be a stable `0`.
import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { Provider } from 'effector-react'
import { fork } from 'effector'
import { QueryClient } from '@tanstack/query-core'
import { $queryClient } from '@effector-tanstack-query/core'
import { useIsFetching, useIsMutating } from '..'

describe('useIsFetching / useIsMutating (SSR)', () => {
  it('render to "0" on the server via getServerSnapshot', () => {
    const queryClient = new QueryClient()
    const scope = fork({ values: [[$queryClient, queryClient]] })

    function Counters() {
      return (
        <>
          <span>f:{useIsFetching()}</span>
          <span>m:{useIsMutating()}</span>
        </>
      )
    }

    const html = renderToString(
      <Provider value={scope}>
        <Counters />
      </Provider>,
    )

    expect(html).toContain('f:<!-- -->0')
    expect(html).toContain('m:<!-- -->0')
  })
})
