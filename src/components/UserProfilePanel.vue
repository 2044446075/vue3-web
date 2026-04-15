<template>
  <div class="nut-profile">
    <nut-cell-group>
      <nut-cell :title="studentTitle" desc="个人信息页" />
    </nut-cell-group>

    <div v-if="!isLoggedIn" class="nut-profile__guest-tip q-mt-md">
      当前为未登录状态，请先登录后查看和编辑个人信息。
    </div>

    <nut-cell-group class="q-mt-md" title="个人信息">
      <nut-cell title="头像" :desc="isLoggedIn ? '' : '未登录'" :is-link="isLoggedIn" @click="openAvatarPicker">
        <template #link>
          <div v-if="isLoggedIn" class="nut-profile__avatar-link">
            <img class="nut-profile__avatar" :src="avatarPreview" alt="头像" @error="handleAvatarError" />
            <nut-icon class="nut-profile__link-icon" name="right" />
          </div>
        </template>
      </nut-cell>

      <ImageUploader
        v-if="isLoggedIn"
        ref="uploaderRef"
        :show-compress="false"
        :show-preview="false"
        :show-picker="false"
        jump-title="头像链接"
        @uploaded="handleAvatarUploaded"
      />

      <nut-cell v-else title="头像链接" desc="未登录" />
      <nut-cell title="UUID" :desc="displayUuid" />
      <nut-cell title="Email" :desc="displayEmail" />
      <nut-cell title="发表文章数" :desc="itemCountText" />
      <nut-cell title="发表评论数" :desc="commentCountText" />
      <nut-cell v-if="shouldShowSettingsEntry" title="参数设置" is-link @click="goSettings" />
    </nut-cell-group>

    <nut-cell-group class="q-mt-md" title="修改姓名">
      <nut-cell>
        <template #title>姓名</template>
        <template #link>
          <div class="nut-profile__input-wrap">
            <nut-input
              v-model="editName"
              :disabled="!isLoggedIn"
              :placeholder="isLoggedIn ? '请输入姓名' : '未登录不可编辑'"
            />
          </div>
        </template>
      </nut-cell>
    </nut-cell-group>

    <div class="q-mt-md">
      <nut-button
        block
        type="primary"
        :disabled="!isLoggedIn"
        :loading="profileLoading"
        :class="['nut-profile__action-btn', { 'nut-profile__action-btn--disabled': !isLoggedIn }]"
        @click="saveProfile"
      >
        保存姓名
      </nut-button>
    </div>

    <nut-cell-group class="q-mt-md" title="修改密码">
      <nut-cell>
        <template #title>新密码</template>
        <template #link>
          <div class="nut-profile__input-wrap">
            <nut-input
              v-model="editPassword"
              type="password"
              :disabled="!isLoggedIn"
              :placeholder="isLoggedIn ? '请输入新密码' : '未登录不可编辑'"
            />
          </div>
        </template>
      </nut-cell>
    </nut-cell-group>

    <div class="q-mt-md">
      <nut-button
        block
        type="warning"
        :disabled="!isLoggedIn"
        :loading="passwordLoading"
        :class="['nut-profile__action-btn', { 'nut-profile__action-btn--disabled': !isLoggedIn }]"
        @click="changePassword"
      >
        修改密码
      </nut-button>
    </div>

    <div class="q-mt-md">
      <nut-button
        block
        type="danger"
        :disabled="!isLoggedIn"
        :class="['nut-profile__action-btn', { 'nut-profile__action-btn--disabled': !isLoggedIn }]"
        @click="handleLogout"
      >
        退出
      </nut-button>
      <nut-button v-if="showLoginButton" block class="q-mt-sm" type="default" @click="goLogin">
        {{ isLoggedIn ? '返回登录' : '去登录' }}
      </nut-button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { Toast } from '@nutui/nutui'
import { useRouter } from 'vue-router'
import ImageUploader from 'components/ImageUploader.vue'
import request from 'src/api/request'
import { useUserStore } from 'src/stores/useUserStore'

defineOptions({
  inheritAttrs: false
})

const props = defineProps({
  studentTitle: {
    type: String,
    default: '23211860236 吴秀东'
  },
  showLoginButton: {
    type: Boolean,
    default: true
  },
  showSettingsEntry: {
    type: Boolean,
    default: false
  },
  settingsRoute: {
    type: String,
    default: '/week04/Work02'
  },
  redirectOnLogout: {
    type: Boolean,
    default: true
  }
})

const fallbackAvatar = '/icons/favicon-128x128.png'
const DEFAULT_PROFILE_PREFIX = '新用户'
const apiBaseUrl =
  request.defaults.baseURL || (typeof window !== 'undefined' ? window.location.origin : '')

const userStore = useUserStore()
const router = useRouter()
const uploaderRef = ref(null)
const newAvatar = ref('')
const editName = ref('')
const editPassword = ref('')
const profileLoading = ref(false)
const passwordLoading = ref(false)

const isLoggedIn = computed(() => Boolean(userStore.token))
const shouldShowSettingsEntry = computed(() => props.showSettingsEntry && isLoggedIn.value)

const buildDefaultProfileName = () => {
  const rawId = String(userStore.profileAuth?.id || '').replace(/-/g, '')
  const suffix = rawId.slice(0, 8)
  return suffix ? `${DEFAULT_PROFILE_PREFIX}_${suffix}` : DEFAULT_PROFILE_PREFIX
}

const displayEmail = computed(() =>
  isLoggedIn.value
    ? userStore.profileDetail?.email || userStore.profileAuth?.email || '未设置'
    : '未登录'
)
const displayUuid = computed(() =>
  isLoggedIn.value
    ? userStore.profileDetail?.uuid || userStore.profileAuth?.id || '未设置'
    : '未登录'
)
const normalizeAvatarUrl = (url) => {
  const raw = String(url || '').trim()
  if (!raw) {
    return fallbackAvatar
  }
  if (raw === fallbackAvatar || raw.startsWith('/icons/')) {
    return raw
  }
  if (/^(https?:\/\/|data:|blob:)/i.test(raw)) {
    return raw
  }
  if (apiBaseUrl) {
    const path = raw.startsWith('/') ? raw : `/${raw}`
    return new URL(path, apiBaseUrl).toString()
  }
  return raw
}

const avatarPreview = computed(() => normalizeAvatarUrl(newAvatar.value || userStore.profileDetail?.avatar))
const fallbackAvatarAbsolute =
  typeof window !== 'undefined' ? new URL(fallbackAvatar, window.location.origin).toString() : fallbackAvatar

const handleAvatarError = (event) => {
  const target = event?.target
  if (!target || target.src === fallbackAvatarAbsolute) {
    return
  }
  target.src = fallbackAvatarAbsolute
}
const itemCountText = computed(() =>
  isLoggedIn.value ? String(userStore.profileDetail?.item_count ?? 0) : '未登录'
)
const commentCountText = computed(() =>
  isLoggedIn.value ? String(userStore.profileDetail?.comment_count ?? 0) : '未登录'
)

const ensureLoggedIn = () => {
  if (isLoggedIn.value) {
    return true
  }
  Toast.warn('请先登录')
  return false
}

const openAvatarPicker = () => {
  if (!ensureLoggedIn()) {
    return
  }
  uploaderRef.value?.openPicker?.()
}

const handleAvatarUploaded = async (payload) => {
  if (!ensureLoggedIn()) {
    return
  }

  const url = payload?.url
  if (!url) {
    return
  }

  newAvatar.value = url
  const nameToSave = editName.value.trim() || buildDefaultProfileName()

  profileLoading.value = true
  try {
    await userStore.updateProfile({
      name: nameToSave,
      avatar: url
    })
    Toast.success('头像已更新')
    newAvatar.value = ''
  } catch (error) {
    const message = error.response?.data?.detail || error.message || '更新失败'
    Toast.fail(message)
  } finally {
    profileLoading.value = false
  }
}

const saveProfile = async () => {
  if (!ensureLoggedIn()) {
    return
  }

  const nameToSave = editName.value.trim()
  if (!nameToSave) {
    Toast.warn('请输入姓名')
    return
  }

  profileLoading.value = true
  try {
    await userStore.updateProfile({
      name: nameToSave,
      avatar: userStore.profileDetail?.avatar || ''
    })
    Toast.success('个人信息已更新')
    newAvatar.value = ''
  } catch (error) {
    const message = error.response?.data?.detail || error.message || '更新失败'
    Toast.fail(message)
  } finally {
    profileLoading.value = false
  }
}

const changePassword = async () => {
  if (!ensureLoggedIn()) {
    return
  }

  if (!editPassword.value) {
    Toast.warn('请输入新密码')
    return
  }

  passwordLoading.value = true
  try {
    await userStore.updatePassword(editPassword.value)
    Toast.success('密码已更新')
    editPassword.value = ''
  } catch (error) {
    const message = error.response?.data?.detail || error.message || '修改失败'
    Toast.fail(message)
  } finally {
    passwordLoading.value = false
  }
}

const handleLogout = async () => {
  if (!ensureLoggedIn()) {
    return
  }

  try {
    await userStore.handleLogout()
    Toast.text('已退出登录')
    if (props.redirectOnLogout) {
      router.push('/week02/Work01')
    }
  } catch (error) {
    const message = error.response?.data?.detail || error.message || '退出失败'
    Toast.fail(message)
  }
}

const goLogin = () => {
  router.push('/week02/Work01')
}

const goSettings = () => {
  router.push(props.settingsRoute)
}

watch(
  [() => userStore.profileDetail?.name, () => userStore.token, () => userStore.profileAuth?.id],
  ([name, token]) => {
    editName.value = token ? name || buildDefaultProfileName() : ''
  },
  { immediate: true }
)

onMounted(async () => {
  if (!userStore.token) {
    return
  }

  if (!userStore.profileDetail) {
    await userStore.getUserInfo()
    return
  }

  await userStore.refreshCounts()
})
</script>

<style scoped>
.nut-profile {
  width: 420px;
  max-width: 92vw;
}

.nut-profile__guest-tip {
  padding: 10px 12px;
  border-radius: 8px;
  background: #fff5f5;
  color: #c53030;
  font-size: 13px;
  line-height: 1.5;
}

.nut-profile__avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
}

.nut-profile__avatar-link {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nut-profile__link-icon {
  color: #9ca3af;
  font-size: 14px;
}

.nut-profile__guest-avatar {
  min-width: 48px;
  padding: 2px 10px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 12px;
  line-height: 20px;
  text-align: center;
}

.nut-profile__input-wrap {
  width: 220px;
  max-width: 52vw;
}

.nut-profile__action-btn--disabled {
  opacity: 0.5;
  filter: grayscale(0.35);
}

.nut-profile :deep(.nut-profile__action-btn--disabled),
.nut-profile :deep(.nut-profile__action-btn--disabled .nut-button) {
  opacity: 0.5;
  filter: grayscale(0.35);
  box-shadow: none;
}
</style>
