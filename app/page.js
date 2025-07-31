'use client'

import { 
  Container, 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Grid, 
  Chip,
  Fade,
  Grow
} from '@mui/material'
import { 
  LockOutlined, 
  SchoolOutlined, 
  TimerOutlined, 
  TrendingUpOutlined,
  PhoneAndroidOutlined
} from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const features = [
    {
      icon: <LockOutlined sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'セキュア',
      description: '安全にスマホを保管'
    },
    {
      icon: <TimerOutlined sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'タイマー設定',
      description: '集中時間をカスタマイズ'
    },
    {
      icon: <TrendingUpOutlined sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: '成果向上',
      description: '学習効率を最大化'
    }
  ]

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F8F9FA 0%, #E8F5E8 100%)',
      py: 2
    }}>
      <Container maxWidth="md">
        {/* ヒーローセクション */}
        <Fade in={mounted} timeout={1000}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Grow in={mounted} timeout={1200}>
              <Box sx={{ mb: 3 }}>
                <PhoneAndroidOutlined sx={{ 
                  fontSize: 60, 
                  color: 'primary.main',
                  mb: 1,
                  filter: 'drop-shadow(0 4px 8px rgba(15, 122, 96, 0.3))'
                }} />
                <Typography 
                  variant="h2" 
                  component="h1"
                  sx={{ 
                    background: 'linear-gradient(135deg, #0F7A60 0%, #4A9B7E 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1,
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  スマ学
                </Typography>
              </Box>
            </Grow>
            
            <Chip 
              icon={<SchoolOutlined />}
              label="名古屋大学公式"
              color="primary"
              variant="outlined"
              sx={{ mb: 2, fontSize: '0.9rem', p: 1.5 }}
            />
            
            <Typography 
              variant="h5" 
              color="text.secondary" 
              sx={{ mb: 2, fontWeight: 400 }}
            >
              スマートフォン断ちで<br />
              集中力を最大化
            </Typography>

            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ mb: 3, maxWidth: '600px', mx: 'auto', lineHeight: 1.6 }}
            >
              図書館での学習効率を向上させる革新的なロッカーシステム。
              スマートフォンを安全に預けて、集中できる学習環境を作りましょう。
            </Typography>

            <Button
              variant="contained"
              size="large"
              onClick={() => router.push('/login')}
              sx={{ 
                px: 6, 
                py: 2, 
                fontSize: '1.1rem',
                borderRadius: 6,
                boxShadow: '0 8px 24px rgba(15, 122, 96, 0.3)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 32px rgba(15, 122, 96, 0.4)',
                }
              }}
            >
              今すぐ利用開始
            </Button>
          </Box>
        </Fade>

        {/* 特徴セクション */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Grow in={mounted} timeout={1000 + index * 200}>
                <Card 
                  sx={{ 
                    height: '100%',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
                    }
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ '& svg': { fontSize: 32 } }}>
                        {feature.icon}
                      </Box>
                    </Box>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grow>
            </Grid>
          ))}
        </Grid>

        {/* CTAセクション */}
        <Fade in={mounted} timeout={1500}>
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #0F7A60 0%, #4A9B7E 100%)',
              color: 'white',
              textAlign: 'center'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 600 }}>
                学習効率を向上させませんか？
              </Typography>
              <Typography variant="body1" sx={{ mb: 2.5, opacity: 0.9 }}>
                今すぐスマ学を始めて、集中できる学習環境を手に入れましょう
              </Typography>
              <Button
                variant="contained"
                size="large"
                sx={{ 
                  bgcolor: 'white', 
                  color: 'primary.main',
                  px: 4,
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    transform: 'scale(1.05)',
                  }
                }}
              >
                ロッカーを利用する
              </Button>
            </CardContent>
          </Card>
        </Fade>
      </Container>
    </Box>
  )
}