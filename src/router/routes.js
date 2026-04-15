const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },

      { path: 'auth/login', component: () => import('pages/auth/LoginPage.vue') },
      { path: 'auth/register', component: () => import('pages/auth/RegisterPage.vue') },

      { path: 'app', component: () => import('pages/app/AppShellPage.vue') },
      { path: 'profile/settings', component: () => import('pages/profile/SettingsPage.vue') },

      {
        path: 'articles/new',
        component: () => import('pages/article/ArticleEditorPage.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'articles/:itemId/edit',
        component: () => import('pages/article/ArticleEditorPage.vue'),
        meta: { requiresAuth: true }
      },
      { path: 'articles/:itemId', component: () => import('pages/article/ArticleDetailPage.vue') },
      { path: 'articles/:itemId/comments', component: () => import('pages/comment/ArticleCommentsPage.vue') },
      { path: 'authors/:userUuid/articles', component: () => import('pages/article/AuthorArticlePage.vue') }
    ]
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
