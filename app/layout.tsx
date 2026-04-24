import type { Metadata } from 'next'
import './globals.css'
import { auth } from '@/auth'
import SessionProvider from '@/components/SessionProvider'

export const metadata: Metadata = {
  title: 'Shift Maker',
  description: 'シフト管理を、もっとシンプルに。',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  return (
    <html lang="ja">
      <body>
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  )
}
