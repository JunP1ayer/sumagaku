'use client'

import React from 'react'

import { 
  Container, 
  Box, 
  Typography, 
  Button, 
  IconButton,
  Fade,
  Zoom,
  Paper,
  Chip,
  Slider,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider
} from '@mui/material'
import { 
  LockOpenOutlined,
  PaymentOutlined,
  TimerOutlined,
  LogoutOutlined,
  CheckCircleOutlineOutlined,
  LocalActivityOutlined,
  PlayArrowOutlined,
  CloseOutlined
} from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAppStore from '../../lib/store'
import type { User } from '../../types'

export default function DashboardPage(): JSX.Element {
  const router = useRouter()
  const { 
    user, 
    isAuthenticated, 
    dailyPass, 
    isDailyPassValid, 
    currentSession,
    lockers,
    startSession,
    reset 
  } = useAppStore()
  
  const [mounted, setMounted] = useState<boolean>(false)
  const [showTimerDialog, setShowTimerDialog] = useState<boolean>(false)
  const [hours, setHours] = useState<number>(1)
  const [minutes, setMinutes] = useState<number>(0)

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  const handleLogout = () => {
    reset()
    router.push('/')
  }

  const isPassValid = isDailyPassValid()

  if (!mounted || !user) return <div>Loading...</div>

  // シンプルなステータス表示
  const getStatusMessage = () => {
    if (currentSession.isActive) {
      const minutes = Math.floor(currentSession.timeRemaining / 60)
      return `集中モード ${minutes}分残り`
    }
    if (isPassValid) {
      return '準備完了'
    }
    return '一日券を購入'
  }

  const handleMainAction = () => {
    if (currentSession.isActive) {
      router.push('/session')
    } else if (isPassValid) {
      setShowTimerDialog(true)
    } else {
      router.push('/payment')
    }
  }

  const handleStartSession = (): void => {
    const totalMinutes = hours * 60 + minutes
    if (totalMinutes < 5) {
      alert('最低5分以上に設定してください')
      return
    }
    
    const availableLocker = lockers.find(l => l.isAvailable)
    if (availableLocker) {
      startSession(availableLocker.id, totalMinutes)
      setShowTimerDialog(false)
      router.push('/session')
    }
  }

  const formatTime = (h: number, m: number): string => {
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
      {/* ログアウトボタン */}
      <IconButton
        onClick={handleLogout}
        sx={{ 
          position: 'absolute',
          top: 24,
          right: 24,
          color: 'white',
          opacity: 0.8,
          '&:hover': {
            opacity: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          }
        }}
      >
        <LogoutOutlined />
      </IconButton>

      <Container maxWidth="sm">
        <Fade in={mounted} timeout={800}>
          <Box sx={{ textAlign: 'center' }}>
            {/* ユーザー名 */}
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'white',
                opacity: 0.9,
                mb: 1,
                fontWeight: 500
              }}
            >
              こんにちは、{user.name}さん
            </Typography>

            {/* ステータス */}
            <Typography 
              variant="h2" 
              sx={{ 
                color: 'white',
                fontWeight: 700,
                mb: 6,
                textShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
              }}
            >
              {getStatusMessage()}
            </Typography>

            {/* メインアクションボタン */}
            <Zoom in={mounted} timeout={1000}>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Button
                  onClick={handleMainAction}
                  sx={{
                    width: { xs: 180, sm: 200 },
                    height: { xs: 180, sm: 200 },
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    color: 'primary.main',
                    fontSize: { xs: '1rem', sm: '1.2rem' },
                    fontWeight: 700,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: { xs: 0.5, sm: 1 },
                    textAlign: 'center',
                    mx: 'auto',
                    '&:hover': {
                      backgroundColor: 'white',
                      transform: 'scale(1.05)',
                      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
                    },
                    '&:active': {
                      transform: 'scale(0.98)',
                    }
                  }}
                >
                  {currentSession.isActive ? (
                    <>
                      <TimerOutlined sx={{ fontSize: 48 }} />
                      集中モード中
                    </>
                  ) : isPassValid ? (
                    <>
                      <LockOpenOutlined sx={{ fontSize: 48 }} />
                      ロッカー利用
                    </>
                  ) : (
                    <>
                      <LocalActivityOutlined sx={{ fontSize: 48 }} />
                      一日券購入
                    </>
                  )}
                </Button>
              </Box>
            </Zoom>

            {/* 一日券ステータス */}
            {isPassValid && (
              <Fade in={mounted} timeout={1200}>
                <Chip
                  icon={<CheckCircleOutlineOutlined />}
                  label="一日券有効"
                  sx={{
                    mt: 4,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '1rem',
                    py: 2.5,
                    px: 3,
                    '& .MuiChip-icon': {
                      color: 'white'
                    }
                  }}
                />
              </Fade>
            )}

            {/* 価格表示（未購入時） */}
            {!isPassValid && !currentSession.isActive && (
              <Fade in={mounted} timeout={1200}>
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    ¥100
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'white', opacity: 0.8, mt: 1 }}>
                    今日一日使い放題
                  </Typography>
                </Box>
              </Fade>
            )}
          </Box>
        </Fade>

        {/* タイマー設定ダイアログ */}
        <Dialog 
          open={showTimerDialog} 
          onClose={() => setShowTimerDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              p: 2
            }
          }}
        >
          <DialogTitle sx={{ 
            textAlign: 'center', 
            pb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <TimerOutlined sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>集中時間を設定</Typography>
            <IconButton onClick={() => setShowTimerDialog(false)} size="small">
              <CloseOutlined />
            </IconButton>
          </DialogTitle>
          
          <DialogContent sx={{ px: 3, pb: 3 }}>
            {/* タイマー表示 */}
            <Paper 
              elevation={0}
              sx={{ 
                p: 4,
                mb: 4,
                textAlign: 'center',
                backgroundColor: 'grey.50',
                borderRadius: 3
              }}
            >
              <Typography 
                variant="h2" 
                sx={{ 
                  fontFamily: 'monospace',
                  fontWeight: 300,
                  color: 'primary.main',
                  mb: 2,
                  letterSpacing: '0.1em'
                }}
              >
                {formatTime(hours, minutes)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                合計: {totalMinutes}分
              </Typography>
            </Paper>

            {/* 時間スライダー */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                時間: {hours}時間
              </Typography>
              <Slider
                value={hours}
                onChange={(e, value) => setHours(Array.isArray(value) ? value[0] : value)}
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
                  '& .MuiSlider-thumb': {
                    width: 20,
                    height: 20,
                  },
                  '& .MuiSlider-track': {
                    height: 4,
                  },
                  '& .MuiSlider-rail': {
                    height: 4,
                    opacity: 0.3,
                  }
                }}
              />
            </Box>

            {/* 分スライダー */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                分: {minutes}分
              </Typography>
              <Slider
                value={minutes}
                onChange={(e, value) => setMinutes(Array.isArray(value) ? value[0] : value)}
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
                  '& .MuiSlider-thumb': {
                    width: 20,
                    height: 20,
                  },
                  '& .MuiSlider-track': {
                    height: 4,
                  },
                  '& .MuiSlider-rail': {
                    height: 4,
                    opacity: 0.3,
                  }
                }}
              />
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* 利用可能ロッカー表示 */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
              利用可能なロッカー: {lockers.filter(l => l.isAvailable).length}台
            </Typography>

            {/* スタートボタン */}
            <Button
              onClick={handleStartSession}
              variant="contained"
              size="large"
              fullWidth
              startIcon={<PlayArrowOutlined />}
              disabled={totalMinutes < 5}
              sx={{
                py: 2,
                fontSize: '1.1rem',
                borderRadius: 3,
                boxShadow: '0 4px 16px rgba(15, 122, 96, 0.3)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(15, 122, 96, 0.4)',
                  transform: 'translateY(-1px)',
                },
                '&:disabled': {
                  opacity: 0.5
                }
              }}
            >
              集中モード開始
            </Button>

            {totalMinutes < 5 && (
              <Typography variant="caption" color="error" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
                最低5分以上に設定してください
              </Typography>
            )}
          </DialogContent>
        </Dialog>
      </Container>
    </Box>
  )
}