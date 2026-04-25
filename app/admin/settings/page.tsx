import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'

export default async function SettingsPage() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') redirect('/')

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
            <Link href="/home" className="btn btn-ghost btn-sm" style={{ marginBottom: 12, display: 'inline-flex', gap: 4 }}>
              ← 戻る
            </Link>
            <h2 style={{ margin: 0 }}>店舗設定</h2>
          </div>

          <div className="settings-list fade-up stagger-1">
            <div>
              <p className="settings-group-label">スタッフ</p>
              <div className="settings-group">
                <Link href="/admin/settings/users" className="settings-row">
                  <span className="settings-row-icon" style={{ background: 'rgba(0,113,227,0.12)' }}>👥</span>
                  <div className="settings-row-body">
                    <div className="settings-row-title">ユーザー管理</div>
                    <div className="settings-row-desc">登録スタッフの確認・削除</div>
                  </div>
                  <span className="settings-row-chevron">›</span>
                </Link>
                <Link href="/admin/settings/wages" className="settings-row">
                  <span className="settings-row-icon" style={{ background: 'rgba(48,209,88,0.12)' }}>💴</span>
                  <div className="settings-row-body">
                    <div className="settings-row-title">基本時給の設定</div>
                    <div className="settings-row-desc">デフォルト時給・個別時給の変更</div>
                  </div>
                  <span className="settings-row-chevron">›</span>
                </Link>
              </div>
            </div>

            <div>
              <p className="settings-group-label">管理者</p>
              <div className="settings-group">
                <Link href="/admin/settings/admin" className="settings-row">
                  <span className="settings-row-icon" style={{ background: 'rgba(142,142,147,0.15)' }}>🔐</span>
                  <div className="settings-row-body">
                    <div className="settings-row-title">管理者設定</div>
                    <div className="settings-row-desc">ユーザー名・パスワードの変更</div>
                  </div>
                  <span className="settings-row-chevron">›</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
