import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  const user  = ref(JSON.parse(localStorage.getItem('sv_user') || 'null'))
  const token = ref(localStorage.getItem('sv_token') || null)

  const isAuth      = computed(() => !!token.value)
  const isAdmin     = computed(() => !!user.value?.is_admin)
  const isPremium   = computed(() => !!user.value?.is_premium_active)
  const homeRoute   = computed(() => user.value?.is_admin ? '/admin' : '/dashboard')
  const matchQuota  = computed(() => user.value?.match_quota_remaining ?? 15)

  const xpPercent = computed(() => {
    if (!user.value) return 0
    const lvl  = user.value.level || 1
    const base = (lvl - 1) * 100
    return Math.min(100, ((user.value.xp_points - base) / 100) * 100)
  })

  function persist() {
    localStorage.setItem('sv_user',  JSON.stringify(user.value))
    localStorage.setItem('sv_token', token.value)
  }

  async function login(email, password) {
    const { data } = await api.post('/login', { email, password })
    user.value  = data.user
    token.value = data.token
    persist()
    return data
  }

  async function register(payload) {
    const { data } = await api.post('/register', payload)
    user.value  = data.user
    token.value = data.token
    persist()
    return data
  }

  async function logout() {
    try { await api.post('/logout') } catch {}
    user.value  = null
    token.value = null
    localStorage.removeItem('sv_user')
    localStorage.removeItem('sv_token')
  }

  async function refreshUser() {
    const { data } = await api.get('/me')
    user.value = data
    localStorage.setItem('sv_user', JSON.stringify(data))
    return data
  }

  return {
    user, token,
    isAuth, isAdmin, isPremium, homeRoute, matchQuota, xpPercent,
    login, register, logout, refreshUser,
  }
})
