'use client'

import { 
  Container, 
  Box, 
  Typography, 
  Button, 
  Fade
} from '@mui/material'
import { 
  PhoneAndroidOutlined
} from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home(): JSX.Element {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])


  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F8F9FA 0%, #E8F5E8 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      px: 2,
      py: 3
    }}>
      <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
        {/* シンプルなヒーロー */}
        <Fade in={mounted} timeout={800}>
          <Box>
            <PhoneAndroidOutlined sx={{ 
              fontSize: { xs: 48, sm: 64 }, 
              color: 'primary.main',
              mb: 1
            }} />
            
            <Typography 
              variant="h1" 
              component="h1"
              sx={{ 
                fontSize: { xs: '2.5rem', sm: '3.5rem' },
                fontWeight: 700,
                color: 'primary.main',
                mb: 1
              }}
            >
              スマ学
            </Typography>
            
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ 
                mb: 4,
                fontSize: { xs: '1rem', sm: '1.2rem' },
                fontWeight: 400
              }}
            >
              スマホを預けて集中学習
            </Typography>

            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={() => router.push('/login')}
              sx={{ 
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(15, 122, 96, 0.3)',
                maxWidth: '280px',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(15, 122, 96, 0.4)',
                }
              }}
            >
              ログイン・利用開始
            </Button>
          </Box>
        </Fade>
      </Container>
    </Box>
  )
}