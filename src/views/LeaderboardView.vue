<template>
  <div class="min-h-screen bg-dark pt-24 pb-16 px-4">
    <div class="max-w-3xl mx-auto">
      <h1 class="font-display text-4xl font-extrabold text-white mb-2">Leaderboard</h1>
      <p class="text-white/40 mb-8">Top learner berdasarkan XP di SkillVia.</p>

      <div v-if="error" class="bento-dark border border-red-600/30 p-8 text-center">
        <p class="text-white/50 mb-4">Gagal memuat leaderboard.</p>
        <button @click="load" class="btn-primary !text-sm">Coba Lagi</button>
      </div>

      <template v-else>
        <!-- Podium top 3 -->
        <div v-if="top3.length >= 3" class="grid grid-cols-3 gap-3 mb-6">
          <div class="bento-muted border border-white/5 p-4 flex flex-col items-center justify-end mt-8">
            <img :src="top3[1]?.avatar_url" class="w-12 h-12 rounded-2xl object-cover mb-2" />
            <p class="text-white font-semibold text-xs truncate w-full text-center">{{ top3[1]?.name }}</p>
            <p class="text-white/40 text-xs">{{ top3[1]?.xp_points?.toLocaleString() }} XP</p>
            <div class="mt-2 bg-white/10 text-white/60 font-display font-black text-lg w-8 h-8 rounded-xl flex items-center justify-center">2</div>
          </div>
          <div class="bento-red noise p-4 flex flex-col items-center">
            <div class="text-2xl mb-1">👑</div>
            <img :src="top3[0]?.avatar_url" class="w-16 h-16 rounded-2xl object-cover mb-2 ring-4 ring-white/20" />
            <p class="text-white font-bold text-xs truncate w-full text-center">{{ top3[0]?.name }}</p>
            <p class="text-white/70 text-xs">{{ top3[0]?.xp_points?.toLocaleString() }} XP</p>
            <div class="mt-2 bg-white/20 text-white font-display font-black text-lg w-8 h-8 rounded-xl flex items-center justify-center">1</div>
          </div>
          <div class="bento-muted border border-white/5 p-4 flex flex-col items-center justify-end mt-12">
            <img :src="top3[2]?.avatar_url" class="w-12 h-12 rounded-2xl object-cover mb-2" />
            <p class="text-white font-semibold text-xs truncate w-full text-center">{{ top3[2]?.name }}</p>
            <p class="text-white/40 text-xs">{{ top3[2]?.xp_points?.toLocaleString() }} XP</p>
            <div class="mt-2 bg-white/10 text-white/60 font-display font-black text-lg w-8 h-8 rounded-xl flex items-center justify-center">3</div>
          </div>
        </div>

        <!-- Skeleton only while loading -->
        <div v-if="loading" class="space-y-2">
          <div v-for="i in 8" :key="i" class="bento-muted h-16 animate-pulse rounded-2xl"></div>
        </div>

        <!-- Full list -->
        <div v-else class="space-y-2">
          <div v-for="(u,i) in leaderboard" :key="u.id"
            :class="['flex items-center gap-3 px-5 py-4 rounded-2xl transition-all hover:bg-white/5',
              u.id === auth.user?.id ? 'bento-red' : 'bento-dark border border-white/10']">
            <span :class="['font-display font-black text-lg w-7 text-center',i<3?'text-amber-400':'text-white/30']">{{ i+1 }}</span>
            <img :src="u.avatar_url" class="w-10 h-10 rounded-full object-cover shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-sm text-white truncate">
                {{ u.name }}
                <span v-if="u.id===auth.user?.id" class="text-white/50 text-xs font-normal"> (Kamu)</span>
              </p>
              <p class="text-xs text-white/40 truncate">{{ u.institution }} · {{ u.level_name }} Lv.{{ u.level }}</p>
            </div>
            <div class="text-right shrink-0">
              <p :class="['font-display font-bold text-base',u.id===auth.user?.id?'text-white':'text-red-400']">
                {{ u.xp_points?.toLocaleString() }}
              </p>
              <p class="text-xs text-white/30">XP</p>
            </div>
            <div class="hidden sm:flex items-center gap-0.5 shrink-0">
              <span class="text-xs" :title="`${u.badges_count} badge`">{{ '🏅'.repeat(Math.min(u.badges_count,3)) }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const auth        = useAuthStore()
const leaderboard = ref([])
const loading     = ref(true)
const error       = ref(false)
const top3        = computed(()=>leaderboard.value.slice(0,3))

async function load() {
  loading.value=true; error.value=false
  try {
    const r=await api.get('/leaderboard')
    leaderboard.value=r.data
  } catch { error.value=true }
  finally { loading.value=false }
}

onMounted(load)
</script>
