/**
 * ユーザーデータリセットスクリプト
 * 新しいパスワード認証システム導入のため、既存データを初期化
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function resetUserData() {
  try {
    console.log('🔄 ユーザーデータのリセットを開始します...')
    
    // 関連データを順番に削除（外部キー制約のため）
    console.log('📊 監査ログを削除中...')
    const auditLogs = await prisma.auditLog.deleteMany({})
    console.log(`✅ 監査ログ ${auditLogs.count} 件を削除しました`)
    
    console.log('🎯 セッションを削除中...')
    const sessions = await prisma.session.deleteMany({})
    console.log(`✅ セッション ${sessions.count} 件を削除しました`)
    
    console.log('🎫 一日券を削除中...')
    const dailyPasses = await prisma.dailyPass.deleteMany({})
    console.log(`✅ 一日券 ${dailyPasses.count} 件を削除しました`)
    
    console.log('💳 決済記録を削除中...')
    const payments = await prisma.payment.deleteMany({})
    console.log(`✅ 決済記録 ${payments.count} 件を削除しました`)
    
    console.log('👤 ユーザーを削除中...')
    const users = await prisma.user.deleteMany({})
    console.log(`✅ ユーザー ${users.count} 件を削除しました`)
    
    console.log('🎉 データベースのリセットが完了しました！')
    console.log('')
    console.log('📝 次回からは以下の流れで利用できます：')
    console.log('1. 新規登録：名前 + メールアドレス + パスワード（6文字以上）')
    console.log('2. ログイン：メールアドレス + パスワード')
    
  } catch (error) {
    console.error('❌ リセット中にエラーが発生しました:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// スクリプト実行
resetUserData()
  .then(() => {
    console.log('✨ リセット完了！')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 リセット失敗:', error)
    process.exit(1)
  })