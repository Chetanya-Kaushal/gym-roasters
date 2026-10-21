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
  return <html lang="en"><body>{children}</body></html>
}
