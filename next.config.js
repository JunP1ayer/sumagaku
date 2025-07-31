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
}

module.exports = nextConfig