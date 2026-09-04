<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { SteamGame, LibraryItem, GameDetails } from '../types/game';
import { fetchFeaturedGames, fetchGameDetails } from '../api';
import GameCard from '../components/GameCard.vue';
import { useLibraryStore } from '../stores/library';

const emit = defineEmits<{
  (e: 'openModal', steamId: number, entry?: LibraryItem): void;
  (e: 'toast', msg: string, isError?: boolean): void;
}>();

const libraryStore = useLibraryStore();

// Shelves Collections
const featured = ref<SteamGame[]>([]);
const topSellers = ref<SteamGame[]>([]);
const newReleases = ref<SteamGame[]>([]);
const surpriseMe = ref<SteamGame[]>([]);

// Reactive map computed directly from the Pinia store
const userLibraryMap = computed(() => {
  const libMap = new Map<number, LibraryItem>();
  libraryStore.items.forEach((item: any) => {
    const appId = Number(item.appId || item.steam_id || item.steamId);
    if (appId) {
      const libItem: LibraryItem = {
        id: item._id || item.id,
        steam_id: appId,
        name: item.name,
        background_image: item.background_image,
        status: item.status,
        rating: item.rating,
        hoursPlayed: item.playtimeHours ?? item.hoursPlayed ?? null,
        notes: item.reviewContent || item.notes || '',
      };
      libMap.set(appId, libItem);
    }
  });
  return libMap;
});

// Spotlight Hero State
const spotlightCandidates = ref<GameDetails[]>([]);
const currentSpotlightIndex = ref(0);
const loadingSpotlight = ref(true);

// Page loading
const loading = ref(true);

// Scroll Shelf Refs
const featuredRef = ref<HTMLElement | null>(null);
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

function handleCardClick(gameId: number) {
  const existingEntry = userLibraryMap.value.get(gameId);
  emit('openModal', gameId, existingEntry);
}

// Hero Carousel Navigation
function nextSpotlight() {
  if (!spotlightCandidates.value.length) return;
  currentSpotlightIndex.value = (currentSpotlightIndex.value + 1) % spotlightCandidates.value.length;
}

function prevSpotlight() {
  if (!spotlightCandidates.value.length) return;
  currentSpotlightIndex.value =
    (currentSpotlightIndex.value - 1 + spotlightCandidates.value.length) % spotlightCandidates.value.length;
}

const currentSpotlightGame = computed(() => {
  return spotlightCandidates.value[currentSpotlightIndex.value] || null;
});

async function loadSpotlightHeroBanner(relevanceGames: SteamGame[]) {
  loadingSpotlight.value = true;
  try {
    const fetchedDetails: GameDetails[] = [];
    for (const game of relevanceGames.slice(0, 10)) {
      try {
        const details = await fetchGameDetails(game.id);
        if (details) fetchedDetails.push(details);
      } catch {}
    }
    spotlightCandidates.value = fetchedDetails;
  } catch (err) {
    console.error('Error constructing Hero Spotlight:', err);
  } finally {
    loadingSpotlight.value = false;
  }
}

onMounted(async () => {
  loading.value = true;
  try {
    const [data] = await Promise.all([
      fetchFeaturedGames(),
      libraryStore.loadLibrary()
    ]);

    featured.value = data.featured || [];
    topSellers.value = data.topSellers || [];
    newReleases.value = data.newReleases || [];
    surpriseMe.value = data.surpriseMe || [];

    if (data.relevanceSpotlight?.length > 0) {
      await loadSpotlightHeroBanner(data.relevanceSpotlight);
    }
  } catch (err) {
    console.error('Failed to load discover page data:', err);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section class="fade-in space-y-8 sm:space-y-12">
    <!-- Header Title -->
    <div>
      <h1 class="font-display text-3xl sm:text-5xl tracking-wide uppercase">Discover</h1>
      <p class="font-mono text-xs sm:text-sm text-ink/60 mt-0.5 sm:mt-1">
        Explore trending Steam releases, top sellers, and popular games.
      </p>
    </div>

    <!-- SPOTLIGHT HERO SKELETON -->
    <div 
      v-if="loading || loadingSpotlight" 
      class="bg-ink/5 border border-ink/10 rounded-sm p-4 sm:p-5 min-h-70 flex flex-col justify-between space-y-4 shadow-sm"
    >
      <div class="flex justify-between items-center border-b border-ink/10 pb-3">
        <div class="skeleton h-5 w-48 rounded-xs"></div>
        <div class="flex gap-2">
          <div class="skeleton w-7 h-7 rounded-full"></div>
          <div class="skeleton w-7 h-7 rounded-full"></div>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-12 gap-5 items-center grow">
        <div class="md:col-span-5 aspect-video skeleton rounded-xs w-full"></div>
        <div class="md:col-span-7 space-y-3">
          <div class="skeleton h-8 w-3/4 rounded-xs"></div>
          <div class="skeleton h-4 w-full rounded-xs"></div>
          <div class="skeleton h-4 w-5/6 rounded-xs"></div>
          <div class="pt-2 flex gap-3">
            <div class="skeleton h-9 w-44 rounded-xs"></div>
            <div class="skeleton h-9 w-24 rounded-xs"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- SPOTLIGHT BANNER -->
    <div 
      v-else-if="currentSpotlightGame" 
      class="bg-ink text-paper border border-paper/20 rounded-sm p-4 sm:p-5 shadow-xl relative overflow-hidden min-h-70 flex flex-col justify-between"
    >
      <!-- Carousel Header Bar -->
      <div class="flex items-center justify-between border-b border-paper/10 pb-3 mb-3 shrink-0 h-9">
        <div class="flex items-center gap-2 overflow-hidden">
          <svg class="w-4 h-4 text-stub fill-stub" viewBox="0 0 24 24">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span class="font-display text-xs sm:text-sm tracking-widest text-stub uppercase font-bold truncate">
            MOST POPULAR ON STEAM
          </span>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <span class="font-mono text-[10px] text-paper/50 mr-1 hidden sm:inline">
            {{ currentSpotlightIndex + 1 }} / {{ spotlightCandidates.length }}
          </span>
          <button 
            @click="prevSpotlight"
            class="w-7 h-7 rounded-full bg-black/50 text-paper hover:bg-stub transition-all flex items-center justify-center border border-paper/20 cursor-pointer"
            title="Previous Spotlight"
          >
            <svg class="w-4 h-4 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <button 
            @click="nextSpotlight"
            class="w-7 h-7 rounded-full bg-black/50 text-paper hover:bg-stub transition-all flex items-center justify-center border border-paper/20 cursor-pointer"
            title="Next Spotlight"
          >
            <svg class="w-4 h-4 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Main Grid Container -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-5 items-center grow">
        <div 
          class="md:col-span-5 relative group cursor-pointer shrink-0" 
          @click="handleCardClick(currentSpotlightGame.id)"
        >
          <div class="overflow-hidden border border-paper/20 rounded-xs aspect-video bg-black/50 shadow-md w-full">
            <img 
              :src="currentSpotlightGame.icon" 
              :alt="currentSpotlightGame.title" 
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>

        <div class="md:col-span-7 flex flex-col justify-between h-full space-y-3">
          <div class="space-y-2">
            <h2 
              class="font-display text-2xl sm:text-3xl tracking-wide text-paper uppercase leading-tight truncate" 
              :title="currentSpotlightGame.title"
            >
              {{ currentSpotlightGame.title }}
            </h2>

            <p class="font-mono text-xs sm:text-sm text-paper/80 leading-relaxed line-clamp-3 text-ellipsis">
              {{ currentSpotlightGame.shortDescription || 'No description available for this title.' }}
            </p>
          </div>

          <div class="pt-2 flex items-center gap-3 shrink-0">
            <button 
              @click="handleCardClick(currentSpotlightGame.id)" 
              class="w-44 bg-stub text-paper hover:bg-stub/80 font-mono text-xs uppercase font-bold tracking-wider py-2.5 rounded-xs shadow transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              <svg v-if="userLibraryMap.has(currentSpotlightGame.id)" class="w-4 h-4 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <svg v-else class="w-4 h-4 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span>{{ userLibraryMap.has(currentSpotlightGame.id) ? 'VIEW IN SHELF' : 'ADD TO SHELF' }}</span>
            </button>
            <a 
              :href="`https://store.steampowered.com/app/${currentSpotlightGame.id}`" 
              target="_blank" 
              rel="noopener" 
              class="font-mono text-xs uppercase text-paper/60 hover:text-paper underline flex items-center gap-1 truncate"
            >
              <span>Steam Store</span>
              <svg class="w-3 h-3 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- SHELVE SKELETONS -->
    <div v-if="loading" class="space-y-10">
      <div v-for="i in 3" :key="i" class="space-y-4">
        <div class="skeleton h-8 w-48 rounded-sm"></div>
        <div class="flex gap-4 overflow-x-auto pb-2">
          <div v-for="j in 5" :key="j" class="skeleton w-48 sm:w-56 aspect-video shrink-0 rounded-sm"></div>
        </div>
      </div>
    </div>

    <!-- GAME SHELVES SECTION -->
    <div v-else class="space-y-10 sm:space-y-12">
      
      <!-- 1. FEATURED GAMES -->
      <section v-if="featured.length" class="space-y-3">
        <div class="flex items-center justify-between border-b-2 border-ink/15 pb-2">
          <div class="flex items-center gap-2">
            <span class="bg-tag text-ink font-display text-sm sm:text-base uppercase font-extrabold px-3 py-1 rounded-xs shadow-xs tracking-wider flex items-center gap-1.5">
              <svg class="w-4 h-4 fill-ink" viewBox="0 0 24 24">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span>FEATURED</span>
            </span>
          </div>

          <div class="flex items-center gap-1.5">
            <button 
              @click="scrollSection(featuredRef, 'left')" 
              class="w-8 h-8 rounded-xs bg-ink text-paper hover:bg-tag hover:text-ink transition-colors flex items-center justify-center border border-ink/20 active:scale-95 cursor-pointer shadow-xs"
              title="Scroll Left"
            >
              <svg class="w-4 h-4 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <button 
              @click="scrollSection(featuredRef, 'right')" 
              class="w-8 h-8 rounded-xs bg-ink text-paper hover:bg-tag hover:text-ink transition-colors flex items-center justify-center border border-ink/20 active:scale-95 cursor-pointer shadow-xs"
              title="Scroll Right"
            >
              <svg class="w-4 h-4 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </div>

        <div 
          ref="featuredRef" 
          class="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory shelf-scrollbar scroll-smooth pb-3 pt-2"
        >
          <div 
            v-for="game in featured" 
            :key="game.id" 
            class="w-48 sm:w-56 shrink-0 snap-start transition-transform duration-200 hover:-translate-y-1"
          >
            <GameCard 
              :steam-id="game.id" :name="game.name" :image="game.tiny_image"
              :status-chip="userLibraryMap.get(game.id)?.status"
              :rating-chip="userLibraryMap.get(game.id)?.rating ? `${userLibraryMap.get(game.id)?.rating} ★` : undefined"
              @click="handleCardClick(game.id)" 
            />
          </div>
        </div>
      </section>

      <!-- 2. TOP SELLERS -->
      <section v-if="topSellers.length" class="space-y-3">
        <div class="flex items-center justify-between border-b-2 border-ink/15 pb-2">
          <div class="flex items-center gap-2">
            <span class="bg-teal text-paper font-display text-sm sm:text-base uppercase font-extrabold px-3 py-1 rounded-xs shadow-xs tracking-wider flex items-center gap-1.5">
              <svg class="w-4 h-4 fill-paper" viewBox="0 0 24 24">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z"/>
              </svg>
              <span>TOP SELLERS</span>
            </span>
          </div>

          <div class="flex items-center gap-1.5">
            <button 
              @click="scrollSection(topSellersRef, 'left')" 
              class="w-8 h-8 rounded-xs bg-ink text-paper hover:bg-teal transition-colors flex items-center justify-center border border-ink/20 active:scale-95 cursor-pointer shadow-xs"
              title="Scroll Left"
            >
              <svg class="w-4 h-4 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <button 
              @click="scrollSection(topSellersRef, 'right')" 
              class="w-8 h-8 rounded-xs bg-ink text-paper hover:bg-teal transition-colors flex items-center justify-center border border-ink/20 active:scale-95 cursor-pointer shadow-xs"
              title="Scroll Right"
            >
              <svg class="w-4 h-4 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </div>

        <div 
          ref="topSellersRef" 
          class="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory shelf-scrollbar scroll-smooth pb-3 pt-2"
        >
          <div 
            v-for="game in topSellers" 
            :key="game.id" 
            class="w-48 sm:w-56 shrink-0 snap-start transition-transform duration-200 hover:-translate-y-1"
          >
            <GameCard 
              :steam-id="game.id" :name="game.name" :image="game.tiny_image"
              :status-chip="userLibraryMap.get(game.id)?.status"
              :rating-chip="userLibraryMap.get(game.id)?.rating ? `${userLibraryMap.get(game.id)?.rating} ★` : undefined"
              @click="handleCardClick(game.id)" 
            />
          </div>
        </div>
      </section>

      <!-- 3. NEW & TRENDING -->
      <section v-if="newReleases.length" class="space-y-3">
        <div class="flex items-center justify-between border-b-2 border-ink/15 pb-2">
          <div class="flex items-center gap-2">
            <span class="bg-ink text-paper font-display text-sm sm:text-base uppercase font-extrabold px-3 py-1 rounded-xs shadow-xs tracking-wider flex items-center gap-1.5">
              <svg class="w-4 h-4 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
              </svg>
              <span>NEW & TRENDING</span>
            </span>
          </div>

          <div class="flex items-center gap-1.5">
            <button 
              @click="scrollSection(newReleasesRef, 'left')" 
              class="w-8 h-8 rounded-xs bg-ink text-paper hover:bg-stub transition-colors flex items-center justify-center border border-ink/20 active:scale-95 cursor-pointer shadow-xs"
              title="Scroll Left"
            >
              <svg class="w-4 h-4 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <button 
              @click="scrollSection(newReleasesRef, 'right')" 
              class="w-8 h-8 rounded-xs bg-ink text-paper hover:bg-stub transition-colors flex items-center justify-center border border-ink/20 active:scale-95 cursor-pointer shadow-xs"
              title="Scroll Right"
            >
              <svg class="w-4 h-4 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </div>

        <div 
          ref="newReleasesRef" 
          class="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory shelf-scrollbar scroll-smooth pb-3 pt-2"
        >
          <div 
            v-for="game in newReleases" 
            :key="game.id" 
            class="w-48 sm:w-56 shrink-0 snap-start transition-transform duration-200 hover:-translate-y-1"
          >
            <GameCard 
              :steam-id="game.id" :name="game.name" :image="game.tiny_image"
              :status-chip="userLibraryMap.get(game.id)?.status"
              :rating-chip="userLibraryMap.get(game.id)?.rating ? `${userLibraryMap.get(game.id)?.rating} ★` : undefined"
              @click="handleCardClick(game.id)" 
            />
          </div>
        </div>
      </section>
    </div>
  </section>
</template>