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

const imageStage = ref<number>(0); // 0 = Vertical, 1 = image prop, 2 = SVG Fallback

const coverImage = computed(() => {
  // Vertical Image
  if (imageStage.value === 0 && props.steamId) {
    return `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${props.steamId}/library_600x900.jpg`;
  }

  // Image prop
  if (imageStage.value <= 1 && props.image) {
    return props.image;
  }

  // Initials of the game as a fallback
  const initial = (props.name || '?').trim().charAt(0).toUpperCase();
  return `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="400">
      <rect width="300" height="400" fill="#8B7355"/>
      <text x="50%" y="52%" font-family="sans-serif" font-size="120" fill="#EDE6D6" text-anchor="middle" dominant-baseline="middle">${initial}</text>
    </svg>`)}`;
});

const statusColor = computed(() => {
  if (props.statusChip === 'Completed') return '#2B6E6E';
  if (props.statusChip === 'In Progress') return '#E8B84B';
  if (props.statusChip === 'Backlog') return '#C1432E';
  return '#8B7355';
});

function handleImageError() {
  imageStage.value += 1;
}
</script>

<template>
  <div 
    @click="emit('click', steamId)"
    class="game-card card-spine snap-start shrink-0 w-36 sm:w-40 md:w-44 cursor-pointer bg-white/60 rounded-sm overflow-hidden hover:-translate-y-1 transition-transform relative group"
    :style="{ '--spine-color': statusColor }"
  >
    <div class="relative aspect-3/4 overflow-hidden bg-ink/10">
      <img 
        :src="coverImage" 
        :alt="name" 
        loading="lazy" 
        @error="handleImageError"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
      />
      <span v-if="ratingChip" class="absolute top-2 left-2 bg-teal text-paper font-mono text-[10px] px-1.5 py-0.5 rounded-sm">{{ ratingChip }}</span>
      <span v-if="statusChip" class="absolute bottom-2 left-2 bg-tag text-ink font-mono text-[10px] uppercase px-1.5 py-0.5 rounded-sm">{{ statusChip }}</span>
    </div>
    <div class="p-2.5">
      <p class="font-mono text-[11px] uppercase leading-snug line-clamp-2">{{ name }}</p>
    </div>
  </div>
</template>