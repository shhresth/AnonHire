import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { ToastProvider } from '@/components/Toast'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AnonHire - Employment Credential Verification',
  description: 'Secure, privacy-preserving credential verification using blockchain and zero-knowledge proofs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
          <Providers>
            {children}
            <Footer />
          </Providers>
        </ToastProvider>
      </body>
    </html>
  )
}


