<template>
  <q-page class="comment-page q-pa-sm">
    <div class="comment-page__panel">
      <nut-navbar :title="displayTitle" left-show @on-click-back="goBack" />

      <q-banner
        v-if="settingsStore.commentAutoRefresh"
        rounded
        dense
        class="comment-page__hint"
      >
        已开启评论自动刷新，间隔 {{ settingsStore.refreshIntervalMs }}ms
      </q-banner>

      <q-banner v-if="loading && comments.length === 0" rounded dense class="comment-page__status">
        评论加载中...
      </q-banner>
      <q-banner v-else-if="error" rounded dense class="comment-page__status comment-page__status--error">
        {{ error }}
      </q-banner>
      <div v-else-if="topLevelComments.length === 0" class="comment-page__empty">
        <nut-empty image="empty" description="无评论信息" />
      </div>

      <section v-else class="comment-list">
        <article v-for="comment in topLevelComments" :key="comment.id" class="comment-card">
          <img
            class="comment-card__avatar"
            :src="normalizeMediaUrl(comment?.owner?.avatar, fallbackAvatar)"
            alt="评论用户头像"
            @error="handleAvatarError"
          />

          <div class="comment-card__main">
            <div class="comment-card__head">
              <div class="comment-card__name">{{ comment?.owner?.name || '匿名用户' }}</div>
              <div class="comment-card__time">{{ formatDateTime(comment?.create_time) }}</div>
            </div>

            <div class="comment-card__content">{{ comment?.content || '' }}</div>

            <img
              v-if="getCommentImageUrl(comment)"
              class="comment-card__image"
              :src="getCommentImageUrl(comment)"
              alt="评论图片"
            />

            <div class="comment-card__actions">
              <button class="comment-card__link" type="button" @click="setReply(comment)">回复</button>
              <button
                v-if="canDelete(comment)"
                class="comment-card__link comment-card__link--danger"
                type="button"
                :disabled="deletingId === comment.id"
                @click="askDeleteComment(comment)"
              >
                删除
              </button>
            </div>

            <div v-if="getChildComments(comment.id).length > 0" class="comment-card__children">
              <article
                v-for="child in getChildComments(comment.id)"
                :key="child.id"
                class="comment-child-card"
              >
                <img
                  class="comment-child-card__avatar"
                  :src="normalizeMediaUrl(child?.owner?.avatar, fallbackAvatar)"
                  alt="回复用户头像"
                  @error="handleAvatarError"
                />

                <div class="comment-child-card__main">
                  <div class="comment-child-card__head">
                    <div class="comment-child-card__name">{{ child?.owner?.name || '匿名用户' }}</div>
                    <div class="comment-child-card__time">{{ formatDateTime(child?.create_time) }}</div>
                  </div>

                  <div v-if="showHint(child?.hint)" class="comment-child-card__hint">
                    {{ child?.hint }}
                  </div>
                  <div class="comment-child-card__content">{{ child?.content || '' }}</div>

                  <img
                    v-if="getCommentImageUrl(child)"
                    class="comment-child-card__image"
                    :src="getCommentImageUrl(child)"
                    alt="回复图片"
                  />

                  <div class="comment-child-card__actions">
                    <button class="comment-card__link" type="button" @click="setReply(child)">回复</button>
                    <button
                      v-if="canDelete(child)"
                      class="comment-card__link comment-card__link--danger"
                      type="button"
                      :disabled="deletingId === child.id"
                      @click="askDeleteComment(child)"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </article>
      </section>

      <section class="comment-composer">
        <div v-if="replyTarget" class="comment-composer__quote">
          <span class="comment-composer__quote-text">{{ buildReplyHint(replyTarget) }}</span>
          <button class="comment-composer__quote-cancel" type="button" @click="clearReply">取消回复</button>
        </div>

        <q-input
          v-model="draft"
          class="comment-composer__input"
          outlined
          dense
          autogrow
          maxlength="300"
          placeholder="写下你的评论..."
        />

        <div v-if="selectedImagePreview" class="comment-composer__image-preview-wrap">
          <img class="comment-composer__image-preview" :src="selectedImagePreview" alt="待发送图片" />
          <button class="comment-composer__image-remove" type="button" @click="clearSelectedImage">
            移除图片
          </button>
        </div>

        <div class="comment-composer__actions">
          <input
            ref="imageInputRef"
            class="comment-composer__file-input"
            type="file"
            accept="image/*"
            @change="onImageFileChange"
          />

          <q-btn
            flat
            dense
            color="deep-orange-6"
            icon="image"
            label="图片"
            @click="openImagePicker"
          />

          <nut-button
            v-if="!settingsStore.commentAutoRefresh"
            size="small"
            type="primary"
            plain
            :disabled="loading || submitting"
            @click="onManualRefresh"
          >
            刷新
          </nut-button>
          <nut-button
            size="small"
            type="primary"
            :loading="submitting"
            :disabled="!canSubmit"
            @click="onSubmitComment"
          >
            发送
          </nut-button>
        </div>
      </section>

      <q-dialog v-model="deleteDialogVisible" persistent>
        <q-card class="delete-dialog">
          <q-card-section class="text-center text-subtitle1 text-weight-medium">
            确定需要删除该评论吗？
          </q-card-section>
          <q-card-actions align="right" class="q-pa-md q-gutter-sm">
            <q-btn
              flat
              color="grey-7"
              label="取消"
              @click="cancelDelete"
            />
            <q-btn
              unelevated
              color="negative"
              label="确认"
              :loading="deletingId !== null"
              @click="confirmDelete"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from 'src/api/request'
import {
  createCommentForItem,
  deleteCommentById,
  getCommentsByItem,
  getCommentsByItemAutoRefresh
} from 'src/api/comments.js'
import { getItemDetail, uploadSimpleImageApi } from 'src/api/articles.js'
import { useRefreshSettingsStore } from 'src/stores/useRefreshSettingsStore'
import { useUserStore } from 'src/stores/useUserStore'

defineOptions({
  inheritAttrs: false
})

const fallbackAvatar = '/icons/favicon-128x128.png'
const apiBaseUrl =
  request.defaults.baseURL || (typeof window !== 'undefined' ? window.location.origin : '')

const route = useRoute()
const router = useRouter()
const settingsStore = useRefreshSettingsStore()
const userStore = useUserStore()

const comments = ref([])
const loading = ref(false)
const refreshing = ref(false)
const error = ref('')
const submitting = ref(false)
const deletingId = ref(null)
const deleteDialogVisible = ref(false)
const pendingDeleteComment = ref(null)
const draft = ref('')
const replyTarget = ref(null)
const articleTitle = ref('')
const imageInputRef = ref(null)
const selectedImageFile = ref(null)
const selectedImagePreview = ref('')

const itemId = computed(() => Number(route.params.itemId || 0))
const displayTitle = computed(() => cutText(articleTitle.value || route.query.title || `文章 #${itemId.value}`, 24))
const canSubmit = computed(() => Boolean(draft.value.trim() || selectedImageFile.value))
const orderedComments = computed(() => sortComments(comments.value))
const topLevelComments = computed(() =>
  orderedComments.value.filter((comment) => !Number(comment?.parent_id || 0))
)

let commentTimer = null
let requestTag = 0

const normalizeArray = (value) => (Array.isArray(value) ? value : [])

const normalizeMediaUrl = (url, fallback) => {
  const raw = String(url || '').trim()
  if (!raw) {
    return fallback
  }
  if (/^(https?:\/\/|data:|blob:)/i.test(raw)) {
    return raw
  }
  if (raw.startsWith('/icons/') || raw.startsWith('/week')) {
    return raw
  }
  if (apiBaseUrl) {
    const path = raw.startsWith('/') ? raw : `/${raw}`
    return new URL(path, apiBaseUrl).toString()
  }
  return raw
}

const cutText = (text, max = 18) => {
  const raw = String(text || '')
  return raw.length > max ? `${raw.slice(0, max)}...` : raw
}

const formatDateTime = (value) => {
  if (!value) {
    return '--'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`
}

const resolveErrorMessage = (err, fallback) => {
  const detail = err?.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) {
    return detail
  }
  return err?.message || fallback
}

const sortComments = (list) => {
  return normalizeArray(list).slice().sort((a, b) => {
    const aTime = new Date(a?.create_time || 0).getTime()
    const bTime = new Date(b?.create_time || 0).getTime()
    if (aTime === bTime) {
      return Number(a?.id || 0) - Number(b?.id || 0)
    }
    return aTime - bTime
  })
}

const showHint = (hint) => {
  const raw = String(hint || '').trim()
  return Boolean(raw) && raw !== '无引用'
}

const getReplyParentId = (comment) => Number(comment?.parent_id || comment?.id || 0)

const getChildComments = (parentCommentId) =>
  orderedComments.value.filter((comment) => Number(comment?.parent_id || 0) === Number(parentCommentId || 0))

const buildReplyHint = (comment) => {
  const ownerName = comment?.owner?.name || '匿名用户'
  const content = String(comment?.content || '').trim()
  return `回复 ${ownerName}: ${content}`
}

const getCommentImageUrl = (comment) => normalizeMediaUrl(comment?.image_url, '')

const canDelete = (comment) => {
  if (!userStore.token) {
    return false
  }
  const ownerId = String(comment?.owner_id || '')
  const ids = [userStore.profileAuth?.id, userStore.profileDetail?.uuid]
    .filter(Boolean)
    .map((id) => String(id))
  return ids.includes(ownerId)
}

const handleAvatarError = (event) => {
  const target = event?.target
  if (!target) {
    return
  }
  const fallback = normalizeMediaUrl(fallbackAvatar, fallbackAvatar)
  if (target.src === fallback) {
    return
  }
  target.src = fallback
}

const clearCommentTimer = () => {
  if (commentTimer) {
    clearInterval(commentTimer)
    commentTimer = null
  }
}

const setupCommentTimer = () => {
  clearCommentTimer()
  if (!settingsStore.commentAutoRefresh || !itemId.value) {
    return
  }

  commentTimer = setInterval(() => {
    if (loading.value || refreshing.value) {
      return
    }
    loadComments({ useAutoEndpoint: true, touchCounter: true })
  }, settingsStore.refreshIntervalMs)
}

const loadArticleMeta = async () => {
  if (!itemId.value) {
    return
  }
  try {
    const res = await getItemDetail(itemId.value)
    const detail = res.data || {}
    articleTitle.value =
      detail?.title || detail?.description || detail?.content || route.query.title || `文章 #${itemId.value}`
  } catch {
    articleTitle.value = route.query.title || `文章 #${itemId.value}`
  }
}

const loadComments = async ({ useAutoEndpoint = false, touchCounter = false } = {}) => {
  if (!itemId.value) {
    error.value = '文章ID无效'
    return
  }

  const currentTag = ++requestTag
  const useBlockingLoading = !useAutoEndpoint || comments.value.length === 0
  if (useBlockingLoading) {
    loading.value = true
  } else {
    refreshing.value = true
  }
  error.value = ''

  if (touchCounter) {
    settingsStore.touchCommentCounter()
  }

  try {
    const res = useAutoEndpoint
      ? await getCommentsByItemAutoRefresh(itemId.value, String(Date.now()))
      : await getCommentsByItem(itemId.value)

    if (currentTag !== requestTag) {
      return
    }

    comments.value = sortComments(res.data)
  } catch (err) {
    if (currentTag !== requestTag) {
      return
    }
    const detail = String(err?.response?.data?.detail || '').toLowerCase()
    if (err?.response?.status === 404 || detail.includes('item not found')) {
      comments.value = []
      error.value = ''
      return
    }
    comments.value = []
    error.value = resolveErrorMessage(err, '获取评论失败')
  } finally {
    if (currentTag === requestTag) {
      if (useBlockingLoading) {
        loading.value = false
      } else {
        refreshing.value = false
      }
    }
  }
}

const setReply = (comment) => {
  replyTarget.value = comment
}

const clearReply = () => {
  replyTarget.value = null
}

const clearSelectedImage = () => {
  if (selectedImagePreview.value) {
    URL.revokeObjectURL(selectedImagePreview.value)
  }
  selectedImagePreview.value = ''
  selectedImageFile.value = null
  if (imageInputRef.value) {
    imageInputRef.value.value = ''
  }
}

const openImagePicker = () => {
  imageInputRef.value?.click?.()
}

const onImageFileChange = (event) => {
  const file = event.target?.files?.[0]
  if (!file) {
    clearSelectedImage()
    return
  }
  clearSelectedImage()
  selectedImageFile.value = file
  selectedImagePreview.value = URL.createObjectURL(file)
}

const onManualRefresh = () => {
  if (loading.value || refreshing.value) {
    return
  }
  loadComments({ useAutoEndpoint: false, touchCounter: true })
}

const onSubmitComment = async () => {
  const content = String(draft.value || '').trim()
  if (!content && !selectedImageFile.value) {
    return
  }
  if (!itemId.value) {
    return
  }
  if (!userStore.token) {
    error.value = '请先登录后发表评论'
    return
  }

  submitting.value = true
  error.value = ''

  try {
    let uploadedImageUrl = ''
    if (selectedImageFile.value) {
      const uploadRes = await uploadSimpleImageApi(selectedImageFile.value)
      uploadedImageUrl = String(uploadRes.data?.src || uploadRes.data?.url || '').trim()
    }

    const payload = {
      content: content || '[图片评论]',
      order: comments.value.length + 1,
      hint: replyTarget.value ? buildReplyHint(replyTarget.value) : '无引用',
      parent_id: replyTarget.value ? getReplyParentId(replyTarget.value) : null,
      image_url: uploadedImageUrl || null
    }
    const res = await createCommentForItem(itemId.value, payload)
    const returned = normalizeArray(res.data)
    if (returned.length) {
      comments.value = sortComments(returned)
    } else {
      await loadComments({ useAutoEndpoint: false, touchCounter: true })
    }
    draft.value = ''
    clearReply()
    clearSelectedImage()
    settingsStore.touchCommentCounter()
    settingsStore.markCommentDataDirty()
    await userStore.refreshCounts()
  } catch (err) {
    error.value = resolveErrorMessage(err, '发表评论失败')
  } finally {
    submitting.value = false
  }
}

const askDeleteComment = (comment) => {
  if (!comment?.id || !canDelete(comment)) {
    return
  }
  pendingDeleteComment.value = comment
  deleteDialogVisible.value = true
}

const cancelDelete = () => {
  deleteDialogVisible.value = false
  pendingDeleteComment.value = null
}

const confirmDelete = async () => {
  const comment = pendingDeleteComment.value
  if (!comment?.id || !canDelete(comment)) {
    cancelDelete()
    return
  }
  deleteDialogVisible.value = false

  deletingId.value = comment.id
  error.value = ''
  try {
    await deleteCommentById(comment.id)
    await loadComments({ useAutoEndpoint: false, touchCounter: true })
    settingsStore.markCommentDataDirty()
    await userStore.refreshCounts()
  } catch (err) {
    error.value = resolveErrorMessage(err, '删除评论失败')
  } finally {
    deletingId.value = null
    pendingDeleteComment.value = null
  }
}

const goBack = () => {
  router.back()
}

watch(
  [() => settingsStore.commentAutoRefresh, () => settingsStore.refreshIntervalMs, () => itemId.value],
  () => {
    setupCommentTimer()
  }
)

onMounted(async () => {
  await loadArticleMeta()
  await loadComments({ useAutoEndpoint: settingsStore.commentAutoRefresh, touchCounter: true })
  setupCommentTimer()
})

onBeforeUnmount(() => {
  clearCommentTimer()
  clearSelectedImage()
})
</script>

<style scoped>
.comment-page {
  background:
    radial-gradient(circle at top, rgba(255, 147, 95, 0.16), transparent 35%),
    linear-gradient(180deg, #fff8f2 0%, #f5f7fb 26%, #f7f8fc 100%);
}

.comment-page__panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 760px;
  margin: 0 auto;
  padding-bottom: 112px;
}

.comment-page__hint,
.comment-page__status {
  border-radius: 16px;
}

.comment-page__status--error {
  background: #fff1f0;
  color: #c53b32;
}

.comment-page__empty {
  padding: 32px 0 12px;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-card,
.comment-child-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(227, 232, 240, 0.9);
  border-radius: 20px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
}

.comment-card {
  padding: 14px;
}

.comment-child-card {
  padding: 10px 12px;
  border-radius: 16px;
  box-shadow: none;
}

.comment-card__avatar,
.comment-child-card__avatar {
  width: 44px;
  height: 44px;
  min-width: 44px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  background: #edf2f7;
  border: 1px solid rgba(226, 232, 240, 0.95);
}

.comment-card__main,
.comment-child-card__main {
  flex: 1;
  min-width: 0;
}

.comment-card__head,
.comment-child-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.comment-card__name,
.comment-child-card__name {
  color: #14213d;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.35;
}

.comment-card__time,
.comment-child-card__time {
  flex-shrink: 0;
  color: #7b8797;
  font-size: 12px;
  line-height: 1.4;
}

.comment-card__content,
.comment-child-card__content,
.comment-child-card__hint,
.comment-composer__quote-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.comment-card__content,
.comment-child-card__content {
  color: #263442;
  font-size: 14px;
  line-height: 1.7;
}

.comment-child-card__hint {
  margin-bottom: 6px;
  color: #f06b3f;
  font-size: 12px;
  line-height: 1.5;
}

.comment-card__image,
.comment-child-card__image,
.comment-composer__image-preview {
  width: min(100%, 260px);
  max-width: 100%;
  max-height: 220px;
  object-fit: cover;
  display: block;
  border-radius: 16px;
  margin-top: 10px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: #f8fafc;
}

.comment-card__actions,
.comment-child-card__actions {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 12px;
}

.comment-card__link,
.comment-composer__quote-cancel,
.comment-composer__image-remove {
  border: none;
  background: transparent;
  padding: 0;
  color: #f06b3f;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  cursor: pointer;
}

.comment-card__link[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}

.comment-card__link--danger {
  color: #d84f4f;
}

.comment-card__children {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 14px;
  padding: 12px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(247, 248, 252, 0.95), rgba(241, 245, 249, 0.9));
}

.comment-composer {
  position: sticky;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 8px);
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(226, 232, 240, 0.94);
  border-radius: 20px;
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(10px);
}

.comment-composer__quote {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  background: #fff5ee;
  color: #8a4d2f;
  font-size: 13px;
}

.comment-composer__input :deep(.q-field__control) {
  border-radius: 16px;
}

.comment-composer__image-preview-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.comment-composer__file-input {
  display: none;
}

.comment-composer__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.delete-dialog {
  width: min(92vw, 360px);
  border-radius: 20px;
}

@media (max-width: 640px) {
  .comment-page__panel {
    padding-bottom: 104px;
  }

  .comment-card,
  .comment-child-card {
    gap: 10px;
  }

  .comment-card {
    padding: 12px;
  }

  .comment-card__head,
  .comment-child-card__head,
  .comment-composer__quote {
    flex-direction: column;
    align-items: flex-start;
  }

  .comment-card__image,
  .comment-child-card__image,
  .comment-composer__image-preview {
    width: 100%;
    max-height: 240px;
  }

  .comment-composer__actions {
    justify-content: flex-start;
  }
}
</style>
