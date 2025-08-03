'use client'

import React from 'react'

import { 
  Container, 
  Box, 
  Typography, 
  Button, 
  IconButton,
  Fade,
  Zoom,
  Paper,
  Chip,
  Slider,
  Snackbar,
  Alert,
  TextField,
  InputAdornment
} from '@mui/material'
import { 
  LockOpenOutlined,
  PaymentOutlined,
  TimerOutlined,
  LogoutOutlined,
  CheckCircleOutlineOutlined,
  LocalActivityOutlined,
  PlayArrowOutlined,
  CloseOutlined,
  LockOutlined
} from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAppStore from '@/lib/store'
import type { User } from '@/types'

export default function DashboardPage(): JSX.Element {
  const router = useRouter()
  const { 
    user, 
    isAuthenticated, 
    dailyPass, 
    isDailyPassValid, 
    currentSession,
    preparationTime,
    lockers,
    startPreparation,
    reset 
  } = useAppStore()
  
  const [mounted, setMounted] = useState<boolean>(false)
  const [showTimerDialog, setShowTimerDialog] = useState<boolean>(false)
  const [hours, setHours] = useState<number>(1)
  const [minutes, setMinutes] = useState<number>(0)
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'error' | 'success' | 'warning'}>({
    open: false, message: '', severity: 'error'
  })
  const [unlockCode, setUnlockCode] = useState<string>('')

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

  if (!mounted || !user) return <div>Loading...</div>

  // シンプルなステータス表示
  const getStatusMessage = () => {
    if (currentSession.isActive) {
      const minutes = Math.floor(currentSession.timeRemaining / 60)
      return `集中モード ${minutes}分残り`
    }
    if (isPassValid) {
      return '準備完了'
    }
    return '一日券を購入'
  }

  const handleMainAction = () => {
    if (currentSession.isActive) {
      router.push('/session')
    } else if (isPassValid) {
      setShowTimerDialog(true)
    } else {
      router.push('/payment')
    }
  }

  const handleStartSession = async (): Promise<void> => {
    const totalMinutes = hours * 60 + minutes
    if (totalMinutes < 5) {
      setSnackbar({open: true, message: '最低5分以上に設定してください', severity: 'warning'})
      return
    }
    
    if (!unlockCode || unlockCode.length < 4 || unlockCode.length > 6) {
      setSnackbar({open: true, message: '解錠コードは4-6桁の数字で入力してください', severity: 'warning'})
      return
    }
    
    if (!/^\d+$/.test(unlockCode)) {
      setSnackbar({open: true, message: '解錠コードは数字のみで入力してください', severity: 'warning'})
      return
    }
    
    try {
      // 利用可能なロッカーを取得
      const lockersResponse = await fetch('/api/lockers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      const lockersData = await lockersResponse.json()
      
      if (!lockersResponse.ok) {
        console.error('Lockers fetch failed:', lockersData)
        setSnackbar({open: true, message: lockersData.error?.message || 'ロッカー情報の取得に失敗しました', severity: 'error'})
        return
      }
      
      const availableLocker = lockersData.data.find((l: any) => l.isAvailable)
      if (!availableLocker) {
        setSnackbar({open: true, message: '利用可能なロッカーがありません', severity: 'warning'})
        return
      }
      
      // セッションを作成
      const sessionResponse = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          lockerId: availableLocker.id,
          plannedDuration: totalMinutes,
          unlockCode: unlockCode
        }),
      })
      
      const sessionData = await sessionResponse.json()
      
      if (!sessionResponse.ok) {
        console.error('Session creation failed:', sessionData)
        setSnackbar({open: true, message: sessionData.error?.message || 'セッション開始に失敗しました', severity: 'error'})
        return
      }
      
      // ローカル状態更新
      startPreparation(availableLocker.id, totalMinutes)
      setShowTimerDialog(false)
      setSnackbar({open: true, message: `ロッカー${availableLocker.location}を予約しました`, severity: 'success'})
      
      // 解錠コードをセッションストレージに保存（メモ画面で使用）
      sessionStorage.setItem('unlockCode', unlockCode)
      router.push('/memo-code')
      
    } catch (error) {
      console.error('Session start error:', error)
      setSnackbar({open: true, message: `エラーが発生しました: ${error instanceof Error ? error.message : 'サーバーエラー'}`, severity: 'error'})
    }
  }

  const formatTime = (h: number, m: number): string => {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

  const totalMinutes = hours * 60 + minutes

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F7A60 0%, #4A9B7E 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      p: 3,
      position: 'relative'
    }}>
      {/* ログアウトボタン */}
      <IconButton
        onClick={handleLogout}
        sx={{ 
          position: 'absolute',
          top: 24,
          right: 24,
          color: 'white',
          opacity: 0.8,
          '&:hover': {
            opacity: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          }
        }}
      >
        <LogoutOutlined />
      </IconButton>

      <Container maxWidth="sm">
        <Fade in={mounted} timeout={800}>
          <Box sx={{ textAlign: 'center' }}>
            {/* ユーザー名 */}
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'white',
                opacity: 0.9,
                mb: 1,
                fontWeight: 500
              }}
            >
              こんにちは、{user.name}さん
            </Typography>

            {/* ステータス */}
            <Typography 
              variant="h2" 
              sx={{ 
                color: 'white',
                fontWeight: 700,
                mb: 6,
                textShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
              }}
            >
              {getStatusMessage()}
            </Typography>

            {/* メインアクションボタン */}
            <Zoom in={mounted} timeout={1000}>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Button
                  onClick={handleMainAction}
                  sx={{
                    width: { xs: 180, sm: 200 },
                    height: { xs: 180, sm: 200 },
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    color: 'primary.main',
                    fontSize: { xs: '1rem', sm: '1.2rem' },
                    fontWeight: 700,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: { xs: 0.5, sm: 1 },
                    textAlign: 'center',
                    mx: 'auto',
                    '&:hover': {
                      backgroundColor: 'white',
                      transform: 'scale(1.05)',
                      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
                    },
                    '&:active': {
                      transform: 'scale(0.98)',
                    }
                  }}
                >
                  {currentSession.isActive ? (
                    <>
                      <TimerOutlined sx={{ fontSize: 48 }} />
                      集中モード中
                    </>
                  ) : isPassValid ? (
                    <>
                      <LockOpenOutlined sx={{ fontSize: 48 }} />
                      ロッカー利用
                    </>
                  ) : (
                    <>
                      <LocalActivityOutlined sx={{ fontSize: 48 }} />
                      一日券購入
                    </>
                  )}
                </Button>
              </Box>
            </Zoom>

            {/* 一日券ステータス */}
            {isPassValid && (
              <Fade in={mounted} timeout={1200}>
                <Chip
                  icon={<CheckCircleOutlineOutlined />}
                  label="一日券有効"
                  sx={{
                    mt: 4,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '1rem',
                    py: 2.5,
                    px: 3,
                    '& .MuiChip-icon': {
                      color: 'white'
                    }
                  }}
                />
              </Fade>
            )}

            {/* 価格表示（未購入時） */}
            {!isPassValid && !currentSession.isActive && (
              <Fade in={mounted} timeout={1200}>
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    ¥100
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'white', opacity: 0.8, mt: 1 }}>
                    今日一日使い放題
                  </Typography>
                </Box>
              </Fade>
            )}
          </Box>
        </Fade>

        {/* タイマー設定画面 */}
        {showTimerDialog && (
          <Fade in={showTimerDialog} timeout={500}>
            <Box sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'background.default',
              zIndex: 1300,
              display: 'flex',
              flexDirection: 'column',
              p: 3
            }}>
              {/* ヘッダー */}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 3,
                pt: 1
              }}>
                <TimerOutlined sx={{ color: 'primary.main', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  集中時間を設定
                </Typography>
                <IconButton onClick={() => setShowTimerDialog(false)} size="small">
                  <CloseOutlined />
                </IconButton>
              </Box>

              {/* メインコンテンツ */}
              <Box sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                maxWidth: 400,
                mx: 'auto',
                width: '100%',
                height: '100%',
                overflow: 'auto',
                py: 2
              }}>
                {/* タイマー表示 */}
                <Box sx={{
                  textAlign: 'center',
                  mb: 2,
                  p: 2,
                  backgroundColor: 'grey.50',
                  borderRadius: 2
                }}>
                  <Typography 
                    variant="h2" 
                    sx={{ 
                      fontFamily: 'monospace',
                      fontWeight: 200,
                      color: 'primary.main',
                      fontSize: { xs: '2rem', sm: '2.5rem' },
                      mb: 0.5,
                      letterSpacing: '0.1em'
                    }}
                  >
                    {formatTime(hours, minutes)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    合計 {totalMinutes}分
                  </Typography>
                </Box>

                {/* 時間選択 */}
                <Box sx={{ mb: 2 }}>
                  {/* 時間スライダー */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, textAlign: 'center' }}>
                      時間: {hours}時間
                    </Typography>
                    <Slider
                      value={hours}
                      onChange={(e, value) => setHours(Array.isArray(value) ? value[0] : value)}
                      min={0}
                      max={10}
                      step={1}
                      marks={[
                        { value: 0, label: '0' },
                        { value: 2, label: '2' },
                        { value: 5, label: '5' },
                        { value: 8, label: '8' },
                        { value: 10, label: '10' }
                      ]}
                      sx={{
                        '& .MuiSlider-thumb': {
                          width: 20,
                          height: 20,
                        },
                        '& .MuiSlider-track': {
                          height: 4,
                        },
                        '& .MuiSlider-rail': {
                          height: 4,
                        },
                        '& .MuiSlider-markLabel': {
                          fontSize: '0.75rem',
                        }
                      }}
                    />
                  </Box>

                  {/* 分スライダー */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, textAlign: 'center' }}>
                      分: {minutes}分
                    </Typography>
                    <Slider
                      value={minutes}
                      onChange={(e, value) => setMinutes(Array.isArray(value) ? value[0] : value)}
                      min={0}
                      max={55}
                      step={5}
                      marks={[
                        { value: 0, label: '0' },
                        { value: 30, label: '30' }
                      ]}
                      sx={{
                        '& .MuiSlider-thumb': {
                          width: 20,
                          height: 20,
                        },
                        '& .MuiSlider-track': {
                          height: 4,
                        },
                        '& .MuiSlider-rail': {
                          height: 4,
                        }
                      }}
                    />
                  </Box>
                </Box>

                {/* 解錠コード設定 */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 600, textAlign: 'center' }}>
                    解錠コード (4-6桁の数字)
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <TextField
                      value={unlockCode}
                      onChange={(e) => setUnlockCode(e.target.value)}
                      placeholder="1234"
                      inputProps={{ 
                        maxLength: 6,
                        style: { 
                          textAlign: 'center',
                          fontFamily: 'monospace',
                          fontSize: '1.3rem',
                          letterSpacing: '0.2em',
                          fontWeight: 600
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlined color="primary" sx={{ fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        width: 180,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'rgba(15, 122, 96, 0.02)',
                          '& fieldset': {
                            borderColor: 'primary.main',
                            borderWidth: 2,
                          },
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                            borderWidth: 2,
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: 'primary.main',
                            borderWidth: 2,
                          },
                        },
                        '& .MuiInputAdornment-root': {
                          marginRight: 1
                        }
                      }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block', mt: 0.5 }}>
                    覚えやすい数字を入力してください
                  </Typography>
                </Box>
                
                {/* エラーメッセージ */}
                {(totalMinutes < 5 || (unlockCode && (unlockCode.length < 4 || unlockCode.length > 6 || !/^\d+$/.test(unlockCode)))) && (
                  <Typography variant="caption" color="error" sx={{ textAlign: 'center', display: 'block', mb: 1 }}>
                    {totalMinutes < 5 ? '最低5分以上に設定してください' : '解錠コードは4-6桁の数字で入力してください'}
                  </Typography>
                )}
                
                {/* スタートボタン */}
                <Button
                  onClick={handleStartSession}
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={totalMinutes < 5 || !unlockCode || unlockCode.length < 4 || unlockCode.length > 6 || !/^\d+$/.test(unlockCode)}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: 2,
                    mt: 1
                  }}
                >
                  集中モード開始 ({totalMinutes}分)
                </Button>
              </Box>
            </Box>
          </Fade>
        )}
      </Container>

      {/* Snackbar for error messages */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({...snackbar, open: false})}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({...snackbar, open: false})} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}