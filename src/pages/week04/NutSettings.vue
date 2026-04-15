<template>
  <q-page class="nut-settings-page q-pa-sm">
    <div class="nut-settings-page__panel">
      <nut-navbar title="参数设置" left-show @on-click-back="goBack" />

      <nut-cell-group class="q-mt-sm">
        <nut-cell title="开启评论自动刷新">
          <template #link>
            <nut-switch v-model="commentAutoRefresh" />
          </template>
        </nut-cell>
        <nut-cell :title="String(settingsStore.commentCounter)" desc="当前评论计数器值" />

        <nut-cell title="开启文章自动刷新">
          <template #link>
            <nut-switch v-model="articleAutoRefresh" />
          </template>
        </nut-cell>
        <nut-cell :title="String(settingsStore.articleCounter)" desc="当前文章计数器值" />

        <nut-cell title="设置刷新间隔(ms)">
          <template #link>
            <div class="nut-settings-page__stepper">
              <nut-button size="small" type="default" @click="decreaseInterval">-</nut-button>
              <div class="nut-settings-page__stepper-value">{{ refreshIntervalMs }}</div>
              <nut-button size="small" type="default" @click="increaseInterval">+</nut-button>
            </div>
          </template>
        </nut-cell>
      </nut-cell-group>
    </div>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRefreshSettingsStore } from 'src/stores/useRefreshSettingsStore'

defineOptions({
  inheritAttrs: false
})

const settingsStore = useRefreshSettingsStore()
const router = useRouter()

const articleAutoRefresh = computed({
  get: () => settingsStore.articleAutoRefresh,
  set: (value) => settingsStore.setArticleAutoRefresh(value)
})

const commentAutoRefresh = computed({
  get: () => settingsStore.commentAutoRefresh,
  set: (value) => settingsStore.setCommentAutoRefresh(value)
})

const refreshIntervalMs = computed(() => settingsStore.refreshIntervalMs)

const increaseInterval = () => {
  settingsStore.increaseRefreshInterval(100)
}

const decreaseInterval = () => {
  settingsStore.decreaseRefreshInterval(100)
}

const goBack = () => {
  settingsStore.setCurrentTab('profile')
  router.replace('/week04/Work01')
}
</script>

<style scoped>
.nut-settings-page__panel {
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
}

.nut-settings-page__stepper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nut-settings-page__stepper-value {
  min-width: 64px;
  text-align: center;
  font-size: 16px;
}
</style>
