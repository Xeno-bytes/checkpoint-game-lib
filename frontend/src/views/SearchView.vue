<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { RAWGGame, Genre } from '../types/game'
import { fetchRawg } from '../api'
import GameCard from '../components/GameCard.vue'

const emit = defineEmits<{(e: 'openModal', id: number): void}>()

const searchQuery = ref('')
const selectedGenre = ref('')
const genres = ref<Genre[]>([])
const searchResults = ref<RAWGGame[]>([])
const loading = ref(false)
const searched = ref(false)

// Fetch genres on load for the dropdown filter
onMounted(async () => {
  try {
    const data = await fetchRawg<{ results: Genre[] }>('/genres')
    genres.value = data.results
  } catch (err) {
    console.error('Failed to fetch genres:', err)
  }
})

async function handleSearch() {
  if (!searchQuery.value.trim() && !selectedGenre.value) return

  loading.value = true
  searched.value = true
  try {
    const params: Record<string, any> = {
      search: searchQuery.value.trim(),
      page_size: 20,
    }
    if (selectedGenre.value) {
      params.genres = selectedGenre.value
    }

    const data = await fetchRawg<{ results: RAWGGame[] }>('/games', params)
    searchResults.value = data.results
  } catch (err) {
    console.error('Search failed:', err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="fade-in">
    <div class="mb-6">
      <h1 class="font-display text-5xl tracking-wide">Search Catalog</h1>
      <p class="font-mono text-sm text-ink/60 mt-1">Look up games by title or filter by genre.</p>
    </div>

    <!-- Search Controls -->
    <form @submit.prevent="handleSearch" class="flex flex-col sm:flex-row gap-3 mb-8">
      <input 
        v-model="searchQuery"
        type="text" 
        placeholder="Type a game title (e.g. Elden Ring, Zelda)..." 
        class="flex-1 bg-white border border-ink/20 rounded-sm px-4 py-3 font-body text-sm focus:outline-none focus:border-ink transition-colors"
      />

      <select 
        v-model="selectedGenre" 
        class="bg-white border border-ink/20 rounded-sm px-4 py-3 font-mono text-xs uppercase focus:outline-none focus:border-ink"
      >
        <option value="">All Genres</option>
        <option v-for="genre in genres" :key="genre.id" :value="genre.slug">
          {{ genre.name }}
        </option>
      </select>

      <button 
        type="submit" 
        class="bg-ink text-paper font-mono text-xs uppercase tracking-widest px-6 py-3 rounded-sm hover:bg-stub transition-colors"
      >
        Search
      </button>
    </form>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      <div v-for="i in 10" :key="i" class="space-y-2">
        <div class="skeleton aspect-[3/4] w-full rounded-sm"></div>
        <div class="skeleton h-4 w-3/4 rounded-sm"></div>
      </div>
    </div>

    <!-- Results Grid -->
    <div v-else-if="searchResults.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      <GameCard 
        v-for="game in searchResults" 
        :key="game.id" 
        :rawg-id="game.id" 
        :name="game.name" 
        :image="game.background_image"
        :rating-chip="game.rating ? `★ ${game.rating.toFixed(1)}` : null"
        @click="emit('openModal', game.id)" 
      />
    </div>

    <!-- No Results Empty State -->
    <div v-else-if="searched" class="text-center py-16 text-ink/50 font-mono text-sm">
      No games found. Try adjusting your search query or filters.
    </div>
  </section>
</template>