export type AuthProvider = 'google' | 'apple' | 'email'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatarUrl?: string
  phone?: string
  dateOfBirth?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  postcode?: string
  country: string
  kycStatus: KYCStatus
  kycLevel: KYCLevel
  createdAt: string
  updatedAt: string
}

export type KYCStatus = 'pending' | 'in_review' | 'approved' | 'rejected'
export type KYCLevel = 0 | 1 | 2 | 3

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}

export interface OAuthRequest {
  provider: AuthProvider
  idToken: string
}
