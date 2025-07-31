'use client'

import React from 'react'

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
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAppStore from '@/lib/store'
import type { User } from '@/types'

export default function LoginPage(): JSX.Element {
  const router = useRouter()
  const { setUser } = useAppStore()
  const [email, setEmail] = useState<string>('')
  const [name, setName] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [mounted, setMounted] = useState<boolean>(false)
  const [showGuide, setShowGuide] = useState<boolean>(false)

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
    
    if (!name.trim()) {
      setError('お名前を入力してください')
      return
    }
    
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
      const user: User = {
        email,
        name: name.trim(),
        studentId: 'demo-' + Math.random().toString(36).substr(2, 9),
        loginTime: new Date().toISOString()
      }
      
      setUser(user)
      setLoading(false)
      router.push('/dashboard')
    }, 1500)
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
      py: 4
    }}>
      <Container maxWidth="sm">
        <Fade in={mounted} timeout={800}>
          <Box>
            {/* ヘッダー */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Button
                onClick={() => router.push('/')}
                sx={{ 
                  position: 'absolute', 
                  top: 32, 
                  left: 32,
                  color: 'text.secondary',
                  minWidth: 40,
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  p: 0
                }}
              >
                <ArrowBackOutlined />
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
                お名前とメールアドレスでログイン
              </Typography>
            </Box>

            {/* ログインフォーム */}
            <Card sx={{ 
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              borderRadius: 3,
              border: '1px solid rgba(15, 122, 96, 0.1)'
            }}>
              <CardContent sx={{ p: 4 }}>
                {/* 名前入力 */}
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