<template>
  <div class="min-h-screen bg-dark pt-24 pb-16 px-4">
    <div class="max-w-4xl mx-auto">
      <div class="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 class="font-display text-4xl font-extrabold text-white">Reward <span class="text-red-500">XP</span></h1>
          <p class="text-white/40 mt-1">Tukar XP kamu dengan voucher dan hadiah menarik.</p>
        </div>
        <div class="bg-red-600/10 border border-red-600/20 px-5 py-3 rounded-2xl">
          <p class="text-white/40 text-xs">XP Kamu</p>
          <p class="font-display text-3xl font-extrabold text-red-400">{{ auth.user?.xp_points?.toLocaleString() ?? 0 }}</p>
        </div>
      </div>

      <div class="flex gap-2 mb-6">
        <button v-for="t in ['Toko Reward','Riwayat']" :key="t" @click="tab=t"
          :class="['px-5 py-2 rounded-2xl text-sm font-medium transition-all',tab===t?'bg-red-600 text-white':'bg-white/5 text-white/50 hover:text-white hover:bg-white/10']">
          {{ t }}
        </button>
      </div>

      <div v-if="tab==='Toko Reward'">
        <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div v-for="i in 6" :key="i" class="bento-muted h-52 animate-pulse rounded-3xl"></div>
        </div>

        <div v-else-if="rewards.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div v-for="r in rewards" :key="r.id"
            :class="['bento-dark border transition-all group flex flex-col overflow-hidden',
              canAfford(r)?'border-white/10 hover:border-red-600/40 cursor-default':'border-white/5 opacity-50']">

            <!-- Banner image or emoji icon -->
            <div class="relative overflow-hidden">
              <img v-if="r.banner_url" :src="r.banner_url" class="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"/>
              <div v-else class="w-full h-28 bg-gradient-to-br from-red-600/20 to-dark-muted flex items-center justify-center text-5xl">
                {{ r.icon }}
              </div>
              <!-- XP cost badge overlay -->
              <div class="absolute top-2 right-2 bg-dark-card/90 backdrop-blur border border-red-600/30 px-2.5 py-1 rounded-xl">
                <span class="font-display font-bold text-red-400 text-sm">{{ r.xp_cost?.toLocaleString() }} XP</span>
              </div>
              <!-- Type badge -->
              <div class="absolute bottom-2 left-2 bg-dark-card/80 backdrop-blur px-2 py-0.5 rounded-lg">
                <span class="text-white/50 text-[10px] capitalize">{{ voucherTypeLabel(r.voucher_type) }}</span>
              </div>
            </div>

            <div class="p-4 flex flex-col flex-1">
              <h3 class="font-semibold text-white text-sm mb-1">{{ r.title }}</h3>
              <p class="text-white/40 text-xs leading-relaxed flex-1">{{ r.description }}</p>
              <div class="flex items-center justify-between mt-3">
                <span class="text-white/30 text-xs">Stok: {{ r.stock }}</span>
                <button @click="redeem(r)" :disabled="!canAfford(r)||redeeming===r.id"
                  :class="['flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                    canAfford(r)?'bg-red-600 text-white hover:bg-red-700 active:scale-95':'bg-white/5 text-white/30 cursor-not-allowed']">
                  <span v-if="redeeming===r.id" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>{{ canAfford(r) ? 'Tukar' : 'XP Kurang' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="bento-dark border border-white/10 p-12 text-center">
          <div class="text-5xl mb-3">🎁</div>
          <p class="text-white/40">Belum ada reward tersedia.</p>
        </div>
      </div>

      <!-- History -->
      <div v-else>
        <div v-if="redemptions.length" class="space-y-2">
          <div v-for="rd in redemptions" :key="rd.id" class="bento-dark border border-white/10 p-4 flex items-center gap-4">
            <div class="shrink-0 w-14 h-14 rounded-2xl overflow-hidden bg-white/5 flex items-center justify-center">
              <img v-if="rd.banner_url||rd.xp_reward?.banner_url" :src="rd.banner_url||rd.xp_reward?.banner_url" class="w-full h-full object-cover"/>
              <span v-else class="text-3xl">{{ rd.xp_reward?.icon }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-white font-semibold text-sm">{{ rd.xp_reward?.title }}</p>
              <p class="text-white/30 text-xs mt-0.5">{{ formatDate(rd.created_at) }}</p>
            </div>
            <div class="text-right shrink-0">
              <code class="bg-red-600/20 text-red-300 px-3 py-1.5 rounded-xl text-xs font-mono font-bold block">{{ rd.code }}</code>
              <p :class="['text-xs mt-1',rd.status==='fulfilled'?'text-green-400':'text-white/40']">{{ rd.status }}</p>
            </div>
          </div>
        </div>
        <p v-else class="text-white/30 text-center py-12">Belum ada penukaran.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const auth=useAuthStore(), toast=useToast()
const tab=ref('Toko Reward'), loading=ref(true), rewards=ref([]), redemptions=ref([]), redeeming=ref(null)

onMounted(async()=>{
  const [rR,rdR]=await Promise.all([api.get('/xp-rewards'),api.get('/xp-redemptions/my')])
  rewards.value=rR.data; redemptions.value=rdR.data; loading.value=false
})

function canAfford(r){ return (auth.user?.xp_points??0)>=r.xp_cost }
function voucherTypeLabel(t){ return {food:'Makanan',transport:'Transport',entertainment:'Hiburan',other:'Lainnya'}[t]||t }

async function redeem(r) {
  if (!canAfford(r)) return
  redeeming.value=r.id
  try {
    const res=await api.post('/xp-rewards/redeem',{reward_id:r.id})
    toast.success(`Berhasil! Kode: ${res.data.code} 🎉`)
    await auth.refreshUser()
    redemptions.value.unshift(res.data.redemption)
    r.stock--
  } catch(e){ toast.error(e.response?.data?.message||'Gagal menukar.') }
  finally { redeeming.value=null }
}

function formatDate(d){ return new Date(d).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}) }
</script>
