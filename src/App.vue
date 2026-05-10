<template>
  <div class="min-h-screen bg-dark font-body">
    <AppNavbar v-if="auth.isAuth" />
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
import AppNavbar from '@/components/AppNavbar.vue'
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
</script>
