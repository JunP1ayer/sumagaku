/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    // ビルド時のTypeScriptエラーを完全に無視
    ignoreBuildErrors: true,
  },
  eslint: {
    // ビルド時のESLintエラーを無視しない
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig