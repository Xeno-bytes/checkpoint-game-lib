<script setup lang="ts">
import { ref } from 'vue'
import type { SteamGame } from '../types/game'
import { searchGames } from '../api'
import GameCard from '../components/GameCard.vue'

const emit = defineEmits<{(e: 'openModal', id: number): void}>()

const searchQuery = ref('')
const searchResults = ref<SteamGame[]>([])
const loading = ref(false)
const searched = ref(false)

async function handleSearch() {
  if (!searchQuery.value.trim()) return

  loading.value = true
  searched.value = true
  try {
    searchResults.value = await searchGames(searchQuery.value.trim())
  } catch (err) {
    console.error('Search failed:', err)
    searchResults.value = []
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="fade-in">
    <div class="mb-6">
      <h1 class="font-display text-5xl tracking-wide">Search Catalog</h1>
      <p class="font-mono text-sm text-ink/60 mt-1">Look up games directly on Steam.</p>
    </div>

    <!-- Search Controls -->
    <form @submit.prevent="handleSearch" class="flex flex-col sm:flex-row gap-3 mb-8">
      <input 
        v-model="searchQuery"
        type="text" 
        placeholder="Type a game title (e.g. Elden Ring, Portal)..." 
        class="flex-1 bg-white border border-ink/20 rounded-sm px-4 py-3 font-body text-sm focus:outline-none focus:border-ink transition-colors"
      />

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
        <div class="skeleton aspect-3/4 w-full rounded-sm"></div>
        <div class="skeleton h-4 w-3/4 rounded-sm"></div>
      </div>
    </div>

    <!-- Results Grid -->
    <div v-else-if="searchResults.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      <GameCard 
        v-for="game in searchResults" 
        :key="game.id" 
        :steam-id="game.id" 
        :name="game.name" 
        :image="game.tiny_image"
        @click="emit('openModal', $event)" 
      />
    </div>

    <!-- No Results Empty State -->
    <div v-else-if="searched" class="text-center py-16 text-ink/50 font-mono text-sm">
      No games found. Try adjusting your search query.
    </div>
  </section>
</template>