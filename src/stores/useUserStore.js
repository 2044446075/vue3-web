import { defineStore } from 'pinia'
import {
  getBriefProfileApi,
  getInfoApi,
  getMyProfile,
  updatePasswordApi,
  updateProfileApi
} from 'src/api/profile.js'
import { loginApi, logoutApi } from 'src/api/auth.js'
import { getMyComments } from 'src/api/comments.js'
import { getMyItems } from 'src/api/articles.js'

export const useUserStore = defineStore('user', {
  state: () => ({
    name: '吴秀东',
    number: '23211860236',
    token: '',
    isLoggedIn: false,
    profileAuth: null,
    profileDetail: null,
    age: 21,
    sex: '男'
  }),
  actions: {
    clearSession() {
      this.token = ''
      this.isLoggedIn = false
      this.profileAuth = null
      this.profileDetail = null
    },
    async handleLogin(loginForm) {
      const res = await loginApi(loginForm)
      const token = res.data?.access_token || res.data?.token
      if (!token) {
        throw new Error('Missing token from login response')
      }
      this.token = token
      this.isLoggedIn = true
      try {
        await this.getUserInfo()
      } catch (error) {
        this.clearSession()
        throw error
      }
    },
    async getUserInfo() {
      const authRes = await getInfoApi()
      this.profileAuth = authRes.data
      try {
        const detailRes = await getBriefProfileApi()
        this.profileDetail = detailRes.data
        if (detailRes.data?.name) {
          this.name = detailRes.data.name
        }
        await this.refreshCounts()
      } catch {
        this.profileDetail = null
      }
      return this.profileAuth
    },
    async refreshCounts() {
      const uuid = this.profileDetail?.uuid || this.profileAuth?.id
      if (!uuid) {
        return
      }
      let itemCount = this.profileDetail?.item_count ?? 0
      let commentCount = this.profileDetail?.comment_count ?? 0

      let profileData = null
      try {
        const profileRes = await getMyProfile()
        profileData = profileRes.data || null
      } catch {
        profileData = null
      }

      if (profileData) {
        if (Array.isArray(profileData.items)) {
          itemCount = profileData.items.length
        }
        if (Array.isArray(profileData.comments)) {
          commentCount = profileData.comments.length
        }
        if (typeof profileData.item_count === 'number') {
          itemCount = profileData.item_count
        }
        if (typeof profileData.comment_count === 'number') {
          commentCount = profileData.comment_count
        }
      } else {
        try {
          const itemsRes = await getMyItems(uuid)
          if (Array.isArray(itemsRes.data)) {
            itemCount = itemsRes.data.length
          }
        } catch (error) {
          if (error.response?.status === 404) {
            itemCount = 0
          }
        }
        try {
          const commentsRes = await getMyComments()
          if (Array.isArray(commentsRes.data)) {
            commentCount = commentsRes.data.length
          }
        } catch (error) {
          if (error.response?.status === 404) {
            commentCount = 0
          }
        }
      }

      if (this.profileDetail) {
        this.profileDetail = {
          ...this.profileDetail,
          item_count: itemCount,
          comment_count: commentCount
        }
      }
    },
    async updateProfile({ name, avatar }) {
      const res = await updateProfileApi({ name, avatar })
      this.profileDetail = res.data
      if (res.data?.name) {
        this.name = res.data.name
      }
      try {
        const detailRes = await getBriefProfileApi()
        this.profileDetail = detailRes.data
      } catch {
        // ignore refresh errors
      }
      await this.refreshCounts()
      return res.data
    },
    async updatePassword(password) {
      await updatePasswordApi(password)
    },
    async handleLogout() {
      try {
        await logoutApi()
      } finally {
        this.clearSession()
      }
    },
    updatesex(sex) {
      this.sex = sex
    },
    updateage(age) {
      this.age = age
    },
    resetdata() {
      this.name = '吴秀东'
      this.number = '23211860236'
      this.age = 21
      this.sex = '男'
    }
  },
  persist: true
})
