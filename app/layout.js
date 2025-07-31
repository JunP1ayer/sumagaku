import { Providers } from './providers'

export const metadata = {
  title: 'スマ学 - 名古屋大学スマホ断ロッカー',
  description: '集中力を高めるスマートフォンロッカーシステム',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#0F7A60',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}