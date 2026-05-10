<template>
  <div class="min-h-screen bg-dark pt-24 pb-16 px-4">
    <div class="max-w-6xl mx-auto">

      <div v-if="loading" class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div v-for="i in 8" :key="i" class="bento-muted h-36 animate-pulse rounded-3xl"></div>
      </div>

      <template v-else>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-auto">

          <!-- Greeting + XP -->
          <div class="bento-dark noise col-span-2 p-6 flex flex-col justify-between min-h-[180px] border border-white/10">
            <div>
              <p class="text-white/40 text-sm">Halo, kembali lagi 👋</p>
              <h1 class="font-display text-3xl font-extrabold text-white mt-1 truncate">{{ auth.user?.name }}</h1>
              <p class="text-white/30 text-xs mt-0.5 flex items-center gap-2">
                {{ auth.user?.institution }}
                <span v-if="auth.isPremium" class="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  ⭐ {{ auth.user?.premium_plan?.toUpperCase() }}
                </span>
              </p>
            </div>
            <div class="mt-4">
              <div class="flex justify-between text-xs mb-1.5">
                <span class="text-red-400 font-semibold">{{ auth.user?.level_name }} · Lv.{{ auth.user?.level }}</span>
                <span class="text-white/30">{{ stats?.xp_to_next ?? 100 }} XP lagi</span>
              </div>
              <div class="xp-bar"><div class="xp-fill" :style="{width: auth.xpPercent+'%'}"></div></div>
            </div>
          </div>

          <!-- Total Exchange -->
          <div class="bento-red noise p-5 flex flex-col justify-between">
            <span class="text-white/70 text-xs font-semibold uppercase tracking-wider">Total Exchange</span>
            <div>
              <div class="font-display text-4xl font-extrabold text-white">{{ stats?.total_exchanges ?? 0 }}</div>
              <div class="text-white/60 text-xs mt-1">{{ stats?.completed ?? 0 }} selesai</div>
            </div>
          </div>

          <!-- Pending requests -->
          <div @click="goToChat"
            class="bento-white p-5 flex flex-col justify-between cursor-pointer hover:bg-red-50 transition-colors">
            <span class="text-dark/40 text-xs font-semibold uppercase tracking-wider">Permintaan Masuk</span>
            <div>
              <div class="font-display text-4xl font-extrabold text-dark">{{ stats?.pending_requests ?? 0 }}</div>
              <div class="text-dark/50 text-xs mt-1">menunggu responmu</div>
            </div>
          </div>

          <!-- Match Quota / Premium bento -->
          <div v-if="auth.isPremium"
            class="col-span-2 p-5 rounded-3xl flex items-center gap-4"
            style="background:linear-gradient(135deg,#92400e,#d97706,#f59e0b);background-size:200% 200%">
            <div class="text-4xl">⭐</div>
            <div class="flex-1">
              <p class="text-amber-900 font-display font-bold text-lg">Premium Aktif</p>
              <p class="text-amber-800 text-xs">{{ auth.user?.premium_plan?.toUpperCase() }} — Berlaku hingga {{ formatDate(stats?.premium_expires_at) }}</p>
              <p class="text-amber-800/70 text-xs mt-0.5">Match tidak terbatas · Badge eksklusif · XP 2x</p>
            </div>
            <router-link to="/premium" class="bg-amber-900/20 hover:bg-amber-900/30 text-amber-900 font-bold text-xs px-4 py-2 rounded-xl transition-colors shrink-0">
              Kelola →
            </router-link>
          </div>

          <div v-else class="col-span-2 bento-dark border border-white/10 p-5 flex items-center gap-4">
            <div class="flex-1">
              <p class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1">Match Gratis Bulan Ini</p>
              <div class="flex items-center gap-3">
                <div class="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div :class="['h-full rounded-full transition-all duration-500',
                    (stats?.match_quota_remaining ?? 15) <= 3 ? 'bg-red-500' : 'bg-red-400']"
                    :style="{width: Math.max(0,((stats?.match_quota_remaining ?? 15)/15)*100)+'%'}"></div>
                </div>
                <span :class="['font-bold text-sm', (stats?.match_quota_remaining ?? 15) <= 3 ? 'text-red-400' : 'text-white']">
                  {{ stats?.match_quota_remaining ?? 15 }}/15
                </span>
              </div>
              <p class="text-white/25 text-xs mt-1">Reset tiap tanggal 1</p>
            </div>
            <router-link to="/premium" class="btn-primary !text-xs !px-4 !py-2 shrink-0">
              ⭐ Upgrade
            </router-link>
          </div>

          <!-- Active exchanges -->
          <div class="bento-dark col-span-2 p-5 border border-white/10">
            <div class="flex items-center justify-between mb-4">
              <span class="text-white/50 text-xs font-semibold uppercase tracking-wider">Exchange Aktif</span>
              <button @click="goToChat" class="text-red-400 text-xs hover:text-red-300 transition-colors">lihat semua →</button>
            </div>
            <div v-if="exchanges.length" class="space-y-2">
              <div v-for="ex in exchanges.slice(0,3)" :key="ex.id"
                @click="goToExchange(ex)"
                class="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-2xl p-3 cursor-pointer transition-all group">
                <img :src="getPartner(ex)?.avatar_url" class="w-9 h-9 rounded-full object-cover shrink-0"/>
                <div class="flex-1 min-w-0">
                  <p class="text-white text-sm font-medium truncate group-hover:text-red-300 transition-colors">
                    {{ getPartner(ex)?.name }}
                  </p>
                  <p class="text-white/40 text-xs truncate">{{ ex.offer_skill?.name }} ↔ {{ ex.want_skill?.name }}</p>
                </div>
                <span :class="statusClass(ex.status)" class="text-xs px-2.5 py-1 rounded-full shrink-0 font-medium">
                  {{ statusLabel(ex.status) }}
                </span>
              </div>
            </div>
            <div v-else class="text-center py-4">
              <p class="text-white/30 text-sm mb-3">Belum ada exchange aktif.</p>
              <router-link to="/matching" class="btn-primary !text-xs">Cari Partner →</router-link>
            </div>
          </div>

          <!-- Pending exchange actions -->
          <div v-if="pendingExchanges.length" class="bento-muted border border-amber-500/20 p-5 col-span-2">
            <div class="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">Butuh Responmu ⚡</div>
            <div class="space-y-2">
              <div v-for="ex in pendingExchanges.slice(0,2)" :key="ex.id"
                class="bg-white/5 rounded-2xl p-3">
                <div class="flex items-center gap-2 mb-2">
                  <img :src="ex.requester?.avatar_url" class="w-8 h-8 rounded-xl object-cover"/>
                  <div class="flex-1 min-w-0">
                    <p class="text-white text-xs font-semibold truncate">{{ ex.requester?.name }}</p>
                    <p class="text-white/40 text-[11px]">{{ ex.offer_skill?.name }} ↔ {{ ex.want_skill?.name }}</p>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button @click="acceptEx(ex.id)"
                    class="flex-1 py-1.5 bg-green-600/20 text-green-400 hover:bg-green-600/40 rounded-xl text-xs font-semibold transition-colors">
                    Terima ✓
                  </button>
                  <button @click="rejectEx(ex.id)"
                    class="flex-1 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/40 rounded-xl text-xs font-semibold transition-colors">
                    Tolak ✗
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Upcoming sessions -->
          <div class="bento-white col-span-2 p-5">
            <div class="text-dark/40 text-xs font-semibold uppercase tracking-wider mb-4">Sesi Mendatang 📅</div>
            <div v-if="upcomingSessions.length" class="space-y-3">
              <div v-for="sess in upcomingSessions.slice(0,2)" :key="sess.id"
                class="flex items-center gap-3">
                <div class="bg-red-600 rounded-2xl px-3 py-2 text-center min-w-[52px] shrink-0">
                  <div class="font-display font-black text-xl text-white leading-none">{{ getDay(sess.scheduled_at) }}</div>
                  <div class="text-red-200 text-[10px] font-semibold">{{ getMonth(sess.scheduled_at) }}</div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-dark text-sm truncate">
                    {{ sess.exchange?.offer_skill?.name }} ↔ {{ sess.exchange?.want_skill?.name }}
                  </p>
                  <p class="text-dark/50 text-xs">
                    {{ getPartnerFromSess(sess)?.name }} · {{ sess.location || 'TBD' }} · {{ getTime(sess.scheduled_at) }}
                  </p>
                </div>
                <router-link :to="`/chat/${sess.exchange_id}`" class="btn-primary !text-xs !px-3 !py-1.5 shrink-0">
                  Chat
                </router-link>
              </div>
            </div>
            <div v-else class="flex items-center justify-between">
              <p class="text-dark/40 text-sm">Belum ada sesi terjadwal.</p>
              <router-link to="/matching" class="btn-primary !text-xs">Cari Partner</router-link>
            </div>
          </div>

          <!-- Badges -->
          <div class="bento-red noise p-5">
            <p class="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3">Badge</p>
            <div class="flex flex-wrap gap-2">
              <div v-for="b in myBadges.slice(0,5)" :key="b.id"
                class="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-lg transition-colors cursor-default"
                :title="b.name">
                {{ badgeIcon(b.icon) }}
              </div>
              <div v-if="!myBadges.length" class="text-white/40 text-xs">Belum ada badge</div>
            </div>
            <p class="text-white/40 text-xs mt-3">{{ stats?.badges_count ?? 0 }}/5 badge</p>
          </div>

          <!-- Certs -->
          <div class="bento-dark p-5 border border-white/10 hover:border-white/20 transition-colors">
            <div class="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Sertifikat 🎓</div>
            <div class="font-display text-4xl font-extrabold text-white">{{ stats?.certificates_count ?? 0 }}</div>
            <div class="text-white/30 text-xs mt-1">diterbitkan</div>
            <router-link to="/profile"
              class="text-red-400 text-xs font-semibold mt-3 block hover:text-red-300 transition-colors">
              Lihat semua →
            </router-link>
          </div>

          <!-- Find match CTA -->
          <div class="bento-red col-span-2 noise p-6 flex items-center justify-between">
            <div>
              <p class="text-white/70 text-sm font-semibold">Temukan partner belajarmu</p>
              <h3 class="font-display text-2xl font-extrabold text-white mt-1">Cari Match Sekarang</h3>
            </div>
            <router-link to="/matching" class="btn-white shrink-0 hover:bg-red-50 transition-colors">
              Cari →
            </router-link>
          </div>

          <!-- Suggestions -->
          <div class="bento-muted border border-white/5 col-span-2 md:col-span-4 p-5">
            <div class="flex items-center justify-between mb-4">
              <span class="text-white/50 text-xs font-semibold uppercase tracking-wider">Saran untuk Kamu</span>
              <span class="text-white/20 text-xs">Berdasarkan skill yang ingin kamu pelajari</span>
            </div>
            <div v-if="suggestions.length" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <router-link v-for="u in suggestions" :key="u.id" :to="`/profile/${u.id}`"
                class="flex flex-col items-center gap-2 bg-white/5 hover:bg-red-600/10 border border-transparent hover:border-red-600/20 rounded-2xl p-3 text-center transition-all group">
                <div class="relative">
                  <img :src="u.avatar_url" class="w-12 h-12 rounded-2xl object-cover group-hover:ring-2 group-hover:ring-red-500 transition-all"/>
                  <span v-if="u.is_premium_active" class="absolute -top-1 -right-1 text-xs">⭐</span>
                </div>
                <p class="text-white text-xs font-medium truncate w-full">{{ u.name }}</p>
                <div v-if="u.avg_rating" class="flex items-center gap-1">
                  <span class="text-amber-400 text-xs">★</span>
                  <span class="text-white/40 text-xs">{{ Number(u.avg_rating).toFixed(1) }}</span>
                </div>
                <div class="flex flex-wrap gap-1 justify-center">
                  <span v-for="s in u.skill_offers?.slice(0,2)" :key="s.id"
                    class="text-[9px] bg-red-600/20 text-red-300 px-1.5 py-0.5 rounded-full">
                    {{ s.skill?.name }}
                  </span>
                </div>
              </router-link>
            </div>
            <p v-else class="text-white/30 text-sm">Tambahkan skill want di profil untuk mendapat saran partner.</p>
          </div>

        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const auth   = useAuthStore()
const router = useRouter()
const toast  = useToast()

const loading          = ref(true)
const stats            = ref(null)
const exchanges        = ref([])
const pendingExchanges = ref([])
const upcomingSessions = ref([])
const myBadges         = ref([])
const suggestions      = ref([])

onMounted(async () => {
  try {
    await auth.refreshUser()
    const [sRes, eRes, sessRes, bRes, sugRes] = await Promise.all([
      api.get('/dashboard/stats'),
      api.get('/exchanges'),
      api.get('/sessions'),
      api.get('/badges/my'),
      api.get('/users/suggestions'),
    ])
    stats.value            = sRes.data
    const allEx            = eRes.data
    exchanges.value        = allEx.filter(e => e.status === 'accepted')
    pendingExchanges.value = allEx.filter(e => e.status === 'pending' && e.provider_id === auth.user?.id)
    const now              = new Date()
    upcomingSessions.value = sessRes.data
      .filter(s => s.status === 'scheduled' && new Date(s.scheduled_at) > now)
      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
    myBadges.value    = bRes.data
    suggestions.value = sugRes.data
  } catch(e) { console.error(e) }
  finally { loading.value = false }
})

async function acceptEx(id) {
  await api.put(`/exchanges/${id}/accept`)
  toast.success('Exchange diterima! +20 XP 🎉')
  pendingExchanges.value = pendingExchanges.value.filter(e => e.id !== id)
  const r = await api.get('/exchanges')
  exchanges.value = r.data.filter(e => e.status === 'accepted')
  stats.value     = (await api.get('/dashboard/stats')).data
  await auth.refreshUser()
}

async function rejectEx(id) {
  await api.put(`/exchanges/${id}/reject`)
  pendingExchanges.value = pendingExchanges.value.filter(e => e.id !== id)
  toast.info('Exchange ditolak.')
}

function getPartner(ex)        { return ex.requester_id === auth.user?.id ? ex.provider : ex.requester }
function getPartnerFromSess(s) { const ex = s.exchange; return ex?.requester_id === auth.user?.id ? ex?.provider : ex?.requester }
function goToChat()            { router.push('/chat') }
function goToExchange(ex)      { router.push(`/chat/${ex.id}`) }

function statusClass(s) {
  return {
    pending:   'bg-amber-500/20 text-amber-400',
    accepted:  'bg-green-500/20 text-green-400',
    completed: 'bg-blue-500/20 text-blue-400',
    rejected:  'bg-red-500/20 text-red-400',
    cancelled: 'bg-white/10 text-white/40',
  }[s] || 'bg-white/10 text-white/40'
}

function statusLabel(s) {
  return { pending:'Menunggu', accepted:'Aktif', completed:'Selesai', rejected:'Ditolak', cancelled:'Batal' }[s] || s
}

function getDay(d)    { return new Date(d).getDate() }
function getMonth(d)  { return new Date(d).toLocaleDateString('id-ID', { month:'short' }) }
function getTime(d)   { return new Date(d).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' }) }
function formatDate(d){ return d ? new Date(d).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' }) : '' }
function badgeIcon(i) { return { star:'⭐', book:'📚', compass:'🧭', academic:'🎓', trophy:'🏆' }[i] || '🏅' }
</script>
