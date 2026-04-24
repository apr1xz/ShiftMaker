import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const { action, user_id, wage } = body ?? {}

  if (wage === undefined || wage === null) {
    return NextResponse.json({ error: '時給を入力してください' }, { status: 400 })
  }

  if (action === 'update_all') {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ hourly_wage: Number(wage) })
      .neq('id', 0) // 全件

    if (error) return NextResponse.json({ error: 'DB エラー' }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (!user_id) return NextResponse.json({ error: 'user_id が必要です' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('users')
    .update({ hourly_wage: Number(wage) })
    .eq('id', Number(user_id))

  if (error) return NextResponse.json({ error: 'DB エラー' }, { status: 500 })
  return NextResponse.json({ success: true })
}
