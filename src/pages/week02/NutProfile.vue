<template>
  <q-page class="q-pa-md flex flex-center">
    <div class="nut-profile">
      <nut-cell-group>
        <nut-cell title="吴秀东 23211860236" desc="个人信息页" />
      </nut-cell-group>

      <nut-cell-group class="q-mt-md" title="用户信息">
        <nut-cell
          v-if="userStore.profileAuth"
          title="邮箱"
          :desc="userStore.profileAuth.email"
        />
        <nut-cell
          v-if="userStore.profileAuth"
          title="用户ID"
          :desc="userStore.profileAuth.id"
        />
        <nut-cell
          v-if="userStore.profileAuth"
          title="激活状态"
          :desc="userStore.profileAuth.is_active ? '是' : '否'"
        />
        <nut-cell
          v-if="userStore.profileAuth"
          title="管理员"
          :desc="userStore.profileAuth.is_superuser ? '是' : '否'"
        />
        <nut-cell
          v-if="userStore.profileAuth"
          title="已验证"
          :desc="userStore.profileAuth.is_verified ? '是' : '否'"
        />
        <nut-cell
          v-else
          title="未获取"
          desc="请先登录并获取用户信息"
        />
      </nut-cell-group>

      <pre v-if="profileText" class="nut-profile__raw">{{ profileText }}</pre>

      <div class="q-mt-md">
        <nut-button block type="primary" :loading="loading" @click="handleGetInfo">
          获取用户信息
        </nut-button>
        <nut-button block class="q-mt-sm" type="danger" @click="handleLogout">
          登出
        </nut-button>
        <nut-button block class="q-mt-sm" type="default" @click="goLogin">
          返回登录
        </nut-button>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { Toast } from '@nutui/nutui'
import { useRouter } from 'vue-router'
import { useUserStore } from 'src/stores/useUserStore'

const userStore = useUserStore()
const router = useRouter()
const loading = ref(false)

const profileText = computed(() =>
  userStore.profileAuth ? JSON.stringify(userStore.profileAuth, null, 2) : ''
)

const goLogin = () => {
  router.push('/week02/Work01')
}

const handleGetInfo = async () => {
  if (!userStore.token) {
    Toast.warn('请先登录')
    return
  }
  loading.value = true
  try {
    await userStore.getUserInfo()
    Toast.text('已获取用户信息')
  } catch (error) {
    const message =
      error.response?.data?.detail || error.message || '获取失败'
    Toast.fail(message)
  } finally {
    loading.value = false
  }
}

const handleLogout = async () => {
  try {
    await userStore.handleLogout()
    Toast.text('已退出登录')
  } catch (error) {
    const message =
      error.response?.data?.detail || error.message || '退出失败'
    Toast.fail(message)
  }
}

onMounted(() => {
  if (userStore.token && !userStore.profileAuth) {
    handleGetInfo()
  }
})
</script>

<style scoped>
.nut-profile {
  width: 420px;
  max-width: 92vw;
}

.nut-profile__raw {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 12px;
  margin-top: 12px;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
