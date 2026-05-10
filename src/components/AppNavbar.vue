<template>
  <nav class="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl">
    <div class="bg-dark-card/85 backdrop-blur-xl border border-white/10 rounded-3xl px-5 py-3 flex items-center justify-between gap-3">

      <!-- Logo -->
      <router-link to="/dashboard" class="font-display font-extrabold text-xl text-white flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
        Skill<span class="text-red-500">Via</span>
      </router-link>

      <!-- Nav links -->
      <div class="hidden md:flex items-center gap-0.5 flex-1 justify-center">
        <router-link v-for="l in navLinks" :key="l.to" :to="l.to"
          class="px-4 py-2 rounded-2xl text-sm font-medium text-white/50 hover:text-white hover:bg-red-600/10 transition-all duration-150"
          active-class="!text-white !bg-red-600/15 !text-red-300">
          {{ l.label }}
        </router-link>
      </div>

      <!-- Right -->
      <div class="flex items-center gap-2 shrink-0">

        <!-- Premium badge OR quota indicator -->
        <template v-if="auth.isPremium">
          <div class="hidden sm:flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 rounded-2xl cursor-default">
            <span class="text-xs">⭐</span>
            <span class="text-xs font-bold text-amber-400">Premium</span>
          </div>
        </template>
        <template v-else>
          <!-- Quota pill — turns red when low -->
          <router-link to="/premium"
            :class="['hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border transition-all hover:scale-105',
              auth.matchQuota <= 3
                ? 'bg-red-500/15 border-red-500/30 text-red-400'
                : 'bg-white/5 border-white/10 text-white/50 hover:text-white']">
            <span class="text-xs">🤝</span>
            <span class="text-xs font-semibold">{{ auth.matchQuota }}/15</span>
          </router-link>
        </template>

        <!-- XP -->
        <div class="hidden lg:flex items-center gap-1.5 bg-red-600/10 border border-red-600/20 px-3 py-1.5 rounded-2xl cursor-default">
          <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse-slow"></span>
          <span class="text-xs font-semibold text-red-400">{{ auth.user?.xp_points ?? 0 }} XP</span>
        </div>

        <!-- Notification bell -->
        <div class="relative" ref="notifRef">
          <button @click="notifOpen = !notifOpen"
            class="relative w-9 h-9 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-colors text-white/60 hover:text-white">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
            <span v-if="unreadCount > 0"
              class="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-[9px] text-white font-bold flex items-center justify-center">
              {{ unreadCount > 9 ? '9+' : unreadCount }}
            </span>
          </button>

          <!-- Notification dropdown -->
          <div v-if="notifOpen"
            class="absolute right-0 top-11 w-80 bg-dark-card border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-fade-in z-50">
            <div class="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span class="font-semibold text-white text-sm">Notifikasi</span>
              <button @click="markAllRead" class="text-xs text-red-400 hover:text-red-300 transition-colors">Semua dibaca</button>
            </div>
            <div class="max-h-72 overflow-y-auto scrollbar-hide">
              <p v-if="!notifications.length" class="px-4 py-6 text-center text-white/30 text-sm">Belum ada notifikasi</p>
              <div v-for="n in notifications" :key="n.id" @click="readNotif(n)"
                :class="['px-4 py-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors flex gap-3',
                  !n.read_at ? 'bg-red-600/5' : '']">
                <span class="text-xl shrink-0">{{ notifIcon(n.type) }}</span>
                <div class="flex-1 min-w-0">
                  <p class="text-white text-xs font-semibold">{{ n.title }}</p>
                  <p class="text-white/40 text-xs mt-0.5 line-clamp-2">{{ n.body }}</p>
                  <p class="text-white/20 text-[10px] mt-1">{{ timeAgo(n.created_at) }}</p>
                </div>
                <span v-if="!n.read_at" class="w-2 h-2 bg-red-500 rounded-full mt-1.5 shrink-0"></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Avatar dropdown -->
        <div class="relative" ref="dropRef">
          <button @click="dropOpen = !dropOpen"
            class="flex items-center gap-2 p-1 rounded-2xl hover:bg-white/5 transition-colors group">
            <img :src="auth.user?.avatar_url" :alt="auth.user?.name"
              class="w-8 h-8 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-red-500 transition-all"/>
          </button>
          <div v-if="dropOpen"
            class="absolute right-0 top-12 w-56 bg-dark-card border border-white/10 rounded-2xl p-2 shadow-xl animate-fade-in z-50">
            <div class="px-3 py-2 mb-1 border-b border-white/10">
              <p class="text-white text-sm font-semibold truncate">{{ auth.user?.name }}</p>
              <div class="flex items-center gap-1.5 mt-0.5">
                <p class="text-white/30 text-xs">{{ auth.user?.level_name }} · Lv.{{ auth.user?.level }}</p>
                <span v-if="auth.isPremium" class="text-amber-400 text-[10px] font-bold">⭐ Premium</span>
              </div>
            </div>
            <router-link v-for="l in dropLinks" :key="l.to" :to="l.to" @click="dropOpen=false"
              class="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/60 hover:text-white hover:bg-red-600/10 transition-all">
              {{ l.label }}
            </router-link>
            <div v-if="auth.isAdmin">
              <div class="border-t border-white/10 my-1"></div>
              <router-link to="/admin" @click="dropOpen=false"
                class="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-amber-400 hover:bg-amber-500/10 transition-all">
                ⚙️ Admin Panel
              </router-link>
            </div>
            <div class="border-t border-white/10 my-1"></div>
            <button @click="doLogout"
              class="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all text-left">
              Logout
            </button>
          </div>
        </div>

        <!-- Mobile menu -->
        <button @click="mobileOpen=!mobileOpen" class="md:hidden p-2 rounded-xl hover:bg-white/5 transition-colors">
          <div class="space-y-1">
            <div class="w-5 h-0.5 bg-white/70 rounded-full"></div>
            <div class="w-5 h-0.5 bg-white/70 rounded-full"></div>
            <div class="w-3 h-0.5 bg-white/70 rounded-full"></div>
          </div>
        </button>
      </div>
    </div>

    <!-- Mobile drawer -->
    <div v-if="mobileOpen"
      class="mt-2 bg-dark-card/95 backdrop-blur border border-white/10 rounded-3xl p-3 md:hidden animate-fade-in">
      <router-link v-for="l in navLinks" :key="l.to" :to="l.to" @click="mobileOpen=false"
        class="block px-4 py-3 rounded-2xl text-sm font-medium text-white/60 hover:text-white hover:bg-red-600/10 transition-all"
        active-class="!text-red-300 !bg-red-600/15">
        {{ l.label }}
      </router-link>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const auth   = useAuthStore()
const router = useRouter()

const dropOpen   = ref(false)
const notifOpen  = ref(false)
const mobileOpen = ref(false)
const dropRef    = ref(null)
const notifRef   = ref(null)
const notifications = ref([])
const unreadCount   = ref(0)

const navLinks = [
  { to:'/dashboard',  label:'Dashboard'   },
  { to:'/matching',   label:'Cari Match'  },
  { to:'/chat',       label:'Chat'        },
  { to:'/sessions',   label:'Sesi'        },
  { to:'/leaderboard',label:'Leaderboard' },
  { to:'/rewards',    label:'Reward XP'   },
  { to:'/premium',    label:'⭐ Premium'  },
]

const dropLinks = [
  { to:'/profile', label:'Profil Saya' },
  { to:'/premium', label:'⭐ Premium'  },
  { to:'/reports', label:'Laporan'     },
]

async function loadNotifications() {
  try {
    const [nR, cR] = await Promise.all([
      api.get('/notifications'),
      api.get('/notifications/unread'),
    ])
    notifications.value = nR.data
    unreadCount.value   = cR.data.count
  } catch {}
}

async function readNotif(n) {
  if (!n.read_at) {
    await api.put(`/notifications/${n.id}/read`)
    n.read_at = new Date().toISOString()
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  }
  if (n.data?.exchange_id) router.push(`/chat/${n.data.exchange_id}`)
  notifOpen.value = false
}

async function markAllRead() {
  await api.put('/notifications/read-all')
  notifications.value.forEach(n => n.read_at = new Date().toISOString())
  unreadCount.value = 0
}

function notifIcon(t) {
  const m = {
    exchange_request:'🤝', exchange_accepted:'✅', exchange_rejected:'❌',
    exchange_completed:'🎓', session_scheduled:'📅', badge_earned:'🏅',
    rating_received:'⭐', xp_earned:'✨', xp_redeemed:'🎁',
    admin_warning:'⚠️', admin_ban:'🚫', admin_broadcast:'📢',
    report_resolved:'📋', quiz_created:'📝', certificate_issued:'🎓',
    premium_activated:'⭐', quiz_needs_approval:'✅',
  }
  return m[t] || '🔔'
}

function timeAgo(d) {
  const mins = Math.floor((Date.now() - new Date(d)) / 60000)
  if (mins < 1)  return 'Baru saja'
  if (mins < 60) return `${mins}m lalu`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}j lalu`
  return `${Math.floor(hrs / 24)}h lalu`
}

async function doLogout() {
  await auth.logout()
  router.push('/login')
}

function onOutsideClick(e) {
  if (dropRef.value  && !dropRef.value.contains(e.target))  dropOpen.value  = false
  if (notifRef.value && !notifRef.value.contains(e.target)) notifOpen.value = false
}

let pollInterval
onMounted(async () => {
  await loadNotifications()
  pollInterval = setInterval(loadNotifications, 20000)
  document.addEventListener('click', onOutsideClick)
})
onUnmounted(() => {
  clearInterval(pollInterval)
  document.removeEventListener('click', onOutsideClick)
})
</script>
