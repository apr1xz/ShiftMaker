import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { getHolidaysForYears } from '@/lib/holidays'
import { calcShiftPeriod, dateRange, formatDate } from '@/lib/period'
import SignOutButton from '@/components/SignOutButton'
import ShiftCalendar from '@/components/ShiftCalendar'

export default async function ShiftInputPage() {
  const session = await auth()
  if (!session || session.user.role !== 'employee') redirect('/')

  const userId = session.user.dbId
  const { startDate, endDate, deadline, modeLabel, isOpen } = calcShiftPeriod()
  const dates = dateRange(startDate, endDate)

  const years = [...new Set([startDate.getFullYear(), endDate.getFullYear()])]
  const holidays = await getHolidaysForYears(years)

  const { data: templates } = await supabaseAdmin
    .from('user_templates')
    .select('id, label_name, start_time, end_time')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const startStr = formatDate(startDate)
  const endStr = formatDate(endDate)
  const deadlineStr = `${String(deadline.getMonth() + 1).padStart(2, '0')}/${String(deadline.getDate()).padStart(2, '0')}`
  const rangeStr = `${startDate.getMonth() + 1}月${startDate.getDate()}日 〜 ${endDate.getMonth() + 1}月${endDate.getDate()}日`

  return (
    <>
      <header className="header">
        <Link href="/home" className="header-title">Shift Maker</Link>
        <div className="header-actions">
          <Link href="/home" className="btn btn-ghost btn-sm">ホーム</Link>
          <SignOutButton />
        </div>
      </header>

      <main className="main-center">
        <div className="container-input">
          <ShiftCalendar
            userId={userId}
            dates={dates.map(formatDate)}
            holidays={holidays}
            templates={templates ?? []}
            startDate={startStr}
            endDate={endStr}
            modeLabel={modeLabel}
            rangeStr={rangeStr}
            deadlineStr={deadlineStr}
            isReadOnly={!isOpen}
          />
        </div>
      </main>
    </>
  )
}
