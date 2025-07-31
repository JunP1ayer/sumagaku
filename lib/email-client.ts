/**
 * Email Notification Client
 * 本番レベルメール通知システム
 */

import nodemailer from 'nodemailer'

export interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
  from: string
}

export interface PaymentConfirmationData {
  amount: number
  validDate: Date
  userName: string
  paymentId: string
  merchantPaymentId: string
}

export interface SessionNotificationData {
  sessionId: string
  lockerNumber: number
  location: string
  startTime: Date
  plannedDuration: number
  userName: string
}

export class EmailClient {
  private transporter: nodemailer.Transporter
  private config: EmailConfig

  constructor(config: EmailConfig) {
    this.config = config
    this.transporter = nodemailer.createTransporter({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    })
  }

  /**
   * Verify email configuration
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify()
      return true
    } catch (error) {
      console.error('Email connection verification failed:', error)
      return false
    }
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(
    email: string,
    data: PaymentConfirmationData
  ): Promise<boolean> {
    try {
      const emailContent = this.generatePaymentConfirmationEmail(data)
      
      const mailOptions = {
        from: this.config.from,
        to: email,
        subject: 'スマ学 - 決済完了のお知らせ',
        html: emailContent.html,
        text: emailContent.text,
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log('Payment confirmation email sent:', result.messageId)
      
      return true
    } catch (error) {
      console.error('Failed to send payment confirmation email:', error)
      return false
    }
  }

  /**
   * Send session start notification
   */
  async sendSessionStartNotification(
    email: string,
    data: SessionNotificationData
  ): Promise<boolean> {
    try {
      const emailContent = this.generateSessionStartEmail(data)
      
      const mailOptions = {
        from: this.config.from,
        to: email,
        subject: 'スマ学 - セッション開始のお知らせ',
        html: emailContent.html,
        text: emailContent.text,
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log('Session start notification sent:', result.messageId)
      
      return true
    } catch (error) {
      console.error('Failed to send session notification:', error)
      return false
    }
  }

  /**
   * Send session reminder (30 minutes before end)
   */
  async sendSessionReminder(
    email: string,
    data: SessionNotificationData & { remainingMinutes: number }
  ): Promise<boolean> {
    try {
      const emailContent = this.generateSessionReminderEmail(data)
      
      const mailOptions = {
        from: this.config.from,
        to: email,
        subject: 'スマ学 - セッション終了間近のお知らせ',
        html: emailContent.html,
        text: emailContent.text,
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log('Session reminder sent:', result.messageId)
      
      return true
    } catch (error) {
      console.error('Failed to send session reminder:', error)
      return false
    }
  }

  /**
   * Generate payment confirmation email content
   */
  private generatePaymentConfirmationEmail(data: PaymentConfirmationData) {
    const validDateStr = data.validDate.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>決済完了のお知らせ</title>
        <style>
          body { font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .highlight { background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .amount { font-size: 24px; font-weight: bold; color: #2196F3; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
          .button { display: inline-block; background: #2196F3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 決済が完了しました</h1>
            <p>スマート学習室システム</p>
          </div>
          <div class="content">
            <p>${data.userName}様</p>
            
            <p>スマ学一日券の決済が正常に完了いたしました。<br>
            本日一日、ロッカーシステムをご利用いただけます。</p>
            
            <div class="highlight">
              <h3>📄 決済詳細</h3>
              <ul>
                <li><strong>金額:</strong> <span class="amount">¥${data.amount.toLocaleString()}</span></li>
                <li><strong>有効期限:</strong> ${validDateStr}</li>
                <li><strong>決済ID:</strong> ${data.merchantPaymentId}</li>
                <li><strong>決済完了日時:</strong> ${new Date().toLocaleString('ja-JP')}</li>
              </ul>
            </div>
            
            <h3>🔐 ご利用方法</h3>
            <ol>
              <li>スマ学アプリでログイン</li>
              <li>利用可能なロッカーを選択</li>
              <li>セッションを開始してご利用ください</li>
            </ol>
            
            <div style="text-align: center;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">
                ダッシュボードへ移動
              </a>
            </div>
            
            <p><strong>注意事項:</strong></p>
            <ul>
              <li>一日券は購入日当日のみ有効です</li>
              <li>セッション中は必要な物品をロッカーに保管してください</li>
              <li>セッション終了後は忘れ物がないようご確認ください</li>
            </ul>
            
            <div class="footer">
              <p>このメールは自動送信されています。<br>
              お問い合わせは <a href="mailto:support@sumagaku.com">support@sumagaku.com</a> まで</p>
              <p>© 2024 スマ学 - Smart Learning System</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    const text = `
決済完了のお知らせ - スマ学

${data.userName}様

スマ学一日券の決済が正常に完了いたしました。

決済詳細:
- 金額: ¥${data.amount.toLocaleString()}
- 有効期限: ${validDateStr}
- 決済ID: ${data.merchantPaymentId}

本日一日、ロッカーシステムをご利用いただけます。

ご利用方法:
1. スマ学アプリでログイン
2. 利用可能なロッカーを選択
3. セッションを開始してご利用ください

注意事項:
- 一日券は購入日当日のみ有効です
- セッション中は必要な物品をロッカーに保管してください
- セッション終了後は忘れ物がないようご確認ください

ダッシュボード: ${process.env.NEXTAUTH_URL}/dashboard

このメールは自動送信されています。
お問い合わせ: support@sumagaku.com

© 2024 スマ学 - Smart Learning System
    `

    return { html, text }
  }

  /**
   * Generate session start email content
   */
  private generateSessionStartEmail(data: SessionNotificationData) {
    const startTimeStr = data.startTime.toLocaleString('ja-JP')
    const endTime = new Date(data.startTime.getTime() + data.plannedDuration * 60000)
    const endTimeStr = endTime.toLocaleString('ja-JP')

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .session-info { background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 セッション開始</h1>
          </div>
          <div class="content">
            <p>${data.userName}様</p>
            <p>ロッカーセッションが開始されました。</p>
            
            <div class="session-info">
              <h3>📍 セッション情報</h3>
              <ul>
                <li><strong>ロッカー番号:</strong> ${data.lockerNumber}</li>
                <li><strong>場所:</strong> ${data.location}</li>
                <li><strong>開始時間:</strong> ${startTimeStr}</li>
                <li><strong>予定終了時間:</strong> ${endTimeStr}</li>
                <li><strong>利用時間:</strong> ${data.plannedDuration}分</li>
              </ul>
            </div>
            
            <p>集中して学習に取り組んでください！<br>
            セッション終了30分前にリマインダーをお送りします。</p>
          </div>
        </div>
      </body>
      </html>
    `

    const text = `
セッション開始 - スマ学

${data.userName}様

ロッカーセッションが開始されました。

セッション情報:
- ロッカー番号: ${data.lockerNumber}
- 場所: ${data.location}
- 開始時間: ${startTimeStr}
- 予定終了時間: ${endTimeStr}
- 利用時間: ${data.plannedDuration}分

集中して学習に取り組んでください！
セッション終了30分前にリマインダーをお送りします。
    `

    return { html, text }
  }

  /**
   * Generate session reminder email content
   */
  private generateSessionReminderEmail(data: SessionNotificationData & { remainingMinutes: number }) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FF9800; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .reminder { background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #FF9800; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ セッション終了間近</h1>
          </div>
          <div class="content">
            <p>${data.userName}様</p>
            
            <div class="reminder">
              <h3>🔔 リマインダー</h3>
              <p>ロッカー${data.lockerNumber}のセッションが<strong>あと${data.remainingMinutes}分</strong>で終了予定です。</p>
            </div>
            
            <p><strong>準備していただくこと:</strong></p>
            <ul>
              <li>学習資料の整理</li>
              <li>ロッカー内の私物確認</li>
              <li>セッションの延長が必要な場合は操作してください</li>
            </ul>
            
            <p>お疲れ様でした！</p>
          </div>
        </div>
      </body>
      </html>
    `

    const text = `
セッション終了間近 - スマ学

${data.userName}様

ロッカー${data.lockerNumber}のセッションがあと${data.remainingMinutes}分で終了予定です。

準備していただくこと:
- 学習資料の整理
- ロッカー内の私物確認
- セッションの延長が必要な場合は操作してください

お疲れ様でした！
    `

    return { html, text }
  }
}

// Singleton instance
let emailClient: EmailClient | null = null

export function getEmailClient(): EmailClient {
  if (!emailClient) {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'localhost',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
      from: process.env.SMTP_FROM || 'noreply@sumagaku.com',
    }

    emailClient = new EmailClient(config)
  }

  return emailClient
}