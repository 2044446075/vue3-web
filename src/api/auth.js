import request from './request'
import { buildSecureLoginPayload, resetSecureLoginKeyCache } from 'src/utils/securePassword'

export async function loginApi({ username, password }) {
  let retryCount = 0

  while (retryCount < 2) {
    try {
      const payload = await buildSecureLoginPayload({ username, password })
      return await request.post('/auth/secure-login', payload)
    } catch (error) {
      const detail = String(error?.response?.data?.detail || '')
      const shouldRefreshKey =
        detail === 'SECURE_LOGIN_KEY_EXPIRED' || detail === 'SECURE_LOGIN_DECRYPT_FAILED'

      if (shouldRefreshKey && retryCount === 0) {
        resetSecureLoginKeyCache()
        retryCount += 1
        continue
      }

      throw error
    }
  }

  throw new Error('安全登录失败')
}

export function registerApi({ email, password }) {
  return request.post('/auth/register', {
    email,
    password
  })
}

export function logoutApi() {
  return request.post('/auth/jwt/logout')
}
