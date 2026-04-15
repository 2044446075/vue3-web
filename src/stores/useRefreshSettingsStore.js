import { defineStore } from 'pinia'

const MIN_REFRESH_MS = 200
const MAX_REFRESH_MS = 10000
const DEFAULT_REFRESH_MS = 1000

const clampRefreshMs = (value) => {
  const num = Number(value)
  if (!Number.isFinite(num)) {
    return DEFAULT_REFRESH_MS
  }
  return Math.min(MAX_REFRESH_MS, Math.max(MIN_REFRESH_MS, Math.round(num)))
}

export const useRefreshSettingsStore = defineStore('refreshSettings', {
  state: () => ({
    currentTab: 'all',
    articleAutoRefresh: false,
    commentAutoRefresh: false,
    refreshIntervalMs: DEFAULT_REFRESH_MS,
    articleCounter: 0,
    commentCounter: 0,
    articleDataDirty: false,
    commentDataDirty: false,
    allArticlesScrollTop: 0
  }),
  actions: {
    setCurrentTab(tabName) {
      this.currentTab = String(tabName || 'all')
    },
    setArticleAutoRefresh(value) {
      this.articleAutoRefresh = Boolean(value)
    },
    setCommentAutoRefresh(value) {
      this.commentAutoRefresh = Boolean(value)
    },
    setRefreshIntervalMs(value) {
      this.refreshIntervalMs = clampRefreshMs(value)
    },
    increaseRefreshInterval(step = 100) {
      this.setRefreshIntervalMs(this.refreshIntervalMs + step)
    },
    decreaseRefreshInterval(step = 100) {
      this.setRefreshIntervalMs(this.refreshIntervalMs - step)
    },
    touchArticleCounter() {
      this.articleCounter = Date.now() % 100000
    },
    markArticleDataDirty() {
      this.articleDataDirty = true
    },
    clearArticleDataDirty() {
      this.articleDataDirty = false
    },
    touchCommentCounter() {
      this.commentCounter = Date.now() % 100000
    },
    markCommentDataDirty() {
      this.commentDataDirty = true
    },
    clearCommentDataDirty() {
      this.commentDataDirty = false
    },
    setAllArticlesScrollTop(value) {
      const num = Number(value)
      this.allArticlesScrollTop = Number.isFinite(num) && num >= 0 ? num : 0
    }
  },
  persist: true
})

