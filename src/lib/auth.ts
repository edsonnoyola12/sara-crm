// ═══════════════════════════════════════════════════════════════════════════
// AUTH LIBRARY — JWT token management for frontend
// ═══════════════════════════════════════════════════════════════════════════

const TOKEN_KEY = 'sara_access_token'
const REFRESH_KEY = 'sara_refresh_token'

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp < Math.floor(Date.now() / 1000)
  } catch {
    return true
  }
}

export function getTokenPayload(token: string): any | null {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}
