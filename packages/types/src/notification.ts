export type NotificationType =
  | 'transaction_received'
  | 'transaction_sent'
  | 'transaction_failed'
  | 'crypto_price_alert'
  | 'crypto_confirmed'
  | 'low_balance'
  | 'savings_goal_reached'
  | 'kyc_approved'
  | 'kyc_rejected'
  | 'security_alert'
  | 'sabrina_insight'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  data?: Record<string, unknown>
  read: boolean
  createdAt: string
}
