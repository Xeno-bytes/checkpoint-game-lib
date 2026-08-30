<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import type { LibraryItem } from '../types/game';
import GameCard from '../components/GameCard.vue';
import { useAuthStore } from '../stores/auth';
import { fetchLibrary, fetchGameDetails } from '../api';

const authStore = useAuthStore();

const emit = defineEmits<{
  (e: 'openModal', steamId: number, entry?: LibraryItem): void;
}>();

const rawLibrary = ref<any[]>([]);
const loading = ref(true);

// Filter & Search States
const searchQuery = ref<string>('');
const debouncedSearchQuery = ref<string>('');
const selectedStatus = ref<string>('All');
const activeFilterType = ref<'all' | 'has_rating' | 'no_rating' | '1_star' | '2_stars' | '3_stars' | '4_stars' | '5_stars'>('all');
const activeSortBy = ref<'recent' | 'hours_desc' | 'hours_asc' | 'rating_desc' | 'rating_asc'>('recent');

// Pagination States
const currentPage = ref<number>(1);
const pageInput = ref<number>(1);
const itemsPerPage = 20;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// Handle auto-search debounce
function onSearchInput() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debouncedSearchQuery.value = searchQuery.value.trim().toLowerCase();
    currentPage.value = 1; // Reset to page 1 on new search
  }, 500);
}

const mappedLibrary = computed<LibraryItem[]>(() => {
  const reverseStatusMap: Record<string, string> = {
    'Playing': 'In Progress',
    'Completed': 'Completed',
    'Plan to Play': 'Backlog',
    'Dropped': 'On Hold'
  };

  return rawLibrary.value.map(item => {
    const appId = Number(item.appId || item.steam_id || item.steamId);
    return {
      id: item._id || item.id,
      steam_id: appId,
      name: item.name || `Game ${appId}`,
      background_image: item.background_image || `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`,
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

  // 1. Text Search Filter
  if (debouncedSearchQuery.value) {
    list = list.filter(item => item.name.toLowerCase().includes(debouncedSearchQuery.value));
  }

  // 2. Status Filter
  if (selectedStatus.value !== 'All') {
    list = list.filter(item => item.status === selectedStatus.value);
  }

  // 3. Rating Filter
  if (activeFilterType.value === 'has_rating') {
    list = list.filter(item => (item.rating ?? 0) > 0);
  } else if (activeFilterType.value === 'no_rating') {
    list = list.filter(item => !item.rating || item.rating === 0);
  } else if (activeFilterType.value.endsWith('_star') || activeFilterType.value.endsWith('_stars')) {
    const starCount = parseInt(activeFilterType.value);
    list = list.filter(item => item.rating === starCount);
  }

  // 4. Sorting
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

// Calculate total pages
const totalPages = computed(() => {
  return Math.ceil(filteredLibrary.value.length / itemsPerPage) || 1;
});

// Paginated items (max 20 per page)
const paginatedLibrary = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredLibrary.value.slice(start, start + itemsPerPage);
});

// Keep pageInput synced with currentPage
watch(currentPage, (newPage) => {
  pageInput.value = newPage;
});

// Reset page when switching filters
watch([selectedStatus, activeFilterType, activeSortBy], () => {
  currentPage.value = 1;
});

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

async function loadLibrary() {
  if (!authStore.firebaseUser) {
    rawLibrary.value = [];
    loading.value = false;
    return;
  }

  loading.value = true;
  try {
    const token = await authStore.getToken();
    const items = await fetchLibrary(token);

    rawLibrary.value = await Promise.all(items.map(async (item: any) => {
      const appId = Number(item.appId || item.steam_id || item.steamId);
      if ((!item.name || item.name.startsWith('Game ')) && appId) {
        try {
          const details = await fetchGameDetails(appId);
          if (details) {
            return {
              ...item,
              name: details.title,
              background_image: details.icon
            };
          }
        } catch {
          // Keep raw backend data on error
        }
      }
      return item;
    }));
  } catch (err) {
    console.error('Failed to load library:', err);
  } finally {
    loading.value = false;
  }
}

function handleCardClick(item: LibraryItem) {
  if (item.steam_id) {
    emit('openModal', item.steam_id, item);
  }
}

watch(() => authStore.firebaseUser, loadLibrary);
onMounted(loadLibrary);
</script>

<template>
  <section class="fade-in">
    <!-- Header Title -->
    <div class="mb-4 sm:mb-6">
      <h1 class="font-display text-3xl sm:text-5xl tracking-wide">My Library</h1>
      <p class="font-mono text-xs sm:text-sm text-ink/60 mt-0.5 sm:mt-1">
        Track status, ratings, and playtimes of your games shelf.
      </p>
    </div>

    <!-- Black Filter & Search Bar Container -->
    <div class="bg-ink text-paper border border-ink/20 rounded-sm p-3 sm:p-4 mb-6 sm:mb-8 space-y-3.5 shadow-md">
      
      <!-- Top Row: Library Search Input -->
      <div class="relative w-full">
        <input 
          v-model="searchQuery"
          @input="onSearchInput"
          type="text" 
          placeholder="Filter your library by title..." 
          class="w-full bg-black/40 border border-paper/20 text-paper placeholder-paper/40 rounded-xs px-3 py-2 font-mono text-xs sm:text-sm focus:outline-none focus:border-stub transition-colors"
        />
        <span v-if="searchQuery" @click="searchQuery = ''; onSearchInput()" class="absolute right-3 top-1/2 -translate-y-1/2 text-paper/40 hover:text-paper cursor-pointer font-mono text-xs">
          ✕
        </span>
      </div>

      <!-- Bottom Row: Status Tabs & Dropdowns -->
      <div class="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between pt-1 border-t border-paper/10">
        
        <!-- Status Filter Tabs -->
        <div class="flex flex-wrap gap-1">
          <button
            v-for="status in ['All', 'Backlog', 'In Progress', 'Completed', 'On Hold']"
            :key="status"
            @click="selectedStatus = status"
            :class="[
              'px-2.5 py-1 sm:px-3 sm:py-1.5 font-mono text-[11px] sm:text-xs uppercase tracking-wider rounded-xs transition-all cursor-pointer border border-transparent',
              selectedStatus === status 
                ? 'bg-stub text-paper font-bold shadow-xs border-stub/50' 
                : 'text-paper/70 hover:text-paper hover:bg-paper/10'
            ]"
          >
            {{ status }}
          </button>
        </div>

        <!-- Filter & Sort Custom Dropdowns -->
        <div class="flex flex-wrap items-center gap-3">
          
          <!-- Rating Filter Dropdown -->
          <div class="flex items-center gap-2 flex-1 sm:flex-none">
            <label class="font-mono text-[10px] sm:text-xs uppercase text-paper/60 font-bold">Filter:</label>
            <div class="relative">
              <select 
                v-model="activeFilterType"
                class="w-full sm:w-auto appearance-none bg-black/40 border border-paper/20 rounded-xs pl-2.5 pr-7 py-1 font-mono text-xs text-paper focus:outline-none focus:border-stub transition-colors cursor-pointer"
              >
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

          <!-- Sort Dropdown -->
          <div class="flex items-center gap-2 flex-1 sm:flex-none">
            <label class="font-mono text-[10px] sm:text-xs uppercase text-paper/60 font-bold">Sort:</label>
            <div class="relative">
              <select 
                v-model="activeSortBy"
                class="w-full sm:w-auto appearance-none bg-black/40 border border-paper/20 rounded-xs pl-2.5 pr-7 py-1 font-mono text-xs text-paper focus:outline-none focus:border-stub transition-colors cursor-pointer"
              >
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

    <!-- Loading Skeleton -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      <div v-for="i in 8" :key="i" class="space-y-2">
        <div class="skeleton aspect-video w-full rounded-md"></div>
        <div class="skeleton h-4 w-3/4 rounded-sm"></div>
      </div>
    </div>

    <!-- Empty State -->
    <div 
      v-else-if="filteredLibrary.length === 0" 
      class="text-center py-16 text-ink/50 font-mono text-xs sm:text-sm"
    >
      <p class="uppercase font-bold">No games found on your shelf.</p>
      <p class="text-ink/40 text-xs mt-1">
        {{ searchQuery || selectedStatus !== 'All' ? 'Try adjusting your search query or filters.' : 'Start adding games from the search bar!' }}
      </p>
    </div>

    <!-- Game Card Grid -->
    <div v-else class="space-y-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 justify-items-center">
        <GameCard
          v-for="item in paginatedLibrary"
          :key="item.id || item.steam_id"
          :steam-id="item.steam_id"
          :name="item.name"
          :image="item.background_image"
          :status-chip="item.status"
          :rating-chip="item.rating ? `${item.rating} ★` : undefined"
          class="w-full!"
          @click="handleCardClick(item)"
        />
      </div>

      <!-- Pagination Bar (Bottom-Right aligned) -->
      <div v-if="totalPages > 1" class="flex items-center justify-end border-t border-ink/10 pt-4">
        <div class="flex items-center gap-2 bg-paper border border-ink/15 p-1.5 rounded-sm shadow-xs font-mono text-xs">
          <!-- Previous Button -->
          <button 
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-2 py-1 rounded-xs bg-ink/5 text-ink hover:bg-ink hover:text-paper disabled:opacity-30 disabled:hover:bg-ink/5 disabled:hover:text-ink transition-colors cursor-pointer font-bold"
          >
            ‹ Prev
          </button>

          <!-- Interactive Page Textbox -->
          <div class="flex items-center gap-1.5 px-1 text-ink/70">
            <input 
              v-model.number="pageInput"
              @keyup.enter="handlePageInputCommit"
              @blur="handlePageInputCommit"
              type="number"
              min="1"
              :max="totalPages"
              class="w-10 text-center bg-white border border-ink/20 rounded-xs py-0.5 font-bold text-ink focus:outline-none focus:border-ink transition-colors"
            />
            <span>of {{ totalPages }} {{ totalPages === 1 ? 'page' : 'pages' }}</span>
          </div>

          <!-- Next Button -->
          <button 
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="px-2 py-1 rounded-xs bg-ink/5 text-ink hover:bg-ink hover:text-paper disabled:opacity-30 disabled:hover:bg-ink/5 disabled:hover:text-ink transition-colors cursor-pointer font-bold"
          >
            Next ›
          </button>
        </div>
      </div>
    </div>
  </section>
</template>