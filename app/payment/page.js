'use client'

import { 
  Box, 
  Typography, 
  Button,
  Fade,
  Zoom,
  CircularProgress
} from '@mui/material'
import { 
  PaymentOutlined,
  CheckCircleOutlined
} from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAppStore from '../../lib/store'

export default function PaymentPage() {
  const router = useRouter()
  const { purchaseDailyPass, isDailyPassValid } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // 既に一日券を持っている場合はダッシュボードへ
    if (isDailyPassValid()) {
      router.push('/dashboard')
    }
  }, [isDailyPassValid, router])

  const handlePayment = async () => {
    setProcessing(true)
    
    // デモ用の決済処理（実際にはPayPay APIを使用）
    setTimeout(() => {
      const transactionId = 'demo-' + Date.now()
      purchaseDailyPass(transactionId)
      setProcessing(false)
      setCompleted(true)
      
      // 1秒後にダッシュボードへ遷移
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    }, 2000)
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: '#FF0033', // PayPayレッド
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      p: 3,
      position: 'relative'
    }}>
      <Fade in={mounted} timeout={800}>
        <Box sx={{ textAlign: 'center' }}>
          {/* タイトル */}
          <Typography 
            variant="h1" 
            sx={{ 
              color: 'white',
              fontWeight: 900,
              mb: 2,
              fontSize: { xs: '3rem', sm: '4rem' },
              textShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}
          >
            ¥100
          </Typography>
          
          <Typography 
            variant="h5" 
            sx={{ 
              color: 'white',
              opacity: 0.95,
              mb: 6,
              fontWeight: 500
            }}
          >
            今日一日使い放題
          </Typography>

          {/* 決済ボタン */}
          <Zoom in={mounted && !completed} timeout={1000}>
            <Box>
              <Button
                onClick={handlePayment}
                disabled={processing || completed}
                sx={{
                  width: 220,
                  height: 220,
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  color: '#FF0033',
                  fontSize: '1.3rem',
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
                  },
                  '&:disabled': {
                    backgroundColor: 'white',
                    color: '#FF0033',
                    opacity: 0.8
                  }
                }}
              >
                {processing ? (
                  <>
                    <CircularProgress size={48} sx={{ color: '#FF0033' }} />
                    決済処理中
                  </>
                ) : (
                  <>
                    <PaymentOutlined sx={{ fontSize: 64 }} />
                    PayPayで支払う
                  </>
                )}
              </Button>
            </Box>
          </Zoom>

          {/* 完了メッセージ */}
          <Zoom in={completed} timeout={500}>
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
              <CheckCircleOutlined sx={{ fontSize: 120, color: 'white', mb: 2 }} />
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                決済完了！
              </Typography>
            </Box>
          </Zoom>

          {/* 説明文 */}
          {!processing && !completed && (
            <Fade in={mounted} timeout={1200}>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'white',
                  opacity: 0.8,
                  mt: 4,
                  maxWidth: 300,
                  mx: 'auto',
                  lineHeight: 1.8
                }}
              >
                PayPayアプリが起動します。
                QRコードをスキャンして決済を完了してください。
              </Typography>
            </Fade>
          )}
        </Box>
      </Fade>
    </Box>
  )
}