import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'effector-tanstack-query — SSR example',
  description:
    'Per-request fork scope + dehydrate/hydrate for hydrationless first paint.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
