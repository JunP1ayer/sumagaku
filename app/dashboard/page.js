'use client'

import { 
  Container, 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent,
  Grid,
  Chip,
  Avatar,
  Divider,
  LinearProgress,
  Alert,
  Fade,
  Grow
} from '@mui/material'
import { 
  PersonOutlined,
  PaymentOutlined,
  LockOutlined,
  TimerOutlined,
  LogoutOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  ErrorOutlineOutlined
} from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAppStore from '../../lib/store'
// 日付フォーマット関数
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export default function DashboardPage() {
  const router = useRouter()
  const { 
    user, 
    isAuthenticated, 
    dailyPass, 
    isDailyPassValid, 
    currentSession,
    lockers,
    reset 
  } = useAppStore()
  
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  const handleLogout = () => {
    reset()
    router.push('/')
  }

  const isPassValid = isDailyPassValid()
  const availableLockers = lockers.filter(l => l.isAvailable).length

  if (!mounted || !user) return null

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F8F9FA 0%, #E8F5E8 100%)',
      py: 4
    }}>
      <Container maxWidth="lg">
        <Fade in={mounted} timeout={800}>
          <Box>
            {/* ヘッダー */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 4 
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ 
                  bgcolor: 'primary.main', 
                  width: 56, 
                  height: 56,
                  fontSize: '1.5rem',
                  fontWeight: 600
                }}>
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    おかえりなさい！
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {user.name} さん
                  </Typography>
                </Box>
              </Box>
              
              <Button
                variant="outlined"
                startIcon={<LogoutOutlined />}
                onClick={handleLogout}
                sx={{ borderRadius: 2 }}
              >
                ログアウト
              </Button>
            </Box>

            {/* 現在のセッション表示 */}
            {currentSession.isActive && (
              <Grow in={mounted} timeout={1000}>
                <Alert 
                  severity="info" 
                  sx={{ mb: 4, borderRadius: 2 }}
                  icon={<TimerOutlined />}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    集中モード実行中
                  </Typography>
                  <Typography variant="body2">
                    ロッカー {currentSession.lockerId} • 残り時間: {Math.floor(currentSession.timeRemaining / 60)}分{currentSession.timeRemaining % 60}秒
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(1 - currentSession.timeRemaining / (currentSession.duration * 60)) * 100}
                    sx={{ mt: 2, borderRadius: 1 }}
                  />
                </Alert>
              </Grow>
            )}

            <Grid container spacing={4}>
              {/* 一日券ステータス */}
              <Grid item xs={12} md={6}>
                <Grow in={mounted} timeout={1200}>
                  <Card sx={{ 
                    height: '100%',
                    background: isPassValid 
                      ? 'linear-gradient(135deg, #0F7A60 0%, #4A9B7E 100%)'
                      : 'linear-gradient(135deg, #F5F5F5 0%, #E0E0E0 100%)',
                    color: isPassValid ? 'white' : 'text.primary'
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {isPassValid ? (
                          <CheckCircleOutlined sx={{ fontSize: 40, mr: 2 }} />
                        ) : (
                          <ErrorOutlineOutlined sx={{ fontSize: 40, mr: 2, color: 'text.secondary' }} />
                        )}
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                          一日券
                        </Typography>
                      </Box>
                      
                      {isPassValid ? (
                        <Box>
                          <Chip 
                            label="有効" 
                            color="secondary"
                            sx={{ mb: 2, fontWeight: 600 }}
                          />
                          <Typography variant="body1" sx={{ opacity: 0.9 }}>
                            今日は何度でもご利用いただけます
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 1 }}>
                            購入日: {formatDate(dailyPass.purchaseDate)}
                          </Typography>
                        </Box>
                      ) : (
                        <Box>
                          <Chip 
                            label="未購入" 
                            variant="outlined"
                            sx={{ mb: 2 }}
                          />
                          <Typography variant="body1" color="text.secondary">
                            一日券を購入してロッカーを利用しましょう
                          </Typography>
                          <Typography variant="h4" sx={{ mt: 2, fontWeight: 700, color: 'primary.main' }}>
                            ¥100
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>

              {/* ロッカー状況 */}
              <Grid item xs={12} md={6}>
                <Grow in={mounted} timeout={1400}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <LockOutlined sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                          ロッカー状況
                        </Typography>
                      </Box>
                      
                      <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                        {availableLockers}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        台利用可能 / 全{lockers.length}台
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {lockers.map((locker) => (
                          <Chip
                            key={locker.id}
                            label={locker.location}
                            color={locker.isAvailable ? 'primary' : 'default'}
                            variant={locker.isAvailable ? 'outlined' : 'filled'}
                            size="small"
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>

              {/* アクションボタン */}
              <Grid item xs={12}>
                <Grow in={mounted} timeout={1600}>
                  <Card>
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, textAlign: 'center' }}>
                        今日も集中して学習しましょう！
                      </Typography>
                      
                      <Grid container spacing={3}>
                        {!isPassValid && (
                          <Grid item xs={12} sm={6}>
                            <Button
                              fullWidth
                              variant="contained"
                              size="large"
                              startIcon={<PaymentOutlined />}
                              onClick={() => router.push('/payment')}
                              sx={{
                                py: 2,
                                fontSize: '1.1rem',
                                borderRadius: 2,
                                boxShadow: '0 4px 16px rgba(15, 122, 96, 0.3)',
                                '&:hover': {
                                  boxShadow: '0 6px 20px rgba(15, 122, 96, 0.4)',
                                  transform: 'translateY(-2px)',
                                }
                              }}
                            >
                              一日券を購入 (¥100)
                            </Button>
                          </Grid>
                        )}
                        
                        {isPassValid && !currentSession.isActive && (
                          <Grid item xs={12} sm={6}>
                            <Button
                              fullWidth
                              variant="contained"
                              size="large"
                              startIcon={<LockOutlined />}
                              onClick={() => router.push('/timer')}
                              disabled={availableLockers === 0}
                              sx={{
                                py: 2,
                                fontSize: '1.1rem',
                                borderRadius: 2,
                                boxShadow: '0 4px 16px rgba(15, 122, 96, 0.3)',
                                '&:hover': {
                                  boxShadow: '0 6px 20px rgba(15, 122, 96, 0.4)',
                                  transform: 'translateY(-2px)',
                                }
                              }}
                            >
                              ロッカーを利用
                            </Button>
                          </Grid>
                        )}
                        
                        {currentSession.isActive && (
                          <Grid item xs={12} sm={6}>
                            <Button
                              fullWidth
                              variant="outlined"
                              size="large"
                              startIcon={<TimerOutlined />}
                              onClick={() => router.push('/session')}
                              sx={{
                                py: 2,
                                fontSize: '1.1rem',
                                borderRadius: 2,
                              }}
                            >
                              集中モードを確認
                            </Button>
                          </Grid>
                        )}
                        
                        <Grid item xs={12} sm={6}>
                          <Button
                            fullWidth
                            variant="outlined"
                            size="large"
                            startIcon={<HistoryOutlined />}
                            onClick={() => {/* 履歴ページへ */}}
                            sx={{
                              py: 2,
                              fontSize: '1.1rem',
                              borderRadius: 2,
                            }}
                          >
                            利用履歴を見る
                          </Button>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>
            </Grid>
          </Box>
        </Fade>
      </Container>
    </Box>
  )
}