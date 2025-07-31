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
  Chip
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
import useAppStore from '@/lib/store'
import type { User } from '@/types'

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

        {/* タイマー設定画面 */}
        {showTimerDialog && (
          <Fade in={showTimerDialog} timeout={500}>
            <Box sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'background.default',
              zIndex: 1300,
              display: 'flex',
              flexDirection: 'column',
              p: 3
            }}>
              {/* ヘッダー */}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 3,
                pt: 1
              }}>
                <TimerOutlined sx={{ color: 'primary.main', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  集中時間を設定
                </Typography>
                <IconButton onClick={() => setShowTimerDialog(false)} size="small">
                  <CloseOutlined />
                </IconButton>
              </Box>

              {/* メインコンテンツ */}
              <Box sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                maxWidth: 400,
                mx: 'auto',
                width: '100%'
              }}>
                {/* タイマー表示 */}
                <Box sx={{
                  textAlign: 'center',
                  mb: 4,
                  p: 3,
                  backgroundColor: 'grey.50',
                  borderRadius: 3
                }}>
                  <Typography 
                    variant="h1" 
                    sx={{ 
                      fontFamily: 'monospace',
                      fontWeight: 200,
                      color: 'primary.main',
                      fontSize: { xs: '3rem', sm: '4rem' },
                      mb: 1,
                      letterSpacing: '0.1em'
                    }}
                  >
                    {formatTime(hours, minutes)}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    合計 {totalMinutes}分
                  </Typography>
                </Box>

                {/* 時間選択 */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1" sx={{ mb: 2, fontWeight: 600, textAlign: 'center' }}>
                    {hours}時間 {minutes}分
                  </Typography>
                  
                  {/* 時間ボタン */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {[0, 1, 2, 3, 4].map(h => (
                      <Button
                        key={h}
                        variant={hours === h ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => setHours(h)}
                        sx={{ minWidth: 50, fontSize: '0.9rem' }}
                      >
                        {h}h
                      </Button>
                    ))}
                  </Box>
                  
                  {/* 分ボタン */}
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {[0, 15, 30, 45].map(m => (
                      <Button
                        key={m}
                        variant={minutes === m ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => setMinutes(m)}
                        sx={{ minWidth: 50, fontSize: '0.9rem' }}
                      >
                        {m}m
                      </Button>
                    ))}
                  </Box>
                </Box>
                
                {/* エラーメッセージ */}
                {totalMinutes < 5 && (
                  <Typography variant="body2" color="error" sx={{ textAlign: 'center', mb: 3 }}>
                    最低5分以上に設定してください
                  </Typography>
                )}
                
                {/* スタートボタン */}
                <Button
                  onClick={handleStartSession}
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={totalMinutes < 5}
                  sx={{
                    py: 2,
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    borderRadius: 2,
                    mt: 2
                  }}
                >
                  集中モード開始 ({totalMinutes}分)
                </Button>
              </Box>
            </Box>
          </Fade>
        )}
      </Container>
    </Box>
  )
}