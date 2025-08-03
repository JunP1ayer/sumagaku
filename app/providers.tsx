'use client'

import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

const theme = createTheme({
  palette: {
    primary: {
      main: '#0F7A60', // 名古屋大学グリーン
      light: '#4A9B7E',
      dark: '#0A5A46',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#FF6B35',
      light: '#FF8A5B',
      dark: '#E55A2B',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2C3E50',
      secondary: '#7F8C8D',
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  typography: {
    fontFamily: '"Noto Sans JP", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '3.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      '@media (max-width:600px)': {
        fontSize: '2.5rem',
      },
    },
    h2: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.3,
      '@media (max-width:600px)': {
        fontSize: '1.8rem',
      },
    },
    h3: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      '@media (max-width:600px)': {
        fontSize: '1.5rem',
      },
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
      '@media (max-width:600px)': {
        fontSize: '1.2rem',
      },
    },
    h6: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
      '@media (max-width:600px)': {
        fontSize: '1.1rem',
      },
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      '@media (max-width:600px)': {
        fontSize: '0.9rem',
      },
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      '@media (max-width:600px)': {
        fontSize: '0.8rem',
      },
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          fontWeight: 600,
          fontSize: '1rem',
          padding: '12px 24px',
          minHeight: 44, // モバイルタッチターゲット最小サイズ
          boxShadow: 'none',
          '@media (max-width:600px)': {
            fontSize: '0.9rem',
            padding: '14px 20px',
            minHeight: 48,
          },
          '&:hover': {
            boxShadow: '0 4px 12px rgba(15, 122, 96, 0.3)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #0F7A60 0%, #4A9B7E 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #0A5A46 0%, #0F7A60 100%)',
          },
        },
        sizeSmall: {
          minHeight: 36,
          '@media (max-width:600px)': {
            minHeight: 40,
            fontSize: '0.8rem',
          },
        },
        sizeLarge: {
          minHeight: 56,
          '@media (max-width:600px)': {
            minHeight: 56,
            fontSize: '1rem',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minHeight: 44,
          minWidth: 44,
          '@media (max-width:600px)': {
            minHeight: 48,
            minWidth: 48,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.04)',
          '@media (max-width:600px)': {
            borderRadius: 12,
            margin: '8px',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            minHeight: 48,
            '@media (max-width:600px)': {
              minHeight: 52,
              fontSize: '16px', // モバイルでズーム防止
            },
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: 16,
          paddingRight: 16,
          '@media (max-width:600px)': {
            paddingLeft: 12,
            paddingRight: 12,
          },
        },
      },
    },
  },
})

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}