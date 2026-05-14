import './globals.css'
import type { Metadata } from 'next'
import { Providers } from '@/lib/providers'
import { Nav } from '@/lib/nav'

export const metadata: Metadata = {
  title: 'effector-tanstack-query — SSR example',
  description:
    'Per-request fork scope + dehydrate/hydrate for hydrationless first paint, wired through @effector/next.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Nav />
          {children}
        </Providers>
      </body>
    </html>
  )
}
