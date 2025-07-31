import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'スマ学',
  description: '名古屋大学スマホ断ロッカー',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}