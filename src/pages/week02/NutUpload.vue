<template>
  <q-page class="q-pa-md flex flex-center">
    <div class="nut-upload-page">
      <div class="nut-upload-page__actions">
        <nut-button type="primary" size="small" @click="goLogin">登录</nut-button>
      </div>
      <div class="nut-upload-page__student">吴秀东 23211860236</div>
      <ImageUploader />
    </div>
  </q-page>
</template>

<script setup>
import { useRouter } from 'vue-router'
import ImageUploader from 'components/ImageUploader.vue'

const router = useRouter()

const goLogin = () => {
  router.push('/week02/Work01')
}
</script>

<style scoped>
.nut-upload-page {
  width: 420px;
  max-width: 92vw;
}

.nut-upload-page__actions {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 12px;
}

.nut-upload-page__student {
  font-weight: 600;
  margin-bottom: 8px;
}
</style>
