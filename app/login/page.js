'use client'

import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Card, 
  CardContent,
  Alert,
  InputAdornment,
  Divider,
  Fade
} from '@mui/material'
import { 
  EmailOutlined,
  SchoolOutlined,
  LoginOutlined,
  ArrowBackOutlined
} from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAppStore from '../../lib/store'

export default function LoginPage() {
  const router = useRouter()
  const { setUser } = useAppStore()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const validateEmail = (email) => {
    const validDomains = [
      'nagoya-u.ac.jp',
      'g.nagoya-u.ac.jp', 
      's.thers.ac.jp'
    ]
    const pattern = new RegExp(`^[a-zA-Z0-9._%+-]+@(${validDomains.join('|').replace(/\./g, '\\.')})$`)
    return pattern.test(email)
  }

  const handleLogin = async () => {
    setError('')
    
    if (!email) {
      setError('メールアドレスを入力してください')
      return
    }
    
    if (!validateEmail(email)) {
      setError('有効なメールアドレスを入力してください\n対応ドメイン:\n• @nagoya-u.ac.jp\n• @g.nagoya-u.ac.jp\n• @s.thers.ac.jp (機構アカウント)')
      return
    }

    setLoading(true)
    
    // デモ用の認証処理（実際にはサーバーサイド認証）
    setTimeout(() => {
      const user = {
        email,
        name: email.split('@')[0],
        studentId: 'demo-' + Math.random().toString(36).substr(2, 9),
        loginTime: new Date().toISOString()
      }
      
      setUser(user)
      setLoading(false)
      router.push('/dashboard')
    }, 1500)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin()
    }
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F8F9FA 0%, #E8F5E8 100%)',
      py: 4
    }}>
      <Container maxWidth="sm">
        <Fade in={mounted} timeout={800}>
          <Box>
            {/* ヘッダー */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Button
                startIcon={<ArrowBackOutlined />}
                onClick={() => router.push('/')}
                sx={{ 
                  position: 'absolute', 
                  top: 32, 
                  left: 32,
                  color: 'text.secondary'
                }}
              >
                ホームに戻る
              </Button>
              
              <SchoolOutlined sx={{ 
                fontSize: 60, 
                color: 'primary.main',
                mb: 2,
                filter: 'drop-shadow(0 4px 8px rgba(15, 122, 96, 0.3))'
              }} />
              
              <Typography variant="h3" sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #0F7A60 0%, #4A9B7E 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}>
                ログイン
              </Typography>
              
              <Typography variant="body1" color="text.secondary">
                大学メールアドレスでログイン
              </Typography>
            </Box>

            {/* ログインフォーム */}
            <Card sx={{ 
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              borderRadius: 3,
              border: '1px solid rgba(15, 122, 96, 0.1)'
            }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
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
                  onClick={handleLogin}
                  disabled={loading}
                  startIcon={loading ? null : <LoginOutlined />}
                  sx={{
                    py: 2,
                    fontSize: '1.1rem',
                    borderRadius: 2,
                    textTransform: 'none',
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
                  {loading ? '認証中...' : 'ログイン'}
                </Button>

                <Divider sx={{ my: 3 }} />

                <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block' }}>
                  ログインすることで、スマ学の利用規約に同意したものとみなされます
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Fade>
      </Container>
    </Box>
  )
}