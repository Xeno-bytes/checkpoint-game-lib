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

// Section Scroll References
const popularRef = ref<HTMLElement | null>(null);
const topSellersRef = ref<HTMLElement | null>(null);
const newReleasesRef = ref<HTMLElement | null>(null);

function scrollSection(container: HTMLElement | null, direction: 'left' | 'right') {
  if (!container) return;

  const scrollAmount = container.clientWidth * 0.75;
  const maxScroll = container.scrollWidth - container.clientWidth;
  const currentScroll = container.scrollLeft;

  if (direction === 'right') {
    if (Math.ceil(currentScroll) >= maxScroll - 10) {
      container.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  } else {
    if (currentScroll <= 10) {
      container.scrollTo({ left: maxScroll, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  }
}

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
  <section class="fade-in space-y-8 sm:space-y-10">
    <div>
      <h1 class="font-display text-3xl sm:text-4xl font-bold tracking-tight uppercase">Discover</h1>
      <p class="font-mono text-xs text-ink/60 mt-1">Explore trending and top-selling Steam titles.</p>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="space-y-8">
      <div v-for="i in 3" :key="i" class="space-y-3">
        <div class="skeleton h-6 w-36 sm:w-48 rounded-sm"></div>
        <div class="flex gap-3 sm:gap-4 overflow-x-auto pb-2">
          <div v-for="j in 6" :key="j" class="skeleton w-44 sm:w-56 aspect-video shrink-0 rounded-sm"></div>
        </div>
      </div>
    </div>

    <!-- Interactive Game Shelves -->
    <div v-else class="space-y-8 sm:space-y-10">
      
      <!-- Section 1: Popular Right Now -->
      <section v-if="popular.length" class="relative group/shelf">
        <div class="flex items-center justify-between mb-3 border-b border-ink/10 pb-2">
          <h2 class="font-display text-base sm:text-lg uppercase font-extrabold tracking-wider border-b-2 border-stub pb-2 -mb-2.25 text-stub">
            Popular Right Now
          </h2>

          <!-- Enhanced High-Visibility Scroll Controls -->
          <div class="flex items-center gap-2">
            <button 
              @click="scrollSection(popularRef, 'left')"
              class="w-8 h-8 rounded-full bg-ink text-paper hover:bg-stub transition-all shadow-md hover:scale-105 active:scale-95 font-mono text-base flex items-center justify-center border border-paper/20 cursor-pointer"
              title="Scroll Left (Loops to end)"
            >
              ‹
            </button>
            <button 
              @click="scrollSection(popularRef, 'right')"
              class="w-8 h-8 rounded-full bg-ink text-paper hover:bg-stub transition-all shadow-md hover:scale-105 active:scale-95 font-mono text-base flex items-center justify-center border border-paper/20 cursor-pointer"
              title="Scroll Right (Loops to start)"
            >
              ›
            </button>
          </div>
        </div>

        <!-- Shelf Track -->
        <div class="relative shelf-mask">
          <div 
            ref="popularRef"
            class="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory pb-4 pt-1 px-1 custom-shelf-scroll scroll-smooth"
          >
            <GameCard 
              v-for="game in popular" 
              :key="game.id" 
              :steam-id="game.id" 
              :name="game.name" 
              :image="game.tiny_image"
              @click="emit('openModal', $event)" 
            />
          </div>
        </div>
      </section>

      <!-- Section 2: Top Sellers -->
      <section v-if="topSellers.length" class="relative group/shelf">
        <div class="flex items-center justify-between mb-3 border-b border-ink/10 pb-2">
          <h2 class="font-display text-base sm:text-lg uppercase font-extrabold tracking-wider border-b-2 border-teal pb-2 -mb-2.25 text-teal">
            Top Sellers
          </h2>

          <!-- Enhanced High-Visibility Scroll Controls -->
          <div class="flex items-center gap-2">
            <button 
              @click="scrollSection(topSellersRef, 'left')"
              class="w-8 h-8 rounded-full bg-ink text-paper hover:bg-teal transition-all shadow-md hover:scale-105 active:scale-95 font-mono text-base flex items-center justify-center border border-paper/20 cursor-pointer"
              title="Scroll Left (Loops to end)"
            >
              ‹
            </button>
            <button 
              @click="scrollSection(topSellersRef, 'right')"
              class="w-8 h-8 rounded-full bg-ink text-paper hover:bg-teal transition-all shadow-md hover:scale-105 active:scale-95 font-mono text-base flex items-center justify-center border border-paper/20 cursor-pointer"
              title="Scroll Right (Loops to start)"
            >
              ›
            </button>
          </div>
        </div>

        <div class="relative shelf-mask">
          <div 
            ref="topSellersRef"
            class="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory pb-4 pt-1 px-1 custom-shelf-scroll scroll-smooth"
          >
            <GameCard 
              v-for="game in topSellers" 
              :key="game.id" 
              :steam-id="game.id" 
              :name="game.name" 
              :image="game.tiny_image"
              @click="emit('openModal', $event)"
            />
          </div>
        </div>
      </section>

      <!-- Section 3: New Releases -->
      <section v-if="newReleases.length" class="relative group/shelf">
        <div class="flex items-center justify-between mb-3 border-b border-ink/10 pb-2">
          <h2 class="font-display text-base sm:text-lg uppercase font-extrabold tracking-wider border-b-2 border-ink pb-2 -mb-2.25">
            New & Trending
          </h2>

          <!-- Enhanced High-Visibility Scroll Controls -->
          <div class="flex items-center gap-2">
            <button 
              @click="scrollSection(newReleasesRef, 'left')"
              class="w-8 h-8 rounded-full bg-ink text-paper hover:bg-tag hover:text-ink transition-all shadow-md hover:scale-105 active:scale-95 font-mono text-base flex items-center justify-center border border-paper/20 cursor-pointer"
              title="Scroll Left (Loops to end)"
            >
              ‹
            </button>
            <button 
              @click="scrollSection(newReleasesRef, 'right')"
              class="w-8 h-8 rounded-full bg-ink text-paper hover:bg-tag hover:text-ink transition-all shadow-md hover:scale-105 active:scale-95 font-mono text-base flex items-center justify-center border border-paper/20 cursor-pointer"
              title="Scroll Right (Loops to start)"
            >
              ›
            </button>
          </div>
        </div>

        <div class="relative shelf-mask">
          <div 
            ref="newReleasesRef"
            class="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory pb-4 pt-1 px-1 custom-shelf-scroll scroll-smooth"
          >
            <GameCard 
              v-for="game in newReleases" 
              :key="game.id" 
              :steam-id="game.id" 
              :name="game.name" 
              :image="game.tiny_image"
              @click="emit('openModal', $event)"
            />
          </div>
        </div>
      </section>

    </div>
  </section>
</template>
