import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { calcViewPeriod, dateRange, formatDate } from '@/lib/period'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const { startDate, endDate } = calcViewPeriod(searchParams.get('month') ?? undefined)
  const dates = dateRange(startDate, endDate)

  const [usersRes, shiftsRes] = await Promise.all([
    supabaseAdmin.from('users').select('id, name, employee_id').order('id'),
    supabaseAdmin
      .from('shift_requests')
      .select('user_id, target_date, is_available, start_time, end_time')
      .gte('target_date', formatDate(startDate))
      .lte('target_date', formatDate(endDate)),
  ])

  const users = usersRes.data ?? []
  const shifts = shiftsRes.data ?? []

  const shiftMap = new Map<string, (typeof shifts)[0]>()
  for (const s of shifts) shiftMap.set(`${s.user_id}:${s.target_date}`, s)

  const BOM = '﻿'
  const rows: string[][] = []

  const header = ['社員番号', '氏名', ...dates.map((d) => `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAYS[d.getDay()]})`)]
  rows.push(header)

  for (const user of users) {
    const row = [user.employee_id, user.name]
    for (const d of dates) {
      const s = shiftMap.get(`${user.id}:${formatDate(d)}`)
      if (!s) { row.push(''); continue }
      if (!s.is_available) { row.push('公休'); continue }
      const st = s.start_time ? s.start_time.substring(0, 5) : ''
      const et = s.end_time ? s.end_time.substring(0, 5) : ''
      row.push(st && et ? `${st}\n${et}` : '')
    }
    rows.push(row)
  }

  const csv = BOM + rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\r\n')
  const filename = `shifts_${startDate.getFullYear()}${String(startDate.getMonth() + 1).padStart(2, '0')}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
