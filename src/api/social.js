import request from './request'

export function getMyFollowedUserIds() {
  return request.get('/users/follows/mine')
}

export function toggleUserFollowApi(userUuid) {
  return request.post(`/users/follows/toggle/${userUuid}`)
}

export function getMyLikedItemIds() {
  return request.get('/items/likes/mine')
}

export function toggleItemLikeApi(itemId) {
  return request.post(`/items/toggle-like/${itemId}`)
}

export function getFollowUnreadItemsApi(params = {}) {
  return request.get('/items/follows/unread/mine', { params })
}
