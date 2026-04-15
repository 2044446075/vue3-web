<template>
  <q-page class="q-pa-md flex flex-center">
    <div class="nut-login">
      <nut-image class="nut-login__cover" :src="coverUrl" fit="cover" />
      <nut-cell-group>
        <nut-cell :title="studentTitle" desc="登录页" />
      </nut-cell-group>

      <nut-cell-group class="q-mt-md" title="用户登录">
        <nut-cell>
          <template #title>用户名</template>
          <nut-input v-model="form.username" placeholder="请输入邮箱" />
        </nut-cell>
        <nut-cell>
          <template #title>密码</template>
          <nut-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
          />
        </nut-cell>
      </nut-cell-group>

      <div class="q-mt-md">
        <nut-button block type="primary" :loading="loading" @click="handleLogin">
          登录
        </nut-button>
        <nut-button block class="q-mt-sm" type="default" @click="goProfile">
          个人信息页
        </nut-button>
      </div>

      <nut-cell-group class="q-mt-md">
        <nut-cell title="没有账号 去注册" is-link @click="goRegister" />
      </nut-cell-group>
    </div>
  </q-page>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { Toast } from '@nutui/nutui'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from 'src/stores/useUserStore'
import { resolvePostLoginPath } from 'src/utils/authNavigation'

const studentTitle = '23211860236 吴秀东'
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const loading = ref(false)
const form = reactive({ username: '', password: '' })
const coverUrl = '/week02-cover.jpg'

const goProfile = () => {
  router.push('/week04/Work01')
}

const goRegister = () => {
  router.push('/week03/Work02')
}

const handleLogin = async () => {
  if (!form.username || !form.password) {
    Toast.text('请输入账号和密码')
    return
  }

  loading.value = true
  try {
    await userStore.handleLogin({ ...form })
    router.replace(resolvePostLoginPath(route.query.redirect))
  } catch (error) {
    const detail = String(error?.response?.data?.detail || '')
    const message = detail === 'SECURE_LOGIN_DECRYPT_FAILED'
      ? '登录加密失败，请重试'
      : detail === 'SECURE_LOGIN_KEY_EXPIRED'
        ? '登录密钥已刷新，请重试'
        : error.response?.data?.detail || error.message || '登录失败'
    Toast.fail(message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.nut-login {
  width: 420px;
  max-width: 92vw;
}

.nut-login__cover {
  display: block;
  width: 100%;
  height: 360px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 12px;
}
</style>
