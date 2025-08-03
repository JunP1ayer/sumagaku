'use client'

import { useState, useEffect } from 'react'
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
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Step,
  StepLabel,
  Stepper
} from '@mui/material'
import { 
  EmailOutlined,
  SchoolOutlined,
  LoginOutlined,
  ArrowBackOutlined,
  PersonOutlined,
  HelpOutlineOutlined,
  CloseOutlined,
  LockOutlined,
  TimerOutlined,
  CheckCircleOutlined,
  PhoneAndroidOutlined
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import useAppStore from '@/lib/store'
import type { User } from '@/types'

export default function LoginPage(): JSX.Element {
  const router = useRouter()
  const { setUser } = useAppStore()
  const [email, setEmail] = useState<string>('')
  const [name, setName] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [mounted, setMounted] = useState<boolean>(false)
  const [showGuide, setShowGuide] = useState<boolean>(false)
  const [isLoginMode, setIsLoginMode] = useState<boolean>(false)
  const [modeSelected, setModeSelected] = useState<boolean>(false)

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

  const handleLogin = async (): Promise<void> => {
    setError('')
    
    if (!email) {
      setError('メールアドレスを入力してください')
      return
    }
    
    if (!validateEmail(email)) {
      setError('有効なメールアドレスを入力してください\n対応ドメイン:\n• @nagoya-u.ac.jp\n• @g.nagoya-u.ac.jp\n• @s.thers.ac.jp (機構アカウント)')
      return
    }

    if (isLoginMode) {
      // ログインモード
      if (!password.trim()) {
        setError('パスワードを入力してください')
        return
      }
    } else {
      // 新規登録モード
      if (!name.trim()) {
        setError('お名前を入力してください')
        return
      }
      if (!password.trim()) {
        setError('パスワードを入力してください')
        return
      }
      if (password.length < 6) {
        setError('パスワードは6文字以上で設定してください')
        return
      }
    }

    setLoading(true)
    
    try {
      // APIエンドポイントを切り替え
      const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register'
      const body = isLoginMode 
        ? { email, password } // ログイン時：メールアドレスとパスワード
        : { email, name: name.trim(), password } // 新規登録時：名前、メールアドレス、パスワード
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error?.message || (isLoginMode ? 'ログインに失敗しました' : '登録に失敗しました'))
        setLoading(false)
        return
      }
      
      // トークンを保存
      if (data.data?.token) {
        localStorage.setItem('token', data.data.token)
      }
      
      const user: User = {
        email: data.data.user?.email || data.data.email,
        name: data.data.user?.name || data.data.name,
        studentId: data.data.user?.studentId || data.data.studentId || 'temp-' + Math.random().toString(36).substr(2, 6),
        loginTime: new Date().toISOString()
      }
      
      setUser(user)
      setLoading(false)
      router.push('/dashboard')
      
    } catch (error) {
      setError('サーバーエラーが発生しました')
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      handleLogin()
    }
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F8F9FA 0%, #E8F5E8 100%)',
      py: { xs: 2, sm: 4 }
    }}>
      <Container maxWidth="sm">
        <Fade in={mounted} timeout={800}>
          <Box>
            {/* ヘッダー */}
            <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 } }}>
              <Button
                onClick={() => router.push('/')}
                sx={{ 
                  position: 'absolute', 
                  top: { xs: 16, sm: 32 }, 
                  left: { xs: 16, sm: 32 },
                  color: 'text.secondary',
                  minWidth: { xs: 48, sm: 40 },
                  width: { xs: 48, sm: 40 },
                  height: { xs: 48, sm: 40 },
                  borderRadius: '50%',
                  p: 0
                }}
              >
                <ArrowBackOutlined />
              </Button>
              
              <SchoolOutlined sx={{ 
                fontSize: { xs: 48, sm: 60 }, 
                color: 'primary.main',
                mb: { xs: 1.5, sm: 2 },
                filter: 'drop-shadow(0 4px 8px rgba(15, 122, 96, 0.3))'
              }} />
              
              <Typography variant="h3" sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #0F7A60 0%, #4A9B7E 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: { xs: 0.5, sm: 1 },
                fontSize: { xs: '1.75rem', sm: '2rem' }
              }}>
                {isLoginMode ? 'ログイン' : '新規登録'}
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{
                fontSize: { xs: '0.9rem', sm: '1rem' },
                px: { xs: 2, sm: 0 }
              }}>
                {isLoginMode ? 'メールアドレスとパスワードでログイン' : 'お名前、メールアドレス、パスワードで新規登録'}
              </Typography>
            </Box>

            {/* モード選択（初期画面） */}
            {!modeSelected && (
              <Card sx={{ 
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                borderRadius: 3,
                border: '1px solid rgba(15, 122, 96, 0.1)',
                mb: 3
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" sx={{ mb: 3, textAlign: 'center', fontWeight: 600 }}>
                    はじめに選択してください
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      onClick={() => {
                        setModeSelected(true)
                        setIsLoginMode(false)
                      }}
                      sx={{
                        py: 2,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600
                      }}
                    >
                      初めて利用する（新規登録）
                    </Button>
                    
                    <Button
                      variant="outlined"
                      size="large"
                      fullWidth
                      onClick={() => {
                        setModeSelected(true)
                        setIsLoginMode(true)
                      }}
                      sx={{
                        py: 2,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        borderWidth: 2,
                        '&:hover': {
                          borderWidth: 2
                        }
                      }}
                    >
                      既にアカウントをお持ちの方
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* ログインフォーム */}
            {modeSelected && (
              <Card sx={{ 
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                borderRadius: 3,
                border: '1px solid rgba(15, 122, 96, 0.1)'
              }}>
                <CardContent sx={{ p: 4 }}>
                {/* 名前入力（新規登録時のみ） */}
                {!isLoginMode && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      お名前
                    </Typography>
                    
                    <TextField
                      fullWidth
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="山田太郎"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonOutlined color="primary" />
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
                )}

                {/* メールアドレス入力 */}
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

                {/* パスワード入力（必須） */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    パスワード
                  </Typography>
                  
                  <TextField
                    fullWidth
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isLoginMode ? "パスワードを入力" : "パスワードを設定（6文字以上）"}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlined color="primary" />
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
                    {isLoginMode ? '登録時に設定したパスワードを入力してください' : '6文字以上で設定してください'}
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
                  {loading ? '認証中...' : (isLoginMode ? 'ログイン' : '新規登録')}
                </Button>

                <Divider sx={{ my: 3 }} />

                <Button
                  variant="text"
                  fullWidth
                  onClick={() => {
                    setModeSelected(false)
                    setError('')
                    setPassword('')
                  }}
                  startIcon={<ArrowBackOutlined />}
                  sx={{
                    mb: 1,
                    color: 'text.secondary',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    }
                  }}
                >
                  選択画面に戻る
                </Button>

                <Button
                  variant="text"
                  onClick={() => setShowGuide(true)}
                  startIcon={<HelpOutlineOutlined />}
                  sx={{
                    width: '100%',
                    py: 1.5,
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'rgba(15, 122, 96, 0.05)',
                    }
                  }}
                >
                  使い方ガイドを見る
                </Button>

                <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block', mt: 2 }}>
                  ログインすることで、スマ学の利用規約に同意したものとみなされます
                </Typography>
              </CardContent>
            </Card>
            )}
          </Box>
        </Fade>

        {/* 使い方ガイドダイアログ */}
        <Dialog 
          open={showGuide} 
          onClose={() => setShowGuide(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              maxHeight: '90vh'
            }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 2
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              スマ学の使い方
            </Typography>
            <IconButton onClick={() => setShowGuide(false)} size="small">
              <CloseOutlined />
            </IconButton>
          </DialogTitle>
          
          <DialogContent sx={{ px: 3, pb: 2 }}>
            <Stepper orientation="vertical" sx={{ '& .MuiStepLabel-root': { pb: 2 } }}>
              <Step active={true}>
                <StepLabel 
                  icon={<PhoneAndroidOutlined color="primary" />}
                  sx={{ '& .MuiStepLabel-labelContainer': { mt: 0.5 } }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                    ログイン
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    大学メールアドレスとお名前でログインします
                  </Typography>
                </StepLabel>
              </Step>
              
              <Step active={true}>
                <StepLabel 
                  icon={<span style={{ color: '#f57c00', fontSize: '24px' }}>¥</span>}
                  sx={{ '& .MuiStepLabel-labelContainer': { mt: 0.5 } }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                    一日券購入（¥100）
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    PayPayで一日券を購入します（その日一日使い放題）
                  </Typography>
                </StepLabel>
              </Step>
              
              <Step active={true}>
                <StepLabel 
                  icon={<TimerOutlined color="primary" />}
                  sx={{ '& .MuiStepLabel-labelContainer': { mt: 0.5 } }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                    集中時間設定
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    集中したい時間を設定します（最低5分〜最大8時間）
                  </Typography>
                </StepLabel>
              </Step>
              
              <Step active={true}>
                <StepLabel 
                  icon={<LockOutlined color="primary" />}
                  sx={{ '& .MuiStepLabel-labelContainer': { mt: 0.5 } }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                    スマホをロッカーに預ける
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    1分間の準備時間でスマートフォンをロッカーに入れます
                  </Typography>
                </StepLabel>
              </Step>
              
              <Step active={true}>
                <StepLabel 
                  icon={<CheckCircleOutlined color="success" />}
                  sx={{ '& .MuiStepLabel-labelContainer': { mt: 0.5 } }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                    集中学習開始！
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    スマホから離れて集中して学習に取り組みましょう
                  </Typography>
                </StepLabel>
              </Step>
            </Stepper>

            <Box sx={{ 
              mt: 3, 
              p: 2, 
              backgroundColor: 'grey.50', 
              borderRadius: 2 
            }}>
              <Typography variant="body2" color="text.secondary" align="center">
                💡 <strong>ポイント</strong><br />
                集中時間中はスマートフォンを取り出すことができません。<br />
                緊急時のみ解除が可能です。
              </Typography>
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button 
              onClick={() => setShowGuide(false)}
              variant="contained"
              fullWidth
              sx={{ py: 1.5, borderRadius: 2 }}
            >
              理解しました
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  )
}