<!-- views/LibraryView.vue -->
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

// Filter & Sort States
const selectedStatus = ref<string>('All');
const activeFilterType = ref<'all' | 'has_rating' | 'no_rating' | '1_star' | '2_stars' | '3_stars' | '4_stars' | '5_stars'>('all');
const activeSortBy = ref<'recent' | 'hours_desc' | 'hours_asc' | 'rating_desc' | 'rating_asc'>('recent');

// Map raw backend MongoDB fields to unified LibraryItem format
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

// Filtered and Sorted list for rendering
const filteredLibrary = computed(() => {
  let list = [...mappedLibrary.value];

  // 1. Status Filter
  if (selectedStatus.value !== 'All') {
    list = list.filter(item => item.status === selectedStatus.value);
  }

  // 2. Rating/Sub-filter
  if (activeFilterType.value === 'has_rating') {
    list = list.filter(item => (item.rating ?? 0) > 0);
  } else if (activeFilterType.value === 'no_rating') {
    list = list.filter(item => !item.rating || item.rating === 0);
  } else if (activeFilterType.value.endsWith('_star') || activeFilterType.value.endsWith('_stars')) {
    const starCount = parseInt(activeFilterType.value);
    list = list.filter(item => item.rating === starCount);
  }

  // 3. Sorting (Fixes 'item.rating is possibly undefined' error)
  return list.sort((a, b) => {
    const hoursA = a.hoursPlayed ?? 0;
    const hoursB = b.hoursPlayed ?? 0;
    const ratingA = a.rating ?? 0;
    const ratingB = b.rating ?? 0;

    if (activeSortBy.value === 'hours_desc') return hoursB - hoursA;
    if (activeSortBy.value === 'hours_asc') return hoursA - hoursB;
    if (activeSortBy.value === 'rating_desc') return ratingB - ratingA;
    if (activeSortBy.value === 'rating_asc') return ratingA - ratingB;
    // Recent (default)
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });
});

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

    // Asynchronously resolve Steam details for items with missing names
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
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
    <!-- Header Title -->
    <div>
      <h1 class="font-mono text-2xl sm:text-3xl uppercase font-bold text-ink">
        My Library
      </h1>
      <p class="font-body text-sm text-ink/60 mt-1">
        Track status, ratings, and playtimes of your games shelf.
      </p>
    </div>

    <!-- Controls Bar -->
    <div class="bg-paper border border-ink/15 rounded-lg p-4 flex flex-wrap gap-4 items-center justify-between">
      <!-- Status Tabs -->
      <div class="flex flex-wrap gap-1">
        <button
          v-for="status in ['All', 'Backlog', 'In Progress', 'Completed', 'On Hold']"
          :key="status"
          @click="selectedStatus = status"
          :class="[
            'px-3 py-1.5 font-mono text-xs uppercase tracking-wider rounded transition-colors',
            selectedStatus === status 
              ? 'bg-ink text-paper font-bold' 
              : 'text-ink/60 hover:text-ink hover:bg-ink/5'
          ]"
        >
          {{ status }}
        </button>
      </div>

      <!-- Filters & Sorting Selectors -->
      <div class="flex flex-wrap items-center gap-3">
        <!-- Filter -->
        <div class="flex items-center gap-2">
          <label class="font-mono text-xs uppercase text-ink/50">Filter:</label>
          <select 
            v-model="activeFilterType"
            class="bg-white border border-ink/15 rounded px-2.5 py-1.5 font-body text-xs text-ink focus:outline-none focus:border-ink/40"
          >
            <option value="all">All Items</option>
            <option value="has_rating">Rated Only</option>
            <option value="no_rating">Unrated</option>
            <option value="5_stars">5 Stars</option>
            <option value="4_stars">4 Stars</option>
            <option value="3_stars">3 Stars</option>
            <option value="2_stars">2 Stars</option>
            <option value="1_star">1 Star</option>
          </select>
        </div>

        <!-- Sort -->
        <div class="flex items-center gap-2">
          <label class="font-mono text-xs uppercase text-ink/50">Sort:</label>
          <select 
            v-model="activeSortBy"
            class="bg-white border border-ink/15 rounded px-2.5 py-1.5 font-body text-xs text-ink focus:outline-none focus:border-ink/40"
          >
            <option value="recent">Recently Added</option>
            <option value="hours_desc">Playtime (High to Low)</option>
            <option value="hours_asc">Playtime (Low to High)</option>
            <option value="rating_desc">Rating (High to Low)</option>
            <option value="rating_asc">Rating (Low to High)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Content Section -->
    <!-- Loading State -->
    <div v-if="loading" class="py-20 flex flex-col items-center justify-center gap-3">
      <div class="w-10 h-10 border-2 border-ink/20 border-t-ink rounded-full animate-spin"></div>
      <p class="font-mono text-xs text-ink/60">Loading your shelf...</p>
    </div>

    <!-- Empty State -->
    <div 
      v-else-if="filteredLibrary.length === 0" 
      class="bg-paper border border-dashed border-ink/20 rounded-lg p-12 text-center space-y-3"
    >
      <p class="font-mono text-sm uppercase text-ink/60">No games found on your shelf</p>
      <p class="font-body text-xs text-ink/40">
        {{ selectedStatus !== 'All' ? 'Try clearing or changing your filters.' : 'Start adding games from the search bar!' }}
      </p>
    </div>

    <!-- Game Grid -->
    <div 
      v-else 
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
    >
      <!-- Fixed GameCard props instantiation -->
      <GameCard
        v-for="item in filteredLibrary"
        :key="item.id || item.steam_id"
        :steam-id="item.steam_id"
        :name="item.name"
        :image="item.background_image"
        :status-chip="item.status"
        :rating-chip="item.rating ? `${item.rating} ★` : undefined"
        class="cursor-pointer transition-transform duration-200 hover:-translate-y-1"
        @click="handleCardClick(item)"
      />
    </div>
  </div>
</template>