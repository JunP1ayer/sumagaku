'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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
  LockOutlined,
  VisibilityOutlined,
  VisibilityOffOutlined,
  CheckCircleOutlined,
  ArrowBackOutlined
} from '@mui/icons-material'

function ResetPasswordPageContent(): JSX.Element {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [mounted, setMounted] = useState<boolean>(false)
  const [token, setToken] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [success, setSuccess] = useState<boolean>(false)

  useEffect(() => {
    setMounted(true)
    
    const tokenParam = searchParams.get('token')
    const emailParam = searchParams.get('email')
    
    if (!tokenParam || !emailParam) {
      setError('無効なリセットリンクです。再度パスワードリセットを申請してください。')
      return
    }
    
    setToken(tokenParam)
    setEmail(emailParam)
  }, [searchParams])

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return 'パスワードは6文字以上で入力してください'
    }
    if (password.length > 128) {
      return 'パスワードは128文字以下で入力してください'
    }
    return null
  }

  const handleResetPassword = async () => {
    setError('')

    // Validation
    if (!newPassword) {
      setError('新しいパスワードを入力してください')
      return
    }

    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('パスワードが一致しません')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          email,
          newPassword
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.error?.message || 'パスワードリセットに失敗しました')
      }
    } catch (error) {
      setError('サーバーエラーが発生しました。しばらく時間をおいてから再度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && !success) {
      handleResetPassword()
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
              <LockOutlined sx={{ 
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
                パスワードリセット
              </Typography>
              
              <Typography variant="body1" color="text.secondary">
                新しいパスワードを設定してください
              </Typography>
            </Box>

            {/* Reset Form or Success Message */}
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
                      パスワードリセット完了！
                    </Typography>

                    <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
                      パスワードが正常にリセットされました。新しいパスワードでログインしてください。
                    </Alert>

                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      onClick={() => router.push('/login')}
                      sx={{
                        py: 2,
                        borderRadius: 2,
                        fontWeight: 600
                      }}
                    >
                      ログイン画面へ
                    </Button>
                  </Box>
                ) : (
                  // Reset Form
                  <Box>
                    {email && (
                      <Box sx={{ mb: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          アカウント: <strong>{email}</strong>
                        </Typography>
                      </Box>
                    )}

                    {/* New Password */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        新しいパスワード
                      </Typography>
                      
                      <TextField
                        fullWidth
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="新しいパスワードを入力（6文字以上）"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockOutlined color="primary" />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <Button
                                onClick={() => setShowPassword(!showPassword)}
                                sx={{ minWidth: 'auto', p: 1 }}
                              >
                                {showPassword ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
                              </Button>
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
                    </Box>

                    {/* Confirm Password */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        パスワード確認
                      </Typography>
                      
                      <TextField
                        fullWidth
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="パスワードを再度入力"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockOutlined color="primary" />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <Button
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                sx={{ minWidth: 'auto', p: 1 }}
                              >
                                {showConfirmPassword ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
                              </Button>
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
                    </Box>

                    {error && (
                      <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                      </Alert>
                    )}

                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={handleResetPassword}
                      disabled={loading || !token || !email}
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LockOutlined />}
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
                      {loading ? 'リセット中...' : 'パスワードをリセット'}
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
                  💡 <strong>パスワードについて</strong><br />
                  • 6文字以上128文字以下で設定してください<br />
                  • 英数字と記号を組み合わせることをお勧めします<br />
                  • 第三者に推測されにくいパスワードを設定してください
                </Typography>
              </Box>
            )}
          </Box>
        </Fade>
      </Container>
    </Box>
  )
}

export default function ResetPasswordPage(): JSX.Element {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordPageContent />
    </Suspense>
  )
}