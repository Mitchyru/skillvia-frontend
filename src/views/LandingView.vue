<template>
  <div class="min-h-screen bg-dark font-body overflow-x-hidden">
    <nav class="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl">
      <div class="bg-dark-card/70 backdrop-blur-xl border border-white/10 rounded-3xl px-6 py-3.5 flex items-center justify-between">
        <span class="font-display font-extrabold text-xl text-white flex items-center gap-2">
          Skill<span class="text-red-500">Via</span>
        </span>
        <div class="flex items-center gap-3">
          <router-link to="/login" class="btn-ghost !px-4 !py-2 !text-sm">Masuk</router-link>
          <router-link to="/register" class="btn-primary !px-4 !py-2 !text-sm">Daftar Gratis</router-link>
        </div>
      </div>
    </nav>

    <section class="pt-28 pb-16 px-4 max-w-6xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-auto">
        <div class="bento-dark noise col-span-1 md:col-span-2 row-span-2 p-8 flex flex-col justify-between min-h-[360px]">
          <div>
            <h1 class="font-display text-5xl lg:text-6xl font-extrabold text-white leading-none mb-4 text-balance">
              Tukar<br/><span class="text-red-500">Ilmumu</span>,<br/>Tumbuh Bersama
            </h1>
            <p class="text-white/50 text-base leading-relaxed max-w-sm">
              Kamu jagoan UI/UX? Butuh belajar coding? Cari partner di SkillVia!
            </p>
              <span class="text-red-500"> belajar tanpa bayar, cukup barter keahlian.</span>
          </div>
          <div class="flex flex-wrap gap-3 mt-6">
            <router-link to="/register" class="btn-primary text-base">Mulai Sekarang →</router-link>
            <router-link to="/login" class="btn-ghost text-base">Login</router-link>
          </div>
        </div>

        <div class="bento-white p-6 flex flex-col justify-between min-h-[170px] hover:bg-red-50 transition-colors">
          <div class="text-dark/40 text-xs font-semibold uppercase tracking-wider">Pengguna Aktif</div>
          <div>
            <div class="font-display text-5xl font-extrabold text-dark">
              <span v-if="userCount!==null">{{ userCount.toLocaleString() }}</span>
              <span v-else class="text-dark/20 animate-pulse">...</span>
            </div>
            <div class="text-dark/50 text-sm mt-1">Skill - Matcher bergabung</div>
          </div>
        </div>

        <div class="bento-red p-6 flex flex-col justify-between min-h-[170px]">
          <div class="text-4xl font-display font-extrabold leading-none">Untuk<br/>Kamu 👋</div>
          <p class="text-white/80 text-sm mt-2">Mahasiswa aktif seluruh Indonesia yang ingin belajar dan berbagi.</p>
        </div>

        <div class="bento-muted p-6 col-span-1 md:col-span-2">
          <div class="text-white/40 text-xs font-semibold uppercase tracking-wider mb-4">Cara Kerja</div>
          <div class="space-y-3">
            <div v-for="s in steps" :key="s.num" class="flex items-center gap-3 hover:translate-x-1 transition-transform">
              <div class="w-7 h-7 rounded-xl bg-red-600 flex items-center justify-center text-xs font-bold shrink-0">{{ s.num }}</div>
              <span class="text-white/80 text-sm">{{ s.text }}</span>
            </div>
          </div>
        </div>

        <div class="bento-dark border border-white/10 p-6">
          <div class="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">25+ Kategori Skill</div>
          <div class="flex flex-wrap gap-2">
            <span v-for="c in categories" :key="c"
              class="skill-pill bg-white/8 text-white/70 border border-white/10 text-xs hover:bg-red-600/20 hover:text-red-300 hover:border-red-600/30 transition-all cursor-default">
              {{ c }}
            </span>
          </div>
        </div>

        <div class="bento-white p-6 flex flex-col justify-between min-h-[160px] hover:bg-red-50 transition-colors">
          <div class="font-display text-2xl font-extrabold text-dark leading-tight">Tanpa Biaya,<br/>Pure Ilmu.</div>
          <div class="mt-3 flex items-center gap-2">
            <div class="flex-1 h-1 bg-dark/10 rounded-full"><div class="h-full w-full bg-red-500 rounded-full"></div></div>
            <span class="text-dark/40 text-xs">100% gratis</span>
          </div>
        </div>

        <div class="bento-red noise p-6 col-span-1 md:col-span-2">
          <div class="text-white/80 text-xs font-semibold uppercase tracking-wider mb-4">Badge + Reward XP</div>
          <div class="flex items-center gap-3 flex-wrap mb-3">
            <div v-for="b in badges" :key="b.name" class="flex flex-col items-center gap-1 group hover:scale-110 transition-transform cursor-default">
              <div class="w-12 h-12 bg-white/20 group-hover:bg-white/30 rounded-2xl flex items-center justify-center text-2xl transition-colors">{{ b.icon }}</div>
              <span class="text-white/70 text-[10px]">{{ b.name }}</span>
            </div>
          </div>
          <p class="text-white/60 text-xs">Tukar XP jadi GrabFood, Netflix, Spotify & voucher lainnya!</p>
        </div>

        <div class="bento-dark border border-red-600/30 p-6 flex flex-col justify-between hover:border-red-600/50 transition-colors">
          <div class="font-display text-xl font-bold text-white">Siap mulai barter ilmu?</div>
          <router-link to="/register" class="btn-primary text-center mt-4 block">Daftar Gratis →</router-link>
        </div>
      </div>
    </section>

    <section class="py-16 px-4 max-w-6xl mx-auto">
      <div class="text-center mb-10">
        <h2 class="font-display text-4xl font-extrabold text-white mb-3">Fitur Lengkap</h2>
        <p class="text-white/40 max-w-md mx-auto">Semua yang kamu butuhkan untuk belajar dan mengajar.</p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div v-for="f in features" :key="f.title"
          class="bento-muted p-6 hover:border-red-600/30 border border-transparent transition-all group cursor-default">
          <div class="text-3xl mb-3 group-hover:animate-float">{{ f.icon }}</div>
          <h3 class="font-display text-lg font-bold text-white mb-1">{{ f.title }}</h3>
          <p class="text-white/40 text-sm leading-relaxed">{{ f.desc }}</p>
        </div>
      </div>
    </section>

    <footer class="py-8 px-4 text-center text-white/20 text-sm border-t border-white/5">
      <span class="font-display font-bold text-white/40">SKILLVIA - BARTER ILMU NO BIAYA</span> 
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
const userCount = ref(null)
onMounted(async()=>{ try { const r=await api.get('/users/count'); userCount.value=r.data.count } catch { userCount.value=0 } })
const steps=[{num:'1',text:'Daftar & isi skill yang kamu kuasai dan ingin pelajari'},{num:'2',text:'Sistem mencocokkan kamu dengan partner yang pas'},{num:'3',text:'Chat, jadwalkan sesi, dan mulai belajar bersama'},{num:'4',text:'Selesai → sertifikat digital + XP yang bisa ditukar reward!'}]
const categories=['UI/UX','Coding','Data','Desain','Bahasa','Marketing','IT','Musik','Bisnis','Soft Skill']
const badges=[{icon:'⭐',name:'Pemula'},{icon:'📚',name:'Tutor'},{icon:'🧭',name:'Penjelajah'},{icon:'🎓',name:'Cendekia'},{icon:'🏆',name:'Maestro'}]
const features=[
  {icon:'🤝',title:'Smart Matching',    desc:'Algoritma mencocokkan skill offer & want secara otomatis.'},
  {icon:'💬',title:'Chat + Attachment', desc:'Chat real-time + upload file, gambar, dan dokumen.'},
  {icon:'📅',title:'Session Booking',   desc:'Jadwalkan sesi dengan notifikasi otomatis kedua pihak.'},
  {icon:'🤖',title:'AI Quiz Generator', desc:'Buat soal quiz otomatis dengan AI sesuai topik.'},
  {icon:'🏆',title:'Gamifikasi Penuh',  desc:'XP, level, badge, leaderboard, dan misi belajar.'},
  {icon:'🎁',title:'Reward Store',      desc:'Tukar XP dengan voucher GrabFood, Netflix, Spotify.'},
  {icon:'🎓',title:'Sertifikat Digital',desc:'Bukti kompetensi otomatis setiap exchange selesai.'},
  {icon:'📋',title:'Laporan & Saran',   desc:'Laporkan masalah atau sarankan skill baru ke admin.'},
]
</script>
