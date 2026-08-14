<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  rawgId: number | string;
  name: string;
  image?: string;
  ratingChip?: string | null;
  statusChip?: string | null;
}>();

const emit = defineEmits<{
  (e: 'click', id: number | string): void;
}>();

const coverImage = computed(() => {
  if (props.image) return props.image;
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
</script>

<template>
  <div 
    @click="emit('click', rawgId)"
    class="game-card card-spine snap-start shrink-0 w-40 sm:w-44 md:w-full cursor-pointer bg-white/60 rounded-sm overflow-hidden hover:-translate-y-1 transition-transform relative group"
    :style="{ '--spine-color': statusColor }"
  >
    <div class="relative aspect-[3/4] overflow-hidden bg-ink/10">
      <img :src="coverImage" :alt="name" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      <span v-if="ratingChip" class="absolute top-2 left-2 bg-teal text-paper font-mono text-[10px] px-1.5 py-0.5 rounded-sm">{{ ratingChip }}</span>
      <span v-if="statusChip" class="absolute bottom-2 left-2 bg-tag text-ink font-mono text-[10px] uppercase px-1.5 py-0.5 rounded-sm">{{ statusChip }}</span>
    </div>
    <div class="p-2.5">
      <p class="font-mono text-[11px] uppercase leading-snug line-clamp-2">{{ name }}</p>
    </div>
  </div>
</template>