'use client'

import { useState } from 'react'

export default function AnnouncementModal() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [targetAudience, setTargetAudience] = useState('all')
  const [priority, setPriority] = useState('normal')
  const [category, setCategory] = useState('other')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!title.trim() || !content.trim()) { alert('タイトルと内容を入力してください'); return }
    setLoading(true)
    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, target_audience: targetAudience, priority, category }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.success) {
      alert('お知らせを投稿しました')
      setOpen(false)
      setTitle(''); setContent(''); setTargetAudience('all'); setPriority('normal'); setCategory('other')
    } else {
      alert('エラー: ' + data.message)
    }
  }

  return (
    <>
      <div className="menu-card fade-up stagger-5" onClick={() => setOpen(true)} style={{ cursor: 'pointer' }}>
        <div className="menu-card-icon" style={{ background: 'rgba(255,159,10,0.1)' }}>📢</div>
        <span className="menu-card-title">お知らせ作成</span>
        <span className="menu-card-desc">従業員へ通知</span>
      </div>

      {open && (
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="modal-content" style={{ maxWidth: 550 }}>
            <h3 className="modal-title">お知らせ作成</h3>
            <div className="form-group">
              <label className="form-label">タイトル</label>
              <input type="text" className="form-input" placeholder="タイトルを入力" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">内容</label>
              <textarea className="form-input" rows={6} placeholder="内容を入力" value={content} onChange={(e) => setContent(e.target.value)} style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">公開範囲</label>
                <select className="form-input" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)}>
                  <option value="all">全員</option>
                  <option value="fulltime">正社員</option>
                  <option value="parttime">アルバイト</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">重要度</label>
                <select className="form-input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="normal">通常</option>
                  <option value="important">重要</option>
                  <option value="urgent">緊急</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">カテゴリ</label>
                <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="shift">シフト募集</option>
                  <option value="work">業務連絡</option>
                  <option value="event">イベント</option>
                  <option value="other">その他</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setOpen(false)}>キャンセル</button>
              <button className="btn" onClick={submit} disabled={loading}>{loading ? '送信中...' : '投稿'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
