import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const { user_id, date, is_available, start_time, end_time } = body ?? {}

  if (!user_id || !date || is_available === undefined) {
    return NextResponse.json({ error: 'パラメータ不足' }, { status: 400 })
  }

  const row = {
    user_id: Number(user_id),
    target_date: date,
    is_available: Boolean(Number(is_available)),
    start_time: start_time || null,
    end_time: end_time || null,
  }

  const { error } = await supabaseAdmin
    .from('shift_requests')
    .upsert(row, { onConflict: 'user_id,target_date' })

  if (error) return NextResponse.json({ error: 'DB エラー' }, { status: 500 })
  return NextResponse.json({ success: true })
}
