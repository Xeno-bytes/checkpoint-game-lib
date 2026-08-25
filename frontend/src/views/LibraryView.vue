<script setup lang="ts">
import { ref, computed } from 'vue';
import type { LibraryItem } from '../types/game';
import GameCard from '../components/GameCard.vue';

const props = defineProps<{ library: LibraryItem[] }>();
const emit = defineEmits<{(e: 'openModal', id: number | string): void}>();

const selectedStatus = ref<string>('All');
const activeFilterType = ref<'all' | 'has_rating' | 'no_rating' | '1_star' | '2_stars' | '3_stars' | '4_stars' | '5_stars'>('all');
const activeSortBy = ref<'recent' | 'hours_desc' | 'hours_asc' | 'rating_desc' | 'rating_asc'>('recent');

const hasCompletedGames = computed(() => props.library.some(item => item.status === 'Completed'));

const showAdvancedFilters = computed(() => {
  if (!hasCompletedGames.value) return false;
  return selectedStatus.value === 'Completed' || selectedStatus.value === 'All';
});

const filteredLibrary = computed(() => {
  let list = [...props.library];

  if (selectedStatus.value !== 'All') {
    list = list.filter(i => i.status === selectedStatus.value);
  }

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

  if (activeSortBy.value === 'recent') {
    list.sort((a, b) => {
      const timeA = (a as any).created_at ? new Date((a as any).created_at).getTime() : (a.id || 0);
      const timeB = (b as any).created_at ? new Date((b as any).created_at).getTime() : (b.id || 0);
      return timeB - timeA;
    });
  }

  return list;
});

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
    <div class="mb-4 sm:mb-6">
      <h1 class="font-display text-3xl sm:text-5xl tracking-wide">My Library</h1>
      <p class="font-mono text-xs sm:text-sm text-ink/60 mt-0.5 sm:mt-1">Everything you've shelved, tracked, and rated.</p>
    </div>

    <!-- Filters Bar (Mobile Column, Desktop Row) -->
    <div class="bg-ink/95 text-paper rounded-sm p-3 sm:p-4 mb-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
      <!-- Status Tabs -->
      <div class="flex items-center gap-1.5 flex-wrap w-full lg:w-auto">
        <span class="font-mono text-[10px] sm:text-[11px] uppercase text-paper/50 mr-1 w-full sm:w-auto">Status:</span>
        <button 
          v-for="st in ['All', 'Backlog', 'In Progress', 'On Hold', 'Completed']" 
          :key="st"
          @click="selectedStatus = st"
          :class="['font-mono text-[10px] sm:text-xs uppercase px-2.5 sm:px-3 py-1 rounded-full transition-colors', selectedStatus === st ? 'bg-tag text-ink font-bold' : 'bg-transparent border border-paper/30 hover:border-tag']"
        >
          {{ st }}
        </button>
      </div>

      <!-- Advanced Filter Dropdowns -->
      <div v-if="showAdvancedFilters" class="flex items-center gap-2 sm:gap-3 flex-wrap w-full lg:w-auto border-t border-paper/10 pt-3 lg:border-t-0 lg:pt-0">
        <!-- Filter Dropdown -->
        <div class="flex items-center gap-1.5 flex-1 sm:flex-initial">
          <label class="font-mono text-[10px] sm:text-[11px] uppercase text-paper/50">Filter:</label>
          <select 
            v-model="activeFilterType" 
            class="bg-paper text-ink font-mono text-[11px] sm:text-xs px-2 py-1 rounded-sm focus:outline-none w-full sm:w-auto"
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
        <div class="flex items-center gap-1.5 flex-1 sm:flex-initial">
          <label class="font-mono text-[10px] sm:text-[11px] uppercase text-paper/50">Sort:</label>
          <select 
            v-model="activeSortBy" 
            class="bg-paper text-ink font-mono text-[11px] sm:text-xs px-2 py-1 rounded-sm focus:outline-none w-full sm:w-auto"
          >
            <option value="recent">Recently Added</option>
            <option value="hours_desc">Hours (High to Low)</option>
            <option value="hours_asc">Hours (Low to High)</option>
            <option value="rating_desc">Rating (High to Low)</option>
            <option value="rating_asc">Rating (Low to High)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Responsive Grid -->
    <div v-if="filteredLibrary.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 justify-items-center">
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
    <div v-else class="text-center py-16 text-ink/50 font-mono text-xs sm:text-sm">
      No games match your current filter settings.
    </div>
  </section>
</template>