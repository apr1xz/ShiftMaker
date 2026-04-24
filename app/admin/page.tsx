import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { getHolidaysForYears } from '@/lib/holidays'
import { calcViewPeriod, dateRange, formatDate, prevMonthParam, nextMonthParam } from '@/lib/period'
import SignOutButton from '@/components/SignOutButton'
import AdminControls from '@/components/AdminControls'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') redirect('/')

  const params = await searchParams
  const { startDate, endDate } = calcViewPeriod(params.month)
  const dates = dateRange(startDate, endDate)
  const years = [...new Set([startDate.getFullYear(), endDate.getFullYear()])]

  const [usersRes, shiftsRes, holidays] = await Promise.all([
    supabaseAdmin.from('users').select('id, name, employee_id, hourly_wage').order('id'),
    supabaseAdmin
      .from('shift_requests')
      .select('user_id, target_date, is_available, start_time, end_time')
      .gte('target_date', formatDate(startDate))
      .lte('target_date', formatDate(endDate)),
    getHolidaysForYears(years),
  ])

  const users = usersRes.data ?? []
  const shifts = shiftsRes.data ?? []

  const shiftMap = new Map<string, (typeof shifts)[0]>()
  for (const s of shifts) shiftMap.set(`${s.user_id}:${s.target_date}`, s)

  const userHours: Record<number, number> = {}
  for (const s of shifts) {
    if (!s.is_available || !s.start_time || !s.end_time) continue
    const [sh, sm] = s.start_time.split(':').map(Number)
    const [eh, em] = s.end_time.split(':').map(Number)
    userHours[s.user_id] = (userHours[s.user_id] ?? 0) + (eh * 60 + em - sh * 60 - sm) / 60
  }

  const dailyCount: Record<string, number> = {}
  for (const s of shifts) {
    if (s.is_available) dailyCount[s.target_date] = (dailyCount[s.target_date] ?? 0) + 1
  }

  const prev = prevMonthParam(startDate)
  const next = nextMonthParam(startDate)
  const fmt = (d: Date) => `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
  const exportMonth = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`

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
        <div className="container-wide">
          <div className="flex justify-between items-center mb-3 fade-up">
            <h2 style={{ margin: 0 }}>シフト管理</h2>
            <div className="flex gap-1">
              <AdminControls users={users.map((u) => ({ id: u.id, name: u.name, hourly_wage: u.hourly_wage }))} />
              <a href={`/api/export?month=${exportMonth}`} className="btn btn-secondary btn-sm">CSV</a>
            </div>
          </div>

          <div className="table-container fade-up stagger-1">
            <div className="table-header">
              <div className="flex items-center gap-2">
                <Link href={`/admin?month=${prev}`} className="btn btn-ghost btn-sm">◀︎</Link>
                <h4 style={{ margin: 0, fontWeight: 600 }}>{fmt(startDate)} 〜 {fmt(endDate)}</h4>
                <Link href={`/admin?month=${next}`} className="btn btn-ghost btn-sm">▶︎</Link>
              </div>
            </div>

            <div className="table-scroll">
              <table className="shift-table" id="shiftTable">
                <thead>
                  <tr>
                    <th>スタッフ</th>
                    {dates.map((d) => {
                      const ds = formatDate(d)
                      const w = d.getDay()
                      const holiday = holidays[ds]
                      const isHoliday = !!holiday
                      const count = dailyCount[ds] ?? 0
                      const colorStyle = isHoliday || w === 0 ? { color: 'var(--red)' } : w === 6 ? { color: 'var(--blue)' } : {}
                      return (
                        <th key={ds} style={colorStyle} className={isHoliday ? 'national-holiday' : ''}>
                          {d.getDate()}<br />
                          <small>{WEEKDAYS[w]}</small>
                          {isHoliday && <span className="holiday-name">{holiday}</span>}
                          <span className={`available-count${count === 0 ? ' zero' : ''}`}>{count}人</span>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>{user.name}</div>
                        <div className="text-caption">ID: {user.employee_id}</div>
                        <div className="text-caption mt-1">
                          <span style={{ color: 'var(--blue)' }}>¥{user.hourly_wage.toLocaleString()}/h</span>
                        </div>
                        <div className="text-caption" style={{ fontWeight: 600 }}>
                          計: {(userHours[user.id] ?? 0).toFixed(1)}h
                        </div>
                      </td>
                      {dates.map((d) => {
                        const ds = formatDate(d)
                        const shift = shiftMap.get(`${user.id}:${ds}`)
                        let cellClass = ''
                        let content: React.ReactNode = <span style={{ opacity: 0.3 }}>-</span>

                        if (shift) {
                          if (!shift.is_available) {
                            cellClass = 'cell-holiday'
                            content = <span style={{ color: 'var(--red)', fontWeight: 600 }}>休</span>
                          } else {
                            cellClass = 'cell-work'
                            const st = shift.start_time?.substring(0, 5) ?? ''
                            const et = shift.end_time?.substring(0, 5) ?? ''
                            content = st && et ? (
                              <div style={{ lineHeight: 1.3 }}>
                                <span style={{ display: 'block', fontWeight: 500 }}>{st}</span>
                                <span style={{ display: 'block', opacity: 0.6, fontSize: 12 }}>{et}</span>
                              </div>
                            ) : 'Free'
                          }
                        }

                        return (
                          <AdminShiftCell
                            key={ds}
                            userId={user.id}
                            userName={user.name}
                            date={ds}
                            isAvailable={shift?.is_available ?? null}
                            startTime={shift?.start_time ?? null}
                            endTime={shift?.end_time ?? null}
                            cellClass={cellClass}
                            content={content}
                          />
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

function AdminShiftCell({
  userId, userName, date, isAvailable, startTime, endTime, cellClass, content,
}: {
  userId: number; userName: string; date: string
  isAvailable: boolean | null; startTime: string | null; endTime: string | null
  cellClass: string; content: React.ReactNode
}) {
  return (
    <td
      className={cellClass}
      data-user-id={userId}
      data-date={date}
      data-available={isAvailable ?? ''}
      data-start={startTime ?? ''}
      data-end={endTime ?? ''}
      data-name={userName}
    >
      {content}
    </td>
  )
}
