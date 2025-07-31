'use client'

import { 
  Container,
  Box, 
  Typography, 
  Button,
  Slider,
  Paper,
  Fade,
  Zoom
} from '@mui/material'
import { 
  TimerOutlined,
  ArrowBackOutlined,
  PlayArrowOutlined
} from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAppStore from '@/lib/store'

export default function TimerPage(): JSX.Element {
  const router = useRouter()
  const { startSession, isDailyPassValid, lockers } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [hours, setHours] = useState(1)
  const [minutes, setMinutes] = useState(0)

  useEffect(() => {
    setMounted(true)
    // 一日券がない場合は決済ページへ
    if (!isDailyPassValid()) {
      router.push('/payment')
    }
  }, [isDailyPassValid, router])

  const handleStart = () => {
    const totalMinutes = hours * 60 + minutes
    if (totalMinutes < 5) {
      alert('最低5分以上に設定してください')
      return
    }
    
    // 利用可能なロッカーを自動選択
    const availableLocker = lockers.find(l => l.isAvailable)
    if (availableLocker) {
      startSession(availableLocker.id, totalMinutes)
      router.push('/session')
    }
  }

  const formatTime = (h, m) => {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

  const totalMinutes = hours * 60 + minutes

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F7A60 0%, #4A9B7E 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      p: 3,
      position: 'relative'
    }}>
      {/* 戻るボタン */}
      <Button
        startIcon={<ArrowBackOutlined />}
        onClick={() => router.push('/dashboard')}
        sx={{ 
          position: 'absolute', 
          top: 32, 
          left: 32,
          color: 'white',
          opacity: 0.8,
          '&:hover': {
            opacity: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          }
        }}
      >
        戻る
      </Button>

      <Container maxWidth="sm">
        <Fade in={mounted} timeout={800}>
          <Box sx={{ textAlign: 'center' }}>
            {/* アイコン */}
            <TimerOutlined sx={{ 
              fontSize: 60, 
              color: 'white',
              mb: 2,
              opacity: 0.9
            }} />
            
            <Typography 
              variant="h4" 
              sx={{ 
                color: 'white',
                fontWeight: 700,
                mb: 1
              }}
            >
              集中時間を設定
            </Typography>
            
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'white',
                opacity: 0.8,
                mb: 6
              }}
            >
              スライダーで時間を調整してください
            </Typography>

            {/* タイマー表示 */}
            <Zoom in={mounted} timeout={1000}>
              <Paper 
                elevation={8}
                sx={{ 
                  p: { xs: 3, sm: 6 },
                  mb: { xs: 4, sm: 6 },
                  borderRadius: 4,
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <Typography 
                  variant="h1" 
                  sx={{ 
                    fontFamily: 'monospace',
                    fontWeight: 300,
                    fontSize: { xs: '2.5rem', sm: '4rem' },
                    color: 'primary.main',
                    mb: { xs: 3, sm: 4 },
                    letterSpacing: '0.1em'
                  }}
                >
                  {formatTime(hours, minutes)}
                </Typography>

                {/* 時間スライダー */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                    時間: {hours}時間
                  </Typography>
                  <Slider
                    value={hours}
                    onChange={(e, value) => setHours(value)}
                    min={0}
                    max={10}
                    step={1}
                    marks={[
                      { value: 0, label: '0h' },
                      { value: 2, label: '2h' },
                      { value: 4, label: '4h' },
                      { value: 6, label: '6h' },
                      { value: 8, label: '8h' },
                      { value: 10, label: '10h' }
                    ]}
                    sx={{
                      color: 'primary.main',
                      '& .MuiSlider-thumb': {
                        width: 24,
                        height: 24,
                      },
                      '& .MuiSlider-track': {
                        height: 6,
                      },
                      '& .MuiSlider-rail': {
                        height: 6,
                        opacity: 0.3,
                      }
                    }}
                  />
                </Box>

                {/* 分スライダー */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                    分: {minutes}分
                  </Typography>
                  <Slider
                    value={minutes}
                    onChange={(e, value) => setMinutes(value)}
                    min={0}
                    max={55}
                    step={5}
                    marks={[
                      { value: 0, label: '0' },
                      { value: 15, label: '15' },
                      { value: 30, label: '30' },
                      { value: 45, label: '45' }
                    ]}
                    sx={{
                      color: 'primary.main',
                      '& .MuiSlider-thumb': {
                        width: 24,
                        height: 24,
                      },
                      '& .MuiSlider-track': {
                        height: 6,
                      },
                      '& .MuiSlider-rail': {
                        height: 6,
                        opacity: 0.3,
                      }
                    }}
                  />
                </Box>

                {/* 合計時間表示 */}
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  合計: {totalMinutes}分
                </Typography>

                {/* スタートボタン */}
                <Button
                  onClick={handleStart}
                  variant="contained"
                  size="large"
                  startIcon={<PlayArrowOutlined />}
                  disabled={totalMinutes < 5}
                  sx={{
                    px: 6,
                    py: 2,
                    fontSize: '1.2rem',
                    borderRadius: 3,
                    boxShadow: '0 4px 16px rgba(15, 122, 96, 0.3)',
                    '&:hover': {
                      boxShadow: '0 6px 20px rgba(15, 122, 96, 0.4)',
                      transform: 'translateY(-2px)',
                    },
                    '&:disabled': {
                      opacity: 0.5
                    }
                  }}
                >
                  集中モード開始
                </Button>

                {totalMinutes < 5 && (
                  <Typography variant="caption" color="error" sx={{ display: 'block', mt: 2 }}>
                    最低5分以上に設定してください
                  </Typography>
                )}
              </Paper>
            </Zoom>

            {/* 利用可能ロッカー数 */}
            <Typography variant="body2" sx={{ color: 'white', opacity: 0.7 }}>
              利用可能なロッカー: {lockers.filter(l => l.isAvailable).length}台
            </Typography>
          </Box>
        </Fade>
      </Container>
    </Box>
  )
}