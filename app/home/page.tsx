import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { calcShiftPeriod } from '@/lib/period'
import AnnouncementsWidget from '@/components/AnnouncementsWidget'
import AnnouncementModal from '@/components/AnnouncementModal'
import SignOutButton from '@/components/SignOutButton'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const session = await auth()
  if (!session) redirect('/')

  const role = session.user.role
  const displayName = session.user.displayName
  const { startDate, endDate, deadline, modeLabel, isOpen } = calcShiftPeriod()

  const fmt = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日`
  const deadlineFmt = `${String(deadline.getMonth() + 1).padStart(2, '0')}/${String(deadline.getDate()).padStart(2, '0')}`

  return (
    <>
      <header className="header">
        <span className="header-title">Shift Maker</span>
        <div className="header-actions">
          <SignOutButton />
        </div>
      </header>

      <main>
        <div className="container">
          <div className="home-greeting">
            <h2 className="fade-up">こんにちは</h2>
            <h1 className="fade-up stagger-1">{displayName}さん</h1>
          </div>

          <div className="home-grid fade-up stagger-2">
            <div className="status-widget">
              <div className={`status-badge ${isOpen ? 'open' : 'closed'}`}>
                <span className="status-badge-dot"></span>
                {isOpen ? '受付中' : '締切'}
              </div>
              <h3 className="status-title">{modeLabel}</h3>
              <p className="status-subtitle">
                {fmt(startDate)} 〜 {fmt(endDate)} ｜ 締切: {deadlineFmt}
              </p>
            </div>

            <AnnouncementsWidget />
          </div>

          <h4 className="fade-up stagger-3" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1, marginBottom: 16 }}>
            メニュー
          </h4>

          <div className="menu-grid">
            {role === 'employee' ? (
              <>
                <Link href="/shift/input" className="menu-card fade-up stagger-4">
                  <div className="menu-card-icon" style={{ background: 'rgba(0,113,227,0.1)' }}>📅</div>
                  <span className="menu-card-title">シフト入力</span>
                  <span className="menu-card-desc">来月のシフト希望を提出</span>
                </Link>
                <Link href="/shift/view" className="menu-card fade-up stagger-5">
                  <div className="menu-card-icon" style={{ background: 'rgba(48,209,88,0.1)' }}>💰</div>
                  <span className="menu-card-title">給与確認</span>
                  <span className="menu-card-desc">確定シフトと概算給与</span>
                </Link>
              </>
            ) : (
              <>
                <Link href="/admin" className="menu-card fade-up stagger-4">
                  <div className="menu-card-icon" style={{ background: 'rgba(88,86,214,0.1)' }}>📊</div>
                  <span className="menu-card-title">シフト管理</span>
                  <span className="menu-card-desc">スタッフのシフトを確認</span>
                </Link>
                <AnnouncementModal />
                <div className="menu-card fade-up stagger-6" style={{ opacity: 0.4, cursor: 'default' }}>
                  <div className="menu-card-icon" style={{ background: 'var(--bg-tertiary)' }}>⚙️</div>
                  <span className="menu-card-title">店舗設定</span>
                  <span className="menu-card-desc">準備中</span>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

    </>
  )
}
