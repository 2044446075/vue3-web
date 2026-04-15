<template>
  <div class="nut-upload">
    <div v-show="props.showPicker">
    <nut-uploader ref="uploaderRef"
      v-model:file-list="fileList"
      :url="uploadUrl"
      :headers="headers"
      name="file"
      accept="image/*"
      :maximum="1"
      :auto-upload="true"
      :before-upload="beforeUpload"
      @success="handleSuccess"
      @failure="handleFailure"
    />
    </div>

    <nut-cell-group class="q-mt-md">
      <nut-cell title="压缩图片" v-if="props.showCompress">
        <template #link>
          <nut-switch v-model="compressEnabled" />
        </template>
      </nut-cell>
      <nut-cell :title="props.jumpTitle" is-link @click="handleJumpClick" v-if="props.showJump">
        <template #link>
          <div class="nut-upload__jump-link">
            <template v-if="uploadedUrl">
              <img
                v-if="!lastCompressed && props.showPreview"
                class="nut-upload__preview"
                :src="uploadedUrl"
                alt=""
              />
              <a v-else class="nut-upload__link" :href="uploadedUrl" target="_blank" @click.prevent="openLink">
                {{ uploadedUrl }}
              </a>
            </template>
            <span v-else>未上传</span>
            <nut-icon class="nut-upload__jump-right" name="right" />
          </div>
        </template>
      </nut-cell>
    </nut-cell-group>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

import { Toast } from '@nutui/nutui'
import { useUserStore } from 'src/stores/useUserStore'
import request from 'src/api/request'
import { getCurrentRouteFullPath, redirectToLogin } from 'src/utils/authNavigation'

const props = defineProps({
  showCompress: { type: Boolean, default: true },
  showJump: { type: Boolean, default: true },
  showPreview: { type: Boolean, default: true },
  showPicker: { type: Boolean, default: true },
  jumpTitle: { type: String, default: '跳转' }
})


const emit = defineEmits(['uploaded'])
const userStore = useUserStore()
const uploaderRef = ref(null)
const fileList = ref([])
const compressEnabled = ref(false)
const lastCompressed = ref(false)
const uploadedUrl = ref('')

const baseUrl =
  request.defaults.baseURL || (typeof window !== 'undefined' ? window.location.origin : '')
const uploadUrl = computed(() => new URL('/uploadimage/', baseUrl).toString())
const headers = computed(() =>
  userStore.token ? { Authorization: `Bearer ${userStore.token}` } : {}
)

const beforeUpload = async (files) => {
  if (!userStore.token) {
    Toast.warn('请先登录获取 Token')
    return []
  }
  const list = Array.from(files || [])
  lastCompressed.value = compressEnabled.value
  if (!compressEnabled.value) {
    return list
  }
  const compressed = await Promise.all(list.map((file) => compressImage(file)))
  return compressed
}

const handleSuccess = ({ responseText }) => {
  try {
    const data = JSON.parse(responseText || '{}')
    const src = data.src || data.url || ''
    if (src) {
      uploadedUrl.value = new URL(src, baseUrl).toString()
      emit('uploaded', { url: uploadedUrl.value, compressed: lastCompressed.value })
    }
  } catch {
    Toast.fail('上传返回解析失败')
  }
}

const isUnauthorizedUploadFailure = (payload) => {
  const status = Number(
    payload?.status || payload?.response?.status || payload?.xhr?.status || payload?.event?.target?.status || 0
  )
  if (status === 401) {
    return true
  }

  const rawText = String(payload?.responseText || payload?.message || '').toLowerCase()
  return rawText.includes('401') || rawText.includes('unauthorized')
}

const handleFailure = async (payload) => {
  if (isUnauthorizedUploadFailure(payload)) {
    userStore.clearSession()
    await redirectToLogin(getCurrentRouteFullPath())
    return
  }

  Toast.fail('图片上传失败')
}

const openPicker = () => {
  const root = uploaderRef.value?.$el || uploaderRef.value?.$?.vnode?.el
  const input = root?.querySelector?.("input[type=file]")
  if (input) {
    input.click()
  }
}

defineExpose({ openPicker })

const openLink = () => {
  if (!uploadedUrl.value) {
    return
  }
  const opened = window.open(uploadedUrl.value, '_blank')
  if (!opened) {
    window.location.href = uploadedUrl.value
  }
}

const handleJumpClick = () => {
  if (!uploadedUrl.value) {
    return
  }
  const opened = window.open(uploadedUrl.value, "_blank")
  if (!opened) {
    window.location.href = uploadedUrl.value
  }
}

const compressImage = (file) =>
  new Promise((resolve) => {
    if (!file || !file.type?.startsWith('image/')) {
      resolve(file)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const maxSize = 900
        let { width, height } = img
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(file)
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file)
              return
            }
            resolve(new File([blob], file.name, { type: blob.type }))
          },
          'image/jpeg',
          0.7
        )
      }
      img.onerror = () => resolve(file)
      img.src = String(reader.result || '')
    }
    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
</script>

<style scoped>
.nut-upload__preview {
  max-width: 140px;
  height: auto;
  display: block;
}

.nut-upload__link {
  color: #2b6cb0;
  text-decoration: none;
  word-break: break-all;
}

.nut-upload__jump-link {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nut-upload__jump-right {
  color: #9ca3af;
  font-size: 14px;
}
</style>
