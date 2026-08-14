<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { RAWGGame } from '../types/game.ts';
import { fetchRawg } from '../api/index.ts';
import GameCard from '../components/GameCard.vue';

const emit = defineEmits<{(e: 'openModal', id: number): void}>();

const trending = ref<RAWGGame[]>([]);
const topRated = ref<RAWGGame[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const [tData, rData] = await Promise.all([
      fetchRawg<{ results: RAWGGame[] }>('/games', { ordering: '-added', page_size: 12 }),
      fetchRawg<{ results: RAWGGame[] }>('/games', { ordering: '-rating', page_size: 12 }),
    ]);
    trending.value = tData.results;
    topRated.value = rData.results;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section class="fade-in">
    <div class="mb-8">
      <h1 class="font-display text-5xl tracking-wide">Discover</h1>
      <p class="font-mono text-sm text-ink/60 mt-1">Fresh titles pulled straight off the RAWG catalog.</p>
    </div>

    <div class="space-y-10">
      <div>
        <h2 class="font-display text-2xl tracking-wide text-stub mb-3">Trending Now</h2>
        <div class="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2">
          <GameCard 
            v-for="game in trending" 
            :key="game.id" 
            :rawg-id="game.id" 
            :name="game.name" 
            :image="game.background_image"
            :rating-chip="game.rating ? `★ ${game.rating.toFixed(1)}` : null"
            @click="emit('openModal', game.id)" 
          />
        </div>
      </div>

      <div>
        <h2 class="font-display text-2xl tracking-wide text-teal mb-3">Top Rated</h2>
        <div class="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2">
          <GameCard 
            v-for="game in topRated" 
            :key="game.id" 
            :rawg-id="game.id" 
            :name="game.name" 
            :image="game.background_image"
            :rating-chip="game.rating ? `★ ${game.rating.toFixed(1)}` : null"
            @click="emit('openModal', game.id)" 
          />
        </div>
      </div>
    </div>
  </section>
</template>