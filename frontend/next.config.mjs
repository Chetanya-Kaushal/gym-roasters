// Next.js config. Production builds are a static export (`out/`): the app is a client-side
// SPA (hash routes, state in the browser + /api), so it is served as plain files by nginx
// in Docker, by Vercel/GitHub Pages, or from disk in the Capacitor shell.
// In `next dev`, /api and the exercise media are proxied like the old Vite dev server did.
const dev = process.env.NODE_ENV !== 'production'
// CLOUD=1 (set on the Vercel project): a server build with the Neon-backed API in
// app/api/[...path]/route.cloud.js. Every other production build is a static export.
const cloud = process.env.CLOUD === '1'
const backend = process.env.API_TARGET || 'http://127.0.0.1:3000'
const media = process.env.MEDIA_TARGET || 'http://127.0.0.1:8888'

export default {
  reactStrictMode: true,
  basePath: process.env.BASE_PATH || '',
  images: { unoptimized: true },
  pageExtensions: cloud ? ['jsx', 'js', 'cloud.js'] : ['jsx', 'js'],
  ...(cloud ? {} : dev ? {
    async rewrites() {
      return [
        { source: '/api/:path*', destination: `${backend}/api/:path*` },
        { source: '/img/:path*', destination: `${media}/img/:path*` },
        { source: '/gif/:path*', destination: `${media}/gif/:path*` }
      ]
    }
  } : { output: 'export' })
}
