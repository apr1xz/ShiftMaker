import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const user_id = Number(body?.user_id)
  if (!user_id) return NextResponse.json({ error: 'user_id が必要です' }, { status: 400 })

  const { error } = await supabaseAdmin.from('users').delete().eq('id', user_id)
  if (error) return NextResponse.json({ error: 'DB エラー: ' + error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
