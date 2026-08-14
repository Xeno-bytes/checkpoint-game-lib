<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Header from './components/Header.vue';
import GameModal from './components/GameModal.vue';
import type { LibraryItem } from './types/game';
import { fetchLibrary } from './api';

const library = ref<LibraryItem[]>([]);
const activeModalId = ref<number | string | null>(null);
const activeModalEntry = ref<LibraryItem | null>(null);

const toastMessage = ref('');
const toastIsError = ref(false);

async function loadLibraryData() {
  try {
    library.value = await fetchLibrary();
  } catch (err) {
    console.error('Could not load library from backend API.');
  }
}

function openGameModal(rawgId: number | string) {
  activeModalId.value = rawgId;
  activeModalEntry.value = library.value.find(i => String(i.rawg_id) === String(rawgId)) || null;
}

function handleSaved(savedItem: LibraryItem) {
  const index = library.value.findIndex(i => String(i.rawg_id) === String(savedItem.rawg_id));
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
}

onMounted(loadLibraryData);
</script>

<template>
  <div id="app" class="font-body text-ink min-h-screen">
    <Header />

    <main class="max-w-6xl mx-auto px-5 py-8">
      <router-view 
        :library="library" 
        @openModal="openGameModal" 
      />
    </main>

    <GameModal 
      :rawg-id="activeModalId" 
      :existing-entry="activeModalEntry"
      @close="activeModalId = null"
      @saved="handleSaved"
      @deleted="handleDeleted"
      @toast="triggerToast"
    />

    <Toast :message="toastMessage" :is-error="toastIsError" />
  </div>
</template>