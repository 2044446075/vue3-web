<template>
  <q-page class="article-editor-page q-pa-sm">
    <div class="article-editor-page__panel">
      <div class="article-editor-page__nav">
        <nut-navbar :title="pageTitle" left-show @on-click-back="goBack" />
        <q-btn
          v-if="isEditMode"
          flat
          round
          dense
          icon="visibility"
          class="article-editor-page__nav-btn"
          @click="goPreview"
        />
      </div>

      <div v-if="loading" class="article-editor-page__status">正在加载文章...</div>
      <div v-else class="article-editor-page__form">
        <q-input
          v-model.trim="form.title"
          outlined
          maxlength="120"
          label="文章标题"
          class="article-editor-page__field"
        />

        <q-input
          v-model.trim="form.description"
          outlined
          autogrow
          maxlength="2000"
          type="textarea"
          label="简介"
          class="article-editor-page__field"
        />

        <q-input
          v-model.trim="form.content"
          outlined
          autogrow
          maxlength="2000"
          type="textarea"
          label="正文首段"
          class="article-editor-page__field"
        />

        <section class="article-editor-page__section">
          <div class="article-editor-page__section-head">
            <span>封面图片</span>
            <button
              v-if="coverPreviewUrl"
              class="article-editor-page__link"
              type="button"
              @click="removeCoverImage"
            >
              删除封面
            </button>
          </div>

          <button class="article-editor-page__image-picker" type="button" @click="openCoverPicker">
            <img
              v-if="coverPreviewUrl"
              class="article-editor-page__image-preview"
              :src="coverPreviewUrl"
              alt="封面图片"
            />
            <div v-else class="article-editor-page__image-placeholder">点击上传封面</div>
          </button>
        </section>

        <section class="article-editor-page__section">
          <div class="article-editor-page__section-head article-editor-page__section-head--stack">
            <span>图文片段</span>
            <div class="article-editor-page__segment-actions">
              <nut-button size="small" type="default" @click="addTextSegment">添加内容片段</nut-button>
              <nut-button size="small" type="primary" plain @click="addImageSegment">
                添加图片片段
              </nut-button>
            </div>
          </div>

          <div v-if="segments.length === 0" class="article-editor-page__empty">还没有添加片段</div>

          <article
            v-for="(segment, index) in segments"
            :key="segment.localKey"
            class="article-segment-card"
          >
            <div class="article-segment-card__head">
              <span>片段 {{ index + 1 }}</span>
              <button
                class="article-editor-page__link article-editor-page__link--danger"
                type="button"
                @click="removeSegment(index)"
              >
                删除
              </button>
            </div>

            <q-input
              v-model.trim="segment.img_content"
              outlined
              autogrow
              maxlength="2000"
              type="textarea"
              label="内容片段"
            />

            <div class="article-segment-card__image-wrap">
              <button
                class="article-editor-page__image-picker article-editor-page__image-picker--segment"
                type="button"
                @click="openSegmentPicker(segment.localKey)"
              >
                <img
                  v-if="getSegmentPreviewUrl(segment)"
                  class="article-editor-page__image-preview"
                  :src="getSegmentPreviewUrl(segment)"
                  alt="片段图片"
                />
                <div v-else class="article-editor-page__image-placeholder">
                  {{ segment.mode === 'image' ? '点击上传片段图片' : '可选上传图片' }}
                </div>
              </button>

              <div class="article-editor-page__segment-actions article-editor-page__segment-actions--inline">
                <nut-button size="small" type="default" @click="openSegmentPicker(segment.localKey)">
                  选择图片
                </nut-button>
                <nut-button
                  size="small"
                  type="default"
                  plain
                  :disabled="index === 0"
                  @click="moveSegmentUp(index)"
                >
                  上移
                </nut-button>
                <nut-button
                  size="small"
                  type="default"
                  plain
                  :disabled="index === segments.length - 1"
                  @click="moveSegmentDown(index)"
                >
                  下移
                </nut-button>
                <nut-button
                  v-if="getSegmentPreviewUrl(segment)"
                  size="small"
                  type="danger"
                  plain
                  @click="removeSegmentImage(segment)"
                >
                  移除图片
                </nut-button>
              </div>
            </div>
          </article>
        </section>

        <div class="article-editor-page__footer">
          <nut-button block type="primary" :loading="saving" @click="saveArticle">
            {{ isEditMode ? '保存文章' : '发布文章' }}
          </nut-button>
        </div>
      </div>

      <input
        ref="coverInputRef"
        class="article-editor-page__hidden-input"
        type="file"
        accept="image/*"
        @change="onCoverFileChange"
      />
      <input
        ref="segmentInputRef"
        class="article-editor-page__hidden-input"
        type="file"
        accept="image/*"
        @change="onSegmentFileChange"
      />
    </div>
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Toast } from '@nutui/nutui'
import request from 'src/api/request'
import textSegmentPlaceholderUrl from 'src/assets/article-text-segment-placeholder.svg'
import {
  createItemApi,
  deleteItemImageApi,
  getItemDetail,
  updateItemApi,
  updateItemImageApi,
  uploadItemImageApi,
  uploadSimpleImageApi
} from 'src/api/articles.js'
import { useRefreshSettingsStore } from 'src/stores/useRefreshSettingsStore'
import { useUserStore } from 'src/stores/useUserStore'

defineOptions({
  inheritAttrs: false
})

const apiBaseUrl =
  request.defaults.baseURL || (typeof window !== 'undefined' ? window.location.origin : '')

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const settingsStore = useRefreshSettingsStore()

const form = reactive({
  title: '',
  description: '',
  content: ''
})

const loading = ref(false)
const saving = ref(false)
const coverUrl = ref('')
const coverFile = ref(null)
const coverLocalPreview = ref('')
const coverInputRef = ref(null)
const segmentInputRef = ref(null)
const pendingSegmentKey = ref('')
const segments = ref([])
const deletedSegmentIds = ref([])

const itemId = computed(() => Number(route.params.itemId || 0))
const isEditMode = computed(() => itemId.value > 0)
const pageTitle = computed(() => (isEditMode.value ? '编辑文章' : '发布文章'))
const coverPreviewUrl = computed(
  () => coverLocalPreview.value || normalizeMediaUrl(coverUrl.value, '')
)

let localKeySeed = 0
let textSegmentPlaceholderPromise = null

const createSegment = (data = {}, mode = 'text') => ({
  localKey: `segment-${Date.now()}-${localKeySeed++}`,
  id: data.id || null,
  url: data.url || '',
  img_content: data.img_content || '',
  localFile: null,
  localPreview: '',
  mode
})

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

const resolveErrorMessage = (error, fallback) => {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) {
    return detail
  }
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0]
    if (typeof first?.msg === 'string' && first.msg.trim()) {
      return first.msg
    }
  }
  return error?.message || fallback
}

const resetFileInput = (input) => {
  if (input) {
    input.value = ''
  }
}

const revokeObjectUrl = (url) => {
  if (url) {
    URL.revokeObjectURL(url)
  }
}

const canEditOwnerItem = (detail) => {
  const ids = [userStore.profileAuth?.id, userStore.profileDetail?.uuid]
    .filter(Boolean)
    .map((id) => String(id))
  return ids.includes(String(detail?.owner_id || ''))
}

const ensureUserReady = async () => {
  if (!userStore.token) {
    Toast.warn('请先登录')
    router.replace('/auth/login')
    return false
  }
  if (!userStore.profileAuth || !userStore.profileDetail) {
    await userStore.getUserInfo()
  }
  return true
}

const openCoverPicker = () => {
  coverInputRef.value?.click?.()
}

const openSegmentPicker = (segmentKey) => {
  pendingSegmentKey.value = segmentKey
  segmentInputRef.value?.click?.()
}

const addTextSegment = () => {
  segments.value.push(createSegment({}, 'text'))
}

const addImageSegment = () => {
  segments.value.push(createSegment({}, 'image'))
}

const getSegmentPreviewUrl = (segment) => {
  return segment.localPreview || normalizeMediaUrl(segment.url, '')
}

const onCoverFileChange = (event) => {
  const file = event.target?.files?.[0]
  resetFileInput(coverInputRef.value)
  if (!file) {
    return
  }
  revokeObjectUrl(coverLocalPreview.value)
  coverFile.value = file
  coverLocalPreview.value = URL.createObjectURL(file)
}

const onSegmentFileChange = (event) => {
  const file = event.target?.files?.[0]
  resetFileInput(segmentInputRef.value)
  if (!file || !pendingSegmentKey.value) {
    return
  }
  const target = segments.value.find((segment) => segment.localKey === pendingSegmentKey.value)
  pendingSegmentKey.value = ''
  if (!target) {
    return
  }
  revokeObjectUrl(target.localPreview)
  target.localFile = file
  target.localPreview = URL.createObjectURL(file)
  if (target.mode !== 'image') {
    target.mode = 'image'
  }
}

const removeCoverImage = () => {
  revokeObjectUrl(coverLocalPreview.value)
  coverLocalPreview.value = ''
  coverFile.value = null
  coverUrl.value = ''
}

const removeSegmentImage = (segment) => {
  revokeObjectUrl(segment.localPreview)
  segment.localPreview = ''
  segment.localFile = null
  segment.url = ''
  if (!segment.img_content.trim()) {
    segment.mode = 'text'
  }
}

const removeSegment = (index) => {
  const target = segments.value[index]
  if (!target) {
    return
  }
  if (target.id) {
    deletedSegmentIds.value.push(target.id)
  }
  revokeObjectUrl(target.localPreview)
  segments.value.splice(index, 1)
}

const moveSegment = (fromIndex, toIndex) => {
  if (fromIndex === toIndex) {
    return
  }
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= segments.value.length ||
    toIndex >= segments.value.length
  ) {
    return
  }

  const nextSegments = segments.value.slice()
  const [movedSegment] = nextSegments.splice(fromIndex, 1)
  nextSegments.splice(toIndex, 0, movedSegment)
  segments.value = nextSegments
}

const moveSegmentUp = (index) => {
  moveSegment(index, index - 1)
}

const moveSegmentDown = (index) => {
  moveSegment(index, index + 1)
}

const goBack = () => {
  router.back()
}

const goPreview = () => {
  if (!itemId.value) {
    return
  }
  router.push(`/articles/${itemId.value}`)
}

const uploadSimpleImageFile = async (file) => {
  const res = await uploadSimpleImageApi(file)
  return res.data?.src || res.data?.url || ''
}

const getTextSegmentPlaceholderFile = async () => {
  if (!textSegmentPlaceholderPromise) {
    textSegmentPlaceholderPromise = fetch(textSegmentPlaceholderUrl)
      .then((response) => response.blob())
      .then((blob) => new File([blob], 'article-text-segment-placeholder.svg', { type: blob.type }))
  }
  const placeholderFile = await textSegmentPlaceholderPromise
  return new File([placeholderFile], placeholderFile.name, { type: placeholderFile.type })
}

const syncSegments = async (savedItemId) => {
  const activeSegments = segments.value.filter(
    (segment) => segment.img_content.trim() || segment.localFile || segment.url || segment.id
  )

  for (const imageId of deletedSegmentIds.value) {
    await deleteItemImageApi(imageId)
  }
  deletedSegmentIds.value = []

  for (let index = 0; index < activeSegments.length; index += 1) {
    const segment = activeSegments[index]
    const payload = {
      name: '',
      img_content: segment.img_content.trim(),
      order: index
    }

    if (segment.id) {
      let nextUrl = segment.url || ''
      if (segment.localFile) {
        nextUrl = await uploadSimpleImageFile(segment.localFile)
      }
      await updateItemImageApi(segment.id, {
        ...payload,
        url: nextUrl
      })
      segment.url = nextUrl
    } else if (segment.localFile || segment.img_content.trim()) {
      const seedFile = segment.localFile || (await getTextSegmentPlaceholderFile())
      const uploadRes = await uploadItemImageApi(savedItemId, seedFile)
      const createdImage = uploadRes.data || {}
      const nextUrl = segment.localFile ? createdImage.url || '' : ''
      await updateItemImageApi(createdImage.id, {
        ...payload,
        url: nextUrl
      })
      segment.id = createdImage.id
      segment.url = nextUrl
    }

    revokeObjectUrl(segment.localPreview)
    segment.localPreview = ''
    segment.localFile = null
  }

  segments.value = activeSegments
}

const saveArticle = async () => {
  const ready = await ensureUserReady()
  if (!ready) {
    return
  }

  const title = form.title.trim()
  const description = form.description.trim()
  const content = form.content.trim()
  const hasSegments = segments.value.some((segment) => segment.img_content.trim() || segment.localFile || segment.url)

  if (!title) {
    Toast.warn('请输入文章标题')
    return
  }
  if (!description && !content && !hasSegments) {
    Toast.warn('请至少填写简介、正文首段或片段内容')
    return
  }

  saving.value = true
  try {
    let nextCoverUrl = coverUrl.value || ''
    if (coverFile.value) {
      nextCoverUrl = await uploadSimpleImageFile(coverFile.value)
    }

    const payload = {
      title,
      description,
      src: nextCoverUrl,
      price: 0,
      type: 0,
      vipPrice: 0,
      content
    }

    const itemRes = isEditMode.value
      ? await updateItemApi(itemId.value, payload)
      : await createItemApi(payload)
    const savedItemId = Number(itemRes.data?.id || itemId.value)

    if (!savedItemId) {
      throw new Error('文章保存失败')
    }

    await syncSegments(savedItemId)
    settingsStore.markArticleDataDirty()
    await userStore.refreshCounts()
    Toast.success(isEditMode.value ? '文章已更新' : '文章已发布')
    router.replace(`/articles/${savedItemId}`)
  } catch (error) {
    Toast.fail(resolveErrorMessage(error, isEditMode.value ? '更新文章失败' : '发布文章失败'))
  } finally {
    saving.value = false
  }
}

const loadArticle = async () => {
  if (!isEditMode.value) {
    return
  }

  loading.value = true
  try {
    const ready = await ensureUserReady()
    if (!ready) {
      return
    }
    const res = await getItemDetail(itemId.value)
    const detail = res.data || {}
    if (!canEditOwnerItem(detail)) {
      Toast.fail('只能编辑自己的文章')
      router.replace(`/articles/${itemId.value}`)
      return
    }

    form.title = detail.title || ''
    form.description = detail.description || ''
    form.content = detail.content || ''
    coverUrl.value = detail.src || ''
    segments.value = normalizeArray(detail.images)
      .slice()
      .sort((a, b) => {
        const aOrder = Number.isFinite(Number(a?.order)) ? Number(a.order) : 9999
        const bOrder = Number.isFinite(Number(b?.order)) ? Number(b.order) : 9999
        if (aOrder === bOrder) {
          return Number(a?.id || 0) - Number(b?.id || 0)
        }
        return aOrder - bOrder
      })
      .map((segment) => createSegment(segment, segment.url ? 'image' : 'text'))
  } catch (error) {
    Toast.fail(resolveErrorMessage(error, '获取文章详情失败'))
    router.back()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadArticle()
})

onBeforeUnmount(() => {
  revokeObjectUrl(coverLocalPreview.value)
  segments.value.forEach((segment) => revokeObjectUrl(segment.localPreview))
})
</script>

<style scoped>
.article-editor-page__panel {
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  position: relative;
}

.article-editor-page__nav {
  position: relative;
}

.article-editor-page__nav-btn {
  position: absolute;
  top: 8px;
  right: 10px;
  z-index: 2;
  color: #0f172a;
}

.article-editor-page__status {
  padding: 28px 12px;
  text-align: center;
  color: #64748b;
  font-size: 14px;
}

.article-editor-page__form {
  padding: 10px 2px 28px;
}

.article-editor-page__field + .article-editor-page__field {
  margin-top: 14px;
}

.article-editor-page__section {
  margin-top: 20px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.article-editor-page__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  color: #0f172a;
  font-size: 16px;
  font-weight: 600;
}

.article-editor-page__section-head--stack {
  align-items: flex-start;
  flex-direction: column;
}

.article-editor-page__segment-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.article-editor-page__segment-actions--inline {
  margin-top: 10px;
}

.article-editor-page__empty {
  padding: 18px 14px;
  border-radius: 16px;
  background: #f8fafc;
  color: #64748b;
  font-size: 14px;
}

.article-editor-page__image-picker {
  width: 100%;
  border: 1px dashed #cbd5e1;
  border-radius: 18px;
  background: #f8fafc;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
}

.article-editor-page__image-picker--segment {
  max-width: 280px;
}

.article-editor-page__image-preview {
  width: 100%;
  display: block;
  object-fit: cover;
}

.article-editor-page__image-placeholder {
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 14px;
}

.article-editor-page__link {
  border: 0;
  background: transparent;
  color: #2563eb;
  cursor: pointer;
  padding: 0;
  font-size: 14px;
}

.article-editor-page__link--danger {
  color: #ef4444;
}

.article-editor-page__hidden-input {
  display: none;
}

.article-editor-page__footer {
  margin-top: 24px;
}

.article-segment-card {
  margin-top: 14px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background: #fff;
}

.article-segment-card__head {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #0f172a;
  font-size: 15px;
  font-weight: 600;
}

.article-segment-card__image-wrap {
  margin-top: 12px;
}

@media (max-width: 600px) {
  .article-editor-page__image-placeholder {
    min-height: 148px;
  }

  .article-editor-page__image-picker--segment {
    max-width: 100%;
  }
}
</style>
