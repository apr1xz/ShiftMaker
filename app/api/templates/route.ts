import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'employee') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const label_name = String(body?.label_name ?? '').trim()
  const start_time = String(body?.start_time ?? '').trim()
  const end_time = String(body?.end_time ?? '').trim()

  if (!label_name || !start_time || !end_time) {
    return NextResponse.json({ error: 'パラメータ不足' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('user_templates')
    .insert({ user_id: session.user.dbId, label_name, start_time, end_time })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'DB エラー' }, { status: 500 })
  return NextResponse.json({ success: true, template: data })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'employee') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const template_ids: number[] = body?.template_ids ?? []

  if (!Array.isArray(template_ids) || template_ids.length === 0) {
    return NextResponse.json({ error: 'テンプレートIDが指定されていません' }, { status: 400 })
  }

  const ids = template_ids.map(Number).filter((n) => n > 0)

  const { error, count } = await supabaseAdmin
    .from('user_templates')
    .delete({ count: 'exact' })
    .eq('user_id', session.user.dbId)
    .in('id', ids)

  if (error) return NextResponse.json({ error: 'DB エラー' }, { status: 500 })
  return NextResponse.json({ success: true, deleted_count: count })
}
