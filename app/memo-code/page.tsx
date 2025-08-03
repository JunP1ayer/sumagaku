'use client'

import React from 'react'

import { 
  Container,
  Box, 
  Typography,
  Button,
  Fade,
  Card,
  CardContent,
  IconButton
} from '@mui/material'
import { 
  EditNoteOutlined,
  ArrowForwardOutlined,
  ArrowBackOutlined
} from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MemoCodePage(): JSX.Element {
  const router = useRouter()
  const [mounted, setMounted] = useState<boolean>(false)
  const [unlockCode, setUnlockCode] = useState<string>('')

  useEffect(() => {
    setMounted(true)
    
    // セッションストレージから解錠コードを取得
    const code = sessionStorage.getItem('unlockCode')
    if (!code) {
      // コードがない場合はダッシュボードに戻る
      router.push('/dashboard')
      return
    }
    setUnlockCode(code)
  }, [router])

  const handleMemoComplete = () => {
    // メモ完了後は準備画面へ
    router.push('/preparation')
  }

  const handleBack = () => {
    router.push('/dashboard')
  }

  if (!unlockCode) return <div>Loading...</div>

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FFF3E0 0%, #E8F5E8 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      p: 3,
      position: 'relative'
    }}>
      {/* 戻るボタン */}
      <IconButton
        onClick={handleBack}
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

      <Container maxWidth="sm">
        <Fade in={mounted} timeout={800}>
          <Box sx={{ textAlign: 'center' }}>
            {/* アイコン */}
            <EditNoteOutlined sx={{ 
              fontSize: 80, 
              color: 'primary.main',
              mb: 3
            }} />

            {/* タイトル */}
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                mb: 2,
                color: 'text.primary'
              }}
            >
              解錠コードをメモしてください
            </Typography>

            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ mb: 4, maxWidth: 400, mx: 'auto', lineHeight: 1.6 }}
            >
              集中時間終了後、このコードでロッカーを解錠します
            </Typography>

            {/* コード表示カード */}
            <Card sx={{ 
              maxWidth: 300,
              mx: 'auto',
              mb: 6,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              borderRadius: 3
            }}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                  解錠コード
                </Typography>
                
                <Typography 
                  variant="h1" 
                  sx={{ 
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: 'primary.main',
                    fontSize: '3rem',
                    letterSpacing: '0.3em',
                    mb: 2,
                    textShadow: '0 2px 4px rgba(15, 122, 96, 0.2)'
                  }}
                >
                  {unlockCode}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  この数字を覚えるかメモしてください
                </Typography>
              </CardContent>
            </Card>

            {/* メモ完了ボタン */}
            <Button
              onClick={handleMemoComplete}
              variant="contained"
              size="large"
              endIcon={<ArrowForwardOutlined />}
              sx={{
                px: 6,
                py: 2,
                fontSize: '1.2rem',
                fontWeight: 600,
                borderRadius: 3,
                boxShadow: '0 4px 16px rgba(15, 122, 96, 0.3)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(15, 122, 96, 0.4)',
                  transform: 'translateY(-2px)',
                }
              }}
            >
              メモしました
            </Button>

            {/* 注意事項 */}
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                mt: 4, 
                display: 'block', 
                opacity: 0.7,
                maxWidth: 350,
                mx: 'auto'
              }}
            >
              ※ このコードを忘れると解錠できません。確実にメモを取ってください。
            </Typography>
          </Box>
        </Fade>
      </Container>
    </Box>
  )
}