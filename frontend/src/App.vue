<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Header from './components/Header.vue';
import GameModal from './components/GameModal.vue';
import type { LibraryItem } from './types/game';
import { fetchLibrary } from './api';

const library = ref<LibraryItem[]>([]);
const activeModalId = ref<number | null>(null);
const activeModalEntry = ref<LibraryItem | null>(null);

const toastMessage = ref('');
const toastIsError = ref(false);
let toastTimer: ReturnType<typeof setTimeout> | null = null;

async function loadLibraryData() {
  try {
    library.value = await fetchLibrary();
  } catch (err) {
    console.error('Could not load library from backend API.');
  }
}

function openGameModal(steamId: number | string) {
  const idNum = Number(steamId);
  if (!steamId || Number.isNaN(idNum)) return;
  
  activeModalId.value = idNum;
  activeModalEntry.value = library.value.find(i => Number(i.steam_id) === idNum) || null;
}

function handleSaved(savedItem: LibraryItem) {
  const index = library.value.findIndex(i => Number(i.steam_id) === Number(savedItem.steam_id));
  if (index !== -1) {
    library.value[index] = savedItem;
  } else {
    library.value.push(savedItem);
  }
  activeModalEntry.value = savedItem;
}

function handleDeleted(id: number) {
  library.value = library.value.filter(i => i.id !== id);
}

function triggerToast(msg: string, isError = false) {
  toastMessage.value = msg;
  toastIsError.value = isError;

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMessage.value = '';
  }, 3000);
}

onMounted(loadLibraryData);
</script>

<template>
  <!-- Added overflow-x-hidden & w-full to prevent horizontal body scroll -->
  <div id="app" class="font-body text-ink min-h-screen relative w-full overflow-x-hidden">
    <Header />

    <!-- Mobile-optimized container padding -->
    <main class="max-w-6xl mx-auto px-3.5 sm:px-5 py-6 sm:py-8 w-full">
      <router-view 
        :library="library" 
        @openModal="openGameModal" 
      />
    </main>

    <!-- Game Modal -->
    <GameModal 
      :steam-id="activeModalId" 
      :existing-entry="activeModalEntry"
      @close="activeModalId = null"
      @saved="handleSaved"
      @deleted="handleDeleted"
      @toast="triggerToast"
    />

    <!-- Toast Notification (Responsive Placement) -->
    <Transition name="toast">
      <div 
        v-if="toastMessage" 
        :class="[
          'fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 px-4 py-3 rounded-sm shadow-xl font-mono text-xs uppercase tracking-wider flex items-center justify-center sm:justify-start gap-2 border max-w-sm mx-auto sm:mx-0',
          toastIsError 
            ? 'bg-red-950 text-red-200 border-red-800' 
            : 'bg-ink text-paper border-paper/20'
        ]"
      >
        <span :class="toastIsError ? 'text-red-400' : 'text-amber-400'">
          {{ toastIsError ? '✕' : '✓' }}
        </span>
        <span class="truncate">{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>