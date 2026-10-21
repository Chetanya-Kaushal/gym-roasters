import '../src/index.css'

export const metadata = {
  title: 'Gym Roasters',
  description: 'Smart gym, cardio & diet plans with workout, food and water tracking',
  manifest: 'manifest.json',
  icons: { icon: 'icon-180.png', apple: 'icon-180.png' },
  appleWebApp: { capable: true, title: 'Gym Roasters', statusBarStyle: 'black-translucent' },
  other: { 'mobile-web-app-capable': 'yes' }
}

export const viewport = {
  width: 'device-width', initialScale: 1, viewportFit: 'cover', userScalable: false, themeColor: '#0c0e12'
}

export default function RootLayout({ children }) {
  // Open connections to YouTube early so the welcome song starts fast on phones.
  return <html lang="en">
    <head>
      <link rel="preconnect" href="https://www.youtube-nocookie.com" />
      <link rel="preconnect" href="https://www.youtube.com" />
      <link rel="preconnect" href="https://i.ytimg.com" />
      <link rel="dns-prefetch" href="https://www.google.com" />
    </head>
    <body>{children}</body>
  </html>
}
