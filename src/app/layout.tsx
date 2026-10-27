import type { Metadata } from 'next'
import { Figtree } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'

const figtree = Figtree({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-figtree',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Task Management & SLA Engine',
  description: 'Enterprise task tracking with real-time SLA metrics and multi-view boards',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`h-full w-full overflow-hidden bg-white ${figtree.variable}`}>
      <body className="h-full w-full overflow-hidden font-sans text-slate-900 bg-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
