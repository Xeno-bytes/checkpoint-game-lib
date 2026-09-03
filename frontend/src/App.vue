<script setup lang="ts">
import { ref, watch } from 'vue';
import Header from './components/Header.vue';
import Footer from './components/Footer.vue';
import GameModal from './components/GameModal.vue';
import NicknameModal from './components/NicknameModal.vue';
import type { LibraryItem } from './types/game';
import { useAuthStore } from './stores/auth';
import { useLibraryStore } from './stores/library';

const authStore = useAuthStore();
const libraryStore = useLibraryStore();

const activeModalId = ref<number | null>(null);
const activeModalEntry = ref<LibraryItem | null>(null);

const toastMessage = ref('');
const toastIsError = ref(false);
let toastTimer: ReturnType<typeof setTimeout> | null = null;

// Watch auth status and automatically load or clear the Pinia store
watch(
  () => authStore.firebaseUser,
  (user) => {
    if (user) {
      libraryStore.loadLibrary();
    } else {
      libraryStore.items = [];
    }
  },
  { immediate: true }
);

function openGameModal(steamId: number | string) {
  const idNum = Number(steamId);
  if (!steamId || Number.isNaN(idNum)) return;
  
  activeModalId.value = idNum;

  // Search inside libraryStore.items instead of local state
  activeModalEntry.value = libraryStore.items.find((i) => {
    const raw = i as any;
    const itemAppId = Number(i.steam_id || raw.appId || raw.steamId);
    return itemAppId === idNum;
  }) || null;
}

function handleSaved(savedItem: LibraryItem) {
  // Save directly to Pinia store so LibraryView instantly updates
  libraryStore.saveItemLocally(savedItem);
  activeModalEntry.value = savedItem;
}

function handleDeleted(id: string | number) {
  // Delete directly from Pinia store so LibraryView instantly updates
  libraryStore.removeItemLocally(id);
  activeModalEntry.value = null;
}

function triggerToast(msg: string, isError = false) {
  toastMessage.value = msg;
  toastIsError.value = isError;

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMessage.value = '';
  }, 3000);
}
</script>

<template>
  <div id="app" class="font-body text-ink min-h-screen relative w-full overflow-x-hidden">
    <Header />

    <main class="max-w-6xl mx-auto px-3.5 sm:px-5 py-6 sm:py-8 w-full">
      <!-- No longer passing local props; components use Pinia directly -->
      <router-view @openModal="openGameModal" />
    </main>

    <Footer />

    <!-- Game Modal -->
    <GameModal 
      :steam-id="activeModalId" 
      :existing-entry="activeModalEntry"
      @close="activeModalId = null"
      @saved="handleSaved"
      @deleted="handleDeleted"
      @toast="triggerToast"
    />

    <!-- Global Nickname Setup Modal -->
    <NicknameModal />

    <!-- Toast Notification -->
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