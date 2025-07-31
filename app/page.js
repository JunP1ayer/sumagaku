export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif',
      backgroundColor: '#f5f5f5'
    }}>
      <h1 style={{
        color: '#0F7A60',
        fontSize: '4rem',
        margin: '0 0 1rem 0',
        textAlign: 'center'
      }}>
        スマ学
      </h1>
      <p style={{
        fontSize: '1.5rem',
        color: '#666',
        textAlign: 'center'
      }}>
        名古屋大学スマホ断ロッカー
      </p>
    </div>
  )
}