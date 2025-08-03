'use client'

import React from 'react'

import { 
  Box, 
  Typography,
  CircularProgress,
  Button,
  Fade,
  IconButton,
  LinearProgress,
  Card,
  CardContent
} from '@mui/material'
import { 
  LockOutlined,
  CheckCircleOutlined,
  PauseOutlined,
  NotificationsOffOutlined
} from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAppStore from '@/lib/store'

export default function SessionPage(): JSX.Element {
  const router = useRouter()
  const { currentSession, updateTimer, endSession } = useAppStore()
  const [mounted, setMounted] = useState<boolean>(false)

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
        handleSessionComplete()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [currentSession.isActive, updateTimer, router])

  const handleSessionComplete = async () => {
    try {
      if (!currentSession.sessionId) {
        console.error('No active session ID')
        return
      }
      
      // セッション終了APIを呼び出し (正しいパスとメソッド)
      const response = await fetch(`/api/sessions/${currentSession.sessionId}`, {
        method: 'DELETE', // DELETEメソッドでセッション終了
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      
      if (response.ok) {
        // ロッカー解錠処理 (正しいパスを使用)
        if (currentSession.lockerId) {
          const unlockResponse = await fetch(`/api/lockers/${currentSession.lockerId}/control`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
              action: 'unlock'
            }),
          })
          
          if (!unlockResponse.ok) {
            console.error('Failed to unlock locker')
          }
        }
        
        // ローカル状態更新
        endSession()
        router.push('/complete')
      } else {
        const errorData = await response.json()
        console.error('Failed to complete session:', errorData)
      }
    } catch (error) {
      console.error('Error completing session:', error)
    }
  }

  const handleEmergencyUnlock = async () => {
    if (confirm('緊急解除しますか？学習記録は保存されません。')) {
      await handleSessionComplete()
    }
  }

  if (!currentSession.isActive) return <div>Session not active</div>

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const progress = currentSession.duration && currentSession.duration > 0 
    ? ((currentSession.duration * 60 - currentSession.timeRemaining) / (currentSession.duration * 60)) * 100
    : 0


  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)',
      display: 'flex',
      flexDirection: 'column',
      p: 3,
      position: 'relative'
    }}>
      <Fade in={mounted} timeout={1000}>
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          justifyContent: 'space-between'
        }}>
          {/* ヘッダー */}
          <Box sx={{ textAlign: 'center', pt: 4 }}>
            <NotificationsOffOutlined sx={{ 
              fontSize: 32, 
              color: 'rgba(255, 255, 255, 0.4)',
              mb: 2
            }} />
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: 500
              }}
            >
              集中モード
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.4)',
                mt: 1
              }}
            >
              ロッカー {currentSession.lockerId || '未設定'}
            </Typography>
          </Box>

          {/* メインタイマー */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1
          }}>
            {/* 大きなタイマー表示 */}
            <Typography 
              variant="h1" 
              sx={{ 
                color: 'white',
                fontWeight: 200,
                fontSize: { xs: '3.5rem', sm: '5rem' },
                fontFamily: 'monospace',
                letterSpacing: '0.1em',
                mb: 4,
                textShadow: '0 0 20px rgba(255, 255, 255, 0.1)'
              }}
            >
              {formatTime(currentSession.timeRemaining)}
            </Typography>

            {/* プログレスバー */}
            <Box sx={{ width: '100%', maxWidth: 300, mb: 6 }}>
              <LinearProgress 
                variant="determinate" 
                value={progress}
                sx={{ 
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    backgroundColor: '#0F7A60',
                    boxShadow: '0 0 10px rgba(15, 122, 96, 0.5)'
                  }
                }}
              />
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                mt: 1
              }}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                  {Math.round(progress)}%
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                  {Math.floor((currentSession.duration || 0) - currentSession.timeRemaining / 60)}分経過
                </Typography>
              </Box>
            </Box>

            {/* ステータスカード */}
            <Card sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 3,
              minWidth: { xs: 280, sm: 320 }
            }}>
              <CardContent sx={{ 
                textAlign: 'center',
                py: 3
              }}>
                <LockOutlined sx={{ 
                  fontSize: 32, 
                  color: '#0F7A60',
                  mb: 2
                }} />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'white',
                    fontWeight: 600,
                    mb: 1
                  }}
                >
                  スマホは安全に保管中
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}
                >
                  集中して学習に取り組みましょう
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* フッター */}
          <Box sx={{ textAlign: 'center', pb: 4 }}>
            <Button
              onClick={handleEmergencyUnlock}
              variant="text"
              size="small"
              sx={{
                color: 'rgba(255, 255, 255, 0.3)',
                fontSize: '0.75rem',
                minHeight: 32,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: 'rgba(255, 255, 255, 0.5)',
                }
              }}
            >
              緊急解除
            </Button>
          </Box>
        </Box>
      </Fade>
    </Box>
  )
}