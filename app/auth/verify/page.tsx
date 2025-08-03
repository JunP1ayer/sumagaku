'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Fade
} from '@mui/material'
import {
  CheckCircleOutlined,
  ErrorOutlined,
  EmailOutlined,
  ArrowBackOutlined
} from '@mui/icons-material'

type VerificationStatus = 'loading' | 'success' | 'error' | 'expired' | 'invalid'

function VerifyEmailPageContent(): JSX.Element {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<VerificationStatus>('loading')
  const [message, setMessage] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [mounted, setMounted] = useState<boolean>(false)

  useEffect(() => {
    setMounted(true)
    
    const token = searchParams.get('token')
    const email = searchParams.get('email')
    
    if (!token || !email) {
      setStatus('invalid')
      setMessage('無効な認証リンクです。')
      return
    }
    
    setUserEmail(email)
    verifyEmail(token, email)
  }, [searchParams])

  const verifyEmail = async (token: string, email: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          email
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage('メール認証が完了しました！ログインしてスマ学をご利用ください。')
      } else {
        if (data.error?.message?.includes('有効期限')) {
          setStatus('expired')
          setMessage('認証リンクの有効期限が切れています。再度認証メールを送信してください。')
        } else {
          setStatus('error')
          setMessage(data.error?.message || '認証に失敗しました。')
        }
      }
    } catch (error) {
      setStatus('error')
      setMessage('サーバーエラーが発生しました。しばらく時間をおいてから再度お試しください。')
    }
  }

  const resendVerificationEmail = async () => {
    try {
      setStatus('loading')
      
      const response = await fetch('/api/auth/verify-email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage('認証メールを再送信しました。メールをご確認ください。')
      } else {
        setStatus('error')
        setMessage(data.error?.message || '再送信に失敗しました。')
      }
    } catch (error) {
      setStatus('error')
      setMessage('サーバーエラーが発生しました。')
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <CircularProgress size={64} color="primary" />
      case 'success':
        return <CheckCircleOutlined sx={{ fontSize: 64, color: 'success.main' }} />
      case 'error':
      case 'expired':
      case 'invalid':
        return <ErrorOutlined sx={{ fontSize: 64, color: 'error.main' }} />
      default:
        return <EmailOutlined sx={{ fontSize: 64, color: 'primary.main' }} />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'success'
      case 'error':
      case 'expired':
      case 'invalid':
        return 'error'
      default:
        return 'info'
    }
  }

  if (!mounted) return <div>Loading...</div>

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F8F9FA 0%, #E8F5E8 100%)',
      py: 4
    }}>
      <Container maxWidth="sm">
        <Fade in={mounted} timeout={800}>
          <Box>
            {/* Back Button */}
            <Button
              onClick={() => router.push('/login')}
              sx={{ 
                position: 'absolute', 
                top: 32, 
                left: 32,
                color: 'text.secondary'
              }}
              startIcon={<ArrowBackOutlined />}
            >
              ログイン画面に戻る
            </Button>

            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4, mt: 6 }}>
              <Typography variant="h4" sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #0F7A60 0%, #4A9B7E 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}>
                メール認証
              </Typography>
              
              <Typography variant="body1" color="text.secondary">
                スマ学アカウントの認証
              </Typography>
            </Box>

            {/* Status Card */}
            <Card sx={{ 
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              borderRadius: 3,
              border: '1px solid rgba(15, 122, 96, 0.1)'
            }}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Box sx={{ mb: 3 }}>
                  {getStatusIcon()}
                </Box>

                <Typography variant="h6" sx={{ 
                  fontWeight: 600,
                  mb: 2,
                  color: status === 'success' ? 'success.main' : 
                         status === 'loading' ? 'text.primary' : 'error.main'
                }}>
                  {status === 'loading' && '認証中...'}
                  {status === 'success' && '認証完了！'}
                  {status === 'error' && '認証エラー'}
                  {status === 'expired' && '認証期限切れ'}
                  {status === 'invalid' && '無効なリンク'}
                </Typography>

                <Alert severity={getStatusColor()} sx={{ mb: 3, textAlign: 'left' }}>
                  {message}
                </Alert>

                {userEmail && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    認証対象: <strong>{userEmail}</strong>
                  </Typography>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {status === 'success' && (
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => router.push('/login')}
                      sx={{
                        py: 2,
                        borderRadius: 2,
                        fontWeight: 600
                      }}
                    >
                      ログイン画面へ
                    </Button>
                  )}

                  {status === 'expired' && (
                    <Button
                      variant="contained"
                      size="large"
                      onClick={resendVerificationEmail}
                      sx={{
                        py: 2,
                        borderRadius: 2,
                        fontWeight: 600
                      }}
                    >
                      認証メールを再送信
                    </Button>
                  )}

                  {(status === 'error' || status === 'invalid') && (
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => router.push('/login')}
                      sx={{
                        py: 2,
                        borderRadius: 2,
                        fontWeight: 600
                      }}
                    >
                      ログイン画面に戻る
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Help Text */}
            <Box sx={{ 
              mt: 3, 
              p: 2, 
              backgroundColor: 'rgba(255, 255, 255, 0.7)', 
              borderRadius: 2,
              textAlign: 'center'
            }}>
              <Typography variant="body2" color="text.secondary">
                💡 <strong>問題が解決しない場合</strong><br />
                認証メールが届かない場合は、迷惑メールフォルダもご確認ください。<br />
                それでも解決しない場合は、システム管理者にお問い合わせください。
              </Typography>
            </Box>
          </Box>
        </Fade>
      </Container>
    </Box>
  )
}

export default function VerifyEmailPage(): JSX.Element {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailPageContent />
    </Suspense>
  )
}