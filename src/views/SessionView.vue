<template>
  <div class="min-h-screen bg-dark pt-24 pb-16 px-4">
    <div class="max-w-5xl mx-auto">

      <h1 class="font-display text-4xl font-extrabold text-white mb-2">Sesi <span class="text-red-500">Belajar</span></h1>
      <p class="text-white/40 mb-8">Semua sesi yang terjadwal dan sudah selesai.</p>

      <!-- Filter tabs -->
      <div class="flex gap-2 mb-6 flex-wrap">
        <button v-for="tab in tabs" :key="tab.val" @click="activeTab = tab.val"
          :class="['px-5 py-2 rounded-2xl text-sm font-medium transition-all',
            activeTab === tab.val ? 'bg-red-600 text-white' : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10']">
          {{ tab.label }}
        </button>
      </div>

      <div v-if="loading" class="space-y-3">
        <div v-for="i in 3" :key="i" class="bento-muted h-32 animate-pulse rounded-3xl"></div>
      </div>

      <div v-else-if="filteredSessions.length" class="space-y-3">
        <div v-for="sess in filteredSessions" :key="sess.id"
          class="bento-dark border border-white/10 p-5 flex flex-col sm:flex-row gap-4 sm:items-center">

          <!-- Date pill -->
          <div class="flex-shrink-0 flex flex-col items-center bg-red-600/10 border border-red-600/20 rounded-2xl px-4 py-3 min-w-[72px] text-center">
            <span class="text-red-400 font-display font-black text-2xl leading-none">{{ getDay(sess.scheduled_at) }}</span>
            <span class="text-red-400/70 text-[11px] font-semibold">{{ getMonth(sess.scheduled_at) }}</span>
            <span class="text-white/30 text-[10px] mt-1">{{ getTime(sess.scheduled_at) }}</span>
          </div>

          <!-- Info -->
          <div class="flex-1">
            <div class="flex flex-wrap items-center gap-2 mb-1">
              <span :class="statusClass(sess.status)" class="text-xs font-semibold px-2.5 py-1 rounded-full">
                {{ statusLabel(sess.status) }}
              </span>
              <span class="text-white/30 text-xs">{{ sess.duration_minutes }} menit</span>
            </div>
            <p class="text-white font-semibold">
              {{ sess.exchange?.offer_skill?.name }} ↔ {{ sess.exchange?.want_skill?.name }}
            </p>
            <p class="text-white/40 text-xs mt-1">
              dengan {{ getPartner(sess).name }} · {{ sess.location || 'Lokasi belum ditentukan' }}
            </p>
            <p v-if="sess.notes" class="text-white/30 text-xs mt-1 italic">"{{ sess.notes }}"</p>
          </div>

          <!-- Actions -->
          <div class="flex gap-2 flex-wrap">
            <router-link v-if="sess.status === 'scheduled'" :to="`/chat/${sess.exchange_id}`"
              class="btn-ghost !text-xs !px-3 !py-2">Chat</router-link>
            <button v-if="sess.status === 'scheduled'" @click="completeSession(sess.id)"
              class="btn-primary !text-xs !px-3 !py-2">Tandai Selesai</button>
            <button v-if="sess.status === 'completed' && !sess.rated" @click="openRating(sess)"
              class="btn-primary !text-xs !px-3 !py-2">Beri Rating</button>
          </div>
        </div>
      </div>

      <div v-else class="bento-dark border border-white/10 p-12 text-center">
        <div class="text-5xl mb-4">📅</div>
        <p class="text-white/40">Tidak ada sesi di kategori ini.</p>
      </div>
    </div>

    <!-- Rating Modal -->
    <div v-if="ratingModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="ratingModal = false">
      <div class="bento-dark border border-white/10 w-full max-w-sm p-7 animate-scale-in">
        <h3 class="font-display text-xl font-bold text-white mb-5">Beri Rating</h3>
        <div class="flex justify-center gap-2 mb-5">
          <button v-for="n in 5" :key="n" @click="ratingForm.score = n"
            :class="['text-3xl transition-transform hover:scale-110', n <= ratingForm.score ? 'opacity-100' : 'opacity-20']">⭐</button>
        </div>
        <textarea v-model="ratingForm.comment" rows="3" placeholder="Tulis komentar (opsional)..." class="input w-full resize-none mb-4"></textarea>
        <div class="flex gap-3">
          <button @click="ratingModal = false" class="btn-ghost flex-1">Batal</button>
          <button @click="submitRating" class="btn-primary flex-1">Kirim Rating</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const auth   = useAuthStore()
const toast  = useToast()
const sessions   = ref([])
const loading    = ref(true)
const activeTab  = ref('upcoming')
const ratingModal= ref(false)
const activeSess = ref(null)
const ratingForm = ref({ score: 5, comment: '' })

const tabs = [
  { val: 'upcoming',  label: 'Mendatang' },
  { val: 'completed', label: 'Selesai' },
  { val: 'all',       label: 'Semua' },
]

const filteredSessions = computed(() => {
  const now = new Date()
  if (activeTab.value === 'upcoming')  return sessions.value.filter(s => s.status === 'scheduled' && new Date(s.scheduled_at) >= now)
  if (activeTab.value === 'completed') return sessions.value.filter(s => s.status === 'completed')
  return sessions.value
})

onMounted(async () => {
  const res = await api.get('/sessions')
  sessions.value = res.data
  loading.value  = false
})

async function completeSession(id) {
  await api.put(`/sessions/${id}/complete`)
  const s = sessions.value.find(x => x.id === id)
  if (s) s.status = 'completed'
  toast.success('Sesi ditandai selesai! +30 XP 🎉')
  await auth.refreshUser()
}

function openRating(sess) {
  activeSess.value = sess
  ratingForm.value = { score: 5, comment: '' }
  ratingModal.value = true
}

async function submitRating() {
  try {
    const partner = getPartner(activeSess.value)
    await api.post('/ratings', {
      exchange_id: activeSess.value.exchange_id,
      session_id:  activeSess.value.id,
      rated_id:    partner.id,
      score:       ratingForm.value.score,
      comment:     ratingForm.value.comment,
    })
    activeSess.value.rated = true
    ratingModal.value = false
    toast.success('Rating berhasil dikirim!')
  } catch (e) { toast.error(e.response?.data?.message || 'Gagal.') }
}

function getPartner(sess) {
  const ex = sess.exchange
  return ex?.requester_id === auth.user?.id ? ex?.provider : ex?.requester
}
function getDay(d)   { return new Date(d).getDate() }
function getMonth(d) { return new Date(d).toLocaleDateString('id-ID', { month:'short' }) }
function getTime(d)  { return new Date(d).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' }) }
function statusClass(s) {
  return { scheduled: 'bg-blue-500/20 text-blue-400', completed: 'bg-green-500/20 text-green-400', cancelled: 'bg-white/10 text-white/40' }[s] || 'bg-white/10 text-white/40'
}
function statusLabel(s) {
  return { scheduled: 'Terjadwal', completed: 'Selesai', cancelled: 'Dibatalkan' }[s] || s
}
</script>
