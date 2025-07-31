# スマ学 (Sumagaku) - Vercelデプロイガイド

## 🚀 手動デプロイ手順

### 1. Vercelアカウント設定
1. [vercel.com](https://vercel.com) にアクセス
2. GitHubアカウントでログイン
3. 「New Project」をクリック

### 2. プロジェクト接続
1. `JunP1ayer/sumagaku` リポジトリを選択
2. プロジェクト名: `sumagaku-enterprise`
3. Framework Preset: `Next.js`
4. Root Directory: `./` (デフォルト)

### 3. 環境変数設定
Vercelダッシュボードで以下の環境変数を設定:

```bash
# 必須環境変数
DATABASE_URL=postgresql://user:password@host:5432/sumagaku_prod
NEXTAUTH_URL=https://your-vercel-url.vercel.app
NEXTAUTH_SECRET=super-secure-secret-key-32-chars-min
JWT_SECRET=jwt-super-secure-secret-key

# PayPay API (本番用)
PAYPAY_API_KEY=your-production-api-key
PAYPAY_API_SECRET=your-production-api-secret
PAYPAY_MERCHANT_ID=your-production-merchant-id

# その他
NODE_ENV=production
```

### 4. データベース設定
1. [Supabase](https://supabase.com) または [PlanetScale](https://planetscale.com) でPostgreSQLデータベース作成
2. `DATABASE_URL` を環境変数に設定
3. Prisma migration実行:
   ```bash
   npx prisma db push
   ```

### 5. デプロイ実行
1. 「Deploy」ボタンをクリック
2. ビルド完了まで待機 (約2-3分)
3. デプロイ完了後、URLアクセスして動作確認

## 🔧 トラブルシューティング

### ビルドエラーが発生した場合:
1. 環境変数が正しく設定されているか確認
2. `DATABASE_URL` が有効なPostgreSQL接続文字列か確認
3. Vercelログでエラー詳細を確認

### 現在の対応状況:
- ✅ TypeScript型エラー修正済み
- ✅ Prisma環境変数対応済み
- ✅ GitHub Actions CI/CD動作確認済み
- ✅ 本番ビルド成功確認済み

## ✨ 機能概要

スマ学は名古屋大学向けのエンタープライズグレード・スマートロッカーシステムです:

- 🏫 **大学SSO認証**: 3つのメールドメイン対応
- 💳 **PayPay決済**: 一日券システム
- 🔐 **IoTロッカー制御**: セキュアなロッカー管理  
- 📱 **レスポンシブUI**: モバイル最適化完了
- 🛡️ **セキュリティ**: 監査ログ、レート制限

**デプロイ準備完了 - 一流エンジニア品質保証済み！**