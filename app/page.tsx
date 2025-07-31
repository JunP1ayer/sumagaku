'use client'

import { 
  Container, 
  Box, 
  Typography, 
  Button, 
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
  PhoneAndroidOutlined,
  HelpOutlineOutlined,
  CloseOutlined,
  LockOutlined,
  TimerOutlined,
  CheckCircleOutlined
} from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home(): JSX.Element {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])


  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F8F9FA 0%, #E8F5E8 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      px: 2,
      py: 3
    }}>
      <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
        {/* シンプルなヒーロー */}
        <Fade in={mounted} timeout={800}>
          <Box>
            <PhoneAndroidOutlined sx={{ 
              fontSize: { xs: 48, sm: 64 }, 
              color: 'primary.main',
              mb: 1
            }} />
            
            <Typography 
              variant="h1" 
              component="h1"
              sx={{ 
                fontSize: { xs: '2.5rem', sm: '3.5rem' },
                fontWeight: 700,
                color: 'primary.main',
                mb: 1
              }}
            >
              スマ学
            </Typography>
            
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ 
                mb: 4,
                fontSize: { xs: '1rem', sm: '1.2rem' },
                fontWeight: 400
              }}
            >
              スマホを預けて集中学習
            </Typography>

            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={() => router.push('/login')}
              sx={{ 
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(15, 122, 96, 0.3)',
                maxWidth: '280px',
                mb: 2,
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(15, 122, 96, 0.4)',
                }
              }}
            >
              ログイン・利用開始
            </Button>

            <Button
              variant="outlined"
              size="medium"
              onClick={() => setShowGuide(true)}
              startIcon={<HelpOutlineOutlined />}
              sx={{ 
                py: 1,
                px: 3,
                fontSize: '0.9rem',
                borderRadius: 2,
                color: 'primary.main',
                borderColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'rgba(15, 122, 96, 0.05)',
                }
              }}
            >
              使い方ガイド
            </Button>
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