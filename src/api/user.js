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

export function logoutApi() {
  return request.post('/auth/jwt/logout')
}

export function getMyItems(uuid) {
  return request.get(`/items/users/${uuid}`)
}

export function getUsersApi(params = {}) {
  return request.get('/users/', { params })
}

export function getMyFollowedUserIds() {
  return request.get('/users/follows/mine')
}

export function toggleUserFollowApi(userUuid) {
  return request.post(`/users/follows/toggle/${userUuid}`)
}

export function getUserItemsProfileApi(uuid) {
  return request.get(`/users/items/${uuid}`)
}

export function getAllItems(params = {}) {
  return request.get('/items/', { params })
}

export function getMyLikedItemIds() {
  return request.get('/items/likes/mine')
}

export function toggleItemLikeApi(itemId) {
  return request.post(`/items/toggle-like/${itemId}`)
}

export function getMyReadItemIds() {
  return request.get('/items/reads/mine')
}

export function markItemReadApi(itemId) {
  return request.post(`/items/read/${itemId}`)
}

export function getFollowUnreadItemsApi(params = {}) {
  return request.get('/items/follows/unread/mine', { params })
}

export function getRecommendedItemsApi(params = {}) {
  return request.get('/items/recommend', { params })
}

export function getRecommendedItemsMineApi(params = {}) {
  return request.get('/items/recommend/mine', { params })
}

export function getItemDetail(itemId) {
  return request.get(`/items/${itemId}`)
}

export function createItemApi(data) {
  return request.post('/items/', data)
}

export function updateItemApi(itemId, data) {
  return request.post(`/items/put/${itemId}`, data)
}

export function deleteItemApi(itemId) {
  return request.delete(`/deleteitem-byid/${itemId}`)
}

export function uploadSimpleImageApi(file) {
  const form = new FormData()
  form.append('file', file)
  return request.post('/uploadimage/', form)
}

export function uploadItemImageApi(itemId, file) {
  const form = new FormData()
  form.append('file', file)
  return request.post(`/uploadimage/${itemId}`, form)
}

export function updateItemImageApi(imageId, data) {
  return request.post(`/modifyimage/${imageId}`, data)
}

export function deleteItemImageApi(imageId) {
  return request.delete(`/deleteimage-byid/${imageId}`)
}

export function getMyComments() {
  return request.get('/comments/mine/')
}

export function getCommentsByItem(itemId) {
  return request.get(`/comments/by-itemid/${itemId}`)
}

export function getCommentsByItemAutoRefresh(itemId, timeTag) {
  return request.get(`/comments/auto-refresh/by-itemid/${itemId}/${timeTag}`)
}

export function createCommentForItem(itemId, data) {
  return request.post(`/comments/${itemId}`, data)
}

export function deleteCommentById(commentId) {
  return request.delete(`/delete-comment/${commentId}`)
}

export function getMyProfile() {
  return request.get('/users/mine/')
}
