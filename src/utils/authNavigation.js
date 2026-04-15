export const LOGIN_PATH = '/auth/login'
export const DEFAULT_AUTHENTICATED_PATH = '/app'

let appRouter = null

export const setAuthRouter = (router) => {
  appRouter = router
}

const normalizeRedirectPath = (value) => {
  if (Array.isArray(value)) {
    return normalizeRedirectPath(value[0])
  }

  const raw = String(value || '').trim()
  if (!raw || raw === LOGIN_PATH || !raw.startsWith('/')) {
    return ''
  }

  return raw
}

export const resolveLoginLocation = (redirectPath = '') => {
  const redirect = normalizeRedirectPath(redirectPath)
  return redirect
    ? {
        path: LOGIN_PATH,
        query: { redirect }
      }
    : { path: LOGIN_PATH }
}

export const resolvePostLoginPath = (redirectPath) =>
  normalizeRedirectPath(redirectPath) || DEFAULT_AUTHENTICATED_PATH

export const getCurrentRouteFullPath = () => {
  if (appRouter?.currentRoute?.value?.fullPath) {
    return appRouter.currentRoute.value.fullPath
  }

  if (typeof window === 'undefined') {
    return '/'
  }

  const hash = String(window.location.hash || '')
  if (hash.startsWith('#/')) {
    return hash.slice(1)
  }

  return window.location.pathname || '/'
}

export const redirectToLogin = (redirectPath = '') => {
  const target = resolveLoginLocation(redirectPath || getCurrentRouteFullPath())

  if (appRouter) {
    const currentPath = appRouter.currentRoute?.value?.path || ''
    if (currentPath === LOGIN_PATH) {
      return Promise.resolve()
    }
    return appRouter.replace(target).catch(() => {})
  }

  if (typeof window !== 'undefined') {
    const search = target.query?.redirect
      ? `?redirect=${encodeURIComponent(target.query.redirect)}`
      : ''
    window.location.hash = `#${LOGIN_PATH}${search}`
  }

  return Promise.resolve()
}
