<template>
  <q-page class="article-detail-page q-pa-sm">
    <div class="article-detail-page__panel">
      <header class="article-detail-page__header">
        <button class="article-detail-page__back" type="button" @click="goBack">
          <q-icon name="arrow_back_ios_new" size="18px" />
        </button>

        <div class="article-detail-page__header-title">
          {{ navTitle }}
        </div>

        <button
          v-if="canEditArticle"
          class="article-detail-page__edit"
          type="button"
          @click="goEdit"
        >
          编辑文章
        </button>
        <div v-else class="article-detail-page__header-action-spacer" aria-hidden="true"></div>
      </header>

      <div v-if="loading" class="article-detail-page__status">正在加载文章...</div>
      <div v-else-if="error" class="article-detail-page__status article-detail-page__status--error">
        {{ error }}
      </div>
      <article v-else-if="articleDetail" class="article-detail-card">
        <h1 class="article-detail-card__title">{{ articleDetail.title || '未命名文章' }}</h1>
        <div class="article-detail-card__author">By {{ articleDetail.owner?.name || '匿名用户' }}</div>
        <div class="article-detail-card__time">
          更新时间 {{ formatDateTime(articleDetail.modify_time || articleDetail.create_time) }}
        </div>

        <div v-if="articleDetail.description" class="article-detail-card__intro">
          {{ articleDetail.description }}
        </div>

        <img
          v-if="articleDetail.src"
          class="article-detail-card__cover"
          :src="normalizeMediaUrl(articleDetail.src, fallbackCover)"
          alt="文章封面"
          @error="handleCoverError"
        />

        <div v-if="articleDetail.content" class="article-detail-card__content">
          {{ articleDetail.content }}
        </div>

        <section
          v-for="segment in sortedSegments"
          :key="segment.id"
          class="article-detail-card__segment"
        >
          <img
            v-if="segment.url"
            class="article-detail-card__segment-image"
            :src="normalizeMediaUrl(segment.url, fallbackCover)"
            alt="文章片段图片"
            @error="handleCoverError"
          />
          <div v-if="segment.img_content" class="article-detail-card__segment-text">
            {{ segment.img_content }}
          </div>
        </section>
      </article>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { QIcon } from 'quasar'
import request from 'src/api/request'
import { getItemDetail, markItemReadApi } from 'src/api/user'
import { useUserStore } from 'src/stores/useUserStore'

defineOptions({
  inheritAttrs: false
})

const fallbackCover = '/week02-cover.jpg'
const apiBaseUrl =
  request.defaults.baseURL || (typeof window !== 'undefined' ? window.location.origin : '')

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const articleDetail = ref(null)
const loading = ref(false)
const error = ref('')

const itemId = computed(() => Number(route.params.itemId || 0))
const navTitle = computed(() => cutText(articleDetail.value?.title || `文章 #${itemId.value}`, 24))
const currentUserIds = computed(() =>
  [userStore.profileAuth?.id, userStore.profileDetail?.uuid]
    .filter(Boolean)
    .map((id) => String(id))
)
const canEditArticle = computed(() => {
  const ownerId = String(articleDetail.value?.owner_id || '')
  return Boolean(ownerId) && currentUserIds.value.includes(ownerId)
})
const sortedSegments = computed(() =>
  normalizeArray(articleDetail.value?.images).slice().sort((a, b) => {
    const aOrder = Number.isFinite(Number(a?.order)) ? Number(a.order) : 9999
    const bOrder = Number.isFinite(Number(b?.order)) ? Number(b.order) : 9999
    if (aOrder === bOrder) {
      return Number(a?.id || 0) - Number(b?.id || 0)
    }
    return aOrder - bOrder
  })
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

const goBack = () => {
  router.back()
}

const goEdit = () => {
  if (!itemId.value || !canEditArticle.value) {
    return
  }
  router.push(`/week06/Work02/${itemId.value}`)
}

const loadArticleDetail = async () => {
  if (!itemId.value) {
    error.value = '文章ID无效'
    return
  }

  loading.value = true
  error.value = ''
  try {
    const res = await getItemDetail(itemId.value)
    articleDetail.value = res.data || null
    if (userStore.token && (!userStore.profileAuth || !userStore.profileDetail)) {
      userStore.getUserInfo().catch(() => {})
    }
    if (userStore.token) {
      await markItemReadApi(itemId.value).catch(() => {})
    }
  } catch (err) {
    articleDetail.value = null
    error.value = resolveErrorMessage(err, '获取文章详情失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadArticleDetail()
})
</script>

<style scoped>
.article-detail-page__panel {
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
}

.article-detail-page__header {
  position: sticky;
  top: 0;
  z-index: 3;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-height: 56px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #eef2f7;
}

.article-detail-page__back,
.article-detail-page__edit {
  border: 0;
  background: transparent;
  cursor: pointer;
}

.article-detail-page__back {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.article-detail-page__header-title {
  min-width: 0;
  text-align: center;
  color: #334155;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.article-detail-page__edit {
  min-width: 84px;
  height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: linear-gradient(90deg, #ff5a1f 0%, #ff7a18 100%);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 8px 18px rgba(255, 122, 24, 0.24);
}

.article-detail-page__header-action-spacer {
  min-width: 84px;
  height: 34px;
}

.article-detail-page__status {
  padding: 28px 12px;
  text-align: center;
  color: #64748b;
  font-size: 14px;
}

.article-detail-page__status--error {
  color: #ef4444;
}

.article-detail-card {
  padding: 16px 8px 24px;
}

.article-detail-card__title {
  margin: 0;
  font-size: clamp(30px, 6vw, 56px);
  line-height: 1.08;
  color: #0f172a;
  font-weight: 700;
}

.article-detail-card__author {
  margin-top: 18px;
  font-size: 20px;
  color: #111827;
  font-weight: 600;
}

.article-detail-card__time {
  margin-top: 10px;
  font-size: 14px;
  color: #475569;
}

.article-detail-card__intro,
.article-detail-card__content,
.article-detail-card__segment-text {
  margin-top: 22px;
  white-space: pre-wrap;
  word-break: break-word;
  color: #0f172a;
  line-height: 1.75;
  font-size: 18px;
}

.article-detail-card__cover,
.article-detail-card__segment-image {
  margin-top: 20px;
  width: 100%;
  border-radius: 20px;
  object-fit: cover;
  display: block;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.article-detail-card__segment + .article-detail-card__segment {
  margin-top: 18px;
}

@media (max-width: 600px) {
  .article-detail-page__header {
    grid-template-columns: 40px minmax(0, 1fr) auto;
    gap: 8px;
    padding-inline: 4px;
  }

  .article-detail-page__edit {
    min-width: 78px;
    padding-inline: 10px;
    font-size: 12px;
  }

  .article-detail-page__header-action-spacer {
    min-width: 78px;
  }

  .article-detail-card {
    padding-inline: 4px;
  }

  .article-detail-card__author {
    font-size: 17px;
  }

  .article-detail-card__intro,
  .article-detail-card__content,
  .article-detail-card__segment-text {
    font-size: 17px;
  }
}
</style>
