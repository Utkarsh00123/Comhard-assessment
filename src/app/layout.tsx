/**
 * ============================================================================
 * ROOT APPLICATION LAYOUT (layout.tsx)
 * ============================================================================
 * HOW IT WORKS:
 * Next.js App Router root layout component. It wraps every page in the application.
 * 
 * KEY RESPONSIBILITIES:
 * 1. Typography: Configures Google's Figtree font with multiple weights and injects
 *    the CSS variable `--font-figtree` into the document root.
 * 2. Global Styles: Imports `globals.css` with Tailwind CSS utilities.
 * 3. SEO Metadata: Configures the browser title and descriptive meta tags.
 * 4. Provider Tree: Wraps all child pages with `<Providers>`, giving the entire app
 *    access to authentication and task state.
 */

import type { Metadata } from 'next'
import { Figtree } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'

// Configure Figtree font optimization with font-display: swap for fast rendering
const figtree = Figtree({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-figtree',
  display: 'swap',
})

// Global SEO Metadata
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
        {/* Client-side Providers wrapper providing AuthContext and TaskContext */}
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

