import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const { type, currentPassword, newValue } = body ?? {}

  if (!type || !currentPassword || !newValue) {
    return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 })
  }

  const { data: admin } = await supabaseAdmin
    .from('admins')
    .select('id, password')
    .eq('id', session.user.dbId)
    .single()

  if (!admin) return NextResponse.json({ error: '管理者が見つかりません' }, { status: 404 })

  const ok = await bcrypt.compare(currentPassword, admin.password)
  if (!ok) return NextResponse.json({ error: '現在のパスワードが正しくありません' }, { status: 400 })

  if (type === 'username') {
    const { data: existing } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('username', newValue)
      .neq('id', admin.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'このユーザー名は既に使用されています' }, { status: 409 })
    }

    const { error } = await supabaseAdmin
      .from('admins')
      .update({ username: newValue })
      .eq('id', admin.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else if (type === 'password') {
    if (newValue.length < 4) {
      return NextResponse.json({ error: 'パスワードは4文字以上で入力してください' }, { status: 400 })
    }
    const hashed = await bcrypt.hash(newValue, 10)
    const { error } = await supabaseAdmin
      .from('admins')
      .update({ password: hashed })
      .eq('id', admin.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    return NextResponse.json({ error: '不正なリクエストタイプ' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
