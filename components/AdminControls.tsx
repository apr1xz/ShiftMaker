'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface UserInfo { id: number; name: string; hourly_wage: number }

interface Props { users: UserInfo[] }

export default function AdminControls({ users }: Props) {
  const [wageUser, setWageUser] = useState<UserInfo | null>(null)
  const [wageValue, setWageValue] = useState('')
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkWage, setBulkWage] = useState('')
  const [editShift, setEditShift] = useState<{
    userId: number; date: string; name: string;
    isAvailable: boolean; startTime: string; endTime: string;
  } | null>(null)
  const [editStatus, setEditStatus] = useState(1)
  const [deleteUserOpen, setDeleteUserOpen] = useState(false)
  const [deleteUserId, setDeleteUserId] = useState<number>(users[0]?.id ?? 0)

  // Intercept table cell clicks for shift editing
  useEffect(() => {
    function handler(e: MouseEvent) {
      const td = (e.target as Element).closest('td[data-user-id]') as HTMLElement | null
      if (!td) return
      const userId = Number(td.dataset.userId)
      const date = td.dataset.date ?? ''
      const available = td.dataset.available
      const start = td.dataset.start ?? ''
      const end = td.dataset.end ?? ''
      const name = td.dataset.name ?? ''
      if (!userId || !date) return
      setEditShift({
        userId, date, name,
        isAvailable: available !== '0' && available !== 'false',
        startTime: start.substring(0, 5),
        endTime: end.substring(0, 5),
      })
      setEditStatus(available === '0' || available === 'false' ? 0 : 1)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  async function saveWage() {
    if (!wageUser) return
    const res = await fetch('/api/wages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: wageUser.id, wage: wageValue }),
    })
    const data = await res.json()
    if (data.success) location.reload()
    else alert('更新失敗: ' + data.error)
  }

  async function saveBulkWage() {
    if (!bulkWage) return
    if (!confirm(`本当に全員の時給を ${bulkWage}円 に変更しますか？`)) return
    const res = await fetch('/api/wages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_all', wage: bulkWage }),
    })
    const data = await res.json()
    if (data.success) { alert('更新しました'); location.reload() }
    else alert('更新失敗: ' + data.error)
  }

  async function saveShiftUpdate() {
    if (!editShift) return
    const body: Record<string, unknown> = {
      user_id: editShift.userId,
      date: editShift.date,
      is_available: editStatus,
    }
    if (editStatus === 1) {
      body.start_time = (document.getElementById('editShiftStart') as HTMLInputElement)?.value ?? ''
      body.end_time = (document.getElementById('editShiftEnd') as HTMLInputElement)?.value ?? ''
    } else {
      body.start_time = ''
      body.end_time = ''
    }
    const res = await fetch('/api/shifts/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data.success) location.reload()
    else alert('更新失敗: ' + data.error)
  }

  async function deleteUser() {
    const target = users.find((u) => u.id === deleteUserId)
    if (!target) return
    if (!confirm(`「${target.name}」を削除しますか？\nシフトデータも全て削除されます。`)) return
    const res = await fetch('/api/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: target.id }),
    })
    const data = await res.json()
    if (data.success) { setDeleteUserOpen(false); location.reload() }
    else alert('削除失敗: ' + data.error)
  }

  return (
    <>
      <button onClick={() => setBulkOpen(true)} className="btn btn-secondary btn-sm">時給一括</button>
      <button onClick={() => { setDeleteUserId(users[0]?.id ?? 0); setDeleteUserOpen(true) }} className="btn btn-secondary btn-sm" style={{ color: 'var(--red)' }}>削除</button>

      {/* Individual wage modal */}
      {wageUser && createPortal(
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setWageUser(null) }}>
          <div className="modal-content">
            <h3 className="modal-title">時給設定</h3>
            <p className="modal-subtitle">{wageUser.name}さんの時給を変更</p>
            <div className="form-group">
              <label className="form-label">時給 (円)</label>
              <input type="number" className="form-input" step={10} value={wageValue} onChange={(e) => setWageValue(e.target.value)} style={{ textAlign: 'center', fontSize: 20 }} />
            </div>
            <div className="modal-actions">
              <button onClick={() => setWageUser(null)} className="btn btn-secondary">キャンセル</button>
              <button onClick={saveWage} className="btn">保存</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Bulk wage modal */}
      {bulkOpen && createPortal(
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setBulkOpen(false) }}>
          <div className="modal-content">
            <h3 className="modal-title">時給一括設定</h3>
            <p className="modal-subtitle">全スタッフの時給を更新します。<br /><span style={{ color: 'var(--red)' }}>この操作は取り消せません。</span></p>
            <div className="form-group">
              <label className="form-label">新しい時給 (円)</label>
              <input type="number" className="form-input" step={10} placeholder="1000" value={bulkWage} onChange={(e) => setBulkWage(e.target.value)} style={{ textAlign: 'center', fontSize: 20 }} />
            </div>
            <div className="modal-actions">
              <button onClick={() => setBulkOpen(false)} className="btn btn-secondary">キャンセル</button>
              <button onClick={saveBulkWage} className="btn">一括更新</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit shift modal */}
      {editShift && createPortal(
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setEditShift(null) }}>
          <div className="modal-content">
            <h3 className="modal-title">シフト編集</h3>
            <p className="modal-subtitle" style={{ color: 'var(--blue)', fontWeight: 600 }}>
              {editShift.name} - {editShift.date}
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
                  <input type="time" id="editShiftStart" className="form-input" defaultValue={editShift.startTime} style={{ textAlign: 'center' }} />
                </div>
                <span style={{ paddingTop: 20 }}>〜</span>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 13 }}>終了</label>
                  <input type="time" id="editShiftEnd" className="form-input" defaultValue={editShift.endTime} style={{ textAlign: 'center' }} />
                </div>
              </div>
            )}
            <div className="modal-actions">
              <button onClick={() => setEditShift(null)} className="btn btn-secondary">キャンセル</button>
              <button onClick={saveShiftUpdate} className="btn">保存</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete user modal */}
      {deleteUserOpen && createPortal(
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setDeleteUserOpen(false) }}>
          <div className="modal-content">
            <h3 className="modal-title">スタッフ削除</h3>
            <p className="modal-subtitle" style={{ color: 'var(--red)' }}>削除するとシフトデータも全て消えます</p>
            <div className="form-group">
              <label className="form-label">対象スタッフ</label>
              <select
                className="form-input"
                value={deleteUserId}
                onChange={(e) => setDeleteUserId(Number(e.target.value))}
                style={{ cursor: 'pointer' }}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button onClick={() => setDeleteUserOpen(false)} className="btn btn-secondary">キャンセル</button>
              <button onClick={deleteUser} className="btn" style={{ background: 'var(--red)', boxShadow: 'none' }}>削除する</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
