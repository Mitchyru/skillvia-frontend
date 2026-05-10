<template>
  <div class="min-h-screen bg-dark pt-24 pb-16 px-4">
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center gap-3 mb-8">
        <span class="text-3xl">⚙️</span>
        <div>
          <h1 class="font-display text-4xl font-extrabold text-white">Admin <span class="text-red-500">Panel</span></h1>
          <p class="text-white/40 text-sm">Kelola SkillVia dari sini · {{ auth.user?.name }}</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-2 mb-6 flex-wrap">
        <button v-for="t in tabs" :key="t" @click="switchTab(t)"
          :class="['px-5 py-2 rounded-2xl text-sm font-medium transition-all',
            activeTab===t ? 'bg-red-600 text-white' : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10']">
          {{ t }}
        </button>
      </div>

      <!-- ── Overview ─────────────────────────────────────────────────── -->
      <div v-if="activeTab==='Overview'" class="space-y-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div v-for="s in statCards" :key="s.label" class="bento-dark border border-white/10 p-5">
            <p class="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">{{ s.label }}</p>
            <p class="font-display text-4xl font-extrabold text-white">{{ s.value ?? '—' }}</p>
          </div>
        </div>
        <div class="bento-dark border border-white/10 p-6">
          <h3 class="font-display text-lg font-bold text-white mb-4">📢 Broadcast Notifikasi</h3>
          <div class="space-y-3">
            <input v-model="broadcastForm.title" type="text" placeholder="Judul" class="input-light w-full"/>
            <textarea v-model="broadcastForm.body" rows="3" placeholder="Pesan..." class="input-light w-full resize-none"></textarea>
            <button @click="broadcast" :disabled="broadcastSending" class="btn-primary flex items-center gap-2">
              <span v-if="broadcastSending" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Kirim ke Semua User
            </button>
          </div>
        </div>
      </div>

      <!-- ── Users ───────────────────────────────────────────────────── -->
      <div v-if="activeTab==='Pengguna'" class="space-y-3">
        <input v-model="userSearch" type="text" placeholder="Cari nama/email..." class="input-light w-full !py-2 !text-sm mb-2"/>
        <div v-if="loadingUsers" class="space-y-2">
          <div v-for="i in 5" :key="i" class="bento-muted h-16 animate-pulse rounded-2xl"></div>
        </div>
        <div v-else class="space-y-2">
          <div v-for="u in filteredUsers" :key="u.id"
            class="bento-dark border border-white/10 p-4 flex items-start gap-4 flex-wrap">
            <img :src="u.avatar_url" class="w-10 h-10 rounded-full object-cover shrink-0 mt-1"/>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap mb-0.5">
                <p class="text-white font-semibold text-sm">{{ u.name }}</p>
                <span v-if="u.is_admin" class="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">Admin</span>
                <span v-if="u.is_premium" class="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">⭐ Premium</span>
                <span :class="uStatusClass(u.status)" class="text-xs px-2 py-0.5 rounded-full">{{ u.status }}</span>
              </div>
              <p class="text-white/40 text-xs">{{ u.email }} · {{ u.institution }}</p>
              <!-- XP editor inline -->
              <div class="flex items-center gap-2 mt-1.5">
                <span class="text-white/30 text-xs">XP:</span>
                <input v-if="editingXp===u.id" v-model.number="editXpVal" type="number" min="0"
                  class="input-light !py-1 !px-2 !text-xs w-24"
                  @keyup.enter="saveXp(u)" @keyup.escape="editingXp=null"/>
                <span v-else @click="startEditXp(u)"
                  class="text-red-400 font-bold text-sm cursor-pointer hover:text-red-300 transition-colors">
                  {{ u.xp_points }} XP ✏️
                </span>
                <template v-if="editingXp===u.id">
                  <button @click="saveXp(u)" class="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded-lg hover:bg-green-600/40 transition-colors">✓</button>
                  <button @click="editingXp=null" class="text-xs bg-white/10 text-white/40 px-2 py-1 rounded-lg hover:bg-white/20 transition-colors">✗</button>
                </template>
              </div>
            </div>
            <div class="flex gap-2 shrink-0 flex-wrap">
              <button @click="grantPremium(u)" class="btn-ghost !px-3 !py-1.5 !text-xs text-amber-400 hover:bg-amber-500/10 border border-amber-500/20">
                ⭐ Grant
              </button>
              <button @click="warnUser(u)" class="btn-ghost !px-3 !py-1.5 !text-xs text-amber-400 hover:bg-amber-500/10 border border-amber-500/20">Peringatan</button>
              <button v-if="u.status!=='banned'" @click="banUser(u)" class="btn-ghost !px-3 !py-1.5 !text-xs text-red-400 hover:bg-red-500/10 border border-red-500/20">Blokir</button>
              <button v-else @click="unbanUser(u)" class="btn-ghost !px-3 !py-1.5 !text-xs text-green-400 hover:bg-green-500/10 border border-green-500/20">Pulihkan</button>
              <button @click="deleteUser(u)" class="btn-ghost !px-3 !py-1.5 !text-xs text-red-400 hover:bg-red-500/10 border border-red-500/20">Hapus</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Premium Subscriptions ───────────────────────────────────── -->
      <div v-if="activeTab==='Premium'" class="space-y-3">
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <div class="bento-dark border border-white/10 p-4">
            <p class="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">Total Subscriber</p>
            <p class="font-display text-3xl font-extrabold text-white">{{ premiumStats.total }}</p>
          </div>
          <div class="bento-dark border border-white/10 p-4">
            <p class="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">Aktif Sekarang</p>
            <p class="font-display text-3xl font-extrabold text-amber-400">{{ premiumStats.active }}</p>
          </div>
          <div class="bento-dark border border-white/10 p-4">
            <p class="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">Total Revenue</p>
            <p class="font-display text-3xl font-extrabold text-green-400">Rp{{ premiumStats.revenue.toLocaleString('id-ID') }}</p>
          </div>
        </div>
        <div v-if="loadingSubscriptions" class="space-y-2">
          <div v-for="i in 5" :key="i" class="bento-muted h-16 animate-pulse rounded-2xl"></div>
        </div>
        <div v-else class="space-y-2">
          <div v-for="sub in subscriptions" :key="sub.id"
            class="bento-dark border border-white/10 p-4 flex items-center gap-4 flex-wrap">
            <img :src="sub.user?.avatar_url" class="w-9 h-9 rounded-full object-cover shrink-0"/>
            <div class="flex-1 min-w-0">
              <p class="text-white font-semibold text-sm">{{ sub.user?.name }}</p>
              <p class="text-white/40 text-xs">{{ sub.user?.email }} · {{ sub.plan?.name }}</p>
            </div>
            <div class="text-right shrink-0">
              <p class="text-white font-bold text-sm">Rp{{ sub.amount?.toLocaleString('id-ID') }}</p>
              <p class="text-white/30 text-xs">{{ formatDate(sub.paid_at || sub.created_at) }}</p>
            </div>
            <span :class="subStatusClass(sub.status)" class="text-xs px-3 py-1.5 rounded-full font-semibold shrink-0">
              {{ sub.status }}
            </span>
          </div>
        </div>
      </div>

      <!-- ── Skills ──────────────────────────────────────────────────── -->
      <div v-if="activeTab==='Skill'">
        <div class="bento-dark border border-white/10 p-5 mb-4">
          <h3 class="font-display text-lg font-bold text-white mb-4">Tambah Skill Baru</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input v-model="newSkill.name" type="text" placeholder="Nama skill" class="input-light"/>
            <select v-model="newSkill.category" class="input-light cursor-pointer">
              <option value="">Kategori...</option>
              <option v-for="c in skillCategories" :key="c" :value="c">{{ c }}</option>
            </select>
            <button @click="addSkill" :disabled="!newSkill.name||!newSkill.category" class="btn-primary !text-sm">+ Tambah</button>
          </div>
        </div>
        <div class="bento-dark border border-white/10 p-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto scrollbar-hide">
            <div v-for="s in adminSkills" :key="s.id"
              class="flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-2xl px-4 py-3 transition-colors">
              <div>
                <p class="text-white text-sm font-medium">{{ s.name }}</p>
                <p class="text-white/30 text-xs">{{ s.category }} · {{ s.offers_count||0 }} offer</p>
              </div>
              <button @click="deleteSkill(s.id)" class="text-red-400/50 hover:text-red-400 transition-colors text-xl ml-3">×</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Reports ─────────────────────────────────────────────────── -->
      <div v-if="activeTab==='Laporan'" class="space-y-3">
        <div v-if="loadingReports" class="space-y-2">
          <div v-for="i in 4" :key="i" class="bento-muted h-24 animate-pulse rounded-2xl"></div>
        </div>
        <div v-else-if="adminReports.length" class="space-y-3">
          <div v-for="r in adminReports" :key="r.id" class="bento-dark border border-white/10 p-5">
            <div class="flex items-start justify-between gap-3 mb-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap mb-1">
                  <span class="text-white font-semibold text-sm">{{ r.subject }}</span>
                  <span :class="typeClass(r.type)" class="text-xs px-2 py-0.5 rounded-full">{{ typeLabel(r.type) }}</span>
                  <span :class="rStatusClass(r.status)" class="text-xs px-2 py-0.5 rounded-full">{{ rStatusLabel(r.status) }}</span>
                </div>
                <p class="text-white/50 text-xs leading-relaxed">{{ r.description }}</p>
                <div class="flex items-center gap-3 mt-2 text-xs text-white/30">
                  <span>Dari: {{ r.reporter?.name }}</span>
                  <span v-if="r.reported_user">→ {{ r.reported_user?.name }}</span>
                </div>
              </div>
            </div>
            <div v-if="r.status==='pending'" class="flex gap-2 flex-wrap">
              <input v-model="adminNotes[r.id]" type="text" placeholder="Catatan admin..." class="input-light flex-1 !py-1.5 !text-xs"/>
              <button @click="resolveReport(r.id,'resolved')" class="btn-primary !text-xs !px-3 !py-1.5">Selesaikan</button>
              <button @click="resolveReport(r.id,'dismissed')" class="btn-ghost !text-xs !px-3 !py-1.5">Tolak</button>
            </div>
          </div>
        </div>
        <p v-else class="text-white/30 text-center py-12">Tidak ada laporan.</p>
      </div>

      <!-- ── Reward XP ───────────────────────────────────────────────── -->
      <div v-if="activeTab==='Reward XP'">
        <div class="bento-dark border border-white/10 p-5 mb-4">
          <h3 class="font-display text-lg font-bold text-white mb-4">Tambah Reward</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input v-model="newReward.title" type="text" placeholder="Nama reward" class="input-light"/>
            <div class="flex gap-2 items-center">
              <input v-model="newReward.icon" type="text" placeholder="Emoji 🎁" class="input-light w-24 text-center text-2xl"/>
              <label class="btn-ghost !text-xs !px-3 !py-2 cursor-pointer shrink-0">
                {{ newReward.bannerFile ? '✓ Banner' : 'Upload Banner' }}
                <input type="file" accept="image/*" class="hidden" @change="e=>newReward.bannerFile=e.target.files[0]"/>
              </label>
            </div>
            <input v-model.number="newReward.xp_cost" type="number" placeholder="Biaya XP" class="input-light"/>
            <select v-model="newReward.voucher_type" class="input-light cursor-pointer">
              <option value="">Tipe...</option>
              <option value="food">🍔 Makanan</option>
              <option value="transport">🚗 Transport</option>
              <option value="entertainment">🎬 Hiburan</option>
              <option value="other">🎁 Lainnya</option>
            </select>
            <input v-model.number="newReward.stock" type="number" placeholder="Stok" class="input-light"/>
            <textarea v-model="newReward.description" rows="2" placeholder="Deskripsi..." class="input-light resize-none sm:col-span-1"></textarea>
            <button @click="addReward" :disabled="addingReward" class="btn-primary !text-sm sm:col-span-2 flex items-center justify-center gap-2">
              <span v-if="addingReward" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              + Tambah Reward
            </button>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div v-for="r in adminRewards" :key="r.id" class="bento-muted border border-white/5 p-4 relative group">
            <div class="mb-3 rounded-2xl overflow-hidden">
              <img v-if="r.banner_url" :src="r.banner_url" class="w-full h-24 object-cover"/>
              <div v-else class="w-full h-16 bg-white/5 flex items-center justify-center text-4xl">{{ r.icon }}</div>
            </div>
            <p class="text-white font-semibold text-sm">{{ r.title }}</p>
            <p class="text-white/40 text-xs mt-1">{{ r.xp_cost?.toLocaleString() }} XP · Stok: {{ r.stock }}</p>
            <button @click="deleteReward(r.id)"
              class="absolute top-3 right-3 w-7 h-7 bg-red-600/20 text-red-400 rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600/40 flex items-center justify-center">
              ×
            </button>
          </div>
        </div>
      </div>

    </div>

    <!-- Grant premium modal -->
    <div v-if="grantModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="grantModal=null">
      <div class="bento-dark border border-white/10 w-full max-w-sm p-6 animate-scale-in">
        <h3 class="font-display text-lg font-bold text-white mb-4">⭐ Grant Premium ke {{ grantModal?.name }}</h3>
        <div class="space-y-3">
          <div>
            <label class="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Paket</label>
            <select v-model="grantForm.plan_id" class="input-light w-full cursor-pointer">
              <option value="">Pilih paket...</option>
              <option v-for="p in premiumPlans" :key="p.id" :value="p.id">{{ p.name }} ({{ p.duration_days }} hari)</option>
            </select>
          </div>
          <div>
            <label class="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Durasi (hari)</label>
            <input v-model.number="grantForm.days" type="number" min="1" max="365" class="input-light w-full" placeholder="30"/>
          </div>
        </div>
        <div class="flex gap-3 mt-5">
          <button @click="grantModal=null" class="btn-ghost flex-1">Batal</button>
          <button @click="executeGrant" :disabled="!grantForm.plan_id||executingGrant" class="btn-primary flex-1 flex items-center justify-center gap-2">
            <span v-if="executingGrant" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Grant Premium
          </button>
        </div>
      </div>
    </div>

    <!-- Warn/Ban modal -->
    <div v-if="actionModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="actionModal=null">
      <div class="bento-dark border border-white/10 w-full max-w-sm p-6 animate-scale-in">
        <h3 class="font-display text-lg font-bold text-white mb-4">{{ actionModal.title }}</h3>
        <textarea v-model="actionModal.reason" rows="3" placeholder="Alasan..." class="input w-full resize-none mb-4"></textarea>
        <div class="flex gap-3">
          <button @click="actionModal=null" class="btn-ghost flex-1">Batal</button>
          <button @click="executeAction" :disabled="!actionModal.reason||executingAction"
            class="btn-primary flex-1 flex items-center justify-center gap-2">
            <span v-if="executingAction" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Konfirmasi
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const auth  = useAuthStore()
const toast = useToast()

const tabs      = ['Overview','Pengguna','Premium','Skill','Laporan','Reward XP']
const activeTab = ref('Overview')

// Stats
const statsData = ref(null)
const statCards = computed(() => !statsData.value ? [] : [
  { label:'Total Pengguna',  value: statsData.value.users           },
  { label:'Aktif',           value: statsData.value.active_users    },
  { label:'Exchange Selesai',value: statsData.value.completed       },
  { label:'Laporan Pending', value: statsData.value.pending_reports },
])

// Users
const allUsers    = ref([]), loadingUsers = ref(false), userSearch = ref('')
const editingXp   = ref(null), editXpVal = ref(0)
const filteredUsers = computed(() => {
  if (!userSearch.value) return allUsers.value
  const q = userSearch.value.toLowerCase()
  return allUsers.value.filter(u => u.name.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
})

// Premium
const subscriptions       = ref([]), loadingSubscriptions = ref(false)
const premiumPlans        = ref([])
const grantModal          = ref(null), grantForm = ref({ plan_id:'', days:30 }), executingGrant = ref(false)
const premiumStats = computed(() => ({
  total:   subscriptions.value.length,
  active:  subscriptions.value.filter(s => s.status === 'paid').length,
  revenue: subscriptions.value.filter(s => s.status === 'paid').reduce((acc, s) => acc + (s.amount||0), 0),
}))

// Skills
const adminSkills = ref([]), skillCategories = ref([])
const newSkill    = ref({ name:'', category:'' })

// Reports
const adminReports = ref([]), loadingReports = ref(false), adminNotes = ref({})

// Rewards
const adminRewards = ref([]), addingReward = ref(false)
const newReward    = ref({ title:'', icon:'🎁', bannerFile:null, xp_cost:100, voucher_type:'', stock:50, description:'' })

// Broadcast
const broadcastForm = ref({ title:'', body:'' }), broadcastSending = ref(false)

// Action modal
const actionModal = ref(null), executingAction = ref(false)

onMounted(async () => {
  const r = await api.get('/admin/stats')
  statsData.value = r.data
  // Preload premium plans for grant modal
  premiumPlans.value = (await api.get('/premium/plans')).data
})

watch(activeTab, async (t) => {
  if (t === 'Pengguna' && !allUsers.value.length) {
    loadingUsers.value = true
    allUsers.value = (await api.get('/admin/users')).data.data || []
    loadingUsers.value = false
  }
  if (t === 'Premium' && !subscriptions.value.length) {
    loadingSubscriptions.value = true
    subscriptions.value = (await api.get('/admin/subscriptions')).data.data || []
    loadingSubscriptions.value = false
  }
  if (t === 'Skill' && !adminSkills.value.length) {
    const [sR, cR] = await Promise.all([api.get('/admin/skills'), api.get('/skills/categories')])
    adminSkills.value     = sR.data
    skillCategories.value = cR.data
  }
  if (t === 'Laporan' && !adminReports.value.length) {
    loadingReports.value = true
    adminReports.value   = (await api.get('/admin/reports')).data.data || []
    loadingReports.value = false
  }
  if (t === 'Reward XP' && !adminRewards.value.length) {
    adminRewards.value = (await api.get('/admin/xp-rewards')).data
  }
})

function switchTab(t) { activeTab.value = t }

// XP edit
function startEditXp(u) { editingXp.value = u.id; editXpVal.value = u.xp_points }
async function saveXp(u) {
  try {
    const r = await api.put(`/admin/users/${u.id}/xp`, { xp_points: editXpVal.value })
    u.xp_points = editXpVal.value
    editingXp.value = null
    toast.success(r.data.message)
  } catch(e) { toast.error(e.response?.data?.message || 'Gagal.') }
}

// Grant premium
function grantPremium(u) { grantModal.value = u; grantForm.value = { plan_id:'', days:30 } }
async function executeGrant() {
  executingGrant.value = true
  try {
    await api.post(`/admin/users/${grantModal.value.id}/grant-premium`, grantForm.value)
    const u = allUsers.value.find(x => x.id === grantModal.value.id)
    if (u) u.is_premium = true
    toast.success('Premium berhasil diberikan!')
    grantModal.value = null
  } catch(e) { toast.error(e.response?.data?.message || 'Gagal.') }
  finally { executingGrant.value = false }
}

// Warn/ban
function warnUser(u)  { actionModal.value = { title:`Peringatan untuk ${u.name}`, type:'warn',  userId:u.id, reason:'' } }
function banUser(u)   { actionModal.value = { title:`Blokir ${u.name}`,           type:'ban',   userId:u.id, reason:'' } }
function unbanUser(u) { api.post(`/admin/users/${u.id}/unban`).then(() => { u.status='active'; toast.success('Akun dipulihkan.') }) }
function deleteUser(u){ if (!confirm(`Hapus ${u.name}?`)) return; api.delete(`/admin/users/${u.id}`).then(()=>{ allUsers.value=allUsers.value.filter(x=>x.id!==u.id); toast.success('Akun dihapus.') }) }

async function executeAction() {
  executingAction.value = true
  try {
    const { type, userId, reason } = actionModal.value
    await api.post(`/admin/users/${userId}/${type}`, { reason })
    const u = allUsers.value.find(x => x.id === userId)
    if (u) u.status = type==='warn' ? 'warned' : 'banned'
    toast.success(type==='warn' ? 'Peringatan dikirim.' : 'Pengguna diblokir.')
    actionModal.value = null
  } finally { executingAction.value = false }
}

// Skills
async function addSkill() {
  try {
    const r = await api.post('/admin/skills', { name: newSkill.value.name, category: newSkill.value.category })
    adminSkills.value.unshift(r.data)
    newSkill.value = { name:'', category:'' }
    toast.success('Skill ditambahkan!')
  } catch(e) { toast.error(e.response?.data?.message || 'Gagal.') }
}
async function deleteSkill(id) {
  if (!confirm('Hapus skill ini?')) return
  await api.delete(`/admin/skills/${id}`)
  adminSkills.value = adminSkills.value.filter(s => s.id !== id)
}

// Reports
async function resolveReport(id, status) {
  await api.put(`/admin/reports/${id}`, { status, admin_note: adminNotes.value[id]||'' })
  const r = adminReports.value.find(x => x.id === id)
  if (r) { r.status = status; r.admin_note = adminNotes.value[id]||'' }
  toast.success('Laporan diperbarui.')
}

// Broadcast
async function broadcast() {
  if (!broadcastForm.value.title || !broadcastForm.value.body) return
  broadcastSending.value = true
  try {
    const r = await api.post('/admin/broadcast', broadcastForm.value)
    toast.success(r.data.message)
    broadcastForm.value = { title:'', body:'' }
  } finally { broadcastSending.value = false }
}

// Rewards
async function addReward() {
  addingReward.value = true
  try {
    const fd = new FormData()
    Object.entries({ title: newReward.value.title, description: newReward.value.description, icon: newReward.value.icon||'🎁', xp_cost: newReward.value.xp_cost, voucher_type: newReward.value.voucher_type, stock: newReward.value.stock }).forEach(([k,v]) => fd.append(k,v))
    if (newReward.value.bannerFile) fd.append('banner', newReward.value.bannerFile)
    const r = await api.post('/admin/xp-rewards', fd, { headers: { 'Content-Type':'multipart/form-data' } })
    adminRewards.value.unshift(r.data)
    newReward.value = { title:'', icon:'🎁', bannerFile:null, xp_cost:100, voucher_type:'', stock:50, description:'' }
    toast.success('Reward ditambahkan!')
  } catch(e) { toast.error(e.response?.data?.message || 'Gagal.') }
  finally { addingReward.value = false }
}
async function deleteReward(id) {
  if (!confirm('Hapus reward?')) return
  await api.delete(`/admin/xp-rewards/${id}`)
  adminRewards.value = adminRewards.value.filter(r => r.id !== id)
}

// Helpers
function uStatusClass(s)  { return { active:'bg-green-500/20 text-green-400', warned:'bg-amber-500/20 text-amber-400', banned:'bg-red-500/20 text-red-400' }[s]||'' }
function subStatusClass(s){ return { paid:'bg-green-500/20 text-green-400', pending:'bg-amber-500/20 text-amber-400', failed:'bg-red-500/20 text-red-400', expired:'bg-white/10 text-white/40' }[s]||'' }
function typeLabel(t)     { return { rating_abuse:'Rating', skill_request:'Skill Baru', content_violation:'Konten', other:'Lainnya' }[t]||t }
function typeClass(t)     { return { rating_abuse:'bg-red-500/20 text-red-400', skill_request:'bg-blue-500/20 text-blue-400', content_violation:'bg-amber-500/20 text-amber-400', other:'bg-white/10 text-white/40' }[t]||'' }
function rStatusLabel(s)  { return { pending:'Menunggu', reviewed:'Ditinjau', resolved:'Selesai', dismissed:'Ditolak' }[s]||s }
function rStatusClass(s)  { return { pending:'bg-amber-500/20 text-amber-400', resolved:'bg-green-500/20 text-green-400', dismissed:'bg-white/10 text-white/40' }[s]||'' }
function formatDate(d)    { return d ? new Date(d).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}) : '—' }
</script>
