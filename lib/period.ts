export interface ShiftPeriod {
  startDate: Date
  endDate: Date
  deadline: Date
  modeLabel: string
  isOpen: boolean
}

export function calcShiftPeriod(today = new Date()): ShiftPeriod {
  const day = today.getDate()
  const year = today.getFullYear()
  const month = today.getMonth() // 0-indexed

  let startDate: Date
  let endDate: Date
  let deadline: Date
  let modeLabel: string

  if (day <= 10) {
    modeLabel = '変更申請期間'
    startDate = new Date(year, month, 11)
    endDate = new Date(year, month + 1, 10)
    deadline = new Date(year, month, 10, 23, 59, 59)
  } else {
    modeLabel = '通常提出期間'
    startDate = new Date(year, month + 1, 11)
    endDate = new Date(year, month + 2, 10)
    deadline = new Date(year, month + 1, 0, 23, 59, 59) // last day of current month
  }

  const isOpen = today <= deadline
  return { startDate, endDate, deadline, modeLabel, isOpen }
}

export function calcViewPeriod(monthParam?: string): { startDate: Date; endDate: Date } {
  let baseDate: Date
  if (monthParam) {
    baseDate = new Date(monthParam + '-01')
    if (isNaN(baseDate.getTime())) baseDate = new Date()
  } else {
    baseDate = new Date()
    if (baseDate.getDate() < 11) {
      baseDate.setMonth(baseDate.getMonth() - 1)
    }
  }

  const startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 11)
  const endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 10)
  return { startDate, endDate }
}

export function dateRange(start: Date, end: Date): Date[] {
  const dates: Date[] = []
  const cur = new Date(start)
  while (cur <= end) {
    dates.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

export function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

export function prevMonthParam(startDate: Date): string {
  const d = new Date(startDate)
  d.setMonth(d.getMonth() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function nextMonthParam(startDate: Date): string {
  const d = new Date(startDate)
  d.setMonth(d.getMonth() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
