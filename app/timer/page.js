'use client'

import { 
  Container,
  Box, 
  Typography, 
  Button,
  Grid,
  Fade,
  Zoom
} from '@mui/material'
import { 
  TimerOutlined,
  ArrowBackOutlined
} from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAppStore from '../../lib/store'

export default function TimerPage() {
  const router = useRouter()
  const { startSession, isDailyPassValid, lockers } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [selectedTime, setSelectedTime] = useState(null)

  useEffect(() => {
    setMounted(true)
    // 一日券がない場合は決済ページへ
    if (!isDailyPassValid()) {
      router.push('/payment')
    }
  }, [isDailyPassValid, router])

  const timePresets = [
    { minutes: 30, label: '30分', description: 'クイック集中' },
    { minutes: 60, label: '1時間', description: '標準学習' },
    { minutes: 90, label: '1.5時間', description: 'しっかり学習' },
    { minutes: 120, label: '2時間', description: '長時間集中' },
  ]

  const handleTimeSelect = (minutes) => {
    setSelectedTime(minutes)
    
    // 利用可能なロッカーを自動選択
    const availableLocker = lockers.find(l => l.isAvailable)
    if (availableLocker) {
      startSession(availableLocker.id, minutes)
      router.push('/session')
    }
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F8F9FA 0%, #E8F5E8 100%)',
      py: 4
    }}>
      <Container maxWidth="md">
        <Fade in={mounted} timeout={800}>
          <Box>
            {/* ヘッダー */}
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Button
                startIcon={<ArrowBackOutlined />}
                onClick={() => router.push('/dashboard')}
                sx={{ 
                  position: 'absolute', 
                  top: 32, 
                  left: 32,
                  color: 'text.secondary'
                }}
              >
                戻る
              </Button>

              <TimerOutlined sx={{ 
                fontSize: 80, 
                color: 'primary.main',
                mb: 2,
                filter: 'drop-shadow(0 4px 8px rgba(15, 122, 96, 0.3))'
              }} />
              
              <Typography variant="h3" sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #0F7A60 0%, #4A9B7E 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2
              }}>
                集中時間を選択
              </Typography>
              
              <Typography variant="h6" color="text.secondary">
                タップするとすぐにロッカーが施錠されます
              </Typography>
            </Box>

            {/* 時間選択ボタン */}
            <Grid container spacing={3}>
              {timePresets.map((preset, index) => (
                <Grid item xs={12} sm={6} key={preset.minutes}>
                  <Zoom in={mounted} timeout={800 + index * 100}>
                    <Button
                      fullWidth
                      onClick={() => handleTimeSelect(preset.minutes)}
                      sx={{
                        p: 4,
                        borderRadius: 4,
                        backgroundColor: 'white',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                        border: '2px solid transparent',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: 'white',
                          borderColor: 'primary.main',
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 32px rgba(15, 122, 96, 0.2)',
                        },
                        '&:active': {
                          transform: 'translateY(-2px)',
                        }
                      }}
                    >
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography 
                          variant="h2" 
                          sx={{ 
                            fontWeight: 800,
                            color: 'primary.main',
                            mb: 1
                          }}
                        >
                          {preset.label}
                        </Typography>
                        <Typography 
                          variant="body1" 
                          color="text.secondary"
                        >
                          {preset.description}
                        </Typography>
                      </Box>
                    </Button>
                  </Zoom>
                </Grid>
              ))}
            </Grid>

            {/* 利用可能ロッカー数 */}
            <Fade in={mounted} timeout={1200}>
              <Box sx={{ textAlign: 'center', mt: 6 }}>
                <Typography variant="body1" color="text.secondary">
                  利用可能なロッカー: {lockers.filter(l => l.isAvailable).length}台
                </Typography>
              </Box>
            </Fade>
          </Box>
        </Fade>
      </Container>
    </Box>
  )
}