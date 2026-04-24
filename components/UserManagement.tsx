'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'

interface UserInfo {
  id: number
  name: string
  employee_id: string
  hourly_wage: number
}

interface Props {
  initialUsers: UserInfo[]
}

export default function UserManagement({ initialUsers }: Props) {
  const [users, setUsers] = useState(initialUsers)
  const [step, setStep] = useState<1 | 2>(1)
  const [target, setTarget] = useState<UserInfo | null>(null)
  const [deleting, setDeleting] = useState(false)

  function openDelete(user: UserInfo) {
    setTarget(user)
    setStep(1)
  }

  function closeModal() {
    setTarget(null)
    setStep(1)
  }

  async function confirmDelete() {
    if (!target) return
    setDeleting(true)
    const res = await fetch('/api/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: target.id }),
    })
    const data = await res.json()
    setDeleting(false)
    if (data.success) {
      setUsers((prev) => prev.filter((u) => u.id !== target.id))
      closeModal()
    } else {
      alert('削除失敗: ' + data.error)
    }
  }

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h3 className="settings-section-title">ユーザー管理</h3>
        <p className="settings-section-desc">登録スタッフの確認・削除ができます</p>
      </div>

      {users.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, padding: '16px 0' }}>登録されているスタッフはいません</p>
      ) : (
        <div className="user-list">
          {users.map((user) => (
            <div key={user.id} className="user-list-item">
              <div className="user-list-info">
                <span className="user-list-name">{user.name}</span>
                <span className="user-list-meta">ID: {user.employee_id} ／ ¥{user.hourly_wage.toLocaleString()}/h</span>
              </div>
              <button
                className="btn btn-sm"
                style={{ background: 'rgba(255,59,48,0.12)', color: 'var(--red)', boxShadow: 'none', flexShrink: 0 }}
                onClick={() => openDelete(user)}
              >
                削除
              </button>
            </div>
          ))}
        </div>
      )}

      {target && createPortal(
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="modal-content">
            {step === 1 ? (
              <>
                <h3 className="modal-title">スタッフを削除</h3>
                <p className="modal-subtitle">
                  <strong style={{ color: 'var(--text-primary)' }}>{target.name}</strong>（ID: {target.employee_id}）を<br />削除しますか？
                </p>
                <div style={{
                  background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.25)',
                  borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 24,
                  fontSize: 14, color: 'var(--red)'
                }}>
                  シフトデータ・テンプレートも全て削除されます。
                </div>
                <div className="modal-actions">
                  <button onClick={closeModal} className="btn btn-secondary">キャンセル</button>
                  <button onClick={() => setStep(2)} className="btn" style={{ background: 'var(--red)', boxShadow: 'none' }}>削除する</button>
                </div>
              </>
            ) : (
              <>
                <h3 className="modal-title" style={{ color: 'var(--red)' }}>本当に削除しますか？</h3>
                <p className="modal-subtitle">
                  この操作は<strong style={{ color: 'var(--red)' }}>取り消せません</strong>。<br />
                  {target.name}のすべてのデータが消えます。
                </p>
                <div className="modal-actions">
                  <button onClick={closeModal} className="btn btn-secondary">やめる</button>
                  <button
                    onClick={confirmDelete}
                    disabled={deleting}
                    className="btn"
                    style={{ background: 'var(--red)', boxShadow: 'none' }}
                  >
                    {deleting ? '削除中...' : '完全に削除する'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
