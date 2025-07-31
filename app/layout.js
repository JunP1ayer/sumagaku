export const metadata = {
  title: 'スマ学',
  description: '名古屋大学スマホ断ロッカー',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}