<template>
  <div class="min-h-screen bg-dark flex items-center justify-center px-4 py-20">
    <div class="w-full max-w-md animate-fade-up">

      <div class="text-center mb-8">
        <router-link to="/" class="inline-flex items-center gap-2 font-display text-3xl font-extrabold text-white">
          Skill<span class="text-red-500">Via</span>
        </router-link>
        <p class="text-white/40 text-sm mt-2">Buat akun dan mulai barter ilmumu</p>
      </div>

      <div class="bento-dark border border-white/10 p-8">
        <h2 class="font-display text-2xl font-bold text-white mb-6">Daftar sekarang</h2>

        <form @submit.prevent="handleRegister" class="space-y-4">
          <div>
            <label class="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Nama Lengkap</label>
            <input v-model="form.name" type="text" placeholder="Nama kamu" class="input" required />
          </div>
          <div>
            <label class="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Email</label>
            <input v-model="form.email" type="email" placeholder="email@kampus.ac.id" class="input" required />
          </div>
          <div>
            <label class="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Institusi / Kampus</label>
            <input v-model="form.institution" type="text" placeholder="Universitas / Politeknik" class="input" required />
          </div>
          <div>
            <label class="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Password</label>
            <input v-model="form.password" type="password" placeholder="Min. 8 karakter" class="input" required />
          </div>
          <div>
            <label class="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Konfirmasi Password</label>
            <input v-model="form.password_confirmation" type="password" placeholder="Ulangi password" class="input" required />
          </div>

          <div v-if="errors.length" class="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-2xl space-y-1">
            <p v-for="e in errors" :key="e">{{ e }}</p>
          </div>

          <button type="submit" :disabled="loading"
            class="btn-primary w-full text-center flex items-center justify-center gap-2 mt-2">
            <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span>{{ loading ? 'Mendaftarkan...' : 'Buat Akun' }}</span>
          </button>
        </form>

        <div class="mt-6 pt-6 border-t border-white/10 text-center">
          <p class="text-white/40 text-sm">
            Sudah punya akun?
            <router-link to="/login" class="text-red-400 font-semibold hover:text-red-300 transition-colors ml-1">
              Masuk →
            </router-link>
          </p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'

const auth   = useAuthStore()
const router = useRouter()
const toast  = useToast()

const form    = ref({ name: '', email: '', institution: '', password: '', password_confirmation: '' })
const loading = ref(false)
const errors  = ref([])

async function handleRegister() {
  loading.value = true
  errors.value  = []
  try {
    await auth.register(form.value)
    toast.success('Akun berhasil dibuat! Selamat datang di SkillVia 🎉')
    router.push('/dashboard')
  } catch (e) {
    const data = e.response?.data
    if (data?.errors) {
      errors.value = Object.values(data.errors).flat()
    } else {
      errors.value = [data?.message || 'Terjadi kesalahan.']
    }
  } finally {
    loading.value = false
  }
}
</script>
