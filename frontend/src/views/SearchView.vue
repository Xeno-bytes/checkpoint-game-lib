<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { SteamGame } from '../types/game'
import { searchGames, fetchGameDetails } from '../api'
import GameListCard from '../components/GameListCard.vue'

const emit = defineEmits<{(e: 'openModal', id: number): void}>()

// Search & Result States
const searchQuery = ref('')
const rawSearchResults = ref<SteamGame[]>([])
const loading = ref(false)
const searched = ref(false)

// Filter & Sort States
const selectedGenre = ref<string>('All')
const activeSortBy = ref<'relevance' | 'name_asc' | 'name_desc' | 'id_desc'>('relevance')

const genres = [
  'All', 'Action', 'RPG', 'Strategy', 'Indie', 'Adventure', 
  'Simulation', 'Sports', 'Shooter', 'Puzzle'
]

let debounceTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  handleSearch('game')
})

function onInput() {
  if (debounceTimer) clearTimeout(debounceTimer)

  // If input is cleared, reset back to default relevant results
  if (!searchQuery.value.trim()) {
    debounceTimer = setTimeout(() => {
      handleSearch('game')
    }, 200)
    return
  }

  debounceTimer = setTimeout(() => {
    handleSearch()
  }, 400)
}

async function handleSearch(overrideQuery?: string) {
  const queryToSearch = overrideQuery || searchQuery.value.trim()
  if (!queryToSearch) return

  loading.value = true
  searched.value = true
  try {
    const basicResults: SteamGame[] = await searchGames(queryToSearch, true)

    const detailedResults = await Promise.all(
      basicResults.map(async (game) => {
        try {
          const details = await fetchGameDetails(game.id)
          return {
            ...game,
            genres: details?.genres || [],
            releaseDate: details?.releaseDate || ''
          }
        } catch {
          return { ...game, genres: [], releaseDate: '' }
        }
      })
    )

    rawSearchResults.value = detailedResults
  } catch (err) {
    console.error('Search failed:', err)
    rawSearchResults.value = []
  } finally {
    loading.value = false
  }
}

function selectGenre(genre: string) {
  selectedGenre.value = genre
}

function clearSearch() {
  searchQuery.value = ''
  handleSearch('game')
}

const filteredResults = computed(() => {
  let list = [...rawSearchResults.value]

  if (selectedGenre.value !== 'All') {
    const targetGenre = selectedGenre.value.toLowerCase()
    list = list.filter(game => {
      if (game.genres && game.genres.length > 0) {
        return game.genres.some(g => g.toLowerCase().includes(targetGenre))
      }
      return false
    })
  }

  // Sort list
  return list.sort((a, b) => {
    if (activeSortBy.value === 'name_asc') return a.name.localeCompare(b.name)
    if (activeSortBy.value === 'name_desc') return b.name.localeCompare(a.name)
    if (activeSortBy.value === 'id_desc') return b.id - a.id 
    return 0
  })
})
</script>

<template>
  <section class="fade-in space-y-6">
    <!-- View Header -->
    <div>
      <h1 class="font-display text-3xl sm:text-5xl tracking-wide uppercase">Search Catalog</h1>
      <p class="font-mono text-xs sm:text-sm text-ink/60 mt-0.5 sm:mt-1">
        Explore Steam games, filter by genre, and sort results.
      </p>
    </div>

    <!-- MAIN CONTROL BAR PANEL -->
    <div class="bg-ink text-paper border border-ink/20 rounded-sm p-4 sm:p-5 space-y-4 shadow-xl">
      
      <!-- Search Input Bar -->
      <div class="relative w-full">
        <input 
          v-model="searchQuery"
          @input="onInput"
          type="text" 
          placeholder="Type a game title (e.g. Elden Ring, Portal, Cyberpunk)..." 
          class="w-full bg-black/40 border border-paper/20 text-paper placeholder-paper/40 rounded-xs px-4 py-2.5 font-mono text-xs sm:text-sm focus:outline-none focus:border-stub transition-colors"
        />
        <button 
          v-if="searchQuery" 
          @click="clearSearch" 
          class="absolute right-3 top-1/2 -translate-y-1/2 text-paper/40 hover:text-paper font-mono text-xs cursor-pointer"
        >
          ✕
        </button>
      </div>

      <!-- Genre Pills Bar -->
      <div class="pt-2 border-t border-paper/10 space-y-2">
        <span class="font-mono text-[10px] sm:text-xs uppercase text-paper/50 tracking-widest block font-bold">
          Filter by Genre:
        </span>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="genre in genres"
            :key="genre"
            @click="selectGenre(genre)"
            :class="[
              'px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider rounded-xs transition-all cursor-pointer border',
              selectedGenre === genre 
                ? 'bg-stub text-paper font-bold border-stub shadow-xs' 
                : 'bg-black/20 text-paper/70 border-paper/10 hover:text-paper hover:bg-paper/10'
            ]"
          >
            {{ genre }}
          </button>
        </div>
      </div>

      <!-- Sorting Options & Counter Bar -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-2 border-t border-paper/10 gap-3">
        <div class="font-mono text-xs text-paper/60">
          <span v-if="searched && !loading" class="text-tag font-bold">
            Showing {{ filteredResults.length }} {{ filteredResults.length === 1 ? 'game' : 'games' }}
          </span>
        </div>

        <div class="flex items-center gap-2 self-end sm:self-auto">
          <label class="font-mono text-[10px] sm:text-xs uppercase text-paper/60 font-bold">Sort By:</label>
          <div class="relative">
            <select 
              v-model="activeSortBy" 
              class="appearance-none bg-black/40 border border-paper/20 rounded-xs pl-3 pr-7 py-1 font-mono text-xs text-paper focus:outline-none focus:border-stub transition-colors cursor-pointer"
            >
              <option value="relevance" class="bg-ink text-paper">Relevance</option>
              <option value="name_asc" class="bg-ink text-paper">Name (A – Z)</option>
              <option value="name_desc" class="bg-ink text-paper">Name (Z – A)</option>
              <option value="id_desc" class="bg-ink text-paper">Newer Releases</option>
            </select>
            <span class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-paper/50 text-[10px]">▼</span>
          </div>
        </div>
      </div>

    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="skeleton h-24 w-full rounded-md"></div>
    </div>

    <!-- Results List -->
    <div v-else-if="filteredResults.length > 0" class="flex flex-col gap-3">
      <GameListCard 
        v-for="game in filteredResults" 
        :key="game.id" 
        :steam-id="game.id" 
        :name="game.name" 
        :image="game.tiny_image"
        :genres="game.genres"
        :release-date="game.releaseDate"
        @click="emit('openModal', $event)" 
      />
    </div>

    <!-- Empty State -->
    <div v-else-if="searched" class="text-center py-16 bg-ink/5 border border-ink/10 rounded-sm">
      <h3 class="font-display text-2xl text-stub mb-1">NO MATCHING GAMES FOUND</h3>
      <p class="font-mono text-xs sm:text-sm text-ink/60">
        Try adjusting your filter choices or search term.
      </p>
    </div>
  </section>
</template>