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

const displayTitle = computed(() => {
  if (!props.name) return `Game ${props.steamId}`;
  
  const isGeneric = new RegExp(`^Game\\s+${props.steamId}$`, 'i').test(props.name.trim());
  if (isGeneric) {
    return `Game ${props.steamId}`;
  }
  
  return props.name;
});

const coverImage = computed(() => {
  if (!imageError.value && props.image) {
    return props.image;
  }
  
  if (!imageError.value && props.steamId) {
    return `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${props.steamId}/header.jpg`;
  }

  const initial = (displayTitle.value || '?').trim().charAt(0).toUpperCase();
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
  if (props.statusChip === 'On Hold') return '#8B7355';
  if (props.statusChip === 'Dropped') return '#4A5568';
  if (props.statusChip === 'Endless') return '#7C3AED';
  return '#8B7355';
});

function handleImageError() {
  imageError.value = true;
}
</script>

<template>
  <div 
    @click="emit('click', steamId)"
    class="game-card group relative w-full cursor-pointer bg-ink/90 rounded-md overflow-hidden border border-ink/20 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
    :style="{ '--spine-color': statusColor }"
  >
    <!-- Accent Color Left Spine -->
    <div 
      class="absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 z-20 transition-colors duration-300"
      :style="{ backgroundColor: statusColor }"
    ></div>

    <!-- Landscape Banner Container -->
    <div class="relative aspect-video overflow-hidden bg-ink/20">
      <img 
        :src="coverImage" 
        :alt="displayTitle" 
        loading="lazy" 
        @error="handleImageError"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
      />
      
      <div class="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/30 opacity-80 group-hover:opacity-60 transition-opacity"></div>

      <!-- Rating Badge -->
      <span 
        v-if="ratingChip" 
        class="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 bg-black/70 backdrop-blur-md text-amber-300 font-mono text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded border border-amber-300/30 shadow"
      >
        {{ ratingChip }}
      </span>

      <!-- Status Badge -->
      <span 
        v-if="statusChip" 
        class="absolute bottom-1.5 left-2.5 sm:bottom-2 sm:left-3 z-10 text-paper font-mono text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 sm:px-2 py-0.5 rounded shadow"
        :style="{ backgroundColor: statusColor }"
      >
        {{ statusChip }}
      </span>
    </div>

    <!-- Card Footer / Title Bar -->
    <div class="p-2.5 pl-3 sm:p-3 sm:pl-4 bg-paper/95 border-t border-ink/10 flex flex-col justify-center min-h-11 sm:min-h-13">
      <p class="font-mono text-[11px] sm:text-xs font-bold text-ink uppercase tracking-wide leading-tight line-clamp-1 group-hover:text-tag transition-colors">
        {{ displayTitle }}
      </p>
    </div>
  </div>
</template>