'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'

interface ShiftData {
  is_available: boolean
  start_time: string | null
  end_time: string | null
}

interface UserInfo {
  id: number
  name: string
  employee_id: string
  hourly_wage: number
}

interface Props {
  users: UserInfo[]
  shiftsByUser: Record<number, Record<string, ShiftData>>
  dates: string[]
  holidays: Record<string, string>
  prev: string
  next: string
  periodLabel: string
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

export default function AdminMobileView({
  users,
  shiftsByUser: initialShiftsByUser,
  dates,
  holidays,
  prev,
  next,
  periodLabel,
}: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [shiftsByUser, setShiftsByUser] = useState(initialShiftsByUser)
  const [editDay, setEditDay] = useState<{ date: string } | null>(null)
  const [editStatus, setEditStatus] = useState(1)
  const [editStart, setEditStart] = useState('')
  const [editEnd, setEditEnd] = useState('')
  const [saving, setSaving] = useState(false)

  const user = users[selectedIndex]
  const userShifts = shiftsByUser[user?.id] ?? {}
  const firstDow = new Date(dates[0]).getDay()

  function openEdit(date: string) {
    const shift = userShifts[date]
    setEditDay({ date })
    setEditStatus(shift && !shift.is_available ? 0 : 1)
    setEditStart(shift?.start_time?.substring(0, 5) ?? '')
    setEditEnd(shift?.end_time?.substring(0, 5) ?? '')
  }

  async function saveEdit() {
    if (!editDay || !user) return
    setSaving(true)
    const res = await fetch('/api/shifts/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        date: editDay.date,
        is_available: editStatus,
        start_time: editStatus === 1 ? editStart : '',
        end_time: editStatus === 1 ? editEnd : '',
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.success) {
      setShiftsByUser((prev) => ({
        ...prev,
        [user.id]: {
          ...prev[user.id],
          [editDay.date]: {
            is_available: editStatus === 1,
            start_time: editStatus === 1 ? (editStart ? editStart + ':00' : null) : null,
            end_time: editStatus === 1 ? (editEnd ? editEnd + ':00' : null) : null,
          },
        },
      }))
      setEditDay(null)
    } else {
      alert('更新失敗: ' + data.error)
    }
  }

  if (!user) return null

  return (
    <div className="admin-mobile-view fade-up">
      {/* Period navigation */}
      <div className="admin-mobile-period">
        <Link href={`/admin?month=${prev}`} className="btn btn-ghost btn-sm">◀︎</Link>
        <span style={{ fontWeight: 600, fontSize: 13 }}>{periodLabel}</span>
        <Link href={`/admin?month=${next}`} className="btn btn-ghost btn-sm">▶︎</Link>
      </div>

      {/* User selector */}
      <div className="admin-mobile-selector">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setSelectedIndex((i) => Math.max(0, i - 1))}
          disabled={selectedIndex === 0}
          style={{ minWidth: 36 }}
        >◀</button>
        <select
          className="admin-mobile-select"
          value={selectedIndex}
          onChange={(e) => setSelectedIndex(Number(e.target.value))}
        >
          {users.map((u, i) => (
            <option key={u.id} value={i}>{u.name}</option>
          ))}
        </select>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setSelectedIndex((i) => Math.min(users.length - 1, i + 1))}
          disabled={selectedIndex === users.length - 1}
          style={{ minWidth: 36 }}
        >▶</button>
      </div>

      {/* Selected user info */}
      <div className="admin-mobile-user-info">
        <span className="text-caption" style={{ color: 'var(--text-secondary)' }}>ID: {user.employee_id}</span>
        <span style={{ fontWeight: 700, fontSize: 17 }}>{user.name}</span>
        <span style={{ color: 'var(--blue)', fontSize: 13 }}>¥{user.hourly_wage.toLocaleString()}/h</span>
      </div>

      {/* Calendar */}
      <div className="calendar-container" style={{ marginTop: 0, borderRadius: 'var(--radius-lg)' }}>
        <div className="calendar-grid">
          {WEEKDAYS.map((w, i) => (
            <div key={w} className={`calendar-weekday-header${i === 0 ? ' sunday' : i === 6 ? ' saturday' : ''}`}>{w}</div>
          ))}
          {Array.from({ length: firstDow }, (_, i) => (
            <div key={`e${i}`} className="calendar-day-empty" />
          ))}
          {dates.map((date) => {
            const shift = userShifts[date]
            const w = new Date(date).getDay()
            const isHoliday = !!holidays[date]
            const dayClass = isHoliday || w === 0 ? 'sunday' : w === 6 ? 'saturday' : ''
            let timeText = ''
            if (shift) {
              if (!shift.is_available) {
                timeText = '休'
              } else if (shift.start_time && shift.end_time) {
                timeText = `${shift.start_time.substring(0, 5)}\n${shift.end_time.substring(0, 5)}`
              } else {
                timeText = 'Free'
              }
            }

            return (
              <div
                key={date}
                className={`calendar-day${dayClass ? ` ${dayClass}` : ''}`}
                data-available={shift != null ? String(shift.is_available) : undefined}
                onClick={() => openEdit(date)}
              >
                <span className="calendar-day-number">{new Date(date).getDate()}</span>
                {isHoliday && <span className="calendar-day-holiday">{holidays[date]}</span>}
                <span className="calendar-day-time" style={{ whiteSpace: 'pre-line' }}>{timeText}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Edit modal */}
      {editDay && createPortal(
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setEditDay(null) }}>
          <div className="modal-content">
            <h3 className="modal-title">シフト編集</h3>
            <p className="modal-subtitle" style={{ color: 'var(--blue)', fontWeight: 600 }}>
              {user.name} - {editDay.date}
            </p>
            <div className="form-group">
              <label className="form-label" style={{ display: 'block', textAlign: 'center' }}>ステータス</label>
              <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                <button type="button" className={`btn ${editStatus === 0 ? '' : 'btn-secondary'}`} onClick={() => setEditStatus(0)} style={{ flex: 1 }}>休み</button>
                <button type="button" className={`btn ${editStatus === 1 ? '' : 'btn-secondary'}`} onClick={() => setEditStatus(1)} style={{ flex: 1 }}>出勤</button>
              </div>
            </div>
            {editStatus === 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 13 }}>開始</label>
                  <input type="time" className="form-input" value={editStart} onChange={(e) => setEditStart(e.target.value)} style={{ textAlign: 'center' }} />
                </div>
                <span style={{ paddingTop: 20 }}>〜</span>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 13 }}>終了</label>
                  <input type="time" className="form-input" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} style={{ textAlign: 'center' }} />
                </div>
              </div>
            )}
            <div className="modal-actions">
              <button onClick={() => setEditDay(null)} className="btn btn-secondary">キャンセル</button>
              <button onClick={saveEdit} className="btn" disabled={saving}>{saving ? '保存中...' : '保存'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
