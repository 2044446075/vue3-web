<template>
  <q-card
    flat
    bordered
    :class="[
      'article-feed-card',
      'cursor-pointer',
      { 'article-feed-card--read': isRead }
    ]"
    @click="emit('article-click')"
  >
    <div class="relative-position">
      <q-img
        :src="item.coverUrl"
        :ratio="16 / 9"
        class="article-feed-card__cover"
        @error="emit('cover-error', $event)"
      />

      <q-badge
        v-if="showReadBadge"
        rounded
        :color="isRead ? 'grey-8' : 'deep-orange-5'"
        class="article-feed-card__badge"
      >
        {{ isRead ? '已读' : '未读' }}
      </q-badge>
    </div>

    <q-card-section class="q-pa-md">
      <div class="article-feed-card__title text-subtitle1 text-weight-medium text-grey-10">
        {{ item.title }}
      </div>

      <q-btn
        flat
        dense
        no-caps
        class="article-feed-card__author q-mt-xs q-px-none"
        color="grey-8"
        @click.stop="emit('author-click')"
      >
        {{ item.authorName }}
      </q-btn>

      <div class="row items-center q-col-gutter-sm q-mt-sm">
        <div class="col-auto">
          <q-btn
            flat
            round
            dense
            size="sm"
            class="q-pa-none"
            @click.stop="emit('author-click')"
          >
            <q-avatar size="28px">
              <img :src="item.authorAvatar" alt="作者头像" @error="emit('avatar-error', $event)" />
            </q-avatar>
          </q-btn>
        </div>

        <div class="col-auto text-caption text-grey-7">
          {{ item.publishDate }}
        </div>

        <div class="col"></div>

        <div class="col-auto row items-center no-wrap q-gutter-xs">
          <q-btn
            flat
            dense
            no-caps
            :disable="likePending"
            :color="isLiked ? 'deep-orange-6' : 'grey-7'"
            icon="thumb_up"
            class="article-feed-card__action-btn"
            @click.stop="emit('like-click')"
          >
            <span class="q-ml-xs">{{ item.starCount }}</span>
          </q-btn>

          <q-btn
            v-if="showDelete"
            flat
            dense
            round
            color="grey-7"
            icon="delete_outline"
            :disable="deleteDisabled"
            @click.stop="emit('delete-click')"
          />

          <q-btn
            flat
            dense
            no-caps
            color="grey-7"
            icon="chat_bubble_outline"
            class="article-feed-card__action-btn"
            @click.stop="emit('comment-click')"
          >
            <span class="q-ml-xs">{{ item.commentCount }}</span>
          </q-btn>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
defineOptions({
  inheritAttrs: false
})

defineProps({
  item: {
    type: Object,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isLiked: {
    type: Boolean,
    default: false
  },
  likePending: {
    type: Boolean,
    default: false
  },
  showReadBadge: {
    type: Boolean,
    default: false
  },
  showDelete: {
    type: Boolean,
    default: false
  },
  deleteDisabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'article-click',
  'author-click',
  'like-click',
  'comment-click',
  'delete-click',
  'cover-error',
  'avatar-error'
])
</script>

<style scoped>
.article-feed-card {
  width: 100%;
  display: block;
  border-radius: 14px;
  overflow: hidden;
}

.article-feed-card--read {
  opacity: 0.82;
}

.article-feed-card__cover {
  background: #f1f5f9;
}

.article-feed-card__badge {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
}

.article-feed-card__title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  line-height: 1.4;
}

.article-feed-card__author {
  min-height: auto;
}

.article-feed-card__action-btn :deep(.q-btn__content) {
  gap: 2px;
}
</style>
