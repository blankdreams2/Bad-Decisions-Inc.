import ConvexClientProvider from '@/app/convex-client-provider'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'
import { Rubik, Syne } from 'next/font/google'
import './globals.css'

const rubik = Rubik({
  subsets: ['latin'],
  variable: '--font-rubik-var',
})

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne-var',
})

export const metadata: Metadata = {
  title: 'Bad Decisions Inc',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={cn(rubik.className, rubik.variable, syne.variable, 'bg-midnight')}>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  )
}
