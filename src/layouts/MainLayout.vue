<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title> Quasar App </q-toolbar-title>

        <div>Quasar v{{ $q.version }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header>Vue3 项目导航</q-item-label>

        <template v-for="menuItem in linksList" :key="menuItem.title">
          <q-expansion-item
            v-if="menuItem.children"
            :icon="menuItem.icon"
            :label="menuItem.title"
            :content-inset-level="0.5"
            expand-separator
          >
            <EssentialLink
              v-for="child in menuItem.children"
              :key="child.title"
              v-bind="child"
            />
          </q-expansion-item>

          <EssentialLink v-else v-bind="menuItem" />
        </template>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import EssentialLink from 'components/common/EssentialLink.vue'

const linksList = [
  {
    title: '认证',
    icon: 'badge',
    children: [
      {
        title: '登录',
        caption: '用户登录入口',
        icon: 'login',
        link: '/auth/login'
      },
      {
        title: '注册',
        caption: '用户注册入口',
        icon: 'person_add',
        link: '/auth/register'
      }
    ]
  },
  {
    title: '主业务',
    icon: 'dashboard',
    children: [
      {
        title: '应用首页',
        caption: '底部导航与文章流',
        icon: 'apps',
        link: '/app'
      },
      {
        title: '参数设置',
        caption: '自动刷新与间隔设置',
        icon: 'tune',
        link: '/profile/settings'
      },
      {
        title: '发布文章',
        caption: '文章创建与编辑入口',
        icon: 'edit_note',
        link: '/articles/new'
      }
    ]
  }
]

const leftDrawerOpen = ref(false)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>
