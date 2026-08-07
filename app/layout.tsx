import type { Metadata, Viewport } from 'next'
import { Geist, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

/**
 * Two faces, each doing one job. Plus Jakarta Sans is the display voice —
 * geometric and a little characterful, which is what makes the product feel
 * designed rather than defaulted. Geist carries body copy and every figure,
 * because its tabular numerals keep currency columns from shifting.
 */
const jakarta = Plus_Jakarta_Sans({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  display: 'swap',
})

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Razd — Money, tracked',
  description: 'Track balances and spending across all your accounts.',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Razd' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  // Lets the app paint under the notch and home indicator, which the safe-area
  // insets in the layout and navbar then account for.
  viewportFit: 'cover',
  themeColor: '#f7f5fb',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  )
}
