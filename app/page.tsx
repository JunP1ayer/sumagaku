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

export default function Home(): JSX.Element {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const features = [
    {
      icon: <LockOutlined sx={{ color: 'primary.main' }} />,
      title: 'セキュア',
      description: '安全にスマホを保管'
    },
    {
      icon: <TimerOutlined sx={{ color: 'primary.main' }} />,
      title: 'タイマー設定',
      description: '集中時間をカスタマイズ'
    },
    {
      icon: <TrendingUpOutlined sx={{ color: 'primary.main' }} />,
      title: '成果向上',
      description: '学習効率を最大化'
    }
  ]

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F8F9FA 0%, #E8F5E8 100%)',
      py: { xs: 1, sm: 2 },
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <Container maxWidth="md" sx={{ 
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        px: { xs: 2, sm: 3 }
      }}>
        {/* ヒーローセクション */}
        <Fade in={mounted} timeout={1000}>
          <Box sx={{ 
            textAlign: 'center', 
            mb: { xs: 1, sm: 2 },
            mt: { xs: 2, sm: 3 }
          }}>
            <Grow in={mounted} timeout={1200}>
              <Box sx={{ mb: { xs: 1, sm: 2 } }}>
                <PhoneAndroidOutlined sx={{ 
                  fontSize: { xs: 40, sm: 50, md: 60 }, 
                  color: 'primary.main',
                  mb: 0.5,
                  filter: 'drop-shadow(0 2px 4px rgba(15, 122, 96, 0.3))'
                }} />
                <Typography 
                  variant="h2" 
                  component="h1"
                  sx={{ 
                    background: 'linear-gradient(135deg, #0F7A60 0%, #4A9B7E 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 0.5,
                    fontSize: { xs: '2.5rem', sm: '3rem', md: '3.75rem' },
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
              sx={{ 
                mb: { xs: 1, sm: 1.5 }, 
                fontSize: { xs: '0.75rem', sm: '0.85rem' }, 
                p: { xs: 1, sm: 1.5 },
                '& .MuiChip-icon': {
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }
              }}
            />
            
            <Typography 
              variant="h5" 
              color="text.secondary" 
              sx={{ 
                mb: { xs: 1, sm: 1.5 }, 
                fontWeight: 400,
                fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
                lineHeight: 1.3
              }}
            >
              スマートフォン断ちで<br />
              集中力を最大化
            </Typography>

            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ 
                mb: { xs: 2, sm: 2.5 }, 
                maxWidth: '600px', 
                mx: 'auto', 
                lineHeight: 1.4,
                fontSize: { xs: '0.875rem', sm: '0.95rem', md: '1rem' },
                px: { xs: 1, sm: 0 }
              }}
            >
              図書館での学習効率を向上させる革新的なロッカーシステム。
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                スマートフォンを安全に預けて、集中できる学習環境を作りましょう。
              </Box>
            </Typography>

            <Button
              variant="contained"
              size="large"
              onClick={() => router.push('/login')}
              sx={{ 
                px: { xs: 4, sm: 5, md: 6 }, 
                py: { xs: 1.5, sm: 1.75, md: 2 }, 
                fontSize: { xs: '1rem', sm: '1.05rem', md: '1.1rem' },
                borderRadius: { xs: 4, sm: 5, md: 6 },
                boxShadow: '0 4px 16px rgba(15, 122, 96, 0.3)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(15, 122, 96, 0.4)',
                }
              }}
            >
              今すぐ利用開始
            </Button>
          </Box>
        </Fade>

        {/* 特徴セクション */}
        <Box sx={{ mb: { xs: 2, sm: 3 }, flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} sx={{ 
            display: { xs: 'flex', md: 'flex' },
            flexDirection: { xs: 'row', md: 'row' },
            justifyContent: 'center',
            alignItems: 'stretch',
            flexWrap: { xs: 'nowrap', md: 'wrap' },
            overflowX: { xs: 'auto', md: 'visible' },
            mx: { xs: -2, sm: 0 },
            px: { xs: 2, sm: 0 },
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none'
          }}>
            {features.map((feature, index) => (
              <Grid item xs={4} md={4} key={index} sx={{ 
                minWidth: { xs: '120px', sm: '140px' },
                flex: { xs: '0 0 auto', md: '1 1 auto' }
              }}>
                <Grow in={mounted} timeout={1000 + index * 200}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      textAlign: 'center',
                      transition: 'all 0.3s ease',
                      backgroundColor: { xs: 'rgba(255, 255, 255, 0.95)', sm: 'background.paper' },
                      boxShadow: { xs: 1, sm: 2 },
                      '&:hover': {
                        transform: { xs: 'none', sm: 'translateY(-4px)' },
                        boxShadow: { xs: 1, sm: '0 8px 24px rgba(0, 0, 0, 0.15)' },
                      }
                    }}
                  >
                    <CardContent sx={{ 
                      p: { xs: 1.5, sm: 2, md: 2.5 },
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%'
                    }}>
                      <Box sx={{ mb: { xs: 1, sm: 1.5 } }}>
                        <Box sx={{ 
                          '& svg': { 
                            fontSize: { xs: 24, sm: 28, md: 32 } 
                          } 
                        }}>
                          {feature.icon}
                        </Box>
                      </Box>
                      <Typography variant="h6" sx={{ 
                        mb: { xs: 0.5, sm: 1, md: 1.5 }, 
                        fontWeight: 600,
                        fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' },
                        lineHeight: 1.2
                      }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{
                        fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' },
                        lineHeight: 1.3,
                        display: { xs: 'none', sm: 'block' }
                      }}>
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  )
}