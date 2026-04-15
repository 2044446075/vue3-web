import request from './request'

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
