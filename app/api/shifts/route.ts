import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'
import type { ShiftEntry } from '@/types'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const user_id = searchParams.get('user_id')
  const start_date = searchParams.get('start_date')
  const end_date = searchParams.get('end_date')

  if (!user_id || !start_date || !end_date) {
    return NextResponse.json({ error: 'パラメータ不足' }, { status: 400 })
  }

  // 従業員は自分のデータのみ参照可
  if (session.user.role === 'employee' && session.user.dbId !== Number(user_id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('shift_requests')
    .select('target_date, is_available, start_time, end_time')
    .eq('user_id', user_id)
    .gte('target_date', start_date)
    .lte('target_date', end_date)

  if (error) return NextResponse.json({ error: 'DB エラー' }, { status: 500 })
  return NextResponse.json({ success: true, shifts: data })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'employee') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const user_id: number = body?.user_id
  const shifts: ShiftEntry[] = body?.shifts ?? []

  if (!user_id || !shifts.length) {
    return NextResponse.json({ error: 'パラメータ不足' }, { status: 400 })
  }

  if (session.user.dbId !== user_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const rows = shifts.map((s) => ({
    user_id,
    target_date: s.date,
    is_available: s.is_available,
    start_time: s.start_time || null,
    end_time: s.end_time || null,
  }))

  const { error } = await supabaseAdmin
    .from('shift_requests')
    .upsert(rows, { onConflict: 'user_id,target_date' })

  if (error) return NextResponse.json({ error: 'DB エラー' }, { status: 500 })
  return NextResponse.json({ success: true })
}
