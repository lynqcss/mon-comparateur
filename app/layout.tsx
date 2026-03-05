import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Header from './components/Header'
import Footer from './components/Footer'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Lynq | Premium CSS Comparison Shopping',
  description: 'Lynq Comparison Shopping Service - Compare prices and find the best deals from top merchants.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${inter.variable} font-sans scroll-smooth`}>
      <body className="min-h-screen bg-slate-50/50 selection:bg-zinc-900 selection:text-white dark:bg-zinc-950 dark:selection:bg-white dark:selection:text-zinc-900">
        <Header />
        <main className="relative">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
