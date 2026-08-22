<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  steamId: number;
  name: string;
  image?: string;
  statusChip?: string;
  ratingChip?: string | null;
}>();

const emit = defineEmits<{(e: 'click', id: number): void}>();

const imageError = ref(false);

// Fallback logic prioritizing props.image
const coverImage = computed(() => {
  if (!imageError.value && props.image) {
    return props.image;
  }
  
  // Fallback to Steam CDN header format if props.image fails
  if (!imageError.value && props.steamId) {
    return `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${props.steamId}/header.jpg`;
  }

  // SVG Letterhead fallback if no image loads
  const initial = (props.name || '?').trim().charAt(0).toUpperCase();
  return `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="460" height="215">
      <rect width="460" height="215" fill="#2A2421"/>
      <text x="50%" y="50%" font-family="monospace" font-size="64" fill="#EDE6D6" text-anchor="middle" dominant-baseline="middle">${initial}</text>
    </svg>`)}`;
});

const statusColor = computed(() => {
  if (props.statusChip === 'Completed') return '#2B6E6E';
  if (props.statusChip === 'In Progress') return '#E8B84B';
  if (props.statusChip === 'Backlog') return '#C1432E';
  return '#8B7355';
});

function handleImageError() {
  imageError.value = true;
}
</script>

<template>
  <div 
    @click="emit('click', steamId)"
    class="game-card group relative shrink-0 w-64 sm:w-72 cursor-pointer bg-ink/90 rounded-md overflow-hidden border border-ink/20 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 snap-start"
    :style="{ '--spine-color': statusColor }"
  >
    <!-- Accent Color Left Spine -->
    <div 
      class="absolute left-0 top-0 bottom-0 w-1.5 z-20 transition-colors duration-300"
      :style="{ backgroundColor: statusColor }"
    ></div>

    <!-- Landscape Banner Container -->
    <div class="relative aspect-video overflow-hidden bg-ink/20">
      <img 
        :src="coverImage" 
        :alt="name" 
        loading="lazy" 
        @error="handleImageError"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
      />
      
      <div class="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/30 opacity-80 group-hover:opacity-60 transition-opacity"></div>

      <!-- Rating Badge -->
      <span 
        v-if="ratingChip" 
        class="absolute top-2 right-2 z-10 bg-black/70 backdrop-blur-md text-amber-300 font-mono text-[11px] font-bold px-2 py-0.5 rounded border border-amber-300/30 shadow"
      >
        {{ ratingChip }}
      </span>

      <!-- Status Badge -->
      <span 
        v-if="statusChip" 
        class="absolute bottom-2 left-3 z-10 text-paper font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded shadow"
        :style="{ backgroundColor: statusColor }"
      >
        {{ statusChip }}
      </span>
    </div>

    <!-- Card Footer / Title Bar -->
    <div class="p-3 pl-4 bg-paper/95 border-t border-ink/10 flex flex-col justify-center min-h-[52px]">
      <p class="font-mono text-xs font-bold text-ink uppercase tracking-wide leading-tight line-clamp-1 group-hover:text-tag transition-colors">
        {{ name }}
      </p>
    </div>
  </div>
</template>