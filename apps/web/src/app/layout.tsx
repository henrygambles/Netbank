import type { Metadata } from 'next'
import { Providers } from '@/components/layout/Providers'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: { default: 'Netbank', template: '%s | Netbank' },
  description: 'Banking built for humans. Not spreadsheets.',
  themeColor: '#ff3465',
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  openGraph: {
    title: 'Netbank',
    description: 'Banking built for humans. Not spreadsheets.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
