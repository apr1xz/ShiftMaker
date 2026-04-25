'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'

interface UserWage {
  id: number
  name: string
  employee_id: string
  hourly_wage: number
}

interface Props {
  users: UserWage[]
  defaultWage: number
}

export default function WageSettings({ users: initialUsers, defaultWage: initialDefaultWage }: Props) {
  const [users, setUsers] = useState(initialUsers)
  const [defaultWage, setDefaultWage] = useState(initialDefaultWage)
  const [defaultInput, setDefaultInput] = useState(String(initialDefaultWage))
  const [savingDefault, setSavingDefault] = useState(false)
  const [defaultSaved, setDefaultSaved] = useState(false)

  const [editTarget, setEditTarget] = useState<UserWage | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  async function saveDefault() {
    const val = Number(defaultInput)
    if (!val || val < 0) return
    setSavingDefault(true)
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'default_hourly_wage', value: String(val) }),
    })
    const data = await res.json()
    setSavingDefault(false)
    if (data.success) {
      setDefaultWage(val)
      setDefaultSaved(true)
      setTimeout(() => setDefaultSaved(false), 2000)
    } else {
      alert('保存失敗: ' + data.error)
    }
  }

  function openEdit(user: UserWage) {
    setEditTarget(user)
    setEditValue(String(user.hourly_wage))
  }

  async function saveWage() {
    if (!editTarget) return
    setSaving(true)
    const res = await fetch('/api/wages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: editTarget.id, wage: editValue }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.success) {
      setUsers((prev) => prev.map((u) => u.id === editTarget.id ? { ...u, hourly_wage: Number(editValue) } : u))
      setEditTarget(null)
    } else {
      alert('更新失敗: ' + data.error)
    }
  }

  return (
    <>
      {/* Default wage */}
      <div className="settings-section">
        <div className="settings-section-header">
          <h3 className="settings-section-title">デフォルト時給</h3>
          <p className="settings-section-desc">新規登録スタッフに適用される初期時給</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 200 }}>
            <input
              type="number"
              className="form-input"
              step={10}
              min={0}
              value={defaultInput}
              onChange={(e) => setDefaultInput(e.target.value)}
              style={{ textAlign: 'right', paddingRight: 36 }}
            />
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: 14 }}>円</span>
          </div>
          <button onClick={saveDefault} disabled={savingDefault} className="btn btn-sm">
            {savingDefault ? '保存中...' : '保存'}
          </button>
          {defaultSaved && <span style={{ fontSize: 13, color: 'var(--green)' }}>保存しました</span>}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>
          現在: ¥{defaultWage.toLocaleString()}/h
        </p>
      </div>

      {/* Per-user wages */}
      <div className="settings-section">
        <div className="settings-section-header">
          <h3 className="settings-section-title">個別時給</h3>
          <p className="settings-section-desc">スタッフごとの時給を設定</p>
        </div>
        {users.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>登録されているスタッフはいません</p>
        ) : (
          <div className="user-list">
            {users.map((user) => (
              <div key={user.id} className="user-list-item">
                <div className="user-list-info">
                  <span className="user-list-name">{user.name}</span>
                  <span className="user-list-meta">ID: {user.employee_id}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--blue)', fontWeight: 600, fontSize: 14 }}>
                    ¥{user.hourly_wage.toLocaleString()}/h
                  </span>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(user)}>変更</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editTarget && createPortal(
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setEditTarget(null) }}>
          <div className="modal-content">
            <h3 className="modal-title">時給変更</h3>
            <p className="modal-subtitle">{editTarget.name}さんの時給</p>
            <div className="form-group">
              <label className="form-label">時給 (円)</label>
              <input
                type="number"
                className="form-input"
                step={10}
                min={0}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                style={{ textAlign: 'center', fontSize: 20 }}
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setEditTarget(null)} className="btn btn-secondary">キャンセル</button>
              <button onClick={saveWage} disabled={saving} className="btn">
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
