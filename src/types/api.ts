export type UserRole = 'waiter' | 'kitchen' | 'manager'
export type DistributionMethod = 'equal' | 'hours' | 'weight' | 'weight_hours'

export interface ApiUser {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string | null
  role: UserRole
}

export interface LoginResponse {
  access: string
  refresh: string
  user: ApiUser
}

export interface BusinessSettingsSummary {
  default_distribution_method: DistributionMethod
}

export interface WeeklyGridDay {
  daily_tip_id: number | null
  date: string
  total_amount: string
  distribution_method: DistributionMethod | null
  is_closed: boolean
  distributed_total: string
}

export interface WeeklyGridCell {
  daily_tip_id: number | null
  hours_worked: string
  amount: string
  role_at_time: UserRole
  weight_at_time: string | null
}

export interface WeeklyGridWorker {
  user_id: number
  username: string
  first_name: string
  last_name: string
  display_name: string
  role: UserRole
  weekly_total: string
  days: Record<string, WeeklyGridCell>
}

export interface WeeklyGridResponse {
  start_date: string
  end_date: string
  week_total: string
  business_settings: BusinessSettingsSummary
  days: WeeklyGridDay[]
  workers: WeeklyGridWorker[]
}

export interface DailyWorkerRow {
  user_id: number
  username: string
  first_name: string
  last_name: string
  display_name: string
  role: UserRole
  hours_worked: string
  weight_at_time: string | null
  amount: string
}

export interface DailyTipHistoryEntry {
  id: number
  event_type: string
  message: string
  reason: string
  old_value: unknown
  new_value: unknown
  happened_after_closure: boolean
  changed_by: ApiUser | null
  created_at: string
}

export interface DailyDetailResponse {
  id: number
  date: string
  total_amount: string
  distribution_method: DistributionMethod
  created_by: ApiUser
  created_at: string
  is_closed: boolean
  closed_at: string | null
  closed_by: ApiUser | null
  participations: unknown[]
  distributions: unknown[]
  worker_rows: DailyWorkerRow[]
  history: DailyTipHistoryEntry[]
}
