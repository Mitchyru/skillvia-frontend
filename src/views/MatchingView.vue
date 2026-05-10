<template>
  <div class="min-h-screen bg-dark pt-24 pb-16 px-4">
    <div class="max-w-6xl mx-auto">

      <!-- Header -->
      <div class="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 class="font-display text-4xl font-extrabold text-white">Cari <span class="text-red-500">Match</span></h1>
          <p class="text-white/40 mt-1">Partner yang bisa mengajarimu dan ingin belajar dari kamu.</p>
        </div>

        <!-- Quota indicator -->
        <div v-if="!auth.isPremium"
          :class="['flex items-center gap-3 px-4 py-3 rounded-2xl border',
            auth.matchQuota <= 3
              ? 'bg-red-500/10 border-red-500/20'
              : 'bg-white/5 border-white/10']">
          <div>
            <p :class="['text-xs font-bold', auth.matchQuota <= 3 ? 'text-red-400' : 'text-white/40']">
              {{ auth.matchQuota <= 3 ? '⚠️ Kuota Hampir Habis' : '🤝 Kuota Match' }}
            </p>
            <div class="flex items-center gap-2 mt-1">
              <div class="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div :class="['h-full rounded-full transition-all',
                    auth.matchQuota <= 3 ? 'bg-red-500' : 'bg-red-400']"
                  :style="{width: Math.max(0,(auth.matchQuota/15)*100)+'%'}"></div>
              </div>
              <span :class="['text-xs font-bold', auth.matchQuota <= 3 ? 'text-red-400' : 'text-white/60']">
                {{ auth.matchQuota }}/15
              </span>
            </div>
          </div>
          <router-link to="/premium" class="btn-primary !text-xs !px-3 !py-1.5 shrink-0">
            Upgrade →
          </router-link>
        </div>

        <div v-else class="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-2xl">
          <span class="text-amber-400 text-sm">⭐</span>
          <span class="text-amber-400 text-xs font-bold">Premium — Unlimited Match</span>
        </div>
      </div>

      <!-- Quota exceeded wall -->
      <div v-if="quotaExceeded && !auth.isPremium"
        class="bento-dark border border-red-600/30 p-10 text-center mb-6">
        <div class="text-5xl mb-4">🔒</div>
        <h3 class="font-display text-2xl font-bold text-white mb-2">Kuota Match Habis</h3>
        <p class="text-white/40 mb-2">Kamu telah menggunakan <span class="text-white font-semibold">15 match gratis</span> bulan ini.</p>
        <p class="text-white/30 text-sm mb-6">Reset otomatis pada tanggal 1 bulan depan, atau upgrade sekarang untuk match tanpa batas.</p>
        <router-link to="/premium" class="btn-primary !text-base inline-flex items-center gap-2">
          <span>⭐</span> Upgrade ke Premium
        </router-link>
      </div>

      <!-- No skills warning -->
      <div v-else-if="noSkills" class="bento-dark border border-red-600/30 p-8 text-center">
        <div class="text-4xl mb-3">🧩</div>
        <h3 class="font-display text-xl font-bold text-white mb-2">Skill belum diisi</h3>
        <p class="text-white/40 text-sm mb-5">Tambahkan skill yang kamu tawarkan dan ingin pelajari di profil dulu.</p>
        <router-link to="/profile" class="btn-primary">Isi Skill Sekarang →</router-link>
      </div>

      <template v-else-if="!quotaExceeded">
        <!-- Filter bar -->
        <div class="flex flex-wrap items-center gap-3 mb-6">
          <input v-model="search" type="text" placeholder="Cari nama atau skill..."
            class="input-light !w-auto flex-1 min-w-[180px] !py-2 !text-sm"/>
          <select v-model="filterCat" class="input-light !w-auto !py-2 !text-sm cursor-pointer">
            <option value="">Semua Kategori</option>
            <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
          </select>
          <select v-model="filterType" class="input-light !w-auto !py-2 !text-sm cursor-pointer">
            <option value="">Semua Tipe</option>
            <option value="perfect">✅ Perfect Match</option>
            <option value="partial">🔶 Partial Match</option>
            <option value="explore">🔍 Jelajahi</option>
          </select>
          <button @click="loadMatches" :disabled="loadingMatches"
            class="btn-primary !py-2 !px-4 !text-sm flex items-center gap-2">
            <span v-if="loadingMatches" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Refresh
          </button>
        </div>

        <!-- Loading -->
        <div v-if="loadingMatches" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div v-for="i in 6" :key="i" class="bento-muted h-60 animate-pulse rounded-3xl"></div>
        </div>

        <template v-else>
          <!-- Grouped by match type when no filter -->
          <template v-if="!filterType && !search && !filterCat">

            <div v-if="perfectGroup.length" class="mb-8">
              <div class="flex items-center gap-2 mb-3">
                <span class="text-lg">✅</span>
                <h2 class="font-display text-lg font-bold text-white">Perfect Match</h2>
                <span class="text-white/25 text-sm">— saling cocok dua arah</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <MatchCard v-for="m in perfectGroup" :key="m.id" :match="m" @exchange="openModal"/>
              </div>
            </div>

            <div v-if="partialGroup.length" class="mb-8">
              <div class="flex items-center gap-2 mb-3">
                <span class="text-lg">🔶</span>
                <h2 class="font-display text-lg font-bold text-white">Partial Match</h2>
                <span class="text-white/25 text-sm">— cocok satu arah</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <MatchCard v-for="m in partialGroup" :key="m.id" :match="m" @exchange="openModal"/>
              </div>
            </div>

            <div v-if="exploreGroup.length" class="mb-8">
              <div class="flex items-center gap-2 mb-3">
                <span class="text-lg">🔍</span>
                <h2 class="font-display text-lg font-bold text-white">Jelajahi</h2>
                <span class="text-white/25 text-sm">— pengguna aktif lainnya</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <MatchCard v-for="m in exploreGroup" :key="m.id" :match="m" @exchange="openModal"/>
              </div>
            </div>

            <div v-if="!perfectGroup.length && !partialGroup.length && !exploreGroup.length"
              class="bento-dark border border-white/10 p-12 text-center">
              <div class="text-5xl mb-4">🔍</div>
              <p class="text-white/50">Belum ada pengguna lain.</p>
              <p class="text-white/30 text-sm mt-2">Ajak temanmu bergabung di SkillVia!</p>
            </div>
          </template>

          <!-- Filtered view -->
          <template v-else>
            <div v-if="filteredMatches.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <MatchCard v-for="m in filteredMatches" :key="m.id" :match="m" @exchange="openModal"/>
            </div>
            <div v-else class="bento-dark border border-white/10 p-12 text-center">
              <div class="text-5xl mb-4">😕</div>
              <p class="text-white/50">Tidak ada match untuk filter ini.</p>
              <button @click="search='';filterCat='';filterType=''" class="btn-ghost !text-sm mt-4">Reset Filter</button>
            </div>
          </template>
        </template>
      </template>
    </div>

    <!-- Exchange modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="showModal=false">
      <div class="bento-dark border border-white/10 w-full max-w-md p-7 animate-scale-in">
        <h3 class="font-display text-2xl font-bold text-white mb-5">Ajukan Pertukaran</h3>
        <div class="flex items-center gap-3 mb-6 bg-white/5 rounded-2xl p-4">
          <img :src="selectedMatch?.avatar_url" class="w-12 h-12 rounded-full object-cover"/>
          <div>
            <p class="font-semibold text-white">{{ selectedMatch?.name }}</p>
            <div class="flex items-center gap-1 mt-0.5">
              <span class="text-amber-400 text-xs">★</span>
              <span class="text-white/40 text-xs">{{ selectedMatch?.avg_rating ? Number(selectedMatch.avg_rating).toFixed(1) : 'Baru' }}</span>
              <span v-if="selectedMatch?.is_premium_active" class="text-amber-400 text-[10px] font-bold ml-1">⭐</span>
            </div>
          </div>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Skill yang kamu tawarkan</label>
            <select v-model="eForm.offer_skill_id" class="input-light w-full cursor-pointer">
              <option value="">Pilih skill...</option>
              <option v-for="s in myOffers" :key="s.id" :value="s.skill_id">{{ s.skill?.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Skill yang ingin dipelajari</label>
            <select v-model="eForm.want_skill_id" class="input-light w-full cursor-pointer">
              <option value="">Pilih skill...</option>
              <option v-for="s in selectedMatch?.skill_offers" :key="s.id" :value="s.skill_id">{{ s.skill?.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Pesan (opsional)</label>
            <textarea v-model="eForm.message" rows="3" placeholder="Hei! Saya tertarik untuk barter ilmu..." class="input-light w-full resize-none"></textarea>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="showModal=false" class="btn-ghost flex-1">Batal</button>
          <button @click="submitExchange" :disabled="submitting||!eForm.offer_skill_id||!eForm.want_skill_id"
            class="btn-primary flex-1 flex items-center justify-center gap-2">
            <span v-if="submitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {{ submitting ? 'Mengirim...' : 'Kirim Permintaan' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import MatchCard from '@/components/MatchCard.vue'
import api from '@/services/api'

const auth  = useAuthStore()
const toast = useToast()

const matches       = ref([])
const loadingMatches= ref(false)
const search        = ref('')
const filterCat     = ref('')
const filterType    = ref('')
const categories    = ref([])
const noSkills      = ref(false)
const quotaExceeded = ref(false)
const myOffers      = ref([])
const showModal     = ref(false)
const selectedMatch = ref(null)
const submitting    = ref(false)
const eForm         = ref({ offer_skill_id:'', want_skill_id:'', message:'' })

const perfectGroup  = computed(() => matches.value.filter(m => m.match_type === 'perfect'))
const partialGroup  = computed(() => matches.value.filter(m => m.match_type === 'partial'))
const exploreGroup  = computed(() => matches.value.filter(m => m.match_type === 'explore'))

const filteredMatches = computed(() => {
  let l = matches.value
  if (filterType.value) l = l.filter(m => m.match_type === filterType.value)
  if (filterCat.value)  l = l.filter(m => m.skill_offers?.some(s => s.skill?.category === filterCat.value))
  if (search.value) {
    const q = search.value.toLowerCase()
    l = l.filter(m => m.name.toLowerCase().includes(q) || m.skill_offers?.some(s => s.skill?.name.toLowerCase().includes(q)))
  }
  return l
})

async function loadMatches() {
  loadingMatches.value = true
  noSkills.value = false
  quotaExceeded.value = false
  try {
    const r = await api.get('/matches')
    if (r.data.quota_exceeded) {
      quotaExceeded.value = true
      await auth.refreshUser()
      return
    }
    matches.value = r.data.data || []
    // Refresh quota display
    await auth.refreshUser()
  } catch(e) {
    if (e.response?.status === 403 && e.response?.data?.quota_exceeded) {
      quotaExceeded.value = true
      await auth.refreshUser()
    } else if (e.response?.data?.message?.includes('skill')) {
      noSkills.value = true
    }
    matches.value = []
  } finally { loadingMatches.value = false }
}

async function openModal(match) {
  selectedMatch.value = match
  eForm.value = { offer_skill_id:'', want_skill_id:'', message:'' }
  const r = await api.get('/skills/my')
  myOffers.value = r.data.offers
  showModal.value = true
}

async function submitExchange() {
  submitting.value = true
  try {
    await api.post('/exchanges', {
      provider_id:    selectedMatch.value.id,
      offer_skill_id: eForm.value.offer_skill_id,
      want_skill_id:  eForm.value.want_skill_id,
      message:        eForm.value.message,
    })
    toast.success('Permintaan pertukaran terkirim! 🎉')
    showModal.value = false
  } catch(e) { toast.error(e.response?.data?.message || 'Gagal.') }
  finally { submitting.value = false }
}

onMounted(async () => {
  await loadMatches()
  try { categories.value = (await api.get('/skills/categories')).data } catch {}
})
</script>
