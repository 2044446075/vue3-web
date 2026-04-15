<template>
  <q-page class="user-article-page q-pa-sm">
    <div class="user-article-page__panel">
      <header class="user-article-page__header">
        <button class="user-article-page__back" type="button" @click="goBack">
          <q-icon name="arrow_back_ios_new" size="18px" />
        </button>

        <div class="user-article-page__header-title">
          {{ headerTitle }}
        </div>

        <div class="user-article-page__header-spacer" aria-hidden="true"></div>
      </header>

      <q-card flat bordered class="user-article-page__hero">
        <q-card-section class="row items-center q-col-gutter-md">
          <div class="col-auto">
            <q-avatar size="56px">
              <img :src="displayAvatar" alt="作者头像" @error="handleAvatarError" />
            </q-avatar>
          </div>

          <div class="col">
            <div class="user-article-page__name">{{ displayName }}</div>
            <div class="user-article-page__meta">共 {{ articles.length }} 篇文章</div>
          </div>

          <div v-if="userStore.token && !isOwnProfile" class="col-auto">
            <q-btn
              unelevated
              no-caps
              :outline="isFollowingAuthor"
              :color="isFollowingAuthor ? 'deep-orange-6' : 'deep-orange-5'"
              :label="isFollowingAuthor ? '取消关注' : '关注作者'"
              :loading="followLoading"
              class="user-article-page__follow-btn"
              @click="toggleFollowAuthor"
            />
          </div>
        </q-card-section>
      </q-card>

      <q-banner v-if="loading" rounded dense class="user-article-page__status">
        正在加载该用户的文章...
      </q-banner>
      <q-banner v-else-if="error" rounded dense class="user-article-page__status user-article-page__status--error">
        {{ error }}
      </q-banner>
      <q-banner v-else-if="articles.length === 0" rounded dense class="user-article-page__empty">
        该用户还没有发布文章
      </q-banner>

      <q-list v-else class="q-gutter-md">
        <q-item
          v-for="item in articles"
          :key="item.id"
          class="q-pa-none full-width"
        >
          <ArticleFeedCard
            class="full-width"
            :item="item"
            :is-read="isItemRead(item.id)"
            :is-liked="isItemLiked(item.id)"
            :like-pending="isLikePending(item.id)"
            :show-read-badge="Boolean(userStore.token)"
            @article-click="openArticleDetail(item.id)"
            @author-click="noop"
            @like-click="toggleItemLike(item)"
            @comment-click="openCommentPage(item.id, item.rawTitle)"
            @cover-error="handleCoverError"
            @avatar-error="handleAvatarError"
          />
        </q-item>
      </q-list>
    </div>
  </q-page>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { Toast } from '@nutui/nutui'
import { useRoute, useRouter } from 'vue-router'
import { QIcon } from 'quasar'
import request from 'src/api/request'
import ArticleFeedCard from 'components/ArticleFeedCard.vue'
import {
  getMyFollowedUserIds,
  getMyItems,
  getMyLikedItemIds,
  getMyReadItemIds,
  markItemReadApi,
  toggleItemLikeApi,
  toggleUserFollowApi
} from 'src/api/user'
import { useUserStore } from 'src/stores/useUserStore'
import { redirectToLogin } from 'src/utils/authNavigation'

defineOptions({
  inheritAttrs: false
})

const fallbackCover = '/week02-cover.jpg'
const fallbackAvatar = '/icons/favicon-128x128.png'
const apiBaseUrl =
  request.defaults.baseURL || (typeof window !== 'undefined' ? window.location.origin : '')

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const error = ref('')
const articles = ref([])
const authorName = ref('')
const authorAvatar = ref('')
const followedUserIds = ref([])
const followLoading = ref(false)
const likedItemIds = ref([])
const likingItemIds = ref([])
const readItemIds = ref([])

const userUuid = computed(() => String(route.params.userUuid || '').trim())
const currentUserIds = computed(() =>
  [userStore.profileAuth?.id, userStore.profileDetail?.uuid]
    .filter(Boolean)
    .map((id) => String(id))
)
const isOwnProfile = computed(() => currentUserIds.value.includes(userUuid.value))
const isFollowingAuthor = computed(() => followedUserIds.value.includes(userUuid.value))
const likedItemIdSet = computed(() => new Set(likedItemIds.value.map((id) => Number(id))))
const likingItemIdSet = computed(() => new Set(likingItemIds.value.map((id) => Number(id))))
const readItemIdSet = computed(() => new Set(readItemIds.value.map((id) => Number(id))))
const headerTitle = computed(() => cutText(`${displayName.value}的文章`, 18))
const displayName = computed(() => authorName.value || String(route.query.name || '').trim() || '该用户')
const displayAvatar = computed(() =>
  normalizeMediaUrl(authorAvatar.value || String(route.query.avatar || '').trim(), fallbackAvatar)
)

const normalizeArray = (value) => (Array.isArray(value) ? value : [])

const cutText = (text, max = 18) => {
  const raw = String(text || '')
  return raw.length > max ? `${raw.slice(0, max)}...` : raw
}

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

const formatDate = (value) => {
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
  return `${y}-${m}-${d}`
}

const resolveErrorMessage = (err, fallback) => {
  const detail = err?.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) {
    return detail
  }
  return err?.message || fallback
}

const mapArticleCard = (item) => ({
  id: item?.id,
  rawTitle: item?.title || item?.description || item?.content || `文章 #${item?.id || '-'}`,
  title: cutText(item?.title || item?.description || item?.content || `文章 #${item?.id || '-'}`, 28),
  coverUrl: normalizeMediaUrl(item?.src, fallbackCover),
  authorName: item?.owner?.name || displayName.value,
  authorAvatar: normalizeMediaUrl(item?.owner?.avatar || displayAvatar.value, fallbackAvatar),
  publishDate: formatDate(item?.create_time || item?.modify_time),
  starCount: Number(item?.star || 0),
  commentCount: Number(item?.comment_count || 0)
})

const normalizeIdList = (value) =>
  normalizeArray(value)
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0)

const isItemLiked = (itemId) => likedItemIdSet.value.has(Number(itemId || 0))

const isLikePending = (itemId) => likingItemIdSet.value.has(Number(itemId || 0))

const updateLikedItemIds = (itemId, liked) => {
  const id = Number(itemId || 0)
  if (!id) {
    return
  }
  if (liked) {
    likedItemIds.value = Array.from(new Set([...likedItemIds.value, id]))
  } else {
    likedItemIds.value = likedItemIds.value.filter((likedId) => Number(likedId) !== id)
  }
}

const updateArticleLikeCount = (itemId, starCount) => {
  const id = Number(itemId || 0)
  const nextStarCount = Number(starCount || 0)
  articles.value = normalizeArray(articles.value).map((item) =>
    Number(item?.id || 0) === id
      ? {
          ...item,
          starCount: nextStarCount
        }
      : item
  )
}

const updateReadItemIds = (itemId, read = true) => {
  const id = Number(itemId || 0)
  if (!id) {
    return
  }
  if (read) {
    readItemIds.value = Array.from(new Set([...readItemIds.value, id]))
  } else {
    readItemIds.value = readItemIds.value.filter((readId) => Number(readId) !== id)
  }
}

const isItemRead = (itemId) => readItemIdSet.value.has(Number(itemId || 0))

const refreshLikedItemIds = async () => {
  if (!userStore.token) {
    likedItemIds.value = []
    return
  }

  try {
    const res = await getMyLikedItemIds()
    likedItemIds.value = normalizeIdList(res.data)
  } catch (err) {
    if (err?.response?.status === 404) {
      likedItemIds.value = []
      return
    }
    throw err
  }
}

const refreshFollowedUserIds = async () => {
  if (!userStore.token) {
    followedUserIds.value = []
    return
  }

  try {
    const res = await getMyFollowedUserIds()
    followedUserIds.value = normalizeArray(res.data).map((id) => String(id || '').trim()).filter(Boolean)
  } catch (err) {
    if (err?.response?.status === 404) {
      followedUserIds.value = []
      return
    }
    throw err
  }
}

const refreshReadItemIds = async () => {
  if (!userStore.token) {
    readItemIds.value = []
    return
  }

  try {
    const res = await getMyReadItemIds()
    readItemIds.value = normalizeIdList(res.data)
  } catch (err) {
    if (err?.response?.status === 404) {
      readItemIds.value = []
      return
    }
    throw err
  }
}

const handleCoverError = (event) => {
  const target = event?.target
  if (!target) {
    return
  }
  const fallback = normalizeMediaUrl(fallbackCover, fallbackCover)
  if (target.src === fallback) {
    return
  }
  target.src = fallback
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

const toggleItemLike = async (item) => {
  const itemId = Number(item?.id || 0)
  if (!itemId) {
    return
  }

  if (!userStore.token) {
    Toast.warn('请先登录后点赞')
    await redirectToLogin()
    return
  }

  if (isLikePending(itemId)) {
    return
  }

  likingItemIds.value = [...likingItemIds.value, itemId]

  try {
    const res = await toggleItemLikeApi(itemId)
    const liked = Boolean(res.data?.liked)
    const starCount = Number(res.data?.star ?? item?.starCount ?? 0)
    updateLikedItemIds(itemId, liked)
    updateArticleLikeCount(itemId, starCount)
  } catch (err) {
    error.value = resolveErrorMessage(err, '点赞失败')
  } finally {
    likingItemIds.value = likingItemIds.value.filter((id) => id !== itemId)
  }
}

const markItemRead = async (itemId) => {
  const id = Number(itemId || 0)
  if (!id || !userStore.token || isItemRead(id)) {
    return false
  }

  try {
    await markItemReadApi(id)
    updateReadItemIds(id, true)
    return true
  } catch {
    return false
  }
}

const noop = () => {}

const toggleFollowAuthor = async () => {
  if (!userUuid.value || isOwnProfile.value) {
    return
  }
  if (!userStore.token) {
    Toast.warn('请先登录后关注用户')
    await redirectToLogin()
    return
  }
  if (followLoading.value) {
    return
  }

  followLoading.value = true
  try {
    const res = await toggleUserFollowApi(userUuid.value)
    const followed = Boolean(res.data?.followed)
    if (followed) {
      followedUserIds.value = Array.from(new Set([...followedUserIds.value, userUuid.value]))
    } else {
      followedUserIds.value = followedUserIds.value.filter((id) => id !== userUuid.value)
    }
  } catch (err) {
    error.value = resolveErrorMessage(err, '关注操作失败')
  } finally {
    followLoading.value = false
  }
}

const openArticleDetail = (itemId) => {
  const id = Number(itemId || 0)
  if (!id) {
    return
  }
  if (userStore.token) {
    markItemRead(id).catch(() => {})
  }
  router.push(`/week06/Work03/${id}`)
}

const openCommentPage = (itemId, title) => {
  const id = Number(itemId || 0)
  if (!id) {
    return
  }
  router.push({
    path: `/week05/Work03/${id}`,
    query: {
      title: String(title || '').trim()
    }
  })
}

const goBack = () => {
  router.back()
}

const loadUserArticles = async () => {
  if (!userUuid.value) {
    error.value = '用户标识无效'
    articles.value = []
    return
  }

  loading.value = true
  error.value = ''
  authorName.value = ''
  authorAvatar.value = ''

  try {
    const res = await getMyItems(userUuid.value)
    const items = normalizeArray(res.data).sort((a, b) => {
      const aTime = new Date(a?.create_time || 0).getTime()
      const bTime = new Date(b?.create_time || 0).getTime()
      return bTime - aTime
    })

    const firstOwner = items[0]?.owner || null
    if (firstOwner?.name) {
      authorName.value = firstOwner.name
    }
    if (firstOwner?.avatar) {
      authorAvatar.value = firstOwner.avatar
    }

    articles.value = items.map((item) => mapArticleCard(item))

    if (userStore.token) {
      Promise.allSettled([
        refreshFollowedUserIds(),
        refreshLikedItemIds(),
        refreshReadItemIds()
      ]).catch(() => {})
    } else {
      followedUserIds.value = []
      likedItemIds.value = []
      readItemIds.value = []
    }
  } catch (err) {
    if (err?.response?.status === 404) {
      articles.value = []
      error.value = ''
      return
    }
    articles.value = []
    error.value = resolveErrorMessage(err, '获取该用户文章失败')
  } finally {
    loading.value = false
  }
}

watch(
  () => userUuid.value,
  () => {
    loadUserArticles()
  },
  { immediate: true }
)

watch(
  () => userStore.token,
  () => {
    if (!userStore.token) {
      followedUserIds.value = []
      likedItemIds.value = []
      readItemIds.value = []
    }
    loadUserArticles()
  }
)
</script>

<style scoped>
.user-article-page__panel {
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
}

.user-article-page__header {
  position: sticky;
  top: 0;
  z-index: 3;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  align-items: center;
  gap: 10px;
  min-height: 56px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #eef2f7;
}

.user-article-page__back {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.user-article-page__header-title {
  min-width: 0;
  text-align: center;
  color: #334155;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-article-page__header-spacer {
  width: 36px;
  height: 36px;
}

.user-article-page__hero {
  border-radius: 16px;
}

.user-article-page__name {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.user-article-page__meta {
  margin-top: 4px;
  font-size: 13px;
  color: #64748b;
}

.user-article-page__follow-btn {
  border-radius: 999px;
  min-width: 96px;
}

.user-article-page__status,
.user-article-page__empty {
  padding: 24px 10px;
  text-align: center;
  color: #64748b;
  font-size: 13px;
}

.user-article-page__status--error {
  color: #ef4444;
}

</style>
