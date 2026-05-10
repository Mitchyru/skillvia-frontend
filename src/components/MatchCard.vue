<template>
  <div class="bento-dark border border-white/10 hover:border-red-600/40 transition-all group p-5 flex flex-col gap-4">
    <!-- Header -->
    <div class="flex items-start gap-3">
      <img :src="match.avatar_url" :alt="match.name" class="w-12 h-12 rounded-2xl object-cover shrink-0 ring-2 ring-white/10 group-hover:ring-red-500 transition-all" />
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="font-semibold text-white text-sm truncate">{{ match.name }}</span>
          <span class="bg-red-600/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-600/20">
            Lv.{{ match.level ?? 1 }}
          </span>
        </div>
        <p class="text-white/40 text-xs truncate">{{ match.institution }}</p>
        <!-- Rating -->
        <div v-if="match.avg_rating" class="flex items-center gap-1 mt-1">
          <span class="text-amber-400 text-xs">★</span>
          <span class="text-white/50 text-xs">{{ Number(match.avg_rating).toFixed(1) }}</span>
        </div>
      </div>
      <!-- Match score -->
      <div class="flex flex-col items-center bg-red-600/10 rounded-xl px-2.5 py-1.5 border border-red-600/20 shrink-0">
        <span class="text-red-400 font-display font-black text-lg leading-none">{{ match.match_score }}</span>
        <span class="text-red-400/60 text-[9px]">match</span>
      </div>
    </div>

    <!-- Skills they offer that I want -->
    <div v-if="match.matching_offers?.length">
      <p class="text-white/30 text-[10px] font-semibold uppercase tracking-wider mb-1.5">Mereka bisa mengajarimu</p>
      <div class="flex flex-wrap gap-1.5">
        <span v-for="s in match.matching_offers.slice(0,3)" :key="s.id" class="skill-pill-offer text-xs">
          {{ s.skill?.name }}
        </span>
      </div>
    </div>

    <!-- Skills they want that I offer -->
    <div v-if="match.matching_wants?.length">
      <p class="text-white/30 text-[10px] font-semibold uppercase tracking-wider mb-1.5">Mereka ingin belajar</p>
      <div class="flex flex-wrap gap-1.5">
        <span v-for="s in match.matching_wants.slice(0,3)" :key="s.id" class="skill-pill-want text-xs">
          {{ s.skill?.name }}
        </span>
      </div>
    </div>

    <button @click="$emit('exchange', match)" class="btn-primary !py-2 !text-sm w-full text-center mt-auto">
      Ajukan Pertukaran →
    </button>
  </div>
</template>

<script setup>
defineProps({ match: { type: Object, required: true } })
defineEmits(['exchange'])
</script>
