<template>
  <div class="min-h-screen bg-dark pt-24 pb-16 px-4">
    <div class="max-w-4xl mx-auto">

      <div v-if="loading" class="space-y-3">
        <div class="bento-muted h-48 animate-pulse rounded-3xl"></div>
        <div class="grid grid-cols-2 gap-3">
          <div class="bento-muted h-48 animate-pulse rounded-3xl"></div>
          <div class="bento-muted h-48 animate-pulse rounded-3xl"></div>
        </div>
      </div>

      <template v-else-if="profile">

        <!-- Profile header -->
        <div class="bento-dark border border-white/10 p-6 mb-3 flex flex-col sm:flex-row items-start gap-5">

          <!-- Avatar with upload -->
          <div class="relative shrink-0 group">
            <img :src="profile.avatar_url" class="w-24 h-24 rounded-3xl object-cover ring-4 ring-white/10" />
            <label v-if="isOwn"
              class="absolute inset-0 bg-black/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <span class="text-white text-xs font-semibold">Ganti Foto</span>
              <input type="file" accept="image/*" class="hidden" @change="uploadAvatar" />
            </label>
            <div v-if="uploadingAvatar" class="absolute inset-0 bg-dark-card/80 rounded-3xl flex items-center justify-center">
              <span class="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></span>
            </div>
          </div>

          <div class="flex-1">
            <div class="flex flex-wrap items-start gap-3">
              <div>
                <h1 class="font-display text-3xl font-extrabold text-white">{{ profile.name }}</h1>
                <p class="text-white/40 text-sm mt-0.5 flex items-center gap-2">
                  <span>{{ profile.institution }}</span>
                  <span v-if="profile.location" class="text-white/30">·</span>
                  <span v-if="profile.location" class="flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    {{ profile.location }}
                  </span>
                </p>
              </div>
              <span class="bg-red-600/20 text-red-400 text-xs font-bold px-3 py-1 rounded-full border border-red-600/20 mt-1">
                {{ profile.level_name }} · Lv.{{ profile.level }}
              </span>
              <!-- Rating badge -->
              <div v-if="profile.avg_rating" class="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full mt-1">
                <span class="text-amber-400">★</span>
                <span class="text-amber-300 text-xs font-bold">{{ Number(profile.avg_rating).toFixed(1) }}</span>
                <span class="text-white/30 text-xs">({{ profile.rating_count }})</span>
              </div>
            </div>
            <p v-if="profile.bio" class="text-white/50 text-sm mt-3 max-w-lg">{{ profile.bio }}</p>
            <div class="mt-4 max-w-xs">
              <div class="flex justify-between text-xs text-white/30 mb-1">
                <span>{{ profile.xp_points }} XP</span>
                <span>Lv.{{ (profile.level||1)+1 }}</span>
              </div>
              <div class="xp-bar"><div class="xp-fill" :style="{width:xpPct+'%'}"></div></div>
            </div>
            <div class="mt-4 flex gap-2 flex-wrap">
              <button v-if="isOwn" @click="editMode=!editMode" class="btn-ghost !text-sm !px-4 !py-2">
                {{ editMode ? 'Batal' : 'Edit Profil' }}
              </button>
              <router-link v-if="!isOwn" :to="`/chat`"
                class="btn-primary !text-sm !px-4 !py-2">
                Kirim Pesan
              </router-link>
            </div>
          </div>
        </div>

        <!-- Edit form -->
        <div v-if="editMode && isOwn" class="bento-muted border border-white/10 p-6 mb-3 animate-fade-in">
          <h3 class="font-display text-lg font-bold text-white mb-4">Edit Profil</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label class="label-xs">Nama</label><input v-model="editForm.name" class="input"/></div>
            <div><label class="label-xs">Institusi</label><input v-model="editForm.institution" class="input"/></div>
            <div><label class="label-xs">Lokasi</label><input v-model="editForm.location" placeholder="Jakarta, Indonesia" class="input"/></div>
            <div><label class="label-xs">Bio</label><textarea v-model="editForm.bio" rows="2" class="input resize-none"></textarea></div>
          </div>
          <button @click="saveProfile" :disabled="saving" class="btn-primary mt-4 !text-sm flex items-center gap-2">
            <span v-if="saving" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Simpan
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">

          <!-- Skill Offers -->
          <div class="bento-dark border border-white/10 p-5">
            <div class="flex items-center justify-between mb-4">
              <span class="text-white/50 text-xs font-semibold uppercase tracking-wider">Skill Ditawarkan</span>
            </div>
            <div class="flex flex-wrap gap-2 mb-4">
              <span v-for="s in profile.skill_offers" :key="s.id" class="skill-pill-offer group/s hover:bg-red-700 transition-colors">
                {{ s.skill?.name }}
                <button v-if="isOwn" @click="removeOffer(s.id)" class="ml-1 text-white/50 hover:text-white transition-colors text-xs leading-none">×</button>
              </span>
              <p v-if="!profile.skill_offers?.length" class="text-white/30 text-sm">Belum ada.</p>
            </div>
            <div v-if="isOwn" class="flex gap-2">
              <select v-model="newOffer" class="input-light flex-1 text-sm cursor-pointer">
                <option value="">+ Tambah skill offer...</option>
                <option v-for="s in allSkills" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
              <button @click="addOffer" :disabled="!newOffer" class="btn-primary !px-3 !py-2 !text-sm">+</button>
            </div>
          </div>

          <!-- Skill Wants -->
          <div class="bento-dark border border-white/10 p-5">
            <span class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4 block">Ingin Belajar</span>
            <div class="flex flex-wrap gap-2 mb-4">
              <span v-for="s in profile.skill_wants" :key="s.id" class="skill-pill-want hover:bg-white/20 transition-colors">
                {{ s.skill?.name }}
                <button v-if="isOwn" @click="removeWant(s.id)" class="ml-1 text-white/50 hover:text-white text-xs">×</button>
              </span>
              <p v-if="!profile.skill_wants?.length" class="text-white/30 text-sm">Belum ada.</p>
            </div>
            <div v-if="isOwn" class="flex gap-2">
              <select v-model="newWant" class="input-light flex-1 text-sm cursor-pointer">
                <option value="">+ Tambah skill want...</option>
                <option v-for="s in allSkills" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
              <button @click="addWant" :disabled="!newWant" class="btn-primary !px-3 !py-2 !text-sm">+</button>
            </div>
          </div>

          <!-- Badges with tooltip -->
          <div class="bento-red noise p-5 overflow-visible">
            <p class="text-white/70 text-xs font-semibold uppercase tracking-wider mb-4">Badge yang Diraih</p>
            <div class="grid grid-cols-5 gap-2">
              <div v-for="b in allBadges" :key="b.id"
                class="relative flex flex-col items-center gap-1 group/b cursor-pointer"
                @mouseenter="hoverBadge=b" @mouseleave="hoverBadge=null">
                <div :class="['w-11 h-11 rounded-2xl flex items-center justify-center text-xl transition-all',
                  hasBadge(b.id) ? 'bg-white/25 hover:bg-white/35 scale-100 hover:scale-105' : 'bg-black/20 opacity-40']">
                  {{ badgeIcon(b.icon) }}
                </div>
                <span class="text-white/60 text-[9px] text-center leading-tight">{{ b.name }}</span>
                <!-- Tooltip -->
                <div v-if="hoverBadge?.id===b.id"
                  class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-9999 w-44 bg-dark-card border border-white/20 rounded-2xl p-3 shadow-xl animate-fade-in pointer-events-none">
                  <p class="text-white font-semibold text-xs mb-1">{{ b.name }}</p>
                  <p class="text-white/50 text-[11px] leading-relaxed">{{ b.description }}</p>
                  <p class="text-red-400 text-[11px] mt-1.5 font-medium">
                    {{ b.requirement_type==='xp' ? `Butuh ${b.requirement_value} XP` : `Selesaikan ${b.requirement_value} sesi` }}
                  </p>
                  <p v-if="hasBadge(b.id)" class="text-green-400 text-[11px] mt-0.5">✓ Sudah diraih!</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Certificates -->
          <div class="bento-muted border border-white/5 p-5">
            <p class="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4">Sertifikat Digital</p>
            <div class="space-y-2">
              <div v-for="cert in profile.certificates" :key="cert.id"
                class="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-xl p-3 transition-colors">
                <span class="text-2xl">🎓</span>
                <div>
                  <p class="text-white font-semibold text-sm">{{ cert.skill?.name }}</p>
                  <p class="text-white/40 text-xs">Diterbitkan {{ formatDate(cert.issued_at) }}</p>
                </div>
              </div>
              <p v-if="!profile.certificates?.length" class="text-white/30 text-sm">Selesaikan exchange untuk mendapat sertifikat.</p>
            </div>
          </div>

          <!-- Ratings/Reviews -->
          <div class="bento-dark border border-white/10 p-5 col-span-1 md:col-span-2">
            <div class="flex items-center gap-3 mb-4">
              <span class="text-white/50 text-xs font-semibold uppercase tracking-wider">Ulasan dari Partner</span>
              <div v-if="ratings.length" class="flex items-center gap-1.5 ml-auto">
                <span class="text-amber-400 text-lg">★</span>
                <span class="font-display text-lg font-bold text-white">{{ avgRating }}</span>
                <span class="text-white/30 text-xs">({{ ratings.length }} ulasan)</span>
              </div>
            </div>
            <div v-if="ratings.length" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div v-for="r in ratings" :key="r.id" class="bg-white/5 rounded-2xl p-4">
                <div class="flex items-center gap-2 mb-2">
                  <img :src="r.rater?.avatar_url" class="w-7 h-7 rounded-full object-cover" />
                  <span class="text-white text-sm font-medium">{{ r.rater?.name }}</span>
                  <span class="ml-auto text-amber-400 text-sm">{{ '★'.repeat(r.score) }}</span>
                </div>
                <p v-if="r.comment" class="text-white/50 text-xs leading-relaxed italic">"{{ r.comment }}"</p>
              </div>
            </div>
            <p v-else class="text-white/30 text-sm">Belum ada ulasan.</p>
          </div>

        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const auth  = useAuthStore()
const route = useRoute()
const toast = useToast()

const profile       = ref(null)
const loading       = ref(true)
const editMode      = ref(false)
const saving        = ref(false)
const editForm      = ref({})
const allSkills     = ref([])
const allBadges     = ref([])
const newOffer      = ref('')
const newWant       = ref('')
const ratings       = ref([])
const avgRating     = ref('0.0')
const uploadingAvatar= ref(false)
const hoverBadge    = ref(null)

const isOwn  = computed(()=> !route.params.id || Number(route.params.id)===auth.user?.id)
const xpPct  = computed(()=>{
  if (!profile.value) return 0
  const base = ((profile.value.level||1)-1)*100
  return Math.min(100,((profile.value.xp_points-base)/100)*100)
})

onMounted(async ()=>{
  const id  = route.params.id || 'me'
  const url = id==='me' ? '/me' : `/users/${id}`
  try {
    const [pRes,sRes,bRes] = await Promise.all([api.get(url), api.get('/skills'), api.get('/badges')])
    profile.value   = pRes.data
    allSkills.value = sRes.data
    allBadges.value = bRes.data
    editForm.value  = { name:profile.value.name, bio:profile.value.bio, institution:profile.value.institution, location:profile.value.location }

    const uid = profile.value.id
    const rRes = await api.get(`/ratings/user/${uid}`)
    ratings.value  = rRes.data.ratings
    avgRating.value= rRes.data.average ?? '0.0'
  } catch(e){ console.error(e) }
  finally { loading.value=false }
})

async function saveProfile() {
  saving.value=true
  try {
    await api.put('/users/profile', editForm.value)
    await auth.refreshUser()
    profile.value={...profile.value,...editForm.value}
    editMode.value=false
    toast.success('Profil diperbarui!')
  } catch { toast.error('Gagal menyimpan.') }
  finally { saving.value=false }
}

async function uploadAvatar(e) {
  const file=e.target.files[0]
  if (!file) return
  uploadingAvatar.value=true
  try {
    const fd=new FormData()
    fd.append('avatar',file)
    const res=await api.post('/users/avatar',fd,{headers:{'Content-Type':'multipart/form-data'}})
    profile.value.avatar_url=res.data.avatar_url
    auth.user.avatar_url=res.data.avatar_url
    toast.success('Foto profil diperbarui!')
  } catch { toast.error('Gagal upload foto.') }
  finally { uploadingAvatar.value=false }
}

async function addOffer() {
  if (!newOffer.value) return
  try {
    const r=await api.post('/skills/offer',{skill_id:newOffer.value})
    profile.value.skill_offers=[...(profile.value.skill_offers||[]),r.data]
    newOffer.value=''
    toast.success('Skill yang ingin ditawar berhasil ditambahkan!')
  } catch(e){ toast.error(e.response?.data?.message||'Gagal.') }
}
async function addWant() {
  if (!newWant.value) return
  try {
    const r=await api.post('/skills/want',{skill_id:newWant.value})
    profile.value.skill_wants=[...(profile.value.skill_wants||[]),r.data]
    newWant.value=''
    toast.success('Skill yang ingin dipelajari berhasil ditambahkan!')
  } catch(e){ toast.error(e.response?.data?.message||'Gagal.') }
}
async function removeOffer(id) {
  await api.delete(`/skills/offer/${id}`)
  profile.value.skill_offers=profile.value.skill_offers.filter(s=>s.id!==id)
}
async function removeWant(id) {
  await api.delete(`/skills/want/${id}`)
  profile.value.skill_wants=profile.value.skill_wants.filter(s=>s.id!==id)
}

function hasBadge(id) { return profile.value?.badges?.some(b=>b.id===id) }
function badgeIcon(i) { return {star:'⭐',book:'📚',compass:'🧭',academic:'🎓',trophy:'🏆'}[i]||'🏅' }
function formatDate(d) { return new Date(d).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}) }
</script>

<style scoped>
.label-xs { @apply block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2; }
</style>
