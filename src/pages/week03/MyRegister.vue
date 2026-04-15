<template>
  <q-page class="q-pa-md flex flex-center">
    <div class="nut-register">
      <nut-cell-group>
        <nut-cell :title="studentTitle" desc="注册页" />
      </nut-cell-group>

      <nut-image class="nut-register__cover q-mt-sm" :src="coverUrl" fit="cover" />

      <nut-cell-group class="q-mt-md" title="用户注册">
        <nut-cell>
          <template #title>* Email</template>
          <template #link>
            <div class="field-box">
              <nut-input
                v-model="form.email"
                placeholder="请输入邮箱"
                @blur="touched.email = true"
              />
              <div v-if="fieldErrors.email" class="field-error">{{ fieldErrors.email }}</div>
            </div>
          </template>
        </nut-cell>

        <nut-cell>
          <template #title>* 密码</template>
          <template #link>
            <div class="field-box">
              <nut-input
                v-model="form.password"
                type="password"
                placeholder="请输入密码"
                @blur="touched.password = true"
              />
              <div v-if="fieldErrors.password" class="field-error">{{ fieldErrors.password }}</div>
            </div>
          </template>
        </nut-cell>

        <nut-cell>
          <template #title>* 确认密码</template>
          <template #link>
            <div class="field-box">
              <nut-input
                v-model="form.confirmPassword"
                type="password"
                placeholder="再次输入密码"
                @blur="touched.confirmPassword = true"
              />
              <div v-if="fieldErrors.confirmPassword" class="field-error">
                {{ fieldErrors.confirmPassword }}
              </div>
            </div>
          </template>
        </nut-cell>
      </nut-cell-group>

      <div class="q-mt-md">
        <nut-button block type="primary" :loading="loading" @click="handleRegister">
          注册
        </nut-button>
      </div>

      <nut-cell-group class="q-mt-md">
        <nut-cell title="已有账号 去登录" is-link @click="goLogin" />
      </nut-cell-group>
    </div>
  </q-page>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { Toast } from '@nutui/nutui'
import { useRouter } from 'vue-router'
import { registerApi } from 'src/api/user'
import { useUserStore } from 'src/stores/useUserStore'

const studentTitle = '23211860236 吴秀东'
const coverUrl = '/week03-register-cover.png'
const MIN_PASSWORD_LENGTH = 6
const DEFAULT_PROFILE_PREFIX = '新用户'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

const form = reactive({
  email: '',
  password: '',
  confirmPassword: ''
})

const touched = reactive({
  email: false,
  password: false,
  confirmPassword: false
})

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const errors = computed(() => {
  const email = form.email.trim()
  const password = form.password
  const confirmPassword = form.confirmPassword

  return {
    email: !email
      ? '请输入Email'
      : !emailRegex.test(email)
        ? '输入的Email不合法'
        : '',
    password: !password
      ? '请输入密码'
      : password.length < MIN_PASSWORD_LENGTH
        ? `密码不少于${MIN_PASSWORD_LENGTH}位`
        : '',
    confirmPassword: !confirmPassword
      ? '请再次输入密码'
      : confirmPassword !== password
        ? '两次输入密码不一致'
        : ''
  }
})

const fieldErrors = computed(() => ({
  email: touched.email ? errors.value.email : '',
  password: touched.password ? errors.value.password : '',
  confirmPassword: touched.confirmPassword ? errors.value.confirmPassword : ''
}))

const hasError = computed(() =>
  Object.values(errors.value).some((errorText) => Boolean(errorText))
)

const markAllTouched = () => {
  touched.email = true
  touched.password = true
  touched.confirmPassword = true
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
  return fallback
}

const buildDefaultProfileName = () => {
  const rawId = String(userStore.profileAuth?.id || '').replace(/-/g, '')
  const suffix = rawId.slice(0, 8)
  return suffix ? `${DEFAULT_PROFILE_PREFIX}_${suffix}` : DEFAULT_PROFILE_PREFIX
}

const goLogin = () => {
  router.push('/week02/Work01')
}

const handleRegister = async () => {
  markAllTouched()
  if (hasError.value) {
    Toast.warn('请先修正表单错误')
    return
  }

  loading.value = true
  try {
    const email = form.email.trim()
    await registerApi({ email, password: form.password })
    await userStore.handleLogin({ username: email, password: form.password })

    if (!userStore.profileDetail?.name) {
      const defaultName = buildDefaultProfileName()
      await userStore.updateProfile({
        name: defaultName,
        avatar: userStore.profileDetail?.avatar || ''
      })
    }

    Toast.success('注册成功，已自动登录')
    router.push('/week03/Work01')
  } catch (error) {
    const message = resolveErrorMessage(error, '注册失败')
    Toast.fail(message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.nut-register {
  width: 420px;
  max-width: 92vw;
}

.nut-register__cover {
  width: 100%;
  height: 360px;
  border-radius: 12px;
  overflow: hidden;
}

.field-box {
  width: 220px;
  max-width: 52vw;
  text-align: left;
}

.field-error {
  margin-top: 4px;
  font-size: 12px;
  color: #f04f4f;
  line-height: 1.4;
}
</style>
