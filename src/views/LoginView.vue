<template>
  <div class="min-h-screen bg-dark flex items-center justify-center px-4 py-20">
    <div class="w-full max-w-md animate-fade-up">

      <!-- Logo -->
      <div class="text-center mb-8">
        <router-link to="/" class="inline-flex items-center gap-2 font-display text-3xl font-extrabold text-white">
          Skill<span class="text-red-500">Via</span>
        </router-link>
        <p class="text-white/40 text-sm mt-2">Masuk dan lanjutkan barter ilmumu</p>
      </div>

      <!-- Card -->
      <div class="bento-dark border border-white/10 p-8">
        <h2 class="font-display text-2xl font-bold text-white mb-6">Selamat datang kembali</h2>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Email</label>
            <input v-model="form.email" type="email" placeholder="email@kampus.ac.id"
              class="input" required autocomplete="email" />
          </div>
          <div>
            <label class="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Password</label>
            <input v-model="form.password" type="password" placeholder="••••••••"
              class="input" required autocomplete="current-password" />
          </div>

          <!-- Error -->
          <div v-if="error" class="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-2xl">
            {{ error }}
          </div>

          <button type="submit" :disabled="loading"
            class="btn-primary w-full text-center flex items-center justify-center gap-2 mt-2">
            <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span>{{ loading ? 'Memproses...' : 'Masuk' }}</span>
          </button>
        </form>

        <div class="mt-6 pt-6 border-t border-white/10 text-center">
          <p class="text-white/40 text-sm">
            Belum punya akun?
            <router-link to="/register" class="text-red-400 font-semibold hover:text-red-300 transition-colors ml-1">
              Daftar gratis →
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

const form    = ref({ email: '', password: '' })
const loading = ref(false)
const error   = ref('')

async function handleLogin() {
  loading.value = true
  error.value   = ''
  try {
    await auth.login(form.value.email, form.value.password)
    toast.success('Selamat datang kembali!')
    router.push('/dashboard')
  } catch (e) {
    error.value = e.response?.data?.message || 'Email atau password salah.'
  } finally {
    loading.value = false
  }
}
</script>
