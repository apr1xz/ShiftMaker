'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type FormType = 'login' | 'register' | 'admin'

export default function LoginPage() {
  const router = useRouter()
  const [formType, setFormType] = useState<FormType>('login')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleEmployeeLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(''); setLoading(true)
    const fd = new FormData(e.currentTarget)
    const res = await signIn('employee', {
      employee_id: fd.get('employee_id'),
      password: fd.get('password'),
      redirect: false,
    })
    setLoading(false)
    if (res?.error) { setError('社員番号またはパスワードが間違っています。') }
    else { router.push('/home') }
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(''); setLoading(true)
    const fd = new FormData(e.currentTarget)
    const name = fd.get('name') as string
    const employee_id = fd.get('employee_id') as string
    const password = fd.get('password') as string

    if (employee_id.length !== 6 || password.length !== 4) {
      setError('社員番号6桁、パスワード4桁で入力してください。')
      setLoading(false); return
    }

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, employee_id, password }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }

    const signRes = await signIn('employee', { employee_id, password, redirect: false })
    setLoading(false)
    if (signRes?.error) { setError('登録後のログインに失敗しました。') }
    else { router.push('/home') }
  }

  async function handleAdminLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(''); setLoading(true)
    const fd = new FormData(e.currentTarget)
    const res = await signIn('admin', {
      username: fd.get('username'),
      password: fd.get('password'),
      redirect: false,
    })
    setLoading(false)
    if (res?.error) { setError('ユーザー名またはパスワードが間違っています。') }
    else { router.push('/home') }
  }

  function switchForm(t: FormType) { setError(''); setFormType(t) }

  return (
    <div className="login-page">
      <div className="login-container fade-up">
        <div className="login-logo">
          <h1>Shift Maker</h1>
          <p>シフト管理を、もっとシンプルに。</p>
        </div>

        {formType === 'login' && (
          <div>
            <div className="login-card">
              <h3 style={{ textAlign: 'center', marginBottom: 24 }}>おかえりなさい</h3>
              {error && <ErrorAlert message={error} />}
              <form onSubmit={handleEmployeeLogin}>
                <div className="form-group">
                  <label className="form-label">社員番号</label>
                  <input name="employee_id" type="text" className="form-input" required placeholder="123456" autoComplete="username" />
                </div>
                <div className="form-group">
                  <label className="form-label">パスワード</label>
                  <input name="password" type="password" className="form-input" required placeholder="••••" autoComplete="current-password" />
                </div>
                <button type="submit" className="btn btn-full btn-lg" disabled={loading}>
                  {loading ? '処理中...' : 'サインイン'}
                </button>
              </form>
            </div>
            <p className="login-toggle">
              アカウントをお持ちでない方は <a onClick={() => switchForm('register')}>新規登録</a>
            </p>
            <p className="login-toggle" style={{ marginTop: 8 }}>
              管理者の方は <a onClick={() => switchForm('admin')}>管理者ログイン</a>
            </p>
          </div>
        )}

        {formType === 'register' && (
          <div>
            <div className="login-card">
              <h3 style={{ textAlign: 'center', marginBottom: 24 }}>はじめまして</h3>
              {error && <ErrorAlert message={error} />}
              <form onSubmit={handleRegister}>
                <div className="form-group">
                  <label className="form-label">お名前</label>
                  <input name="name" type="text" className="form-input" required placeholder="山田 太郎" autoComplete="name" />
                </div>
                <div className="form-group">
                  <label className="form-label">社員番号（6桁）</label>
                  <input name="employee_id" type="text" className="form-input" required placeholder="123456" maxLength={6} autoComplete="username" />
                </div>
                <div className="form-group">
                  <label className="form-label">パスワード（4桁）</label>
                  <input name="password" type="password" className="form-input" required placeholder="••••" maxLength={4} autoComplete="new-password" />
                </div>
                <button type="submit" className="btn btn-full btn-lg" disabled={loading}>
                  {loading ? '処理中...' : 'アカウント作成'}
                </button>
              </form>
            </div>
            <p className="login-toggle">
              すでにアカウントをお持ちの方は <a onClick={() => switchForm('login')}>ログイン</a>
            </p>
          </div>
        )}

        {formType === 'admin' && (
          <div>
            <div className="login-card">
              <h3 style={{ textAlign: 'center', marginBottom: 24 }}>管理者ログイン</h3>
              {error && <ErrorAlert message={error} />}
              <form onSubmit={handleAdminLogin}>
                <div className="form-group">
                  <label className="form-label">ユーザー名</label>
                  <input name="username" type="text" className="form-input" required placeholder="admin" autoComplete="username" />
                </div>
                <div className="form-group">
                  <label className="form-label">パスワード</label>
                  <input name="password" type="password" className="form-input" required placeholder="••••••••" autoComplete="current-password" />
                </div>
                <button type="submit" className="btn btn-full btn-lg" disabled={loading}>
                  {loading ? '処理中...' : '管理者としてログイン'}
                </button>
              </form>
            </div>
            <p className="login-toggle">
              従業員の方は <a onClick={() => switchForm('login')}>従業員ログイン</a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div style={{ background: 'rgba(255,69,58,0.1)', color: 'var(--red)', padding: 14, borderRadius: 'var(--radius-sm)', marginBottom: 20, fontSize: 14, textAlign: 'center' }}>
      {message}
    </div>
  )
}
