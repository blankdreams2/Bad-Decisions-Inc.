import type { Metadata } from 'next'
import { Fredoka } from 'next/font/google'
import { cn } from '@/lib/utils'
import './globals.css'
import ConvexClientProvider from './convex-client-provider'

const fredoka = Fredoka({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bad Decisions Inc',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={cn(
          fredoka.className,
          'bg-[#161616]'
        )}
      >
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  )
}
