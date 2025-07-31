'use client'

import React from 'react'

import { 
  Container,
  Box, 
  Typography,
  Button,
  Fade,
  Zoom,
  Chip,
  Card,
  CardContent,
  Grid,
  IconButton
} from '@mui/material'
import { 
  CheckCircleOutlined,
  EmojiEventsOutlined,
  RestartAltOutlined,
  HomeOutlined,
  TimerOutlined,
  StarOutlined,
  TrendingUpOutlined
} from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAppStore from '../../lib/store'
// Confetti effect removed for simplicity

export default function CompletePage(): JSX.Element {
  const router = useRouter()
  const { isDailyPassValid, startSession, lockers } = useAppStore()
  const [mounted, setMounted] = useState<boolean>(false)
  const [studyTime, setStudyTime] = useState<number>(0)

  const handleQuickStart = (minutes: number): void => {
    const availableLocker = lockers.find(l => l.isAvailable)
    if (availableLocker) {
      startSession(availableLocker.id, minutes)
      router.push('/session')
    } else {
      alert('利用可能なロッカーがありません')
    }
  }

  useEffect(() => {
    setMounted(true)
    
    // 学習時間を取得（デモ用にランダム生成）
    const randomMinutes = Math.floor(Math.random() * 60) + 30
    setStudyTime(randomMinutes)
  }, [])

  const isPassValid = isDailyPassValid()

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F8F9FA 0%, #E8F5E8 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Container maxWidth="sm">
        <Fade in={mounted} timeout={800}>
          <Box sx={{ textAlign: 'center' }}>
            {/* 成功アイコン */}
            <Zoom in={mounted} timeout={1000}>
              <Box>
                <CheckCircleOutlined sx={{ 
                  fontSize: 120, 
                  color: '#4CAF50',
                  mb: 3,
                  filter: 'drop-shadow(0 4px 12px rgba(76, 175, 80, 0.3))'
                }} />
              </Box>
            </Zoom>

            {/* メッセージ */}
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700,
                mb: 2,
                background: 'linear-gradient(135deg, #0F7A60 0%, #4A9B7E 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              お疲れさまでした！
            </Typography>

            {/* 学習時間 */}
            <Zoom in={mounted} timeout={1200}>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                  今回の集中時間
                </Typography>
                <Chip
                  icon={<EmojiEventsOutlined />}
                  label={`${studyTime}分`}
                  color="primary"
                  sx={{
                    fontSize: '1.5rem',
                    py: 3,
                    px: 4,
                    '& .MuiChip-icon': {
                      fontSize: '2rem'
                    }
                  }}
                />
              </Box>
            </Zoom>

            {/* 励ましメッセージ */}
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ mb: 6, maxWidth: 400, mx: 'auto', lineHeight: 1.8 }}
            >
              集中して学習できました！
              この調子で目標に向かって頑張りましょう。
            </Typography>

            {/* よく使われる時間のクイックアクション */}
            {isPassValid && (
              <Zoom in={mounted} timeout={1200}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: 'text.primary' }}>
                    もう一度利用しますか？
                  </Typography>
                  <Grid container spacing={2} justifyContent="center">
                    {[30, 60, 90, 120].map((minutes, index) => (
                      <Grid item key={minutes}>
                        <Card 
                          sx={{ 
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: '0 8px 24px rgba(15, 122, 96, 0.3)'
                            }
                          }}
                          onClick={() => handleQuickStart(minutes)}
                        >
                          <CardContent sx={{ 
                            textAlign: 'center', 
                            py: 2,
                            px: 3,
                            minWidth: 80
                          }}>
                            <TimerOutlined sx={{ 
                              color: 'primary.main', 
                              fontSize: 24,
                              mb: 1
                            }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {minutes}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              分
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Zoom>
            )}

            {/* メインアクションボタン */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
              {isPassValid && (
                <Zoom in={mounted} timeout={1400}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<RestartAltOutlined />}
                    onClick={() => router.push('/dashboard')}
                    sx={{
                      px: 6,
                      py: 2,
                      fontSize: '1.1rem',
                      borderRadius: 3,
                      boxShadow: '0 4px 16px rgba(15, 122, 96, 0.3)',
                      '&:hover': {
                        boxShadow: '0 6px 20px rgba(15, 122, 96, 0.4)',
                        transform: 'translateY(-2px)',
                      }
                    }}
                  >
                    時間を設定して再利用
                  </Button>
                </Zoom>
              )}
              
              <Zoom in={mounted} timeout={1600}>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<HomeOutlined />}
                  onClick={() => router.push('/dashboard')}
                  sx={{
                    px: 6,
                    py: 1.5,
                    fontSize: '1rem',
                    borderRadius: 3,
                  }}
                >
                  ホームに戻る
                </Button>
              </Zoom>
            </Box>

            {/* 一日券情報 */}
            {isPassValid && (
              <Fade in={mounted} timeout={1800}>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ mt: 4, display: 'block', opacity: 0.7 }}
                >
                  一日券は今日中何度でもご利用いただけます
                </Typography>
              </Fade>
            )}
          </Box>
        </Fade>
      </Container>
    </Box>
  )
}