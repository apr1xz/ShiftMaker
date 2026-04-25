'use client'

import { useState } from 'react'

interface Props {
  currentUsername: string
}

export default function AdminCredentials({ currentUsername }: Props) {
  const [username, setUsername] = useState(currentUsername)

  const [unForm, setUnForm] = useState({ currentPw: '', newUsername: '' })
  const [unState, setUnState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')
  const [unError, setUnError] = useState('')

  const [pwForm, setPwForm] = useState({ currentPw: '', newPw: '', confirmPw: '' })
  const [pwState, setPwState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')
  const [pwError, setPwError] = useState('')

  async function saveUsername() {
    if (!unForm.currentPw || !unForm.newUsername.trim()) return
    setUnState('saving')
    setUnError('')
    const res = await fetch('/api/admin/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'username', currentPassword: unForm.currentPw, newValue: unForm.newUsername.trim() }),
    })
    const data = await res.json()
    if (data.success) {
      setUsername(unForm.newUsername.trim())
      setUnForm({ currentPw: '', newUsername: '' })
      setUnState('done')
      setTimeout(() => setUnState('idle'), 3000)
    } else {
      setUnError(data.error ?? '更新に失敗しました')
      setUnState('error')
    }
  }

  async function savePassword() {
    if (!pwForm.currentPw || !pwForm.newPw) return
    if (pwForm.newPw !== pwForm.confirmPw) {
      setPwError('新しいパスワードが一致しません')
      setPwState('error')
      return
    }
    setPwState('saving')
    setPwError('')
    const res = await fetch('/api/admin/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'password', currentPassword: pwForm.currentPw, newValue: pwForm.newPw }),
    })
    const data = await res.json()
    if (data.success) {
      setPwForm({ currentPw: '', newPw: '', confirmPw: '' })
      setPwState('done')
      setTimeout(() => setPwState('idle'), 3000)
    } else {
      setPwError(data.error ?? '更新に失敗しました')
      setPwState('error')
    }
  }

  return (
    <>
      {/* Username change */}
      <div className="settings-section">
        <div className="settings-section-header">
          <h3 className="settings-section-title">ユーザー名変更</h3>
          <p className="settings-section-desc">現在: <strong style={{ color: 'var(--text-primary)' }}>{username}</strong></p>
        </div>
        <div className="form-group">
          <label className="form-label">新しいユーザー名</label>
          <input
            type="text"
            className="form-input"
            placeholder="新しいユーザー名"
            value={unForm.newUsername}
            onChange={(e) => setUnForm((f) => ({ ...f, newUsername: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label className="form-label">現在のパスワード（確認）</label>
          <input
            type="password"
            className="form-input"
            placeholder="現在のパスワード"
            value={unForm.currentPw}
            onChange={(e) => setUnForm((f) => ({ ...f, currentPw: e.target.value }))}
          />
        </div>
        {unState === 'error' && (
          <p style={{ fontSize: 13, color: 'var(--red)', marginBottom: 12 }}>{unError}</p>
        )}
        {unState === 'done' && (
          <p style={{ fontSize: 13, color: 'var(--green)', marginBottom: 12 }}>ユーザー名を更新しました</p>
        )}
        <button
          onClick={saveUsername}
          disabled={unState === 'saving' || !unForm.newUsername.trim() || !unForm.currentPw}
          className="btn btn-sm"
        >
          {unState === 'saving' ? '更新中...' : 'ユーザー名を変更'}
        </button>
      </div>

      {/* Password change */}
      <div className="settings-section">
        <div className="settings-section-header">
          <h3 className="settings-section-title">パスワード変更</h3>
          <p className="settings-section-desc">管理者ログインパスワードを変更します</p>
        </div>
        <div className="form-group">
          <label className="form-label">現在のパスワード</label>
          <input
            type="password"
            className="form-input"
            placeholder="現在のパスワード"
            value={pwForm.currentPw}
            onChange={(e) => setPwForm((f) => ({ ...f, currentPw: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label className="form-label">新しいパスワード</label>
          <input
            type="password"
            className="form-input"
            placeholder="4文字以上"
            value={pwForm.newPw}
            onChange={(e) => setPwForm((f) => ({ ...f, newPw: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label className="form-label">新しいパスワード（確認）</label>
          <input
            type="password"
            className="form-input"
            placeholder="もう一度入力"
            value={pwForm.confirmPw}
            onChange={(e) => setPwForm((f) => ({ ...f, confirmPw: e.target.value }))}
          />
        </div>
        {pwState === 'error' && (
          <p style={{ fontSize: 13, color: 'var(--red)', marginBottom: 12 }}>{pwError}</p>
        )}
        {pwState === 'done' && (
          <p style={{ fontSize: 13, color: 'var(--green)', marginBottom: 12 }}>パスワードを更新しました</p>
        )}
        <button
          onClick={savePassword}
          disabled={pwState === 'saving' || !pwForm.currentPw || !pwForm.newPw || !pwForm.confirmPw}
          className="btn btn-sm"
        >
          {pwState === 'saving' ? '更新中...' : 'パスワードを変更'}
        </button>
      </div>
    </>
  )
}
