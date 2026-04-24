'use client'

import { signOut } from 'next-auth/react'

export default function SignOutButton({ className = 'btn btn-ghost btn-sm' }: { className?: string }) {
  return (
    <button className={className} onClick={() => signOut({ callbackUrl: '/' })}>
      ログアウト
    </button>
  )
}
