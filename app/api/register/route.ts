import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: '不正なリクエスト' }, { status: 400 })

  const name = String(body.name ?? '').trim()
  const employee_id = String(body.employee_id ?? '').trim()
  const password = String(body.password ?? '').trim()

  if (!name || employee_id.length !== 6 || password.length !== 4) {
    return NextResponse.json(
      { error: 'すべての項目を正しく入力してください（社員番号6桁、パスワード4桁）' },
      { status: 400 }
    )
  }

  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('employee_id', employee_id)
    .single()

  if (existing) {
    return NextResponse.json(
      { error: 'この社員番号は既に登録されています' },
      { status: 409 }
    )
  }

  const hashed = await bcrypt.hash(password, 10)
  const { error } = await supabaseAdmin
    .from('users')
    .insert({ name, employee_id, password: hashed })

  if (error) return NextResponse.json({ error: 'DB エラー' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
