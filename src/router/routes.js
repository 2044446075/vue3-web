const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },

      { path: 'week01/Work01', component: () => import('pages/week01/ChildModule.vue') },
      { path: 'week01/Work02', component: () => import('pages/week01/UserLogin.vue') },

      { path: 'week02/Work01', component: () => import('pages/week02/NutLogin.vue') },
      { path: 'week02/Work02', component: () => import('pages/week02/NutProfile.vue') },
      { path: 'week02/Work03', component: () => import('pages/week02/NutUpload.vue') },

      {
        path: 'week03/Work01',
        component: () => import('pages/week03/MyProfile.vue'),
        meta: { requiresAuth: true }
      },
      { path: 'week03/Work02', component: () => import('pages/week03/MyRegister.vue') },

      { path: 'week04/Work01', component: () => import('pages/week04/NutBottomNav.vue') },
      { path: 'week04/Work02', component: () => import('pages/week04/NutSettings.vue') },
      { path: 'week04/Work03/:itemId', component: () => import('pages/week05/NutItemComments.vue') },

      { path: 'week05/Work01', component: () => import('pages/week04/NutBottomNav.vue') },
      { path: 'week05/Work02', component: () => import('pages/week04/NutSettings.vue') },
      { path: 'week05/Work03/:itemId', component: () => import('pages/week05/NutItemComments.vue') },

      { path: 'week06/Work01', component: () => import('pages/week04/NutBottomNav.vue') },
      {
        path: 'week06/Work02',
        component: () => import('pages/week06/NutItemEditor.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'week06/Work02/:itemId',
        component: () => import('pages/week06/NutItemEditor.vue'),
        meta: { requiresAuth: true }
      },
      { path: 'week06/Work03/:itemId', component: () => import('pages/week06/NutItemDetail.vue') },
      { path: 'week06/Work04/:userUuid', component: () => import('pages/week06/UserArticleList.vue') }
    ]
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes

