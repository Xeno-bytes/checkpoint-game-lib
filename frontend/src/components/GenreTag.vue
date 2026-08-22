<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  genre: string;
}>();

const genreType = computed(() => {
  const g = props.genre.toLowerCase();

  if (g.includes('co-op') || g.includes('coop') || g.includes('multiplayer')) return 'multiplayer';
  if (g.includes('singleplayer') || g.includes('single-player')) return 'singleplayer';
  if (g.includes('action')) return 'action';
  if (g.includes('rpg') || g.includes('role-playing') || g.includes('adventure')) return 'rpg';
  if (g.includes('shooter') || g.includes('fps')) return 'shooter';
  if (g.includes('strategy') || g.includes('tactics')) return 'strategy';
  if (g.includes('sports') || g.includes('racing')) return 'sports';
  if (g.includes('simulation') || g.includes('sandbox')) return 'simulation';
  if (g.includes('indie')) return 'indie';
  
  return 'default';
});
</script>

<template>
  <span 
    class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-ink/10 text-ink border border-ink/20 rounded-xs font-mono text-[11px] uppercase tracking-wider hover:bg-ink/20 transition-colors cursor-default"
  >
    <!-- Multiplayer / Co-op -->
    <svg v-if="genreType === 'multiplayer'" class="w-3.5 h-3.5 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>

    <!-- Singleplayer -->
    <svg v-else-if="genreType === 'singleplayer'" class="w-3.5 h-3.5 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>

    <!-- Action -->
    <svg v-else-if="genreType === 'action'" class="w-3.5 h-3.5 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/>
    </svg>

    <!-- RPG / Adventure -->
    <svg v-else-if="genreType === 'rpg'" class="w-3.5 h-3.5 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
    </svg>

    <!-- Shooter / FPS -->
    <svg v-else-if="genreType === 'shooter'" class="w-3.5 h-3.5 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/>
    </svg>

    <!-- Strategy -->
    <svg v-else-if="genreType === 'strategy'" class="w-3.5 h-3.5 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
      <path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 12 2.1 12.1"/><path d="M12 12 19.1 5.1"/>
    </svg>

    <!-- Indie / Controller -->
    <svg v-else-if="genreType === 'indie'" class="w-3.5 h-3.5 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
      <line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><circle cx="15" cy="13" r="1"/><circle cx="17.5" cy="10.5" r="1"/><path d="M18 5H6a7 7 0 0 0-7 7v3a3 3 0 0 0 3 3h2l2-3h8l2 3h2a3 3 0 0 0 3-3v-3a7 7 0 0 0-7-7z"/>
    </svg>

    <!-- Simulation -->
    <svg v-else-if="genreType === 'simulation'" class="w-3.5 h-3.5 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>

    <!-- Fallback Tag Icon -->
    <svg v-else class="w-3.5 h-3.5 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
      <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.29-7.29a1 1 0 0 0 0-1.41L12 2z"/><circle cx="7" cy="7" r="1"/>
    </svg>

    <span>{{ genre }}</span>
  </span>
</template>