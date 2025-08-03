'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  InputAdornment,
  Fade,
  CircularProgress
} from '@mui/material'
import {
  EmailOutlined,
  ArrowBackOutlined,
  SendOutlined,
  CheckCircleOutlined
} from '@mui/icons-material'

export default function ForgotPasswordPage(): JSX.Element {
  const router = useRouter()
  const [mounted, setMounted] = useState<boolean>(false)
  const [email, setEmail] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [success, setSuccess] = useState<boolean>(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const validateEmail = (email: string): boolean => {
    const validDomains = [
      'nagoya-u.ac.jp',
      'g.nagoya-u.ac.jp', 
      's.thers.ac.jp'
    ]
    const pattern = new RegExp(`^[a-zA-Z0-9._%+-]+@(${validDomains.join('|').replace(/\./g, '\\.')})$`)
    return pattern.test(email)
  }

  const handleSubmit = async () => {
    setError('')

    if (!email) {
      setError('メールアドレスを入力してください')
      return
    }

    if (!validateEmail(email)) {
      setError('有効な大学メールアドレスを入力してください\n対応ドメイン:\n• @nagoya-u.ac.jp\n• @g.nagoya-u.ac.jp\n• @s.thers.ac.jp')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.error?.message || 'リセットメールの送信に失敗しました')
      }
    } catch (error) {
      setError('サーバーエラーが発生しました。しばらく時間をおいてから再度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && !success) {
      handleSubmit()
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
              <EmailOutlined sx={{ 
                fontSize: 60, 
                color: 'primary.main',
                mb: 2,
                filter: 'drop-shadow(0 4px 8px rgba(15, 122, 96, 0.3))'
              }} />
              
              <Typography variant="h4" sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #0F7A60 0%, #4A9B7E 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}>
                パスワードをお忘れですか？
              </Typography>
              
              <Typography variant="body1" color="text.secondary">
                登録されているメールアドレスにリセットリンクを送信します
              </Typography>
            </Box>

            {/* Form or Success Message */}
            <Card sx={{ 
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              borderRadius: 3,
              border: '1px solid rgba(15, 122, 96, 0.1)'
            }}>
              <CardContent sx={{ p: 4 }}>
                {success ? (
                  // Success State
                  <Box sx={{ textAlign: 'center' }}>
                    <CheckCircleOutlined sx={{ 
                      fontSize: 64, 
                      color: 'success.main',
                      mb: 2
                    }} />
                    
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600,
                      mb: 2,
                      color: 'success.main'
                    }}>
                      リセットメールを送信しました！
                    </Typography>

                    <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
                      パスワードリセットのメールを送信しました。メールをご確認いただき、リンクをクリックして新しいパスワードを設定してください。
                    </Alert>

                    {email && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        送信先: <strong>{email}</strong>
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                        ログイン画面に戻る
                      </Button>

                      <Button
                        variant="text"
                        onClick={() => {
                          setSuccess(false)
                          setEmail('')
                          setError('')
                        }}
                        sx={{
                          color: 'text.secondary'
                        }}
                      >
                        別のメールアドレスで再送信
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  // Request Form
                  <Box>
                    <Typography variant="h6" sx={{ mb: 3, textAlign: 'center', fontWeight: 600 }}>
                      パスワードリセット申請
                    </Typography>

                    {/* Email Input */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body1" sx={{ mb: 2, fontWeight: 600 }}>
                        大学メールアドレス
                      </Typography>
                      
                      <TextField
                        fullWidth
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="your-name@nagoya-u.ac.jp"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailOutlined color="primary" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover fieldset': {
                              borderColor: 'primary.main',
                            },
                          }
                        }}
                        disabled={loading}
                      />
                      
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        対応ドメイン: @nagoya-u.ac.jp / @g.nagoya-u.ac.jp / @s.thers.ac.jp
                      </Typography>
                    </Box>

                    {error && (
                      <Alert severity="error" sx={{ mb: 3, whiteSpace: 'pre-line' }}>
                        {error}
                      </Alert>
                    )}

                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={handleSubmit}
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendOutlined />}
                      sx={{
                        py: 2,
                        fontSize: '1.1rem',
                        borderRadius: 2,
                        fontWeight: 600,
                        boxShadow: '0 4px 16px rgba(15, 122, 96, 0.3)',
                        '&:hover': {
                          boxShadow: '0 6px 20px rgba(15, 122, 96, 0.4)',
                          transform: 'translateY(-1px)',
                        },
                        '&:disabled': {
                          background: 'rgba(15, 122, 96, 0.6)',
                          color: 'white',
                        }
                      }}
                    >
                      {loading ? '送信中...' : 'リセットメールを送信'}
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Help Text */}
            {!success && (
              <Box sx={{ 
                mt: 3, 
                p: 2, 
                backgroundColor: 'rgba(255, 255, 255, 0.7)', 
                borderRadius: 2,
                textAlign: 'center'
              }}>
                <Typography variant="body2" color="text.secondary">
                  💡 <strong>メールについて</strong><br />
                  • リセットメールは1時間有効です<br />
                  • メールが届かない場合は迷惑メールフォルダもご確認ください<br />
                  • 15分間に3回まで申請可能です
                </Typography>
              </Box>
            )}
          </Box>
        </Fade>
      </Container>
    </Box>
  )
}