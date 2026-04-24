'use client'

import { useEffect, useState } from 'react'
import type { Announcement } from '@/types'

export default function AnnouncementsWidget() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Announcement | null>(null)

  useEffect(() => {
    fetch('/api/announcements?limit=5')
      .then((r) => r.json())
      .then((d) => { if (d.success) setAnnouncements(d.announcements) })
      .finally(() => setLoading(false))
  }, [])

  function formatDate(s: string) {
    const d = new Date(s)
    return `${d.getMonth() + 1}/${d.getDate()}`
  }

  function PriorityBadge({ priority }: { priority: string }) {
    if (priority === 'urgent') return <span className="priority-badge urgent">緊急</span>
    if (priority === 'important') return <span className="priority-badge important">重要</span>
    return null
  }

  return (
    <>
      <div className="announcements-widget">
        <h4 className="announcements-title">📢 お知らせ</h4>
        <div className="announcements-list">
          {loading ? (
            <p className="text-caption" style={{ textAlign: 'center', padding: 20 }}>読み込み中...</p>
          ) : announcements.length === 0 ? (
            <p className="text-caption" style={{ textAlign: 'center', padding: 20, opacity: 0.5 }}>お知らせはありません</p>
          ) : (
            announcements.map((a) => (
              <div key={a.id} className="announcement-item" onClick={() => setSelected(a)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                  <PriorityBadge priority={a.priority} />
                  <div className="announcement-item-title">{a.title}</div>
                </div>
                <div className="announcement-item-date">{formatDate(a.created_at)}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {selected && (
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setSelected(null) }}>
          <div className="modal-content">
            <h3 className="modal-title">{selected.title}</h3>
            <p className="text-caption" style={{ marginBottom: 16 }}>{formatDate(selected.created_at)}</p>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{selected.content}</div>
            <div className="modal-actions" style={{ marginTop: 24 }}>
              <button className="btn" onClick={() => setSelected(null)}>閉じる</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
