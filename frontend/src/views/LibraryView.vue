<script setup lang="ts">
import { ref, computed } from 'vue';
import type { LibraryItem } from '../types/game.ts';
import GameCard from '../components/GameCard.vue';

const props = defineProps<{ library: LibraryItem[] }>();
const emit = defineEmits<{(e: 'openModal', id: number | string): void}>();

const selectedStatus = ref<string>('All');
const minRating = ref<number>(0);
const sortBy = ref<'recent' | 'rating_desc'>('recent');

const filteredLibrary = computed(() => {
  let list = [...props.library];

  if (selectedStatus.value !== 'All') {
    list = list.filter(i => i.status === selectedStatus.value);
  }
  if (minRating.value > 0) {
    list = list.filter(i => (i.rating || 0) >= minRating.value);
  }
  if (sortBy.value === 'rating_desc') {
    list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else {
    list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }

  return list;
});
</script>

<template>
  <section class="fade-in">
    <div class="mb-6">
      <h1 class="font-display text-5xl tracking-wide">My Library</h1>
      <p class="font-mono text-sm text-ink/60 mt-1">Everything you've shelved, tracked, and rated.</p>
    </div>

    <!-- Filters Bar -->
    <div class="bg-ink/95 text-paper rounded-sm px-4 py-3 mb-6 flex flex-wrap items-center gap-3 sm:gap-5">
      <div class="flex items-center gap-1.5 flex-wrap">
        <span class="font-mono text-[11px] uppercase text-paper/50 mr-1">Status:</span>
        <button 
          v-for="st in ['All', 'Backlog', 'In Progress', 'Completed']" 
          :key="st"
          @click="selectedStatus = st"
          :class="['font-mono text-xs uppercase px-3 py-1.5 rounded-full transition-colors', selectedStatus === st ? 'bg-tag text-ink' : 'bg-transparent border border-paper/30 hover:border-tag']"
        >
          {{ st }}
        </button>
      </div>

      <div class="flex items-center gap-2 ml-auto">
        <label class="font-mono text-[11px] uppercase text-paper/50">Rating:</label>
        <select v-model.number="minRating" class="bg-paper text-ink font-mono text-xs px-2 py-1.5 rounded-sm">
          <option :value="0">Any</option>
          <option :value="5">5 stars</option>
          <option :value="4">4+ stars</option>
          <option :value="3">3+ stars</option>
        </select>
      </div>
    </div>

    <!-- Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      <GameCard 
        v-for="item in filteredLibrary" 
        :key="item.id || item.rawg_id" 
        :rawg-id="item.rawg_id" 
        :name="item.name" 
        :image="item.background_image"
        :status-chip="item.status"
        :rating-chip="item.rating ? `★ ${item.rating}` : null"
        @click="emit('openModal', item.rawg_id)" 
      />
    </div>
  </section>
</template>