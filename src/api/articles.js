import request from './request'

export function getMyItems(uuid) {
  return request.get(`/items/users/${uuid}`)
}

export function getUsersApi(params = {}) {
  return request.get('/users/', { params })
}

export function getUserItemsProfileApi(uuid) {
  return request.get(`/users/items/${uuid}`)
}

export function getAllItems(params = {}) {
  return request.get('/items/', { params })
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

export function getMyReadItemIds() {
  return request.get('/items/reads/mine')
}

export function markItemReadApi(itemId) {
  return request.post(`/items/read/${itemId}`)
}

export function getRecommendedItemsApi(params = {}) {
  return request.get('/items/recommend', { params })
}

export function getRecommendedItemsMineApi(params = {}) {
  return request.get('/items/recommend/mine', { params })
}
