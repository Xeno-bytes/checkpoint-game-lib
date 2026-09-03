<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { fetchGameDetails } from '../api'

const props = defineProps<{
  steamId: number
  name: string
  image?: string
  genres?: string[]
  releaseDate?: string
  statusChip?: string
  ratingChip?: string | null
}>()

const emit = defineEmits<{(e: 'click', id: number): void}>()

const imageError = ref(false)
const localGenres = ref<string[]>(props.genres || [])
const localReleaseDate = ref<string>(props.releaseDate || '')

onMounted(async () => {
  if ((!localReleaseDate.value || !localGenres.value.length) && props.steamId) {
    try {
      const details = await fetchGameDetails(props.steamId)
      if (details) {
        if (details.releaseDate) localReleaseDate.value = details.releaseDate
        if (details.genres && details.genres.length) localGenres.value = details.genres
      }
    } catch {}
  }
})

const coverImage = computed(() => {
  if (!imageError.value && props.image) {
    return props.image
  }
  
  if (!imageError.value && props.steamId) {
    return `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${props.steamId}/header.jpg`
  }

  const initial = (props.name || '?').trim().charAt(0).toUpperCase()
  return `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="460" height="215">
      <rect width="460" height="215" fill="#2A2421"/>
      <text x="50%" y="50%" font-family="monospace" font-size="64" fill="#EDE6D6" text-anchor="middle" dominant-baseline="middle">${initial}</text>
    </svg>`)}`
})

const statusColor = computed(() => {
  if (props.statusChip === 'Completed') return '#2B6E6E'
  if (props.statusChip === 'In Progress') return '#E8B84B'
  if (props.statusChip === 'Backlog') return '#C1432E'
  if (props.statusChip === 'On Hold') return '#8B7355'
  if (props.statusChip === 'Dropped') return '#4A5568'
  if (props.statusChip === 'Endless') return '#7C3AED'
  return '#8B7355'
})

function handleImageError() {
  imageError.value = true
}
</script>

<template>
  <div 
    @click="emit('click', steamId)"
    class="game-list-card group relative w-full cursor-pointer bg-ink/90 rounded-md overflow-hidden border border-ink/20 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col sm:flex-row items-stretch select-none"
    :style="{ '--spine-color': statusColor }"
  >
    <div 
      class="w-full sm:w-1.5 h-1 sm:h-auto shrink-0 transition-colors duration-300"
      :style="{ backgroundColor: statusColor }"
    ></div>

    <div class="relative w-full sm:w-56 h-32 sm:h-auto shrink-0 overflow-hidden bg-ink/20">
      <img 
        :src="coverImage" 
        :alt="name" 
        loading="lazy" 
        @error="handleImageError"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
      />
      <div class="absolute inset-0 bg-linear-to-t sm:bg-linear-to-r from-black/80 via-transparent to-black/30 opacity-80 group-hover:opacity-60 transition-opacity"></div>
      
      <span 
        v-if="ratingChip" 
        class="absolute top-2 right-2 z-10 bg-black/70 backdrop-blur-md text-amber-300 font-mono text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded border border-amber-300/30 shadow"
      >
        ★ {{ ratingChip }}
      </span>

      <span 
        v-if="statusChip" 
        class="absolute bottom-2 left-2 z-10 text-paper font-mono text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded shadow"
        :style="{ backgroundColor: statusColor }"
      >
        {{ statusChip }}
      </span>
    </div>

    <div class="p-3 sm:p-4 bg-paper/95 border-t sm:border-t-0 sm:border-l border-ink/10 flex-1 flex flex-col justify-between gap-3">
      <div>
        <h3 class="font-mono text-sm sm:text-base font-bold text-ink uppercase tracking-wide line-clamp-1 group-hover:text-tag transition-colors">
          {{ name }}
        </h3>

        <div v-if="localGenres && localGenres.length" class="flex flex-wrap items-center gap-1.5 mt-2">
          <span 
            v-for="genre in localGenres.slice(0, 3)" 
            :key="genre" 
            class="font-mono text-[10px] uppercase bg-ink/10 text-ink border border-ink/30 px-2 py-0.5 rounded-xs font-bold"
          >
            {{ genre }}
          </span>
        </div>
      </div>

      <div class="flex items-center justify-between pt-2 border-t border-ink/20 font-mono text-xs">
        <span v-if="localReleaseDate" class="text-[11px] font-bold tracking-wide text-ink/80">
          RELEASED: <span class="text-ink font-black">{{ localReleaseDate }}</span>
        </span>
        <span v-else class="text-[10px] text-ink/60 font-bold tracking-wider uppercase">Loading release date...</span>

        <div class="text-ink/60 group-hover:text-tag group-hover:translate-x-1 transition-all pl-2 font-mono text-xs font-bold">
          ➔
        </div>
      </div>
    </div>
  </div>
</template>