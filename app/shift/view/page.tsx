import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { calcViewPeriod, dateRange, formatDate, prevMonthParam, nextMonthParam } from '@/lib/period'
import SignOutButton from '@/components/SignOutButton'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

export default async function ViewShiftPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'employee') redirect('/')

  const params = await searchParams
  const userId = session.user.dbId
  const { startDate, endDate } = calcViewPeriod(params.month)
  const dates = dateRange(startDate, endDate)

  const [userRes, shiftsRes] = await Promise.all([
    supabaseAdmin.from('users').select('hourly_wage').eq('id', userId).single(),
    supabaseAdmin
      .from('shift_requests')
      .select('target_date, is_available, start_time, end_time')
      .eq('user_id', userId)
      .gte('target_date', formatDate(startDate))
      .lte('target_date', formatDate(endDate)),
  ])

  const hourlyWage = userRes.data?.hourly_wage ?? 1000
  const shifts = shiftsRes.data ?? []
  const shiftMap = new Map(shifts.map((s) => [s.target_date, s]))

  let totalHours = 0
  for (const s of shifts) {
    if (!s.is_available || !s.start_time || !s.end_time) continue
    const [sh, sm] = s.start_time.split(':').map(Number)
    const [eh, em] = s.end_time.split(':').map(Number)
    totalHours += (eh * 60 + em - sh * 60 - sm) / 60
  }
  const estimatedSalary = Math.floor(totalHours * hourlyWage)

  const prev = prevMonthParam(startDate)
  const next = nextMonthParam(startDate)
  const fmt = (d: Date) => `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`

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
        <div className="container">
          <div className="status-widget fade-up">
            <h3 className="status-title">{startDate.getMonth() + 1}月の概算給与</h3>
            <div style={{ fontSize: 40, fontWeight: 800, color: 'var(--text-primary)', margin: '16px 0', fontFamily: 'var(--font-heading)' }}>
              ¥{estimatedSalary.toLocaleString()}
            </div>
            <p className="status-subtitle">
              時給: ¥{hourlyWage.toLocaleString()} × 合計時間: {totalHours.toFixed(1)}h
            </p>
          </div>

          <div className="table-container fade-up stagger-1">
            <div className="table-header">
              <h4 style={{ margin: 0 }}>シフト確認</h4>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 16, borderBottom: '1px solid var(--border)' }}>
              <Link href={`/shift/view?month=${prev}`} className="btn btn-ghost btn-sm">◀</Link>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{fmt(startDate)} 〜 {fmt(endDate)}</span>
              <Link href={`/shift/view?month=${next}`} className="btn btn-ghost btn-sm">▶</Link>
            </div>

            {shifts.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>まだシフト希望が提出されていません。</p>
                <Link href="/shift/input" className="btn">シフトを入力する</Link>
              </div>
            ) : (
              <>
                <div className="table-scroll">
                  <table className="shift-table">
                    <thead>
                      <tr>
                        <th>日付</th>
                        <th>希望シフト</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dates.map((d) => {
                        const ds = formatDate(d)
                        const shift = shiftMap.get(ds)
                        const w = d.getDay()
                        const dayStyle = w === 0 ? { color: 'var(--red)' } : w === 6 ? { color: 'var(--blue)' } : {}
                        let cellClass = ''
                        let content: React.ReactNode = <span style={{ opacity: 0.3 }}>-</span>

                        if (shift) {
                          if (!shift.is_available) {
                            cellClass = 'cell-holiday'
                            content = <span style={{ color: 'var(--red)' }}>休み</span>
                          } else {
                            cellClass = 'cell-work'
                            const st = shift.start_time?.substring(0, 5) ?? ''
                            const et = shift.end_time?.substring(0, 5) ?? ''
                            content = st && et ? `${st} ${et}` : 'Free'
                          }
                        }

                        return (
                          <tr key={ds}>
                            <td style={dayStyle}>{`${d.getMonth() + 1}/${d.getDate()}`} ({WEEKDAYS[w]})</td>
                            <td className={cellClass}>{content}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: 20, textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                  <Link href="/shift/input" className="btn btn-secondary">修正する</Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
