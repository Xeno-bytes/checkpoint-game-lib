<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { LibraryItem } from '../types/game';
import GameCard from '../components/GameCard.vue';
import { useAuthStore } from '../stores/auth';
import { useLibraryStore } from '../stores/library';
import { fetchPublicLibrary, fetchGameDetails } from '../api';

const route = useRoute();
const authStore = useAuthStore();
const libraryStore = useLibraryStore();

const emit = defineEmits<{
  (e: 'openModal', steamId: number, entry?: LibraryItem): void;
}>();

const publicLibraryRaw = ref<any[]>([]);
const loading = ref(true);
const userNotFound = ref(false);
const targetUsername = ref<string>('');

const searchQuery = ref<string>('');
const debouncedSearchQuery = ref<string>('');
const selectedStatus = ref<string>('All');
const activeFilterType = ref<'all' | 'has_rating' | 'no_rating' | '1_star' | '2_stars' | '3_stars' | '4_stars' | '5_stars'>('all');
const activeSortBy = ref<'recent' | 'hours_desc' | 'hours_asc' | 'rating_desc' | 'rating_asc'>('recent');

const selectedFeaturedItem = ref<LibraryItem | null>(null);

const currentPage = ref<number>(1);
const pageInput = ref<number>(1);
const itemsPerPage = 20;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const isOwner = computed(() => {
  const routeUser = route.params.username as string | undefined;
  if (!routeUser) return true;
  
  const currentUsername = authStore.userProfile?.nickname;
  if (!currentUsername) return false;

  return routeUser.toLowerCase() === currentUsername.toLowerCase();
});

const pageTitle = computed(() => {
  if (isOwner.value) return 'My Library';
  return targetUsername.value ? `@${targetUsername.value}'s Library` : 'Library';
});

function onSearchInput() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debouncedSearchQuery.value = searchQuery.value.trim().toLowerCase();
    currentPage.value = 1;
  }, 500);
}

// Binds directly to Pinia store for owner, or local ref for public user profile
const rawLibrary = computed(() => {
  return isOwner.value ? libraryStore.items : publicLibraryRaw.value;
});

const mappedLibrary = computed<LibraryItem[]>(() => {
  const reverseStatusMap: Record<string, string> = {
    'Playing': 'In Progress',
    'Completed': 'Completed',
    'Plan to Play': 'Backlog',
    'On Hold': 'On Hold',
    'Dropped': 'Dropped',
    'Endless': 'Endless'
  };

  return rawLibrary.value.map(item => {
    const appId = Number(item.appId || item.steam_id || item.steamId);
    const title = item.name || item.title || item.gameName;

    return {
      id: item._id || item.id,
      steam_id: appId,
      name: title && !title.startsWith('Game ') ? title : `Game ${appId}`,
      background_image: item.background_image || item.icon || `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`,
      status: reverseStatusMap[item.status] || item.status || 'Backlog',
      rating: Number(item.rating) || 0,
      hoursPlayed: item.playtimeHours ?? item.hoursPlayed ?? null,
      notes: item.reviewContent || item.notes || '',
      created_at: item.createdAt || item.created_at
    } as unknown as LibraryItem;
  });
});

const filteredLibrary = computed(() => {
  let list = [...mappedLibrary.value];

  if (debouncedSearchQuery.value) {
    list = list.filter(item => item.name.toLowerCase().includes(debouncedSearchQuery.value));
  }

  if (selectedStatus.value !== 'All') {
    list = list.filter(item => item.status === selectedStatus.value);
  }

  if (activeFilterType.value === 'has_rating') {
    list = list.filter(item => (item.rating ?? 0) > 0);
  } else if (activeFilterType.value === 'no_rating') {
    list = list.filter(item => !item.rating || item.rating === 0);
  } else if (activeFilterType.value.endsWith('_star') || activeFilterType.value.endsWith('_stars')) {
    const starCount = parseInt(activeFilterType.value);
    list = list.filter(item => Math.floor(item.rating ?? 0) === starCount);
  }

  return list.sort((a, b) => {
    const hoursA = a.hoursPlayed ?? 0;
    const hoursB = b.hoursPlayed ?? 0;
    const ratingA = a.rating ?? 0;
    const ratingB = b.rating ?? 0;

    if (activeSortBy.value === 'hours_desc') return hoursB - hoursA;
    if (activeSortBy.value === 'hours_asc') return hoursA - hoursB;
    if (activeSortBy.value === 'rating_desc') return ratingB - ratingA;
    if (activeSortBy.value === 'rating_asc') return ratingA - ratingB;
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });
});

const totalPages = computed(() => Math.ceil(filteredLibrary.value.length / itemsPerPage) || 1);

const paginatedLibrary = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredLibrary.value.slice(start, start + itemsPerPage);
});

watch(currentPage, (newPage) => { pageInput.value = newPage; });
watch([selectedStatus, activeFilterType, activeSortBy], () => { currentPage.value = 1; });

function goToPage(page: number) {
  if (page < 1) currentPage.value = 1;
  else if (page > totalPages.value) currentPage.value = totalPages.value;
  else currentPage.value = page;
}

function handlePageInputCommit() {
  let val = Number(pageInput.value);
  if (isNaN(val) || val < 1) val = 1;
  if (val > totalPages.value) val = totalPages.value;
  currentPage.value = val;
  pageInput.value = val;
}

function renderStars(rating: number) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
  return '★'.repeat(fullStars) + (hasHalf ? '½' : '') + '☆'.repeat(emptyStars);
}

async function hydrateMissingNames(items: any[]) {
  return Promise.all(items.map(async (item: any) => {
    const appId = Number(item.appId || item.steam_id || item.steamId);
    const title = item.name || item.title || item.gameName;
    if ((!title || title.startsWith('Game ')) && appId) {
      try {
        const details = await fetchGameDetails(appId);
        if (details) {
          return { ...item, name: details.title, background_image: details.icon };
        }
      } catch {}
    }
    return item;
  }));
}

async function loadLibrary() {
  loading.value = true;
  userNotFound.value = false;
  selectedFeaturedItem.value = null;

  const routeUsername = route.params.username as string | undefined;

  try {
    if (routeUsername && !isOwner.value) {
      targetUsername.value = routeUsername;
      const res = await fetchPublicLibrary(routeUsername);
      const raw = res.library || [];
      publicLibraryRaw.value = await hydrateMissingNames(raw);
    } else {
      targetUsername.value = authStore.userProfile?.nickname || '';
      if (!authStore.firebaseUser) {
        publicLibraryRaw.value = [];
        loading.value = false;
        return;
      }
      // Load Pinia Store
      await libraryStore.loadLibrary();
      // Hydrate missing names inside Pinia store directly
      const hydrated = await hydrateMissingNames(libraryStore.items);
      libraryStore.items = hydrated;
    }

    if (!isOwner.value) {
      const itemsWithReviews = mappedLibrary.value.filter(
        item => item.notes && item.notes.trim().length > 0
      );
      if (itemsWithReviews.length > 0) {
        const randomIndex = Math.floor(Math.random() * itemsWithReviews.length);
        selectedFeaturedItem.value = itemsWithReviews[randomIndex];
      }
    }
  } catch (err: any) {
    if (err.message === 'User not found') {
      userNotFound.value = true;
    }
  } finally {
    loading.value = false;
  }
}

function handleCardClick(item: LibraryItem) {
  if (isOwner.value && item.steam_id) {
    emit('openModal', item.steam_id, item);
  } else {
    selectedFeaturedItem.value = item;
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}

watch(() => route.params.username, loadLibrary);
watch(() => authStore.firebaseUser, loadLibrary);
onMounted(loadLibrary);
</script>

<template>
  <section class="fade-in">
    <!-- Title Header -->
    <div class="mb-4 sm:mb-6">
      <h1 class="font-display text-3xl sm:text-5xl tracking-wide uppercase">{{ pageTitle }}</h1>
      <p class="font-mono text-xs sm:text-sm text-ink/60 mt-0.5 sm:mt-1">
        Track status, ratings, and playtimes of {{ isOwner ? 'your' : `@${targetUsername}'s` }} games shelf.
      </p>
    </div>

    <!-- User Not Found Error State -->
    <div v-if="userNotFound" class="text-center py-20 bg-ink/5 border border-ink/10 rounded-sm">
      <h2 class="font-display text-3xl text-stub mb-2">USER NOT FOUND</h2>
      <p class="font-mono text-xs sm:text-sm text-ink/60">The library user "@{{ route.params.username }}" does not exist.</p>
    </div>

    <template v-else>
      <!-- Filter & Search Controls Bar -->
      <div class="bg-ink text-paper border border-ink/20 rounded-sm p-3 sm:p-4 mb-6 sm:mb-8 space-y-3.5 shadow-md">
        <div class="relative w-full">
          <input 
            v-model="searchQuery"
            @input="onSearchInput"
            type="text" 
            placeholder="Filter library by title..." 
            class="w-full bg-black/40 border border-paper/20 text-paper placeholder-paper/40 rounded-xs px-3 py-2 font-mono text-xs sm:text-sm focus:outline-none focus:border-stub transition-colors"
          />
          <span v-if="searchQuery" @click="searchQuery = ''; onSearchInput()" class="absolute right-3 top-1/2 -translate-y-1/2 text-paper/40 hover:text-paper cursor-pointer font-mono text-xs">✕</span>
        </div>

        <div class="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between pt-1 border-t border-paper/10">
          <div class="flex flex-wrap gap-1">
            <button
              v-for="status in ['All', 'Backlog', 'In Progress', 'Completed', 'Endless', 'On Hold', 'Dropped']"
              :key="status"
              @click="selectedStatus = status"
              :class="[
                'px-2.5 py-1 sm:px-3 sm:py-1.5 font-mono text-[11px] sm:text-xs uppercase tracking-wider rounded-xs transition-all cursor-pointer border border-transparent',
                selectedStatus === status ? 'bg-stub text-paper font-bold shadow-xs border-stub/50' : 'text-paper/70 hover:text-paper hover:bg-paper/10'
              ]"
            >
              {{ status }}
            </button>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center gap-2 flex-1 sm:flex-none">
              <label class="font-mono text-[10px] sm:text-xs uppercase text-paper/60 font-bold">Filter:</label>
              <div class="relative">
                <select v-model="activeFilterType" class="w-full sm:w-auto appearance-none bg-black/40 border border-paper/20 rounded-xs pl-2.5 pr-7 py-1 font-mono text-xs text-paper focus:outline-none focus:border-stub transition-colors cursor-pointer">
                  <option value="all" class="bg-ink text-paper">All Items</option>
                  <option value="has_rating" class="bg-ink text-paper">Rated Only</option>
                  <option value="no_rating" class="bg-ink text-paper">Unrated</option>
                  <option value="5_stars" class="bg-ink text-paper">5 Stars</option>
                  <option value="4_stars" class="bg-ink text-paper">4 Stars</option>
                  <option value="3_stars" class="bg-ink text-paper">3 Stars</option>
                  <option value="2_stars" class="bg-ink text-paper">2 Stars</option>
                  <option value="1_star" class="bg-ink text-paper">1 Star</option>
                </select>
                <span class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-paper/50 text-[10px]">▼</span>
              </div>
            </div>

            <div class="flex items-center gap-2 flex-1 sm:flex-none">
              <label class="font-mono text-[10px] sm:text-xs uppercase text-paper/60 font-bold">Sort:</label>
              <div class="relative">
                <select v-model="activeSortBy" class="w-full sm:w-auto appearance-none bg-black/40 border border-paper/20 rounded-xs pl-2.5 pr-7 py-1 font-mono text-xs text-paper focus:outline-none focus:border-stub transition-colors cursor-pointer">
                  <option value="recent" class="bg-ink text-paper">Recently Added</option>
                  <option value="hours_desc" class="bg-ink text-paper">Playtime (High to Low)</option>
                  <option value="hours_asc" class="bg-ink text-paper">Playtime (Low to High)</option>
                  <option value="rating_desc" class="bg-ink text-paper">Rating (High to Low)</option>
                  <option value="rating_asc" class="bg-ink text-paper">Rating (Low to High)</option>
                </select>
                <span class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-paper/50 text-[10px]">▼</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- FEATURED REVIEW SPOTLIGHT -->
      <div 
        v-if="!isOwner && selectedFeaturedItem" 
        class="bg-ink text-paper border border-paper/20 rounded-sm p-4 sm:p-5 mb-8 shadow-xl relative overflow-hidden"
      >
        <div class="flex items-center justify-between border-b border-paper/10 pb-2 mb-4">
          <span class="font-display text-xs sm:text-sm tracking-widest text-stub uppercase">★ SPOTLIGHT REVIEW</span>
          <span class="font-mono text-[10px] text-paper/40 uppercase">Click any game below to view its review</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          <div class="md:col-span-4 space-y-2">
            <div class="overflow-hidden border border-paper/20 rounded-xs aspect-video bg-black/50 shadow-md">
              <img 
                :src="selectedFeaturedItem.background_image" 
                :alt="selectedFeaturedItem.name" 
                class="w-full h-full object-cover"
              />
            </div>
            <div class="font-mono text-xs uppercase tracking-widest text-amber-400 font-bold flex items-center justify-between pt-1">
              <span>{{ renderStars(selectedFeaturedItem.rating || 0) }}</span>
              <span class="text-paper/70 font-normal">({{ selectedFeaturedItem.rating ? selectedFeaturedItem.rating.toFixed(1) : 'Unrated' }})</span>
            </div>
          </div>

          <div class="md:col-span-8 space-y-2">
            <h3 class="font-display text-xl sm:text-2xl tracking-wide text-tag uppercase leading-tight">
              {{ selectedFeaturedItem.name }}
            </h3>
            <p class="font-mono text-xs sm:text-sm text-paper/80 leading-relaxed whitespace-pre-line">
              {{ selectedFeaturedItem.notes || 'No written review available for this game.' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Loading Skeleton -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        <div v-for="i in 8" :key="i" class="space-y-2">
          <div class="skeleton aspect-video w-full rounded-md"></div>
          <div class="skeleton h-4 w-3/4 rounded-sm"></div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredLibrary.length === 0" class="text-center py-16 text-ink/50 font-mono text-xs sm:text-sm">
        <p class="uppercase font-bold">No games found on this shelf.</p>
      </div>

      <!-- Grid Layout -->
      <div v-else class="space-y-8">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 items-start">
          <GameCard
            v-for="item in paginatedLibrary"
            :key="item.id || item.steam_id"
            :steam-id="item.steam_id"
            :name="item.name"
            :image="item.background_image"
            :status-chip="item.status"
            :rating-chip="item.rating ? `${item.rating} ★` : undefined"
            class="w-full cursor-pointer transition-transform hover:-translate-y-1"
            @click="handleCardClick(item)"
          />
        </div>

        <!-- Pagination Controls -->
        <div v-if="totalPages > 1" class="flex items-center justify-end border-t border-ink/10 pt-4">
          <div class="flex items-center gap-2 bg-paper border border-ink/15 p-1.5 rounded-sm shadow-xs font-mono text-xs">
            <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1" class="px-2 py-1 rounded-xs bg-ink/5 text-ink hover:bg-ink hover:text-paper disabled:opacity-30 transition-colors cursor-pointer font-bold">‹ Prev</button>
            <div class="flex items-center gap-1.5 px-1 text-ink/70">
              <input v-model.number="pageInput" @keyup.enter="handlePageInputCommit" @blur="handlePageInputCommit" type="number" min="1" :max="totalPages" class="w-10 text-center bg-white border border-ink/20 rounded-xs py-0.5 font-bold text-ink focus:outline-none" />
              <span>of {{ totalPages }} {{ totalPages === 1 ? 'page' : 'pages' }}</span>
            </div>
            <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages" class="px-2 py-1 rounded-xs bg-ink/5 text-ink hover:bg-ink hover:text-paper disabled:opacity-30 transition-colors cursor-pointer font-bold">Next ›</button>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>