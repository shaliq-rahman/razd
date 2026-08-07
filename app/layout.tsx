import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
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
  themeColor: '#f4f3f7',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  )
}
