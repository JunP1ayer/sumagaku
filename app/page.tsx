export default function HomePage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{ color: '#0F7A60', fontSize: '3rem', margin: '0 0 1rem 0' }}>
        スマ学
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#666' }}>
        名古屋大学スマホ断ロッカー
      </p>
    </div>
  )
}