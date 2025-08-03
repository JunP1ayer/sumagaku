'use client'

import React from 'react'

import { 
  Box, 
  Typography,
  LinearProgress,
  Card,
  CardContent,
  Fade,
  IconButton
} from '@mui/material'
import { 
  PhoneAndroidOutlined,
  LockOutlined,
  TimerOutlined,
  ArrowBackOutlined
} from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAppStore from '@/lib/store'

export default function PreparationPage(): JSX.Element {
  const router = useRouter()
  const { preparationTime, updatePreparationTimer, startSessionFromPreparation } = useAppStore()
  const [mounted, setMounted] = useState<boolean>(false)
  const [step, setStep] = useState<number>(1)

  useEffect(() => {
    setMounted(true)
    
    // 準備時間がない場合はダッシュボードへ
    if (!preparationTime.isActive) {
      router.push('/dashboard')
      return
    }

    // タイマー更新とステップ管理
    const timer = setInterval(() => {
      updatePreparationTimer()
      
      const state = useAppStore.getState()
      const remaining = state.preparationTime.timeRemaining
      
      // ステップ管理
      if (remaining > 40) setStep(1) // スマホをロッカーに入れる
      else if (remaining > 20) setStep(2) // ロッカーを閉める
      else if (remaining > 0) setStep(3) // 集中モード開始準備
      
      // 時間切れ後に集中モードへ
      if (remaining <= 0) {
        clearInterval(timer)
        handleStartSession()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [preparationTime.isActive, updatePreparationTimer, startSessionFromPreparation, router])

  const handleStartSession = async () => {
    try {
      // セッションストレージからセッションIDを取得
      const sessionId = sessionStorage.getItem('sessionId')
      if (!sessionId) {
        console.error('No session ID found')
        router.push('/dashboard')
        return
      }
      
      // セッションは既にACTIVE状態で作成済み、フロントエンド状態を更新
      startSessionFromPreparation(sessionId)
      
      // セッションページへ遷移
      router.push('/session')
      
    } catch (error) {
      console.error('Error starting session:', error)
      router.push('/dashboard')
    }
  }

  const handleCancel = () => {
    // 準備時間をキャンセルして戻る
    router.push('/dashboard')
  }

  if (!preparationTime.isActive) return <div>Loading...</div>

  const progress = ((60 - preparationTime.timeRemaining) / 60) * 100

  const getStepContent = () => {
    switch (step) {
      case 1:
        return {
          icon: <PhoneAndroidOutlined sx={{ fontSize: 64, color: 'primary.main' }} />,
          title: 'スマートフォンをロッカーに入れてください',
          description: 'ロッカー ' + preparationTime.lockerId + ' に向かい、\nスマートフォンを中に入れてください'
        }
      case 2:
        return {
          icon: <LockOutlined sx={{ fontSize: 64, color: 'warning.main' }} />,
          title: 'ロッカーを閉めてください',
          description: 'スマートフォンが入ったら\nロッカーのドアをしっかりと閉めてください'
        }
      case 3:
        return {
          icon: <TimerOutlined sx={{ fontSize: 64, color: 'success.main' }} />,
          title: '集中モード開始準備完了',
          description: 'まもなく集中モードが開始されます\n学習に集中しましょう！'
        }
      default:
        return {
          icon: <PhoneAndroidOutlined sx={{ fontSize: 64, color: 'primary.main' }} />,
          title: 'スマートフォンをロッカーに入れてください',
          description: 'ロッカーに向かってください'
        }
    }
  }

  const stepContent = getStepContent()

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FFF3E0 0%, #E8F5E8 100%)',
      display: 'flex',
      flexDirection: 'column',
      p: 3,
      position: 'relative'
    }}>
      {/* キャンセルボタン */}
      <IconButton
        onClick={handleCancel}
        sx={{ 
          position: 'absolute',
          top: 24,
          left: 24,
          color: 'text.secondary',
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.9)',
          }
        }}
      >
        <ArrowBackOutlined />
      </IconButton>

      <Fade in={mounted} timeout={800}>
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          {/* カウントダウン表示 */}
          <Typography 
            variant="h1" 
            sx={{ 
              color: 'primary.main',
              fontWeight: 200,
              fontSize: { xs: '4rem', sm: '6rem' },
              fontFamily: 'monospace',
              mb: 2
            }}
          >
            {preparationTime.timeRemaining}
          </Typography>

          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            秒後に集中モード開始
          </Typography>

          {/* プログレスバー */}
          <Box sx={{ width: '100%', maxWidth: 300, mb: 4 }}>
            <LinearProgress 
              variant="determinate" 
              value={progress}
              sx={{ 
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(15, 122, 96, 0.1)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  backgroundColor: 'primary.main'
                }
              }}
            />
          </Box>

          {/* ステップカード */}
          <Card sx={{ 
            maxWidth: 400,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            borderRadius: 3
          }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Box sx={{ mb: 3 }}>
                {stepContent.icon}
              </Box>
              
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 600,
                  mb: 2,
                  color: 'text.primary'
                }}
              >
                {stepContent.title}
              </Typography>
              
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ 
                  whiteSpace: 'pre-line',
                  lineHeight: 1.6
                }}
              >
                {stepContent.description}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Fade>
    </Box>
  )
}