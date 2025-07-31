/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    // ビルド時のTypeScriptエラーを警告レベルに下げる
    ignoreBuildErrors: false,
  },
  eslint: {
    // ビルド時のESLintエラーを無視
    ignoreDuringBuilds: true,
  },
  experimental: {
    // 実験的機能を無効化
    appDir: true,
  },
}

module.exports = nextConfig