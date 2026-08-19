<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { SteamGame } from '../types/game';
import { fetchFeaturedGames } from '../api';
import GameCard from '../components/GameCard.vue';

const emit = defineEmits<{(e: 'openModal', id: number): void}>();

const popular = ref<SteamGame[]>([]);
const topSellers = ref<SteamGame[]>([]);
const newReleases = ref<SteamGame[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const data = await fetchFeaturedGames();
    popular.value = data.popular;
    topSellers.value = data.topSellers;
    newReleases.value = data.newReleases;
  } catch (err) {
    console.error('Failed to load featured games:', err);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section class="fade-in space-y-10">
    <div>
      <h1 class="font-display text-4xl font-bold tracking-tight uppercase">Discover</h1>
      <p class="font-mono text-xs text-ink/60 mt-1">Explore trending and top-selling Steam titles.</p>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="space-y-8">
      <div v-for="i in 3" :key="i" class="space-y-3">
        <div class="skeleton h-6 w-48 rounded-sm"></div>
        <div class="flex gap-4 overflow-x-auto pb-2">
          <div v-for="j in 6" :key="j" class="skeleton w-44 aspect-3/4 shrink-0 rounded-sm"></div>
        </div>
      </div>
    </div>

    <!-- IGDB-style Sections -->
    <div v-else class="space-y-10">
      <!-- Section 1: Popular Right Now -->
      <section v-if="popular.length">
        <div class="flex items-center justify-between mb-3 border-b border-ink/10 pb-2">
          <h2 class="font-display text-lg uppercase font-extrabold tracking-wider border-b-2 border-stub pb-2 -mb-2.25 text-stub">
            Popular Right Now
          </h2>
        </div>
        <div class="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3">
          <GameCard 
            v-for="game in popular" 
            :key="game.id" 
            :steam-id="game.id" 
            :name="game.name" 
            :image="game.tiny_image"
            @click="emit('openModal', $event)" 
          />
        </div>
      </section>

      <!-- Section 2: Top Sellers -->
      <section v-if="topSellers.length">
        <div class="flex items-center justify-between mb-3 border-b border-ink/10 pb-2">
          <h2 class="font-display text-lg uppercase font-extrabold tracking-wider border-b-2 border-teal pb-2 -mb-2.25 text-teal">
            Top Sellers
          </h2>
        </div>
        <div class="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3">
          <GameCard 
            v-for="game in topSellers" 
            :key="game.id" 
            :steam-id="game.id" 
            :name="game.name" 
            :image="game.tiny_image"
            @click="emit('openModal', $event)"
          />
        </div>
      </section>

      <!-- Section 3: New Releases -->
      <section v-if="newReleases.length">
        <div class="flex items-center justify-between mb-3 border-b border-ink/10 pb-2">
          <h2 class="font-display text-lg uppercase font-extrabold tracking-wider border-b-2 border-ink pb-2 -mb-2.25">
            New & Trending
          </h2>
        </div>
        <div class="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3">
          <GameCard 
            v-for="game in newReleases" 
            :key="game.id" 
            :steam-id="game.id" 
            :name="game.name" 
            :image="game.tiny_image"
            @click="emit('openModal', $event)"
          />
        </div>
      </section>
    </div>
  </section>
</template>