import { Providers } from './providers'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'スマ学 - 名古屋大学スマホ断ロッカー',
  description: '集中力を高めるスマートフォンロッカーシステム',
  viewport: 'width=device-width, initial-scale=1, user-scalable=no, maximum-scale=1',
  themeColor: '#0F7A60',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'format-detection': 'telephone=no',
  }
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="apple-mobile-web-app-title" content="スマ学" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0F7A60" />
      </head>
      <body style={{ touchAction: 'manipulation', userSelect: 'none', WebkitUserSelect: 'none' }}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}