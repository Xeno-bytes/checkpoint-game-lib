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
  if (!steamId || Number.isNaN(idNum)) return; // Prevents triggering modal with invalid IDs
  
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
  <div id="app" class="font-body text-ink min-h-screen relative">
    <Header />

    <main class="max-w-6xl mx-auto px-5 py-8">
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

    <!-- Toast Notification -->
    <Transition name="toast">
      <div 
        v-if="toastMessage" 
        :class="[
          'fixed bottom-6 right-6 z-50 px-4 py-3 rounded-sm shadow-xl font-mono text-xs uppercase tracking-wider flex items-center gap-2 border',
          toastIsError 
            ? 'bg-red-950 text-red-200 border-red-800' 
            : 'bg-ink text-paper border-paper/20'
        ]"
      >
        <span :class="toastIsError ? 'text-red-400' : 'text-amber-400'">
          {{ toastIsError ? '✕' : '✓' }}
        </span>
        <span>{{ toastMessage }}</span>
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