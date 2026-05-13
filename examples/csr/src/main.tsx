import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient } from '@tanstack/query-core'
import { setQueryClient } from '@effector-tanstack-query/core'
import { App } from './app'
import './styles.css'

// One global QueryClient for this CSR app. setQueryClient lets every factory
// pull it without threading it through the call site.
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: 30_000 } },
})
queryClient.mount()
setQueryClient(queryClient)

async function start() {
  if (import.meta.env.DEV) {
    // MSW intercepts /api/* requests so the mutations / optimistic-update
    // examples have something to talk to without a real backend.
    // Init is best-effort — if `public/mockServiceWorker.js` is missing
    // (i.e. you didn't run `pnpm msw:init`), the rest of the app still
    // renders, just the mutation pages will see real /api/* failures.
    try {
      const { worker } = await import('./mocks/browser')
      await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(
        '[example-csr] MSW worker failed to start — mutation pages will be broken until you run `pnpm msw:init`.\n',
        e,
      )
    }
  }

  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  )
}

void start()
