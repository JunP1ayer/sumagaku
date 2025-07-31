'use client'

import { 
  Box, 
  Typography,
  CircularProgress,
  Button,
  Fade
} from '@mui/material'
import { 
  LockOutlined,
  CheckCircleOutlined
} from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAppStore from '../../lib/store'

export default function SessionPage() {
  const router = useRouter()
  const { currentSession, updateTimer, endSession } = useAppStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // セッションがない場合はダッシュボードへ
    if (!currentSession.isActive) {
      router.push('/dashboard')
      return
    }

    // タイマー更新
    const timer = setInterval(() => {
      updateTimer()
      
      // 時間切れチェック
      const state = useAppStore.getState()
      if (state.currentSession.timeRemaining <= 0) {
        clearInterval(timer)
        router.push('/complete')
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [currentSession.isActive, updateTimer, router])

  if (!currentSession.isActive) return null

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const progress = currentSession.duration > 0 
    ? ((currentSession.duration * 60 - currentSession.timeRemaining) / (currentSession.duration * 60)) * 100
    : 0

  const handleEmergencyUnlock = () => {
    if (confirm('本当にロッカーを解除しますか？\n集中時間が終了します。')) {
      endSession()
      router.push('/dashboard')
    }
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: '#0A0A0A',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      p: 3,
      position: 'relative'
    }}>
      <Fade in={mounted} timeout={1000}>
        <Box sx={{ textAlign: 'center', position: 'relative' }}>
          {/* ロッカーアイコン */}
          <LockOutlined sx={{ 
            fontSize: 40, 
            color: 'rgba(255, 255, 255, 0.3)',
            mb: 4
          }} />

          {/* 円形プログレス */}
          <Box sx={{ position: 'relative', display: 'inline-flex', mb: 6 }}>
            <CircularProgress 
              variant="determinate" 
              value={progress}
              size={280}
              thickness={2}
              sx={{ 
                color: '#0F7A60',
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round',
                }
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <Typography 
                variant="h1" 
                sx={{ 
                  color: 'white',
                  fontWeight: 300,
                  fontSize: '4rem',
                  fontFamily: 'monospace'
                }}
              >
                {formatTime(currentSession.timeRemaining)}
              </Typography>
            </Box>
          </Box>

          {/* ロッカー情報 */}
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.5)',
              mb: 6
            }}
          >
            ロッカー {currentSession.lockerId} 使用中
          </Typography>

          {/* 緊急解除ボタン（目立たないように） */}
          <Button
            onClick={handleEmergencyUnlock}
            variant="text"
            size="small"
            sx={{
              color: 'rgba(255, 255, 255, 0.3)',
              fontSize: '0.75rem',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'rgba(255, 255, 255, 0.5)',
              }
            }}
          >
            緊急解除
          </Button>
        </Box>
      </Fade>
    </Box>
  )
}