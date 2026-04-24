'use client'

import { useEffect, useRef, useState } from 'react'

interface Template {
  id: number
  label_name: string
  start_time: string
  end_time: string
}

interface DayState {
  available: boolean | null
  startTime: string
  endTime: string
}

interface Props {
  userId: number
  dates: string[]
  holidays: Record<string, string>
  templates: Template[]
  startDate: string
  endDate: string
  modeLabel: string
  rangeStr: string
  deadlineStr: string
  isReadOnly: boolean
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

export default function ShiftCalendar({
  userId, dates, holidays, templates,
  startDate, endDate, modeLabel, rangeStr, deadlineStr, isReadOnly,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [dayStates, setDayStates] = useState<Record<string, DayState>>({})
  const [saveMsg, setSaveMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteSelected, setDeleteSelected] = useState<Set<number>>(new Set())
  const bottomSheetRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)

  // 既存シフトを読み込む
  useEffect(() => {
    fetch(`/api/shifts?user_id=${userId}&start_date=${startDate}&end_date=${endDate}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return
        const next: Record<string, DayState> = {}
        for (const s of d.shifts) {
          next[s.target_date] = {
            available: s.is_available,
            startTime: s.start_time?.substring(0, 5) ?? '',
            endTime: s.end_time?.substring(0, 5) ?? '',
          }
        }
        setDayStates(next)
      })
  }, [userId, startDate, endDate])

  function toggleDate(date: string) {
    if (isReadOnly) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(date)) next.delete(date)
      else next.add(date)
      return next
    })
  }

  function applyToSelected(available: boolean, start: string, end: string) {
    if (selected.size === 0) { alert('日付を選択してください'); return }
    setDayStates((prev) => {
      const next = { ...prev }
      for (const d of selected) {
        next[d] = { available, startTime: start, endTime: end }
      }
      return next
    })
  }

  function getDayClass(date: string) {
    const d = new Date(date)
    const w = d.getDay()
    const holiday = holidays[date]
    if (holiday || w === 0) return 'sunday'
    if (w === 6) return 'saturday'
    return ''
  }

  function getDayTimeText(state: DayState | undefined) {
    if (!state || state.available === null) return ''
    if (!state.available) return '休'
    if (state.startTime && state.endTime) return `${state.startTime}\n${state.endTime}`
    return 'Free'
  }

  async function saveShifts() {
    setSaving(true)
    const shifts = dates.map((date) => {
      const st = dayStates[date]
      return {
        date,
        is_available: st?.available ?? true,
        start_time: st?.startTime ?? '',
        end_time: st?.endTime ?? '',
      }
    })
    const res = await fetch('/api/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, shifts }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.success) {
      setSaveMsg('保存しました！')
      setTimeout(() => setSaveMsg(''), 3000)
    } else {
      setSaveMsg('エラー: ' + (data.error ?? '失敗'))
    }
  }

  async function saveTemplate() {
    const label = prompt('テンプレート名を入力してください（例: いつもの）')
    if (!label) return
    const start = activeTab === 'custom' ? customStart : ''
    const end = activeTab === 'custom' ? customEnd : ''
    if (!start || !end) { alert('時間を入力してください'); return }
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label_name: label, start_time: start, end_time: end }),
    })
    const data = await res.json()
    if (data.success) { alert('テンプレートを保存しました'); location.reload() }
    else alert('エラー: ' + data.error)
  }

  async function deleteTemplates() {
    const ids = [...deleteSelected]
    if (!ids.length) return
    if (!confirm(`${ids.length}件のプリセットを削除しますか？`)) return
    const res = await fetch('/api/templates', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template_ids: ids }),
    })
    const data = await res.json()
    if (data.success) { setDeleteOpen(false); location.reload() }
    else alert('エラー: ' + data.error)
  }

  // first date's day-of-week for empty cells
  const firstDow = new Date(dates[0]).getDay()
  const emptyCount = firstDow

  // swipe handling
  function onTouchStart(e: React.TouchEvent) { touchStartY.current = e.touches[0].clientY }
  function onTouchEnd(e: React.TouchEvent) {
    const delta = e.changedTouches[0].clientY - touchStartY.current
    if (delta > 80) setCollapsed(true)
    else if (delta < -80) setCollapsed(false)
  }

  return (
    <div className="input-layout">
      {/* Calendar */}
      <div className="calendar-pane fade-up stagger-1">
        <div className="calendar-container">
          <div className="calendar-header">
            <div>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{modeLabel}</h4>
              <p className="text-small" style={{ margin: '2px 0 0', color: 'var(--text-secondary)', fontSize: 10 }}>
                {rangeStr} ｜ 締切: {deadlineStr}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--blue)', fontWeight: 500, fontSize: 14 }}>{selected.size}日選択中</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>解除</button>
            </div>
          </div>

          <div className="calendar-grid">
            {WEEKDAYS.map((w, i) => (
              <div key={w} className={`calendar-weekday-header${i === 0 ? ' sunday' : i === 6 ? ' saturday' : ''}`}>{w}</div>
            ))}
            {Array.from({ length: emptyCount }, (_, i) => (
              <div key={`e${i}`} className="calendar-day-empty" />
            ))}
            {dates.map((date) => {
              const state = dayStates[date]
              const dayClass = getDayClass(date)
              const isSelected = selected.has(date)
              const avail = state?.available
              const dayNum = new Date(date).getDate()
              const holiday = holidays[date]
              const timeText = getDayTimeText(state)

              return (
                <div
                  key={date}
                  className={`calendar-day${dayClass ? ` ${dayClass}` : ''}${isSelected ? ' selected' : ''}`}
                  data-available={avail === null || avail === undefined ? undefined : String(avail)}
                  onClick={() => toggleDate(date)}
                >
                  <span className="calendar-day-number">{dayNum}</span>
                  {holiday && <span className="calendar-day-holiday">{holiday}</span>}
                  <span className="calendar-day-status" />
                  <span className="calendar-day-time" style={{ whiteSpace: 'pre-line' }}>{timeText}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-3 text-center save-section-desktop">
          {isReadOnly ? (
            <button className="btn btn-secondary btn-lg btn-full" disabled style={{ opacity: 0.5 }}>受付終了</button>
          ) : (
            <button className="btn btn-lg btn-full" onClick={saveShifts} disabled={saving}>
              {saving ? '保存中...' : '変更を保存'}
            </button>
          )}
          <p className="text-caption mt-1" style={{ minHeight: 20, color: saveMsg.startsWith('エラー') ? 'var(--red)' : 'var(--green)' }}>
            {saveMsg}
          </p>
        </div>
      </div>

      {/* Control Pane / Bottom Sheet */}
      <div
        className={`control-pane fade-up stagger-2${collapsed ? ' bottom-sheet-collapsed' : ''}`}
        ref={bottomSheetRef}
        style={isReadOnly ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
      >
        <div
          className="bottom-sheet-handle"
          onClick={() => setCollapsed((c) => !c)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <span className="bottom-sheet-handle-bar" />
        </div>

        <div className="control-panel">
          {activeTab === 'preset' && (
            <>
              <div className="control-section">
                <div className="control-section-header">
                  <span className="control-section-title">プリセット</span>
                  {templates.length > 0 && (
                    <button className="preset-delete-trigger" onClick={() => setDeleteOpen(true)} title="プリセットを削除">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="preset-grid preset-grid-2x2">
                  <button className="preset-btn" onClick={() => applyToSelected(false, '', '')}>
                    <span className="preset-btn-label" style={{ color: 'var(--red)' }}>休み</span>
                  </button>
                  <button className="preset-btn" onClick={() => applyToSelected(true, '09:30', '19:00')}>
                    <span className="preset-btn-label">早番</span>
                    <span className="preset-btn-time">09:30-19:00</span>
                  </button>
                  <button className="preset-btn" onClick={() => applyToSelected(true, '', '')}>
                    <span className="preset-btn-label">Free</span>
                  </button>
                  <button className="preset-btn" onClick={() => applyToSelected(true, '11:00', '20:45')}>
                    <span className="preset-btn-label">遅番</span>
                    <span className="preset-btn-time">11:00-20:45</span>
                  </button>
                </div>
              </div>

              {templates.length > 0 && (
                <div className="control-section template-section-desktop">
                  <span className="control-section-title">テンプレート</span>
                  <div id="templateList" style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto' }}>
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        className="preset-btn template-item"
                        style={{ flexDirection: 'row', justifyContent: 'space-between' }}
                        onClick={() => applyToSelected(true, t.start_time.substring(0, 5), t.end_time.substring(0, 5))}
                      >
                        <span className="preset-btn-label">{t.label_name}</span>
                        <span className="preset-btn-time">{t.start_time.substring(0, 5)}-{t.end_time.substring(0, 5)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="control-section time-section-desktop">
                <span className="control-section-title">時間指定</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                  <input type="time" className="form-input" style={{ flex: 1 }} value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                  <span style={{ color: 'var(--text-secondary)', padding: '0 4px' }}>〜</span>
                  <input type="time" className="form-input" style={{ flex: 1 }} value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => {
                    if (!customStart || !customEnd) { alert('開始時間と終了時間を入力してください'); return }
                    applyToSelected(true, customStart, customEnd)
                  }}>適用</button>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={saveTemplate}>保存</button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'custom' && (
            <div className="control-section">
              <span className="control-section-title">プリセット</span>
              <div style={{ marginBottom: 8 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 10 }}>時間指定</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                  <input type="time" className="form-input" style={{ flex: 1 }} value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                  <span style={{ color: 'var(--text-secondary)', padding: '0 4px' }}>〜</span>
                  <input type="time" className="form-input" style={{ flex: 1 }} value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom sheet action buttons (mobile) */}
        {activeTab === 'preset' && (
          <div className="bottom-sheet-actions" id="mainSheetActions">
            <button className="btn btn-full" disabled={selected.size === 0}
              onClick={() => setActiveTab('custom')}>カスタム</button>
            <button className="btn btn-full" onClick={() => setActiveTab('custom')}>プリセットを追加</button>
          </div>
        )}
        {activeTab === 'custom' && (
          <div className="bottom-sheet-actions">
            <button className="btn btn-secondary btn-full" onClick={() => setActiveTab('preset')}>閉じる</button>
            <button className="btn btn-full" onClick={saveTemplate} style={{ color: 'var(--blue)', background: 'var(--surface-hover)' }}>保存</button>
          </div>
        )}
      </div>

      {/* Delete presets modal */}
      {deleteOpen && (
        <div className="preset-delete-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setDeleteOpen(false) }}>
          <div className="preset-delete-modal">
            <div className="preset-delete-modal-header">
              <h3 className="preset-delete-modal-title">プリセットを削除</h3>
              <button className="preset-delete-close" onClick={() => setDeleteOpen(false)}>&times;</button>
            </div>
            <p className="preset-delete-modal-desc">削除するプリセットを選択してください</p>
            <div className="preset-delete-list">
              {templates.map((t) => (
                <label key={t.id} className="preset-delete-item">
                  <div className="preset-delete-item-info">
                    <span className="preset-delete-item-label">{t.label_name}</span>
                    <span className="preset-delete-item-time">{t.start_time.substring(0, 5)}-{t.end_time.substring(0, 5)}</span>
                  </div>
                  <input
                    type="checkbox"
                    className="preset-delete-checkbox"
                    checked={deleteSelected.has(t.id)}
                    onChange={(e) => {
                      setDeleteSelected((prev) => {
                        const next = new Set(prev)
                        e.target.checked ? next.add(t.id) : next.delete(t.id)
                        return next
                      })
                    }}
                  />
                </label>
              ))}
            </div>
            <div className="preset-delete-actions">
              <button className="btn btn-secondary btn-full" onClick={() => setDeleteOpen(false)}>キャンセル</button>
              <button
                className="btn btn-danger btn-full"
                disabled={deleteSelected.size === 0}
                onClick={deleteTemplates}
              >
                {deleteSelected.size > 0 ? `${deleteSelected.size}件を削除する` : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
