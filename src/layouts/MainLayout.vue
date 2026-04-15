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
        <q-item-label header>Vue3 作业</q-item-label>

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
import EssentialLink from 'components/EssentialLink.vue'

const linksList = [
  {
    title: '第一周',
    icon: 'date_range',
    children: [
      {
        title: '作业 1.1',
        caption: 'Pinia 状态管理与模块化',
        icon: 'settings',
        link: '/week01/Work01'
      },
      {
        title: '作业 1.2',
        caption: 'Axios 登录/登出与用户信息',
        icon: 'settings',
        link: '/week01/Work02'
      }
    ]
  },
  {
    title: '第二周',
    icon: 'extension',
    children: [
      {
        title: '作业 2.1',
        caption: 'NutUI 登录与 Token Toast',
        icon: 'apps',
        link: '/week02/Work01'
      },
      {
        title: '作业 2.2',
        caption: 'NutUI 路由与个人信息页',
        icon: 'person',
        link: '/week02/Work02'
      },
      {
        title: '作业 2.3',
        caption: '图片上传组件与二次封装',
        icon: 'image',
        link: '/week02/Work03'
      }
    ]
  },
  {
    title: '第三周',
    icon: 'badge',
    children: [
      {
        title: '作业 3.1',
        caption: '完善个人信息页',
        icon: 'person',
        link: '/week03/Work01'
      },
      {
        title: '作业 3.2',
        caption: '注册页与表单校验',
        icon: 'person_add',
        link: '/week03/Work02'
      }
    ]
  },
  {
    title: '第四周',
    icon: 'dashboard',
    children: [
      {
        title: '作业 4.1',
        caption: '底部导航与页面替换',
        icon: 'view_quilt',
        link: '/week04/Work01'
      },
      {
        title: '作业 4.2',
        caption: '卡片文章列表与参数设置',
        icon: 'tune',
        link: '/week04/Work02'
      }
    ]
  },
  {
    title: '第五周',
    icon: 'forum',
    children: [
      {
        title: '作业 5.1',
        caption: '文章评论与我的评论页面',
        icon: 'comment',
        link: '/week05/Work01'
      }
    ]
  },
  {
    title: '第六周',
    icon: 'article',
    children: [
      {
        title: '作业 6.2',
        caption: '文章发布、编辑与详情查看',
        icon: 'edit_note',
        link: '/week06/Work01'
      }
    ]
  }
]

const leftDrawerOpen = ref(false)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>
