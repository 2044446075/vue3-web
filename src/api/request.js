import axios from 'axios'
import { useUserStore } from 'src/stores/useUserStore'
import { getCurrentRouteFullPath, redirectToLogin } from 'src/utils/authNavigation'

const service = axios.create({
  baseURL: 'http://127.0.0.1:80',
  timeout: 5000
})

let isRedirectingForUnauthorized = false

const isAuthRequest = (url) => {
  const raw = String(url || '')
  return raw.includes('/auth/jwt/login') || raw.includes('/auth/register')
}

service.interceptors.request.use((config) => {
  const userStore = useUserStore()
  if (userStore.token) {
    config.headers.Authorization = `Bearer ${userStore.token}`
  }
  return config
})

service.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401 && !isAuthRequest(error?.config?.url)) {
      const userStore = useUserStore()
      userStore.clearSession()

      if (!isRedirectingForUnauthorized) {
        isRedirectingForUnauthorized = true
        await redirectToLogin(getCurrentRouteFullPath())
        isRedirectingForUnauthorized = false
      }
    }

    return Promise.reject(error)
  }
)

export default service
