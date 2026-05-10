<template>
  <div class="min-h-screen bg-dark pt-24 pb-16 px-4">
    <div class="max-w-5xl mx-auto">

      <!-- Header -->
      <div class="text-center mb-12">
        <div class="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold px-4 py-2 rounded-full mb-4">
          ⭐ SkillVia Premium
        </div>
        <h1 class="font-display text-5xl font-extrabold text-white mb-4">
          Belajar Tanpa Batas,<br/><span class="text-amber-400">Berkembang Tanpa Limit</span>
        </h1>
        <p class="text-white/40 text-lg max-w-xl mx-auto">
          User gratis: <span class="text-white/60 font-semibold">15 match/bulan</span>.
          Premium: <span class="text-amber-400 font-semibold">unlimited match</span> + fitur eksklusif.
        </p>

        <!-- Current quota display for free users -->
        <div v-if="!auth.user?.is_premium_active" class="mt-6 inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-3">
          <div class="text-left">
            <p class="text-white/40 text-xs font-semibold uppercase tracking-wider">Sisa Match Bulan Ini</p>
            <div class="flex items-center gap-2 mt-1">
              <div class="h-2 w-32 bg-white/10 rounded-full overflow-hidden">
                <div class="h-full bg-amber-400 rounded-full transition-all duration-500"
                  :style="{width: Math.max(0,((auth.user?.match_quota_remaining ?? 15)/15)*100)+'%'}"></div>
              </div>
              <span class="text-white font-bold text-sm">{{ auth.user?.match_quota_remaining ?? 15 }}/15</span>
            </div>
          </div>
          <div class="w-px h-8 bg-white/10"></div>
          <p class="text-white/30 text-xs">Reset tiap tanggal 1</p>
        </div>

        <!-- Already premium badge -->
        <div v-else class="mt-6 inline-flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-5 py-3">
          <span class="text-2xl">⭐</span>
          <div class="text-left">
            <p class="text-amber-400 font-bold text-sm">Premium Aktif — {{ auth.user?.premium_plan?.toUpperCase() }}</p>
            <p class="text-white/40 text-xs">Berlaku hingga {{ formatDate(auth.user?.premium_expires_at) }}</p>
          </div>
        </div>
      </div>

      <!-- Comparison: Free vs Premium -->
      <div class="bento-dark border border-white/10 p-6 mb-8">
        <h3 class="font-display text-lg font-bold text-white mb-4">Free vs Premium</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div v-for="item in comparison" :key="item.feature"
            class="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
            <span class="text-base shrink-0">{{ item.icon }}</span>
            <span class="text-white/60 text-sm flex-1">{{ item.feature }}</span>
            <span class="text-xs text-white/30 shrink-0">{{ item.free }}</span>
            <span class="text-xs text-amber-400 font-bold shrink-0">→ {{ item.premium }}</span>
          </div>
        </div>
      </div>

      <!-- Pricing cards -->
      <div v-if="loadingPlans" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div v-for="i in 3" :key="i" class="bento-muted h-80 animate-pulse rounded-3xl"></div>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div v-for="plan in plans" :key="plan.id"
          :class="['rounded-3xl border p-6 flex flex-col relative transition-all group',
            plan.slug === 'pro'
              ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/40 scale-[1.02]'
              : 'bento-dark border-white/10 hover:border-white/20']">

          <!-- Popular badge -->
          <div v-if="plan.slug === 'pro'"
            class="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-dark text-xs font-bold px-4 py-1 rounded-full">
            ⚡ Paling Populer
          </div>

          <div class="mb-5">
            <h3 class="font-display text-2xl font-extrabold text-white mb-1">{{ plan.name }}</h3>
            <p class="text-white/40 text-sm leading-relaxed">{{ plan.description }}</p>
          </div>

          <!-- Price -->
          <div class="mb-6">
            <div class="flex items-end gap-1">
              <span class="font-display text-4xl font-extrabold text-white">
                Rp{{ formatPrice(plan.price) }}
              </span>
              <span class="text-white/40 text-sm mb-1.5">
                /{{ plan.duration_days >= 365 ? 'tahun' : 'bulan' }}
              </span>
            </div>
            <p v-if="plan.slug === 'scholar'" class="text-emerald-400 text-xs font-semibold mt-1">
              Hemat Rp221.000 vs Pro bulanan!
            </p>
            <p v-if="plan.slug === 'basic'" class="text-white/30 text-xs mt-1">
              ~Rp500/hari
            </p>
          </div>

          <!-- Features -->
          <ul class="space-y-2 mb-6 flex-1">
            <li v-for="feat in getFeatureLabels(plan.features)" :key="feat"
              class="flex items-start gap-2 text-sm">
              <span class="text-emerald-400 shrink-0 mt-0.5">✓</span>
              <span class="text-white/70">{{ feat }}</span>
            </li>
          </ul>

          <!-- CTA button -->
          <button @click="subscribe(plan)"
            :disabled="paying === plan.id || auth.user?.is_premium_active"
            :class="['w-full py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2',
              plan.slug === 'pro'
                ? 'bg-amber-500 hover:bg-amber-400 text-dark active:scale-95'
                : auth.user?.is_premium_active
                  ? 'bg-white/5 text-white/30 cursor-not-allowed'
                  : 'bg-white/10 hover:bg-white/20 text-white active:scale-95']">
            <span v-if="paying === plan.id" class="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin"></span>
            <span>{{ auth.user?.is_premium_active ? 'Sudah Premium' : 'Mulai ' + plan.name }}</span>
          </button>
        </div>
      </div>

      <!-- FAQ -->
      <div class="mt-12">
        <h2 class="font-display text-2xl font-bold text-white text-center mb-6">Pertanyaan Umum</h2>
        <div class="space-y-3 max-w-2xl mx-auto">
          <div v-for="faq in faqs" :key="faq.q" class="bento-dark border border-white/10 p-5">
            <p class="text-white font-semibold text-sm mb-2">{{ faq.q }}</p>
            <p class="text-white/40 text-sm leading-relaxed">{{ faq.a }}</p>
          </div>
        </div>
      </div>

    </div>

    <!-- Payment processing modal -->
    <div v-if="processingModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bento-dark border border-white/10 w-full max-w-sm p-7 text-center animate-scale-in">
        <div class="text-5xl mb-4">💳</div>
        <h3 class="font-display text-xl font-bold text-white mb-2">Memproses Pembayaran</h3>
        <p class="text-white/40 text-sm mb-6">Jendela pembayaran Midtrans sudah terbuka. Selesaikan pembayaran di sana.</p>
        <div class="flex gap-3">
          <button @click="cancelPayment" class="btn-ghost flex-1 !text-sm">Batal</button>
          <button @click="checkPaymentStatus" :disabled="checkingStatus"
            class="btn-primary flex-1 !text-sm flex items-center justify-center gap-2">
            <span v-if="checkingStatus" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Cek Status
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const auth  = useAuthStore()
const toast = useToast()

const plans        = ref([])
const loadingPlans = ref(true)
const paying       = ref(null)
const processingModal = ref(false)
const checkingStatus  = ref(false)
const currentOrderId  = ref(null)

onMounted(async () => {
  // Load Midtrans Snap script
  const script = document.createElement('script')
  const isProduction = false // change to true for production
  script.src = isProduction
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js'
  script.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY || '')
  document.head.appendChild(script)

  try {
    const r = await api.get('/premium/plans')
    plans.value = r.data
  } finally {
    loadingPlans.value = false
  }
})

async function subscribe(plan) {
  paying.value = plan.id
  try {
    const r = await api.post('/premium/order', { plan_id: plan.id })
    const { snap_token, order_id } = r.data
    currentOrderId.value = order_id

    if (!window.snap) {
      toast.error('Midtrans Snap belum siap. Reload halaman.')
      return
    }

    window.snap.pay(snap_token, {
      onSuccess: async (result) => {
        toast.success('Pembayaran berhasil! Premium aktif 🎉')
        await auth.refreshUser()
        processingModal.value = false
      },
      onPending: () => {
        processingModal.value = true
        toast.info('Pembayaran pending. Selesaikan di aplikasi bankmu.')
      },
      onError: (err) => {
        toast.error('Pembayaran gagal. Coba lagi.')
        processingModal.value = false
      },
      onClose: () => {
        processingModal.value = true
      },
    })
  } catch(e) {
    toast.error(e.response?.data?.message || 'Gagal membuat transaksi.')
  } finally {
    paying.value = null
  }
}

async function checkPaymentStatus() {
  if (!currentOrderId.value) return
  checkingStatus.value = true
  try {
    const r = await api.get(`/premium/check/${currentOrderId.value}`)
    if (r.data.is_paid) {
      toast.success('Pembayaran dikonfirmasi! Premium aktif 🎉')
      await auth.refreshUser()
      processingModal.value = false
    } else {
      toast.info('Pembayaran belum dikonfirmasi. Coba lagi dalam beberapa saat.')
    }
  } catch { toast.error('Gagal cek status.') }
  finally { checkingStatus.value = false }
}

function cancelPayment() {
  processingModal.value = false
  currentOrderId.value  = null
}

function getFeatureLabels(features) {
  const map = {
    unlimited_match:           '✨ Match tidak terbatas (15/bulan untuk free)',
    priority_search:           '🔍 Prioritas di hasil pencarian',
    premium_badge:             '⭐ Badge Premium eksklusif di profil',
    extended_chat_history:     '💬 Riwayat chat tidak terhapus',
    advanced_analytics:        '📊 Analitik skill dan progress',
    certificate_custom_branding: '🎓 Sertifikat dengan branding premium',
    bonus_xp_2x:               '⚡ Bonus XP 2x dari setiap aktivitas',
    early_access_features:     '🚀 Akses fitur baru lebih awal',
    dedicated_support:         '🛡️ Dukungan prioritas dari tim SkillVia',
    exclusive_scholar_badge:   '🏆 Badge Scholar langka di profil',
    yearly_skill_report:       '📈 Laporan perkembangan skill tahunan',
  }
  return (features || []).map(f => map[f] || f)
}

function formatPrice(n) {
  return n.toLocaleString('id-ID')
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })
}

const comparison = [
  { icon:'🤝', feature:'Cari Match per Bulan',    free:'15x',       premium:'Unlimited' },
  { icon:'⭐', feature:'Badge Premium',             free:'—',         premium:'Ada' },
  { icon:'🔍', feature:'Prioritas Pencarian',       free:'Normal',    premium:'Diprioritaskan' },
  { icon:'⚡', feature:'Bonus XP',                  free:'1x normal', premium:'2x lipat' },
  { icon:'🎓', feature:'Sertifikat Premium',        free:'Standard',  premium:'Custom branding' },
  { icon:'📊', feature:'Analytics Skill',           free:'Basic',     premium:'Advanced' },
  { icon:'💬', feature:'Riwayat Chat',              free:'30 hari',   premium:'Selamanya' },
  { icon:'🚀', feature:'Akses Fitur Baru',          free:'Reguler',   premium:'Early Access' },
]

const faqs = [
  { q:'Apakah bisa cancel langganan?', a:'Saat ini langganan berjalan hingga masa aktif habis. Tidak ada perpanjangan otomatis.' },
  { q:'Metode pembayaran apa yang tersedia?', a:'QRIS, GoPay, OVO, DANA, transfer bank (BCA, Mandiri, BNI, BRI), dan kartu kredit via Midtrans.' },
  { q:'Apakah data pembayaran aman?', a:'Semua transaksi diproses langsung oleh Midtrans — payment gateway tersertifikasi PCI DSS Level 1 terpercaya di Indonesia.' },
  { q:'Bagaimana jika kuota 15 match sudah habis?', a:'Kamu masih bisa chat, exchange, dan menggunakan semua fitur lain. Hanya fitur "Cari Match Baru" yang dibatasi sampai reset di awal bulan.' },
  { q:'Kapan premium aktif setelah bayar?', a:'Langsung setelah pembayaran dikonfirmasi — biasanya dalam hitungan detik untuk GoPay/QRIS, atau hingga 1 jam untuk transfer bank.' },
]
</script>
