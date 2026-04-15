<template>
  <q-page class="nut-bottom-nav-page">
    <div class="nut-bottom-nav-page__content q-pa-sm">
      <section v-if="activeTab === 'all'" class="nut-bottom-nav-page__all-section">
        <q-banner
          v-if="settingsStore.articleAutoRefresh"
          rounded
          dense
          inline-actions
          class="nut-bottom-nav-page__hint"
        >
          已开启文章自动刷新，当前为无下拉刷新模式。
        </q-banner>

        <q-banner
          v-if="recommendationLoading"
          rounded
          dense
          class="nut-bottom-nav-page__status-banner"
        >
          正在生成推荐文章...
        </q-banner>

        <q-banner
          v-else-if="recommendationError"
          rounded
          dense
          class="nut-bottom-nav-page__status-banner nut-bottom-nav-page__status-banner--error"
        >
          {{ recommendationError }}
        </q-banner>

        <div v-else-if="recommendedArticles.length > 0" class="recommendation-section q-mt-sm">
          <div class="row items-center q-mb-sm">
            <q-chip dense square color="deep-orange-5" text-color="white" icon="auto_awesome">
              为你推荐
            </q-chip>
          </div>

          <q-carousel
            v-model="recommendationSlide"
            animated
            swipeable
            navigation
            arrows
            infinite
            height="260px"
            class="recommendation-carousel"
          >
            <q-carousel-slide
              v-for="item in recommendedArticles"
              :key="`recommend-${item.id}`"
              :name="item.id"
              class="recommendation-carousel__slide q-pa-none"
            >
              <q-img
                :src="item.coverUrl"
                class="recommendation-carousel__image"
                :ratio="16 / 9"
                @click="openArticleDetail(item.id)"
              >
                <div class="absolute-full recommendation-carousel__overlay column justify-end q-pa-md">
                  <div class="row items-center q-gutter-sm q-mb-sm">
                    <q-chip dense square color="white" text-color="deep-orange-6">
                      推荐文章
                    </q-chip>
                    <q-chip
                      v-if="isLoggedIn"
                      dense
                      square
                      :color="isItemRead(item.id) ? 'grey-8' : 'deep-orange-5'"
                      text-color="white"
                    >
                      {{ isItemRead(item.id) ? '已读' : '未读' }}
                    </q-chip>
                  </div>

                  <div class="recommendation-carousel__title text-white text-h6 text-weight-bold">
                    {{ item.title }}
                  </div>

                  <div class="row items-center q-gutter-sm q-mt-sm">
                    <q-avatar size="28px">
                      <img :src="item.authorAvatar" alt="作者头像" @error="handleAvatarError" />
                    </q-avatar>
                    <q-btn
                      flat
                      no-caps
                      dense
                      text-color="white"
                      class="q-px-none"
                      @click.stop="openAuthorArticles(item)"
                    >
                      {{ item.authorName }}
                    </q-btn>
                  </div>

                  <div class="row items-center q-gutter-sm q-mt-md recommendation-carousel__actions">
                    <q-btn
                      unelevated
                      color="white"
                      text-color="dark"
                      no-caps
                      class="recommendation-carousel__action-btn"
                      label="阅读文章"
                      @click.stop="openArticleDetail(item.id)"
                    />
                    <q-btn
                      flat
                      color="white"
                      icon="chat_bubble_outline"
                      no-caps
                      class="recommendation-carousel__action-btn recommendation-carousel__action-btn--comment"
                      @click.stop="openCommentPage(item.id, item.rawTitle)"
                    >
                      <span class="q-ml-xs">{{ item.commentCount }}</span>
                    </q-btn>
                  </div>
                </div>
              </q-img>
            </q-carousel-slide>
          </q-carousel>
        </div>

        <div class="list-search q-mt-sm">
          <q-input
            v-model.trim="allSearchKeyword"
            dense
            outlined
            clearable
            debounce="200"
            class="list-search__input"
            placeholder="搜索标题、内容、评论"
          >
            <template #prepend>
              <q-icon name="search" size="18px" color="grey-6" />
            </template>
          </q-input>
        </div>

        <q-pull-to-refresh v-if="!settingsStore.articleAutoRefresh" @refresh="onAllPullRefresh">
          <div class="nut-bottom-nav-page__cards">
            <q-list class="q-gutter-md">
              <q-item
                v-for="item in filteredAllArticles"
                :key="`all-card-${item.id}`"
                class="q-pa-none full-width"
              >
                <ArticleFeedCard
                  class="full-width"
                  :item="item"
                  :is-read="isItemRead(item.id)"
                  :is-liked="isItemLiked(item.id)"
                  :like-pending="isLikePending(item.id)"
                  :show-read-badge="isLoggedIn"
                  @article-click="openArticleDetail(item.id)"
                  @author-click="openAuthorArticles(item)"
                  @like-click="toggleItemLike(item, 'all')"
                  @comment-click="openCommentPage(item.id, item.rawTitle)"
                  @cover-error="handleCoverError"
                  @avatar-error="handleAvatarError"
                />
              </q-item>
            </q-list>

            <div v-if="allLoading && allArticles.length === 0" class="nut-bottom-nav-page__empty">加载中...</div>
            <div v-if="!allLoading && allArticles.length === 0" class="nut-bottom-nav-page__empty">
              暂无文章数据
            </div>
            <div
              v-if="!allLoading && allArticles.length > 0 && filteredAllArticles.length === 0"
              class="nut-bottom-nav-page__empty"
            >
              未找到匹配的文章
            </div>
            <div v-if="allError" class="nut-bottom-nav-page__error">{{ allError }}</div>
          </div>
        </q-pull-to-refresh>

        <div v-else class="nut-bottom-nav-page__cards">
          <q-list class="q-gutter-md">
            <q-item
              v-for="item in filteredAllArticles"
              :key="`all-card-${item.id}`"
              class="q-pa-none full-width"
            >
              <ArticleFeedCard
                class="full-width"
                :item="item"
                :is-read="isItemRead(item.id)"
                :is-liked="isItemLiked(item.id)"
                :like-pending="isLikePending(item.id)"
                :show-read-badge="isLoggedIn"
                @article-click="openArticleDetail(item.id)"
                @author-click="openAuthorArticles(item)"
                @like-click="toggleItemLike(item, 'all')"
                @comment-click="openCommentPage(item.id, item.rawTitle)"
                @cover-error="handleCoverError"
                @avatar-error="handleAvatarError"
              />
            </q-item>
          </q-list>

          <div v-if="allLoading && allArticles.length === 0" class="nut-bottom-nav-page__empty">加载中...</div>
          <div v-if="!allLoading && allArticles.length === 0" class="nut-bottom-nav-page__empty">暂无文章数据</div>
          <div
            v-if="!allLoading && allArticles.length > 0 && filteredAllArticles.length === 0"
            class="nut-bottom-nav-page__empty"
          >
            未找到匹配的文章
          </div>
          <div v-if="allError" class="nut-bottom-nav-page__error">{{ allError }}</div>
        </div>
      </section>

      <section v-else-if="activeTab === 'items'">
        <nut-cell-group>
          <nut-cell :title="studentTitle" desc="我的文章" />
        </nut-cell-group>

        <div class="my-items-search q-mt-sm">
          <q-input
            v-model.trim="itemSearchKeyword"
            dense
            outlined
            clearable
            debounce="200"
            class="my-items-search__input"
            placeholder="搜索标题、内容、评论"
          >
            <template #prepend>
              <q-icon name="search" size="18px" color="grey-6" />
            </template>
          </q-input>
          <nut-button type="danger" size="small" class="my-items-search__publish" @click="goCreateArticle">
            发布文章
          </nut-button>
        </div>

        <q-banner v-if="myLoading" rounded dense class="nut-bottom-nav-page__status-banner">
          正在获取我的文章...
        </q-banner>
        <q-banner v-else-if="myError" rounded dense class="nut-bottom-nav-page__status-banner nut-bottom-nav-page__status-banner--error">
          {{ myError }}
        </q-banner>

        <div v-else class="nut-bottom-nav-page__cards q-mt-sm">
          <q-list class="q-gutter-md">
            <q-item
              v-for="item in filteredMyItems"
              :key="`mine-${item.id}`"
              class="q-pa-none full-width"
            >
              <ArticleFeedCard
                class="full-width"
                :item="item"
                :is-read="isItemRead(item.id)"
                :is-liked="isItemLiked(item.id)"
                :like-pending="isLikePending(item.id)"
                :show-read-badge="isLoggedIn"
                :show-delete="true"
                :delete-disabled="deletingItemId === item.id"
                @article-click="openArticleDetail(item.id, { editable: true })"
                @author-click="openAuthorArticles(item)"
                @like-click="toggleItemLike(item, 'items')"
                @comment-click="openCommentPage(item.id, item.rawTitle)"
                @delete-click="askDeleteMyItem(item)"
                @cover-error="handleCoverError"
                @avatar-error="handleAvatarError"
              />
            </q-item>
          </q-list>

          <q-banner v-if="myItems.length === 0" rounded dense class="nut-bottom-nav-page__status-banner">
            你还没有发布文章
          </q-banner>
          <q-banner v-else-if="filteredMyItems.length === 0" rounded dense class="nut-bottom-nav-page__status-banner">
            未找到匹配的文章
          </q-banner>
        </div>
      </section>

      <section v-else-if="activeTab === 'comments'">
        <nut-cell-group>
          <nut-cell :title="studentTitle" desc="我的评论" />
        </nut-cell-group>

        <q-banner v-if="commentLoading" rounded dense class="nut-bottom-nav-page__status-banner">
          正在获取我的评论...
        </q-banner>
        <q-banner
          v-else-if="commentError"
          rounded
          dense
          class="nut-bottom-nav-page__status-banner nut-bottom-nav-page__status-banner--error"
        >
          {{ commentError }}
        </q-banner>

        <div v-else class="q-mt-sm">
          <div class="list-search">
            <q-input
              v-model.trim="commentSearchKeyword"
              dense
              outlined
              clearable
              debounce="200"
              class="list-search__input"
              placeholder="搜索文章标题、评论内容、引用信息"
            >
              <template #prepend>
                <q-icon name="search" size="18px" color="grey-6" />
              </template>
            </q-input>
          </div>

          <q-banner
            v-if="myComments.length > 0 && filteredMyComments.length === 0"
            rounded
            dense
            class="nut-bottom-nav-page__status-banner q-mt-sm"
          >
            未找到匹配的评论
          </q-banner>

          <q-list v-else class="q-mt-sm">
            <q-item
              v-for="(comment, index) in filteredMyComments"
              :key="`comment-${comment.id || index}`"
              clickable
              class="my-comment-item"
              @click="openCommentFromMyComment(comment, index)"
            >
              <q-item-section avatar>
                <q-avatar rounded size="50px">
                  <img :src="getCommentCover(comment)" alt="文章封面" @error="handleCoverError" />
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-subtitle2 text-grey-10">
                  {{ getCommentItemTitle(comment, index) }}
                </q-item-label>
                <q-item-label caption class="text-body2 text-grey-8 q-mt-xs">
                  {{ getCommentPreview(comment, index) }}
                </q-item-label>
                <q-item-label caption class="q-mt-xs">
                  {{ formatDateTime(comment?.create_time) }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <div class="row items-center no-wrap q-gutter-xs">
                  <q-btn
                    flat
                    round
                    dense
                    color="grey-8"
                    icon="delete_outline"
                    :disable="deletingCommentId === comment.id || !canDeleteMyComment(comment)"
                    @click.stop="askDeleteMyComment(comment)"
                  />
                  <q-btn
                    flat
                    round
                    dense
                    color="grey-8"
                    icon="map"
                    @click.stop="openCommentFromMyComment(comment, index)"
                  />
                </div>
              </q-item-section>
            </q-item>

            <q-banner v-if="myComments.length === 0" rounded dense class="nut-bottom-nav-page__status-banner">
              你还没有发表评论
            </q-banner>
          </q-list>
        </div>
      </section>

      <section v-else-if="activeTab === 'follows'">
        <nut-cell-group>
          <nut-cell :title="studentTitle" desc="我的关注" />
        </nut-cell-group>

        <q-banner v-if="followLoading" rounded dense class="nut-bottom-nav-page__status-banner">
          正在获取关注用户的未读文章...
        </q-banner>
        <q-banner
          v-else-if="followError"
          rounded
          dense
          class="nut-bottom-nav-page__status-banner nut-bottom-nav-page__status-banner--error"
        >
          {{ followError }}
        </q-banner>
        <q-banner v-else-if="followUnreadItems.length === 0" rounded dense class="nut-bottom-nav-page__status-banner">
          你关注的用户还没有未读文章
        </q-banner>

        <div v-else class="nut-bottom-nav-page__cards q-mt-sm">
          <q-list class="q-gutter-md">
            <q-item
              v-for="item in followUnreadItems"
              :key="`follow-${item.id}`"
              class="q-pa-none full-width"
            >
              <ArticleFeedCard
                class="full-width"
                :item="item"
                :is-read="isItemRead(item.id)"
                :is-liked="isItemLiked(item.id)"
                :like-pending="isLikePending(item.id)"
                :show-read-badge="isLoggedIn"
                @article-click="openArticleDetail(item.id)"
                @author-click="openAuthorArticles(item)"
                @like-click="toggleItemLike(item, 'follows')"
                @comment-click="openCommentPage(item.id, item.rawTitle)"
                @cover-error="handleCoverError"
                @avatar-error="handleAvatarError"
              />
            </q-item>
          </q-list>
        </div>
      </section>

      <section v-else>
        <div class="nut-bottom-nav-page__profile-wrap">
          <UserProfilePanel
            :student-title="studentTitle"
            :show-settings-entry="true"
            settings-route="/profile/settings"
          />
        </div>
      </section>
    </div>

    <q-dialog v-model="deleteItemDialogVisible" persistent>
      <q-card class="delete-dialog">
        <q-card-section class="text-center text-subtitle1 text-weight-medium">
          确定需要删除这篇文章吗？
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md q-gutter-sm">
          <q-btn
            flat
            color="grey-7"
            label="取消"
            @click="cancelDeleteMyItem"
          />
          <q-btn
            unelevated
            color="negative"
            label="确认"
            :loading="deletingItemId !== null"
            @click="confirmDeleteMyItem"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="deleteDialogVisible" persistent>
      <q-card class="delete-dialog">
        <q-card-section class="text-center text-subtitle1 text-weight-medium">
          确定需要删除该评论吗？
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md q-gutter-sm">
          <q-btn
            flat
            color="grey-7"
            label="取消"
            @click="cancelDeleteMyComment"
          />
          <q-btn
            unelevated
            color="negative"
            label="确认"
            :loading="deletingCommentId !== null"
            @click="confirmDeleteMyComment"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <nut-tabbar
      v-model:visible="activeTab"
      bottom
      placeholder
      safe-area-inset-bottom
      active-color="#fa2c19"
      unactive-color="#667085"
    >
      <nut-tabbar-item
        v-for="tab in tabs"
        :key="tab.name"
        :name="tab.name"
        :tab-title="tab.title"
        :icon="tab.icon"
      />
    </nut-tabbar>
  </q-page>
</template>
<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Toast } from '@nutui/nutui'
import { useRouter } from 'vue-router'
import request from 'src/api/request'
import ArticleFeedCard from 'components/article/ArticleFeedCard.vue'
import UserProfilePanel from 'components/profile/UserProfilePanel.vue'
import {
  getAllItems,
  getItemDetail,
  getMyItems,
  getMyReadItemIds,
  getRecommendedItemsApi,
  getRecommendedItemsMineApi,
  getUserItemsProfileApi,
  getUsersApi,
  markItemReadApi,
  deleteItemApi
} from 'src/api/articles.js'
import { deleteCommentById, getMyComments } from 'src/api/comments.js'
import {
  getFollowUnreadItemsApi,
  getMyLikedItemIds,
  toggleItemLikeApi
} from 'src/api/social.js'
import { useRefreshSettingsStore } from 'src/stores/useRefreshSettingsStore'
import { useUserStore } from 'src/stores/useUserStore'
import { redirectToLogin } from 'src/utils/authNavigation'

defineOptions({
  inheritAttrs: false
})

const studentTitle = '23211860236 吴秀东'
const defaultRealName = '吴秀东'
const fallbackCover = '/week02-cover.jpg'
const fallbackAvatar = '/icons/favicon-128x128.png'
const apiBaseUrl =
  request.defaults.baseURL || (typeof window !== 'undefined' ? window.location.origin : '')

const settingsStore = useRefreshSettingsStore()
const userStore = useUserStore()
const router = useRouter()

const tabs = computed(() => [
  { name: 'all', title: '全部文章', icon: 'category' },
  { name: 'items', title: '我的文章', icon: 'home' },
  { name: 'comments', title: '我的评论', icon: 'message' },
  { name: 'follows', title: '我的关注', icon: 'follow' },
  { name: 'profile', title: defaultRealName, icon: 'my' }
])

const activeTab = ref(settingsStore.currentTab || 'all')

const recommendedArticles = ref([])
const allArticles = ref([])
const myItems = ref([])
const myComments = ref([])
const followUnreadItems = ref([])

const allSearchKeyword = ref('')
const itemSearchKeyword = ref('')
const commentSearchKeyword = ref('')

const likedItemIds = ref([])
const likingItemIds = ref([])
const readItemIds = ref([])
const commentCoverMap = ref({})

const deletingItemId = ref(null)
const deleteItemDialogVisible = ref(false)
const pendingDeleteItem = ref(null)
const deletingCommentId = ref(null)
const deleteDialogVisible = ref(false)
const pendingDeleteComment = ref(null)

const allLoading = ref(false)
const myLoading = ref(false)
const commentLoading = ref(false)
const commentRefreshing = ref(false)
const followLoading = ref(false)
const recommendationLoading = ref(false)
const recommendationSlide = ref(null)

const recommendationLoaded = ref(false)
const allLoaded = ref(false)
const myLoaded = ref(false)
const commentLoaded = ref(false)
const followLoaded = ref(false)

const recommendationError = ref('')
const allError = ref('')
const myError = ref('')
const commentError = ref('')
const followError = ref('')

const isLoggedIn = computed(() => Boolean(userStore.token))
const likedItemIdSet = computed(() => new Set(likedItemIds.value.map((id) => Number(id))))
const likingItemIdSet = computed(() => new Set(likingItemIds.value.map((id) => Number(id))))
const readItemIdSet = computed(() => new Set(readItemIds.value.map((id) => Number(id))))

const normalizedAllSearchKeyword = computed(() => String(allSearchKeyword.value || '').trim().toLowerCase())
const normalizedItemSearchKeyword = computed(() => String(itemSearchKeyword.value || '').trim().toLowerCase())
const normalizedCommentSearchKeyword = computed(() =>
  String(commentSearchKeyword.value || '').trim().toLowerCase()
)

const filteredAllArticles = computed(() => {
  const keyword = normalizedAllSearchKeyword.value
  if (!keyword) {
    return allArticles.value
  }
  return allArticles.value.filter((item) => String(item?.searchText || '').includes(keyword))
})

const filteredMyItems = computed(() => {
  const keyword = normalizedItemSearchKeyword.value
  if (!keyword) {
    return myItems.value
  }
  return myItems.value.filter((item) => String(item?.searchText || '').includes(keyword))
})

const filteredMyComments = computed(() => {
  const keyword = normalizedCommentSearchKeyword.value
  if (!keyword) {
    return myComments.value
  }
  return myComments.value.filter((comment) => {
    const searchText = [comment?.item?.title || '', comment?.content || '', comment?.hint || '']
      .join(' ')
      .toLowerCase()
    return searchText.includes(keyword)
  })
})

const protectedTabNames = new Set(['items', 'comments', 'follows', 'profile'])

let articleTimer = null
let commentTimer = null
let allRequestTag = 0
let isRevertingProtectedTab = false
let allScrollEventSeq = 0

const normalizeArray = (value) => (Array.isArray(value) ? value : [])

const normalizeIdList = (value) =>
  normalizeArray(value)
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0)

const getScrollTop = () => {
  if (typeof window === 'undefined') {
    return 0
  }
  return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
}

const setScrollTop = (value) => {
  if (typeof window === 'undefined') {
    return
  }
  window.scrollTo({ top: Number(value) || 0, behavior: 'auto' })
}

const rememberAllScrollPosition = () => {
  if (activeTab.value === 'all') {
    settingsStore.setAllArticlesScrollTop(getScrollTop())
  }
}

const restoreAllScrollPosition = () => {
  nextTick(() => {
    setTimeout(() => {
      setScrollTop(settingsStore.allArticlesScrollTop)
    }, 0)
  })
}

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

const formatDate = (value) => {
  if (!value) {
    return '--'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const formatDateTime = (value) => {
  if (!value) {
    return '--'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`
}

const cutText = (text, max = 16) => {
  const raw = String(text || '')
  return raw.length > max ? `${raw.slice(0, max)}...` : raw
}

const resolveErrorMessage = (error, fallback) => {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) {
    return detail
  }
  return error?.message || fallback
}

const buildArticleCard = (item, detail) => {
  const comments = normalizeArray(detail?.comments)
  const hasCommentList = Array.isArray(detail?.comments)
  const cover = detail?.src || item?.src || ''
  const rawTitle =
    item?.title ||
    detail?.title ||
    item?.description ||
    detail?.description ||
    item?.content ||
    ''
  const rawContent =
    item?.content ||
    detail?.content ||
    item?.description ||
    detail?.description ||
    ''
  const commentText = comments.map((comment) => `${comment?.content || ''} ${comment?.hint || ''}`).join(' ')
  const searchText = `${rawTitle} ${rawContent} ${item?.owner?.name || ''} ${commentText}`.toLowerCase()

  return {
    id: item.id,
    owner_id: item?.owner_id || detail?.owner_id || '',
    authorUuid: item?.owner_id || detail?.owner_id || '',
    rawTitle: rawTitle || `文章 #${item?.id || '-'}`,
    title: cutText(rawTitle || `文章 #${item?.id || '-'}`, 28),
    rawContent,
    rawCommentText: commentText,
    searchText,
    authorName: item?.owner?.name || detail?.owner?.name || '匿名用户',
    authorAvatar: normalizeMediaUrl(item?.owner?.avatar || detail?.owner?.avatar, fallbackAvatar),
    coverUrl: normalizeMediaUrl(cover, fallbackCover),
    publishDate: formatDate(item?.create_time || detail?.create_time),
    starCount: Number(item?.star || detail?.star || 0),
    commentCount: hasCommentList
      ? comments.length
      : Number(item?.comment_count ?? detail?.comment_count ?? 0)
  }
}

const loadRecommendations = async (force = false) => {
  if (recommendationLoaded.value && !force) {
    return
  }

  recommendationLoading.value = true
  recommendationError.value = ''
  let loadedSuccessfully = false

  try {
    const res = userStore.token
      ? await getRecommendedItemsMineApi({ limit: 5 })
      : await getRecommendedItemsApi({ limit: 5 })

    recommendedArticles.value = normalizeArray(res.data).map((item) => buildArticleCard(item, null))
    if (recommendedArticles.value.length > 0) {
      recommendationSlide.value = recommendedArticles.value[0].id
    } else {
      recommendationSlide.value = null
    }
    loadedSuccessfully = true
  } catch (error) {
    recommendedArticles.value = []
    recommendationSlide.value = null
    recommendationError.value = resolveErrorMessage(error, '获取推荐文章失败')
  } finally {
    recommendationLoading.value = false
    recommendationLoaded.value = loadedSuccessfully
  }
}

const updateLikedItemIds = (itemId, liked) => {
  const id = Number(itemId || 0)
  if (!id) {
    return
  }
  if (liked) {
    likedItemIds.value = Array.from(new Set([...likedItemIds.value, id]))
  } else {
    likedItemIds.value = likedItemIds.value.filter((likedId) => Number(likedId) !== id)
  }
}

const updateReadItemIds = (itemId, read = true) => {
  const id = Number(itemId || 0)
  if (!id) {
    return
  }
  if (read) {
    readItemIds.value = Array.from(new Set([...readItemIds.value, id]))
  } else {
    readItemIds.value = readItemIds.value.filter((readId) => Number(readId) !== id)
  }
}

const isItemLiked = (itemId) => likedItemIdSet.value.has(Number(itemId || 0))
const isLikePending = (itemId) => likingItemIdSet.value.has(Number(itemId || 0))
const isItemRead = (itemId) => readItemIdSet.value.has(Number(itemId || 0))

const updateArticleLikeCount = (itemId, starCount) => {
  const id = Number(itemId || 0)
  const nextStarCount = Number(starCount || 0)
  const applyUpdate = (list) =>
    normalizeArray(list).map((item) =>
      Number(item?.id || 0) === id
        ? {
            ...item,
            starCount: nextStarCount
          }
        : item
    )

  recommendedArticles.value = applyUpdate(recommendedArticles.value)
  allArticles.value = applyUpdate(allArticles.value)
  myItems.value = applyUpdate(myItems.value)
  followUnreadItems.value = applyUpdate(followUnreadItems.value)
}

const refreshLikedItemIds = async () => {
  if (!userStore.token) {
    likedItemIds.value = []
    return
  }

  try {
    const res = await getMyLikedItemIds()
    likedItemIds.value = normalizeIdList(res.data)
  } catch (error) {
    if (error?.response?.status === 404) {
      likedItemIds.value = []
      return
    }
    throw error
  }
}

const refreshReadItemIds = async () => {
  if (!userStore.token) {
    readItemIds.value = []
    return
  }

  try {
    const res = await getMyReadItemIds()
    readItemIds.value = normalizeIdList(res.data)
  } catch (error) {
    if (error?.response?.status === 404) {
      readItemIds.value = []
      return
    }
    throw error
  }
}

const ensureUserReady = async () => {
  if (!userStore.token) {
    return false
  }

  if (!userStore.profileAuth || !userStore.profileDetail) {
    await userStore.getUserInfo()
  } else {
    await userStore.refreshCounts()
  }

  return true
}

const markItemRead = async (itemId) => {
  const id = Number(itemId || 0)
  if (!id || !userStore.token || isItemRead(id)) {
    return false
  }

  try {
    await markItemReadApi(id)
    updateReadItemIds(id, true)
    return true
  } catch {
    return false
  }
}

const toggleItemLike = async (item, errorTarget = 'all') => {
  const itemId = Number(item?.id || 0)
  if (!itemId) {
    return
  }

  if (!isLoggedIn.value) {
    Toast.warn('请先登录后点赞')
    await redirectToLogin()
    return
  }

  if (isLikePending(itemId)) {
    return
  }

  likingItemIds.value = [...likingItemIds.value, itemId]

  try {
    const res = await toggleItemLikeApi(itemId)
    const liked = Boolean(res.data?.liked)
    const starCount = Number(res.data?.star ?? item?.starCount ?? 0)
    updateLikedItemIds(itemId, liked)
    updateArticleLikeCount(itemId, starCount)
  } catch (error) {
    const message = resolveErrorMessage(error, '点赞失败')
    if (errorTarget === 'items') {
      myError.value = message
    } else if (errorTarget === 'follows') {
      followError.value = message
    } else {
      allError.value = message
    }
  } finally {
    likingItemIds.value = likingItemIds.value.filter((id) => id !== itemId)
  }
}

const consumeCommentDataDirty = () => {
  if (!settingsStore.commentDataDirty) {
    return
  }

  recommendationLoaded.value = false
  allLoaded.value = false
  myLoaded.value = false
  commentLoaded.value = false
  followLoaded.value = false
  settingsStore.clearCommentDataDirty()
}

const consumeArticleDataDirty = () => {
  if (!settingsStore.articleDataDirty) {
    return
  }

  recommendationLoaded.value = false
  allLoaded.value = false
  myLoaded.value = false
  commentLoaded.value = false
  followLoaded.value = false
  commentCoverMap.value = {}
  settingsStore.clearArticleDataDirty()
}

const loadAllArticlesFromUsers = async () => {
  const usersRes = await getUsersApi({ limit: 200 })
  const users = normalizeArray(usersRes.data)

  const itemTasks = await Promise.allSettled(users.map((user) => getUserItemsProfileApi(user?.uuid)))
  const seenIds = new Set()
  const mergedItems = []

  itemTasks.forEach((task) => {
    if (task.status !== 'fulfilled') {
      return
    }
    normalizeArray(task.value?.data?.items).forEach((item) => {
      const itemId = Number(item?.id || 0)
      if (!itemId || seenIds.has(itemId)) {
        return
      }
      seenIds.add(itemId)
      mergedItems.push(item)
    })
  })

  return mergedItems.sort((a, b) => {
    const aTime = new Date(a?.create_time || 0).getTime()
    const bTime = new Date(b?.create_time || 0).getTime()
    return bTime - aTime
  })
}

const loadAllArticles = async ({ force = false, keepPosition = false, touchCounter = false } = {}) => {
  if (allLoaded.value && !force) {
    return
  }

  const requestTag = ++allRequestTag
  const currentTop = keepPosition ? getScrollTop() : 0
  const scrollEventSeqAtStart = allScrollEventSeq

  allLoading.value = true
  allError.value = ''
  let loadedSuccessfully = false

  if (touchCounter) {
    settingsStore.touchArticleCounter()
  }

  try {
    const items = userStore.token
      ? await loadAllArticlesFromUsers()
      : normalizeArray((await getAllItems({ limit: 50 })).data).sort((a, b) => {
          const aTime = new Date(a?.create_time || 0).getTime()
          const bTime = new Date(b?.create_time || 0).getTime()
          return bTime - aTime
        })

    if (requestTag !== allRequestTag) {
      return
    }

    allArticles.value = items.map((item) => buildArticleCard(item, null))
    loadedSuccessfully = true
  } catch (error) {
    if (requestTag !== allRequestTag) {
      return
    }
    allArticles.value = []
    allError.value = resolveErrorMessage(error, '获取所有文章失败')
  } finally {
    if (requestTag === allRequestTag) {
      allLoading.value = false
      allLoaded.value = loadedSuccessfully
      if (keepPosition) {
        const restoreTop =
          scrollEventSeqAtStart === allScrollEventSeq ? currentTop : settingsStore.allArticlesScrollTop
        nextTick(() => {
          setScrollTop(restoreTop)
          settingsStore.setAllArticlesScrollTop(restoreTop)
        })
      }
    }
  }
}

const loadMyItems = async (force = false) => {
  if (myLoaded.value && !force) {
    return
  }

  myLoading.value = true
  myError.value = ''
  let loadedSuccessfully = false

  if (!isLoggedIn.value) {
    myItems.value = []
    myError.value = '请先登录后查看我的文章'
    myLoading.value = false
    myLoaded.value = true
    return
  }

  try {
    await ensureUserReady()
    const uuid = userStore.profileDetail?.uuid || userStore.profileAuth?.id
    if (!uuid) {
      myItems.value = []
      myError.value = '未获取到用户标识'
      return
    }

    const res = await getMyItems(uuid)
    const items = normalizeArray(res.data).sort((a, b) => {
      const aTime = new Date(a?.create_time || 0).getTime()
      const bTime = new Date(b?.create_time || 0).getTime()
      return bTime - aTime
    })

    myItems.value = items.map((item) => buildArticleCard(item, null))
    loadedSuccessfully = true
  } catch (error) {
    if (error?.response?.status === 404) {
      myItems.value = []
      myError.value = ''
      loadedSuccessfully = true
    } else {
      myItems.value = []
      myError.value = resolveErrorMessage(error, '获取我的文章失败')
    }
  } finally {
    myLoading.value = false
    myLoaded.value = loadedSuccessfully
  }
}

const getCommentCover = (comment) => {
  const itemId = Number(comment?.item_id || 0)
  if (!itemId) {
    return normalizeMediaUrl(fallbackCover, fallbackCover)
  }
  const fromMap = commentCoverMap.value[itemId]
  return normalizeMediaUrl(fromMap, fallbackCover)
}

const loadCommentCovers = async (comments) => {
  const currentMap = commentCoverMap.value || {}
  const itemIds = Array.from(
    new Set(
      normalizeArray(comments)
        .map((comment) => Number(comment?.item_id || 0))
        .filter((id) => id > 0 && !currentMap[id])
    )
  )
  if (itemIds.length === 0) {
    return
  }

  const detailTasks = await Promise.allSettled(itemIds.map((id) => getItemDetail(id).then((r) => r.data)))
  const nextMap = { ...currentMap }
  itemIds.forEach((id, index) => {
    const detail = detailTasks[index]?.status === 'fulfilled' ? detailTasks[index].value : null
    const firstImage = detail?.src || normalizeArray(detail?.images)[0]?.url || ''
    nextMap[id] = normalizeMediaUrl(firstImage, fallbackCover)
  })
  commentCoverMap.value = nextMap
}

const loadMyComments = async ({ force = false, touchCounter = false } = {}) => {
  if (commentLoaded.value && !force) {
    return
  }

  const useBlockingLoading = !commentLoaded.value && myComments.value.length === 0
  if (useBlockingLoading) {
    commentLoading.value = true
  } else {
    commentRefreshing.value = true
  }
  commentError.value = ''
  let loadedSuccessfully = false

  if (touchCounter) {
    settingsStore.touchCommentCounter()
  }

  if (!isLoggedIn.value) {
    myComments.value = []
    commentError.value = '请先登录后查看我的评论'
    if (useBlockingLoading) {
      commentLoading.value = false
    } else {
      commentRefreshing.value = false
    }
    commentLoaded.value = true
    return
  }

  try {
    await ensureUserReady()
    const res = await getMyComments()
    const comments = normalizeArray(res.data).sort((a, b) => {
      const aTime = new Date(a?.create_time || 0).getTime()
      const bTime = new Date(b?.create_time || 0).getTime()
      return bTime - aTime
    })
    myComments.value = comments
    await loadCommentCovers(comments)
    loadedSuccessfully = true
  } catch (error) {
    if (error?.response?.status === 404) {
      myComments.value = []
      commentError.value = ''
      loadedSuccessfully = true
    } else {
      myComments.value = []
      commentError.value = resolveErrorMessage(error, '获取我的评论失败')
    }
  } finally {
    if (useBlockingLoading) {
      commentLoading.value = false
    } else {
      commentRefreshing.value = false
    }
    commentLoaded.value = loadedSuccessfully
  }
}

const loadFollowUnreadItems = async (force = false) => {
  if (followLoaded.value && !force) {
    return
  }

  followLoading.value = true
  followError.value = ''
  let loadedSuccessfully = false

  if (!isLoggedIn.value) {
    followUnreadItems.value = []
    followError.value = '请先登录后查看我的关注'
    followLoading.value = false
    followLoaded.value = true
    return
  }

  try {
    await ensureUserReady()
    const res = await getFollowUnreadItemsApi()
    const items = normalizeArray(res.data).sort((a, b) => {
      const aTime = new Date(a?.create_time || 0).getTime()
      const bTime = new Date(b?.create_time || 0).getTime()
      return bTime - aTime
    })

    followUnreadItems.value = items.map((item) => buildArticleCard(item, null))
    loadedSuccessfully = true
  } catch (error) {
    if (error?.response?.status === 404) {
      followUnreadItems.value = []
      followError.value = ''
      loadedSuccessfully = true
    } else {
      followUnreadItems.value = []
      followError.value = resolveErrorMessage(error, '获取关注未读文章失败')
    }
  } finally {
    followLoading.value = false
    followLoaded.value = loadedSuccessfully
  }
}

const getCommentItemTitle = (comment, index) => {
  return cutText(comment?.item?.title || `文章 #${comment?.item_id || index + 1}`, 20)
}

const getCommentPreview = (comment, index) => {
  return cutText(comment?.content || `评论 #${comment?.id || index + 1}`, 24)
}

const openCommentPage = (itemId, title) => {
  const id = Number(itemId || 0)
  if (!id) {
    return
  }
  if (activeTab.value === 'all') {
    rememberAllScrollPosition()
  }
  router.push({
    path: `/articles/${id}/comments`,
    query: {
      title: String(title || '').trim()
    }
  })
}

const openAuthorArticles = (item) => {
  const userUuid = String(item?.authorUuid || item?.owner_id || '').trim()
  if (!userUuid) {
    return
  }
  if (activeTab.value === 'all') {
    rememberAllScrollPosition()
  }
  router.push({
    path: `/authors/${userUuid}/articles`,
    query: {
      name: String(item?.authorName || '').trim(),
      avatar: String(item?.authorAvatar || '').trim()
    }
  })
}

const openArticleDetail = (itemId, options = {}) => {
  const id = Number(itemId || 0)
  if (!id) {
    return
  }
  if (activeTab.value === 'all') {
    rememberAllScrollPosition()
  }
  if (userStore.token) {
    markItemRead(id).catch(() => {})
  }
  router.push({
    path: `/articles/${id}`,
    query: options.editable ? { editable: '1' } : undefined
  })
}

const goCreateArticle = () => {
  if (!userStore.token) {
    myError.value = '请先登录后发布文章'
    return
  }
  router.push('/articles/new')
}

const canEditItem = (item) => {
  if (!userStore.token) {
    return false
  }
  const ownerId = String(item?.owner_id || '')
  const ids = [userStore.profileAuth?.id, userStore.profileDetail?.uuid]
    .filter(Boolean)
    .map((id) => String(id))
  return ids.includes(ownerId)
}

const askDeleteMyItem = (item) => {
  if (!item?.id || !canEditItem(item) || deletingItemId.value !== null) {
    return
  }
  pendingDeleteItem.value = item
  deleteItemDialogVisible.value = true
}

const cancelDeleteMyItem = () => {
  deleteItemDialogVisible.value = false
  pendingDeleteItem.value = null
}

const confirmDeleteMyItem = async () => {
  const item = pendingDeleteItem.value
  if (!item?.id || !canEditItem(item) || deletingItemId.value !== null) {
    cancelDeleteMyItem()
    return
  }
  deleteItemDialogVisible.value = false
  try {
    await deleteMyItem(item)
  } finally {
    pendingDeleteItem.value = null
  }
}

const deleteMyItem = async (item) => {
  if (!item?.id || !canEditItem(item) || deletingItemId.value !== null) {
    return
  }

  deletingItemId.value = item.id
  myError.value = ''

  try {
    await deleteItemApi(item.id)
    settingsStore.markArticleDataDirty()
    allLoaded.value = false
    myLoaded.value = false
    commentLoaded.value = false
    followLoaded.value = false
    commentCoverMap.value = {}
    await userStore.refreshCounts()

    if (activeTab.value === 'all') {
      await loadAllArticles({ force: true, keepPosition: true })
    }
    if (activeTab.value === 'items') {
      await loadMyItems(true)
    }
    if (activeTab.value === 'comments') {
      await loadMyComments({ force: true })
    }
    if (activeTab.value === 'follows') {
      await loadFollowUnreadItems(true)
    }
  } catch (error) {
    myError.value = resolveErrorMessage(error, '删除文章失败')
  } finally {
    deletingItemId.value = null
  }
}

const openCommentFromMyComment = (comment, index) => {
  openCommentPage(comment?.item_id, comment?.item?.title || getCommentItemTitle(comment, index))
}

const canDeleteMyComment = (comment) => {
  if (!userStore.token) {
    return false
  }
  const ownerId = String(comment?.owner_id || '')
  const ids = [userStore.profileAuth?.id, userStore.profileDetail?.uuid]
    .filter(Boolean)
    .map((id) => String(id))
  return ids.includes(ownerId)
}

const askDeleteMyComment = (comment) => {
  if (!comment?.id || !canDeleteMyComment(comment)) {
    return
  }
  pendingDeleteComment.value = comment
  deleteDialogVisible.value = true
}

const cancelDeleteMyComment = () => {
  deleteDialogVisible.value = false
  pendingDeleteComment.value = null
}

const confirmDeleteMyComment = async () => {
  const comment = pendingDeleteComment.value
  if (!comment?.id || !canDeleteMyComment(comment)) {
    cancelDeleteMyComment()
    return
  }
  deleteDialogVisible.value = false

  deletingCommentId.value = comment.id
  commentError.value = ''

  try {
    await deleteCommentById(comment.id)
    settingsStore.touchCommentCounter()
    await loadMyComments({ force: true, touchCounter: false })
    await userStore.refreshCounts()
    allLoaded.value = false
    myLoaded.value = false
    followLoaded.value = false
    if (activeTab.value === 'all') {
      loadAllArticles({ force: true, keepPosition: true })
    }
    if (activeTab.value === 'items') {
      loadMyItems(true)
    }
    if (activeTab.value === 'follows') {
      loadFollowUnreadItems(true)
    }
  } catch (error) {
    commentError.value = resolveErrorMessage(error, '删除评论失败')
  } finally {
    deletingCommentId.value = null
    pendingDeleteComment.value = null
  }
}

const clearArticleTimer = () => {
  if (articleTimer) {
    clearInterval(articleTimer)
    articleTimer = null
  }
}

const clearCommentTimer = () => {
  if (commentTimer) {
    clearInterval(commentTimer)
    commentTimer = null
  }
}

const setupArticleAutoRefreshTimer = () => {
  clearArticleTimer()
  if (activeTab.value !== 'all' || !settingsStore.articleAutoRefresh) {
    return
  }

  articleTimer = setInterval(() => {
    if (allLoading.value) {
      return
    }
    loadAllArticles({ force: true, keepPosition: true, touchCounter: true })
  }, settingsStore.refreshIntervalMs)
}

const setupCommentAutoRefreshTimer = () => {
  clearCommentTimer()
  if (activeTab.value !== 'comments' || !settingsStore.commentAutoRefresh) {
    return
  }

  commentTimer = setInterval(() => {
    if (commentLoading.value || commentRefreshing.value) {
      return
    }
    loadMyComments({ force: true, touchCounter: true })
  }, settingsStore.refreshIntervalMs)
}

const onAllPullRefresh = (done) => {
  if (allLoading.value) {
    done()
    return
  }
  loadAllArticles({ force: true, touchCounter: true }).finally(() => done())
}

const handleCoverError = (event) => {
  const target = event?.target
  if (!target) {
    return
  }
  const fallback = normalizeMediaUrl(fallbackCover, fallbackCover)
  if (target.src === fallback) {
    return
  }
  target.src = fallback
}

const handleAvatarError = (event) => {
  const target = event?.target
  if (!target) {
    return
  }
  const fallback = normalizeMediaUrl(fallbackAvatar, fallbackAvatar)
  if (target.src === fallback) {
    return
  }
  target.src = fallback
}

const onWindowScroll = () => {
  allScrollEventSeq += 1
  rememberAllScrollPosition()
}

const getSafePublicTab = (tabName) => (protectedTabNames.has(tabName) ? 'all' : tabName || 'all')

const handleProtectedTabAccess = async (tabName, oldTab) => {
  if (isLoggedIn.value || !protectedTabNames.has(tabName)) {
    return false
  }

  const fallbackTab = getSafePublicTab(oldTab)
  isRevertingProtectedTab = true
  activeTab.value = fallbackTab
  settingsStore.setCurrentTab(fallbackTab)
  Toast.warn('请先登录后访问该页面')
  await redirectToLogin()
  isRevertingProtectedTab = false
  return true
}

watch(activeTab, async (tabName, oldTab) => {
  if (isRevertingProtectedTab) {
    return
  }
  if (await handleProtectedTabAccess(tabName, oldTab)) {
    return
  }

  settingsStore.setCurrentTab(tabName)
  consumeArticleDataDirty()
  consumeCommentDataDirty()

  if (oldTab === 'all') {
    rememberAllScrollPosition()
  }

  if (tabName === 'all') {
    if (!allLoading.value) {
      loadAllArticles()
    }
    if (!recommendationLoading.value) {
      loadRecommendations()
    }
    restoreAllScrollPosition()
  } else if (tabName === 'items') {
    if (!myLoading.value) {
      loadMyItems()
    }
  } else if (tabName === 'comments') {
    if (!commentLoading.value && !commentRefreshing.value) {
      loadMyComments({ force: false })
    }
  } else if (tabName === 'follows') {
    if (!followLoading.value) {
      loadFollowUnreadItems(true)
    }
  }
})

watch([() => activeTab.value, () => settingsStore.articleAutoRefresh, () => settingsStore.refreshIntervalMs], () => {
  setupArticleAutoRefreshTimer()
})

watch([() => activeTab.value, () => settingsStore.commentAutoRefresh, () => settingsStore.refreshIntervalMs], () => {
  setupCommentAutoRefreshTimer()
})

watch(
  () => userStore.token,
  () => {
    recommendationLoaded.value = false
    if (!userStore.token) {
      likedItemIds.value = []
      readItemIds.value = []
    } else {
      refreshLikedItemIds().catch(() => {})
      refreshReadItemIds().catch(() => {})
    }

    if (!userStore.token && protectedTabNames.has(activeTab.value)) {
      const fallbackTab = getSafePublicTab(activeTab.value)
      activeTab.value = fallbackTab
      settingsStore.setCurrentTab(fallbackTab)
    }

    myLoaded.value = false
    commentLoaded.value = false
    followLoaded.value = false
    if (activeTab.value === 'items') {
      if (!myLoading.value) {
        loadMyItems(true)
      }
    }
    if (activeTab.value === 'comments') {
      if (!commentLoading.value && !commentRefreshing.value) {
        loadMyComments({ force: true })
      }
    }
    if (activeTab.value === 'follows') {
      if (!followLoading.value) {
        loadFollowUnreadItems(true)
      }
    }
    if (activeTab.value === 'all') {
      if (!recommendationLoading.value) {
        loadRecommendations(true)
      }
    }
  }
)

onMounted(() => {
  consumeArticleDataDirty()
  consumeCommentDataDirty()

  if (userStore.token) {
    refreshLikedItemIds().catch(() => {})
    refreshReadItemIds().catch(() => {})
  }

  loadRecommendations(true)

  if (!isLoggedIn.value && protectedTabNames.has(activeTab.value)) {
    const fallbackTab = getSafePublicTab(activeTab.value)
    activeTab.value = fallbackTab
    settingsStore.setCurrentTab(fallbackTab)
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', onWindowScroll, { passive: true })
  }

  if (activeTab.value === 'all') {
    if (!allLoading.value) {
      loadAllArticles()
    }
    if (!recommendationLoading.value) {
      loadRecommendations()
    }
    restoreAllScrollPosition()
  } else if (activeTab.value === 'items') {
    if (!myLoading.value) {
      loadMyItems()
    }
  } else if (activeTab.value === 'comments') {
    if (!commentLoading.value && !commentRefreshing.value) {
      loadMyComments({ force: false })
    }
  } else if (activeTab.value === 'follows') {
    if (!followLoading.value) {
      loadFollowUnreadItems(true)
    }
  }

  setupArticleAutoRefreshTimer()
  setupCommentAutoRefreshTimer()
})

onBeforeUnmount(() => {
  rememberAllScrollPosition()
  clearArticleTimer()
  clearCommentTimer()
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', onWindowScroll)
  }
})
</script>

<style>
.nut-bottom-nav-page {
  background: #fff;
}

.nut-bottom-nav-page__content {
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
}

.nut-bottom-nav-page__all-section {
  min-height: 260px;
}

.nut-bottom-nav-page__hint {
  margin: 2px 6px 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #fff8e1;
  color: #9a3412;
  font-size: 12px;
}

.nut-bottom-nav-page__cards {
  padding-bottom: 10px;
}

.recommendation-section {
  margin-inline: 2px;
}

.recommendation-carousel {
  border-radius: 18px;
  overflow: hidden;
}

.recommendation-carousel__image {
  height: 100%;
}

.recommendation-carousel__overlay {
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.12) 0%, rgba(15, 23, 42, 0.82) 100%);
}

.recommendation-carousel__actions {
  position: relative;
  z-index: 3;
  pointer-events: auto;
}

.recommendation-carousel__action-btn {
  position: relative;
  z-index: 3;
  pointer-events: auto;
}

.recommendation-carousel__action-btn--comment :deep(.q-btn__content) {
  gap: 2px;
}

.recommendation-carousel__title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.list-search {
  width: 100%;
  padding: 0 2px;
}

.list-search__input {
  width: 100%;
}

.list-search :deep(.q-field__control) {
  border-radius: 10px;
}

.my-items-search {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 0 2px;
}

.my-items-search__input {
  flex: 1;
  min-width: 0;
}

.my-items-search :deep(.q-field) {
  width: 100%;
}

.my-items-search :deep(.q-field__control) {
  border-radius: 10px;
}

.my-items-search__publish {
  flex-shrink: 0;
  min-width: 88px;
  margin-left: auto;
}

.nut-bottom-nav-page__empty {
  padding: 24px 10px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}

.nut-bottom-nav-page__error {
  margin: 8px 10px 0;
  color: #ef4444;
  font-size: 12px;
}

.nut-bottom-nav-page__status-banner {
  margin: 8px 2px 0;
}

.nut-bottom-nav-page__status-banner--error {
  color: #b42318;
  background: #fef3f2;
}

.nut-bottom-nav-page__profile-wrap {
  display: flex;
  justify-content: center;
}

.my-comment-item {
  border-bottom: 1px solid #eef2f7;
}

.nut-bottom-nav-page :deep(.nut-tabbar-item__title) {
  font-size: 13px;
}

.delete-dialog {
  width: min(84vw, 360px);
  border-radius: 18px;
}

@media (max-width: 600px) {
  .my-comment-item :deep(.q-item__label) {
    font-size: 15px;
  }
}
</style>
