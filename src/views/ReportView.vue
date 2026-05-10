<template>
  <div class="min-h-screen bg-dark pt-24 pb-16 px-4">
    <div class="max-w-2xl mx-auto">
      <h1 class="font-display text-4xl font-extrabold text-white mb-2">Laporan</h1>
      <p class="text-white/40 mb-8">Laporkan masalah atau sarankan skill baru.</p>

      <div class="bento-dark border border-white/10 p-7">
        <form @submit.prevent="submit" class="space-y-5">

          <div>
            <label class="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Jenis Laporan</label>
            <select v-model="form.type" class="input-light w-full cursor-pointer" required>
              <option value="">Pilih jenis laporan...</option>
              <option value="rating_abuse">⭐ Rating Tak Wajar</option>
              <option value="skill_request">💡 Saran Skill Baru</option>
              <option value="content_violation">🚫 Pelanggaran Konten</option>
              <option value="other">📝 Lainnya</option>
            </select>
          </div>

          <!-- Exchange dropdown — shown for rating_abuse reports -->
          <div v-if="form.type === 'rating_abuse'">
            <label class="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">
              Exchange yang Bermasalah
            </label>
            <select v-model="form.exchange_id" class="input-light w-full cursor-pointer">
              <option value="">Pilih exchange...</option>
              <option v-for="ex in myExchanges" :key="ex.id" :value="ex.id">
                {{ getPartner(ex)?.name }} — {{ ex.offer_skill?.name }} ↔ {{ ex.want_skill?.name }}
                ({{ statusLabel(ex.status) }})
              </option>
            </select>
            <p v-if="loadingExchanges" class="text-white/30 text-xs mt-1">Memuat exchanges...</p>
            <p v-if="!loadingExchanges && !myExchanges.length" class="text-white/30 text-xs mt-1">
              Belum ada exchange.
            </p>
          </div>

          <!-- Reported user — shown for user-related reports -->
          <div v-if="['rating_abuse','content_violation'].includes(form.type)">
            <label class="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">
              User yang Dilaporkan (opsional)
            </label>
            <select v-model="form.reported_user_id" class="input-light w-full cursor-pointer">
              <option value="">Pilih user...</option>
              <option v-for="u in reportableUsers" :key="u.id" :value="u.id">
                {{ u.name }} — {{ u.institution }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Subjek</label>
            <input v-model="form.subject" type="text" placeholder="Ringkasan singkat laporan kamu..." class="input-light w-full" required/>
          </div>

          <div>
            <label class="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Deskripsi</label>
            <textarea v-model="form.description" rows="5" placeholder="Jelaskan detail laporan kamu..." class="input-light w-full resize-none" required></textarea>
          </div>

          <div v-if="success" class="bg-green-500/15 border border-green-500/30 text-green-400 text-sm px-4 py-3 rounded-2xl">
            ✅ Laporan berhasil dikirim! Tim admin akan meninjau dalam 1-3 hari kerja.
          </div>
          <div v-if="errorMsg" class="bg-red-500/15 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-2xl">
            {{ errorMsg }}
          </div>

          <button type="submit" :disabled="submitting" class="btn-primary w-full flex items-center justify-center gap-2 !py-3">
            <span v-if="submitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {{ submitting ? 'Mengirim...' : 'Kirim Laporan' }}
          </button>
        </form>
      </div>

      <!-- My reports history -->
      <div class="mt-8" v-if="myReports.length">
        <h2 class="font-display text-xl font-bold text-white mb-4">Laporan Saya</h2>
        <div class="space-y-3">
          <div v-for="r in myReports" :key="r.id" class="bento-dark border border-white/10 p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <p class="text-white font-semibold text-sm">{{ r.subject }}</p>
                <p class="text-white/40 text-xs mt-0.5">{{ typeLabel(r.type) }} · {{ formatDate(r.created_at) }}</p>
                <p v-if="r.admin_note" class="text-white/60 text-xs mt-1.5 bg-white/5 px-3 py-1.5 rounded-xl">
                  Admin: {{ r.admin_note }}
                </p>
              </div>
              <span :class="statusBadgeClass(r.status)" class="text-xs px-3 py-1.5 rounded-full font-semibold shrink-0">
                {{ statusBadgeLabel(r.status) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const auth  = useAuthStore()
const toast = useToast()

const form = ref({
  type:             '',
  subject:          '',
  description:      '',
  exchange_id:      '',
  reported_user_id: '',
})

const submitting      = ref(false)
const success         = ref(false)
const errorMsg        = ref('')
const myReports       = ref([])
const myExchanges     = ref([])
const reportableUsers = ref([])
const loadingExchanges= ref(false)

onMounted(async () => {
  try {
    myReports.value = (await api.get('/reports/my')).data
  } catch {}
})

// Load exchanges when rating_abuse is selected
watch(() => form.value.type, async (type) => {
  form.value.exchange_id      = ''
  form.value.reported_user_id = ''

  if (['rating_abuse', 'content_violation'].includes(type) && !myExchanges.value.length) {
    loadingExchanges.value = true
    try {
      const r = await api.get('/exchanges')
      myExchanges.value = r.data

      // Build list of unique partners from exchanges
      const partnerMap = {}
      r.data.forEach(ex => {
        const partner = getPartner(ex)
        if (partner && !partnerMap[partner.id]) partnerMap[partner.id] = partner
      })
      reportableUsers.value = Object.values(partnerMap)
    } catch {}
    finally { loadingExchanges.value = false }
  }
})

async function submit() {
  submitting.value = true
  success.value    = false
  errorMsg.value   = ''
  try {
    await api.post('/reports', {
      type:             form.value.type,
      subject:          form.value.subject,
      description:      form.value.description,
      exchange_id:      form.value.exchange_id      || null,
      reported_user_id: form.value.reported_user_id || null,
    })
    success.value = true
    toast.success('Laporan terkirim!')
    form.value = { type:'', subject:'', description:'', exchange_id:'', reported_user_id:'' }
    myReports.value = (await api.get('/reports/my')).data
  } catch(e) {
    errorMsg.value = e.response?.data?.message || 'Gagal mengirim laporan.'
  } finally { submitting.value = false }
}

function getPartner(ex) {
  return ex.requester_id === auth.user?.id ? ex.provider : ex.requester
}

function typeLabel(t) {
  return { rating_abuse:'Rating Tak Wajar', skill_request:'Saran Skill', content_violation:'Pelanggaran', other:'Lainnya' }[t] || t
}

function statusLabel(s) {
  return { pending:'Menunggu', accepted:'Aktif', completed:'Selesai', rejected:'Ditolak' }[s] || s
}

function statusBadgeLabel(s) {
  return { pending:'Menunggu', reviewed:'Ditinjau', resolved:'Selesai', dismissed:'Ditolak' }[s] || s
}

function statusBadgeClass(s) {
  return {
    pending:   'bg-amber-500/20 text-amber-400',
    reviewed:  'bg-blue-500/20 text-blue-400',
    resolved:  'bg-green-500/20 text-green-400',
    dismissed: 'bg-white/10 text-white/40',
  }[s] || 'bg-white/10 text-white/40'
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })
}
</script>
