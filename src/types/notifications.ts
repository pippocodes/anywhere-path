export interface NotificationSettings {
  enabled: boolean
  timezone: string
  quietHoursStart: string | null // "HH:MM"
  quietHoursEnd: string | null
}

export interface HabitReminder {
  habitId: string
  remindAt: string // "HH:MM"
  enabled: boolean
}
