export type Role = 'employee' | 'admin'

export interface User {
  id: number
  name: string
  employee_id: string
  hourly_wage: number
  created_at: string
}

export interface Admin {
  id: number
  username: string
  created_at: string
}

export interface ShiftRequest {
  id: number
  user_id: number
  target_date: string
  is_available: boolean
  start_time: string | null
  end_time: string | null
}

export interface UserTemplate {
  id: number
  user_id: number
  label_name: string
  start_time: string
  end_time: string
  created_at: string
}

export interface Announcement {
  id: number
  title: string
  content: string
  target_audience: 'all' | 'fulltime' | 'parttime'
  priority: 'normal' | 'important' | 'urgent'
  category: 'shift' | 'work' | 'event' | 'other'
  created_at: string
}

export interface ShiftEntry {
  date: string
  is_available: boolean
  start_time: string
  end_time: string
}
