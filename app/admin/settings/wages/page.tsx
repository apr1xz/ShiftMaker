import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import SignOutButton from '@/components/SignOutButton'
import WageSettings from '@/components/WageSettings'

export default async function WagesSettingsPage() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') redirect('/')

  const [usersResult, wageResult] = await Promise.all([
    supabaseAdmin.from('users').select('id, name, employee_id, hourly_wage').order('employee_id'),
    supabaseAdmin.from('store_settings').select('value').eq('key', 'default_hourly_wage').single(),
  ])

  const users = usersResult.data ?? []
  const defaultWage = Number(wageResult.data?.value ?? 1000) || 1000

  return (
    <>
      <header className="header">
        <Link href="/home" className="header-title">Shift Maker</Link>
        <div className="header-actions">
          <Link href="/home" className="btn btn-ghost btn-sm">ホーム</Link>
          <SignOutButton />
        </div>
      </header>

      <main>
        <div className="container" style={{ maxWidth: 640 }}>
          <div className="fade-up" style={{ marginBottom: 32 }}>
            <Link href="/admin/settings" className="btn btn-ghost btn-sm" style={{ marginBottom: 12, display: 'inline-flex', gap: 4 }}>
              ← 設定
            </Link>
            <h2 style={{ margin: 0 }}>基本時給の設定</h2>
          </div>

          <div className="settings-card fade-up stagger-1">
            <WageSettings users={users} defaultWage={defaultWage} />
          </div>
        </div>
      </main>
    </>
  )
}
