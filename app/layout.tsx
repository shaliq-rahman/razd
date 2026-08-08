import type { Metadata, Viewport } from 'next'
import { Geist, Poppins } from 'next/font/google'
import './globals.css'

/**
 * Poppins is the voice of the product — geometric, round, friendly, and the
 * face you asked for. It carries every heading, label and line of body copy.
 *
 * Geist stays for one job only: figures. Poppins has no tabular numerals, so
 * currency set in it visibly jitters as digits change (a 1 is far narrower
 * than a 4). Amounts therefore render in Geist's tabular figures via the
 * .tabular-nums rule below, which keeps columns of rupees locked in place.
 */
const poppins = Poppins({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Razd رصد — Money, tracked',
  description: 'Track balances and spending across all your accounts.',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Razd' },
  icons: {
    icon: [{ url: '/razd-app-icon.png', type: 'image/png' }],
    apple: '/razd-app-icon.png',
  },
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
      className={`${geistSans.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
