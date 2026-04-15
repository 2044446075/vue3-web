<template>
  <q-page class="q-pa-md flex flex-center">
    <q-card class="q-pa-sm" style="width: 420px; max-width: 92vw;">
      <q-card-section>
        <div class="text-h6">用户登录</div>
        <div class="text-caption q-mt-xs">
          姓名：{{ userStore.name }} | 学号：{{ userStore.number }}
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section v-if="!userStore.isLoggedIn">
        <q-input v-model.trim="form.username" label="账号（邮箱）" />
        <q-input v-model.trim="form.password" type="password" label="密码" />
        <q-btn
          class="full-width q-mt-md"
          color="primary"
          label="登录"
          :loading="loading"
          @click="handleLogin"
        />
      </q-card-section>

      <q-card-section v-else>
        <div class="row items-center q-gutter-sm">
          <q-avatar size="56px" color="teal" text-color="white" icon="person" />
          <div class="text-subtitle1">已登录</div>
        </div>
        <div class="q-mt-md">
          <q-btn
            color="primary"
            label="获取用户信息"
            :loading="infoLoading"
            @click="handleGetInfo"
          />
          <q-btn
            class="q-ml-sm"
            color="negative"
            label="退出登录"
            @click="handleLogout"
          />
        </div>
      </q-card-section>

      <q-card-section v-if="profileText">
        <div class="text-subtitle2">用户信息</div>
        <pre class="bg-grey-2 q-pa-sm rounded-borders">{{ profileText }}</pre>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useUserStore } from 'src/stores/useUserStore'

const userStore = useUserStore()
const $q = useQuasar()
const form = ref({ username: '', password: '' })
const loading = ref(false)
const infoLoading = ref(false)

const profileText = computed(() =>
  userStore.profileAuth ? JSON.stringify(userStore.profileAuth, null, 2) : ''
)

const handleLogin = async () => {
  if (!form.value.username || !form.value.password) {
    $q.notify({ type: 'warning', message: '请输入账号和密码' })
    return
  }
  loading.value = true
  try {
    await userStore.handleLogin(form.value)
    $q.notify({ type: 'positive', message: '登录成功' })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.detail || error.message || '登录失败'
    })
  } finally {
    loading.value = false
  }
}

const handleGetInfo = async () => {
  infoLoading.value = true
  try {
    await userStore.getUserInfo()
    $q.notify({ type: 'positive', message: '已获取用户信息' })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.detail || error.message || '获取失败'
    })
  } finally {
    infoLoading.value = false
  }
}

const handleLogout = async () => {
  try {
    await userStore.handleLogout()
    $q.notify({ type: 'positive', message: '已退出登录' })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.detail || error.message || '退出失败'
    })
  }
}
</script>
