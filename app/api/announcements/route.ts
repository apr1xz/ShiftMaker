import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'

const VALID_AUDIENCES = ['all', 'fulltime', 'parttime'] as const
const VALID_PRIORITIES = ['normal', 'important', 'urgent'] as const
const VALID_CATEGORIES = ['shift', 'work', 'event', 'other'] as const

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '5'), 50)

  const { data, error } = await supabaseAdmin
    .from('announcements')
    .select('id, title, content, target_audience, priority, category, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  return NextResponse.json({ success: true, announcements: data })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ success: false, message: '権限がありません' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const title = String(body?.title ?? '').trim()
  const content = String(body?.content ?? '').trim()
  let target_audience = String(body?.target_audience ?? 'all')
  let priority = String(body?.priority ?? 'normal')
  let category = String(body?.category ?? 'other')

  if (!title || !content) {
    return NextResponse.json({ success: false, message: 'タイトルと内容を入力してください' }, { status: 400 })
  }

  if (!VALID_AUDIENCES.includes(target_audience as never)) target_audience = 'all'
  if (!VALID_PRIORITIES.includes(priority as never)) priority = 'normal'
  if (!VALID_CATEGORIES.includes(category as never)) category = 'other'

  const { data, error } = await supabaseAdmin
    .from('announcements')
    .insert({ title, content, target_audience, priority, category })
    .select('id')
    .single()

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  return NextResponse.json({ success: true, message: 'お知らせを作成しました', id: data.id })
}
