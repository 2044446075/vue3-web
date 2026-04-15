import request from './request'

export function getInfoApi() {
  return request.get('/users/me')
}

export function getBriefProfileApi() {
  return request.get('/users/brief-mine/')
}

export function updateProfileApi(data) {
  return request.post('/users/rename/', data)
}

export function updatePasswordApi(password) {
  return request.patch('/users/me', { password })
}

export function getMyProfile() {
  return request.get('/users/mine/')
}
