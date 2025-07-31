'use client'

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
  LocalActivityOutlined
} from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAppStore from '../../lib/store'

export default function DashboardPage() {
  const router = useRouter()
  const { 
    user, 
    isAuthenticated, 
    dailyPass, 
    isDailyPassValid, 
    currentSession,
    reset 
  } = useAppStore()
  
  const [mounted, setMounted] = useState(false)

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

  if (!mounted || !user) return null

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
      router.push('/timer')
    } else {
      router.push('/payment')
    }
  }

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
              <Box>
                <Button
                  onClick={handleMainAction}
                  sx={{
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    color: 'primary.main',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
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
      </Container>
    </Box>
  )
}