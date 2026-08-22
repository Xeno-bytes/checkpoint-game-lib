<script setup lang="ts">
import { ref, computed } from 'vue';
import type { LibraryItem } from '../types/game';
import GameCard from '../components/GameCard.vue';

const props = defineProps<{ library: LibraryItem[] }>();
const emit = defineEmits<{(e: 'openModal', id: number | string): void}>();

const selectedStatus = ref<string>('All');

// Advanced Filter Controls
const activeFilterType = ref<'all' | 'has_rating' | 'no_rating' | '1_star' | '2_stars' | '3_stars' | '4_stars' | '5_stars'>('all');
const activeSortBy = ref<'recent' | 'hours_desc' | 'hours_asc' | 'rating_desc' | 'rating_asc'>('recent');

// Check if any completed games exist in the library
const hasCompletedGames = computed(() => props.library.some(item => item.status === 'Completed'));

// Advanced filter panel visibility: ONLY visible if completed games exist AND user hasn't selected another status
const showAdvancedFilters = computed(() => {
  if (!hasCompletedGames.value) return false;
  return selectedStatus.value === 'Completed' || selectedStatus.value === 'All';
});

const filteredLibrary = computed(() => {
  let list = [...props.library];

  // 1. Filter by Status
  if (selectedStatus.value !== 'All') {
    list = list.filter(i => i.status === selectedStatus.value);
  }

  // 2. Advanced Filters (Only applied if Advanced Filters are active)
  if (showAdvancedFilters.value) {
    if (activeFilterType.value === 'has_rating') {
      list = list.filter(i => (i.rating || 0) > 0);
    } else if (activeFilterType.value === 'no_rating') {
      list = list.filter(i => !i.rating || i.rating === 0);
    } else if (activeFilterType.value === '1_star') {
      list = list.filter(i => Math.floor(i.rating || 0) === 1);
    } else if (activeFilterType.value === '2_stars') {
      list = list.filter(i => Math.floor(i.rating || 0) === 2);
    } else if (activeFilterType.value === '3_stars') {
      list = list.filter(i => Math.floor(i.rating || 0) === 3);
    } else if (activeFilterType.value === '4_stars') {
      list = list.filter(i => Math.floor(i.rating || 0) === 4);
    } else if (activeFilterType.value === '5_stars') {
      list = list.filter(i => (i.rating || 0) === 5);
    }

    // 3. Advanced Sorting
    if (activeSortBy.value === 'hours_desc') {
      list.sort((a, b) => ((b as any).hoursPlayed || 0) - ((a as any).hoursPlayed || 0));
    } else if (activeSortBy.value === 'hours_asc') {
      list.sort((a, b) => ((a as any).hoursPlayed || 0) - ((b as any).hoursPlayed || 0));
    } else if (activeSortBy.value === 'rating_desc') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (activeSortBy.value === 'rating_asc') {
      list.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    }
  }

  // Default Sort by Recent
  if (activeSortBy.value === 'recent') {
    list.sort((a, b) => {
      const timeA = (a as any).created_at ? new Date((a as any).created_at).getTime() : (a.id || 0);
      const timeB = (b as any).created_at ? new Date((b as any).created_at).getTime() : (b.id || 0);
      return timeB - timeA;
    });
  }

  return list;
});

// Helper for dynamic card chip badges
function getCardBadge(item: LibraryItem) {
  if (activeSortBy.value.includes('hours') && (item as any).hoursPlayed) {
    return `${(item as any).hoursPlayed} hrs`;
  }
  if (item.rating && item.rating > 0) {
    return `★ ${item.rating}`;
  }
  return null;
}
</script>

<template>
  <section class="fade-in">
    <div class="mb-6">
      <h1 class="font-display text-5xl tracking-wide">My Library</h1>
      <p class="font-mono text-sm text-ink/60 mt-1">Everything you've shelved, tracked, and rated.</p>
    </div>

    <!-- Filters Bar -->
    <div class="bg-ink/95 text-paper rounded-sm px-4 py-3 mb-6 flex flex-wrap items-center justify-between gap-4">
      <!-- Status Tabs -->
      <div class="flex items-center gap-1.5 flex-wrap">
        <span class="font-mono text-[11px] uppercase text-paper/50 mr-1">Status:</span>
        <button 
          v-for="st in ['All', 'Backlog', 'In Progress', 'On Hold', 'Completed']" 
          :key="st"
          @click="selectedStatus = st"
          :class="['font-mono text-xs uppercase px-3 py-1.5 rounded-full transition-colors', selectedStatus === st ? 'bg-tag text-ink font-bold' : 'bg-transparent border border-paper/30 hover:border-tag']"
        >
          {{ st }}
        </button>
      </div>

      <!-- Advanced Filter Dropdowns (ONLY appears if Completed games exist and visible) -->
      <div v-if="showAdvancedFilters" class="flex items-center gap-3 flex-wrap">
        <!-- Filter Dropdown -->
        <div class="flex items-center gap-1.5">
          <label class="font-mono text-[11px] uppercase text-paper/50">Filter:</label>
          <select 
            v-model="activeFilterType" 
            class="bg-paper text-ink font-mono text-xs px-2.5 py-1.5 rounded-sm focus:outline-none"
          >
            <option value="all">All Games</option>
            <option value="has_rating">Has Rating</option>
            <option value="no_rating">No Rating</option>
            <option value="5_stars">5 Stars</option>
            <option value="4_stars">4 Stars</option>
            <option value="3_stars">3 Stars</option>
            <option value="2_stars">2 Stars</option>
            <option value="1_star">1 Star</option>
          </select>
        </div>

        <!-- Sort Dropdown -->
        <div class="flex items-center gap-1.5">
          <label class="font-mono text-[11px] uppercase text-paper/50">Sort:</label>
          <select 
            v-model="activeSortBy" 
            class="bg-paper text-ink font-mono text-xs px-2.5 py-1.5 rounded-sm focus:outline-none"
          >
            <option value="recent">Recently Added</option>
            <option value="hours_desc">Hours Played (High to Low)</option>
            <option value="hours_asc">Hours Played (Low to High)</option>
            <option value="rating_desc">Rating (High to Low)</option>
            <option value="rating_asc">Rating (Low to High)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Grid Layout configured for 16:9 Landscape cards -->
    <div v-if="filteredLibrary.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center">
      <GameCard 
        v-for="item in filteredLibrary" 
        :key="item.id || item.steam_id" 
        :steam-id="item.steam_id" 
        :name="item.name" 
        :image="item.background_image"
        :status-chip="item.status"
        :rating-chip="getCardBadge(item)"
        class="w-full!"
        @click="emit('openModal', $event)" 
      />
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-16 text-ink/50 font-mono text-sm">
      No games match your current filter settings.
    </div>
  </section>
</template>