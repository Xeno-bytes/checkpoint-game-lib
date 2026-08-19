<script setup lang="ts">
import { ref, watch } from 'vue';
import type { LibraryItem, GameDetails } from '../types/game';
import { fetchGameDetails, saveLibraryItem, deleteLibraryItem } from '../api';

const props = defineProps<{
  steamId: number | null;
  existingEntry: LibraryItem | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved', item: LibraryItem): void;
  (e: 'deleted', id: number): void;
  (e: 'toast', msg: string, isError?: boolean): void;
}>();

const game = ref<GameDetails | null>(null);
const loading = ref(false);
const saving = ref(false);
const formError = ref('');

const status = ref<'Backlog' | 'In Progress' | 'Completed'>('Backlog');
const rating = ref(0);
const notes = ref('');

watch(() => props.steamId, async (newId) => {
  if (!newId || Number.isNaN(Number(newId))) {
    game.value = null;
    return;
  }
  
  status.value = props.existingEntry?.status || 'Backlog';
  rating.value = props.existingEntry?.rating || 0;
  notes.value = props.existingEntry?.notes || '';
  formError.value = '';

  loading.value = true;
  try {
    game.value = await fetchGameDetails(Number(newId));
  } catch (err) {
    game.value = null;
  } finally {
    loading.value = false;
  }
});

async function handleSave() {
  if (!props.steamId || !game.value) return;
  saving.value = true;
  formError.value = '';

  const payload: Partial<LibraryItem> = {
    id: props.existingEntry?.id,
    steam_id: Number(props.steamId),
    name: game.value.title,
    background_image: game.value.icon,
    status: status.value,
    rating: rating.value,
    notes: notes.value.trim(),
  };

  try {
    const saved = await saveLibraryItem(payload);
    emit('saved', saved);
    emit('toast', 'Saved to your shelf.');
  } catch (err) {
    formError.value = "Couldn't save. Check backend connection.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div v-if="steamId" class="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="case-open bg-paper w-full max-w-4xl max-h-[88vh] rounded-sm shadow-2xl overflow-hidden relative grid grid-cols-1 md:grid-cols-2">
      <button @click="emit('close')" class="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-ink text-paper font-mono text-sm hover:bg-stub transition-colors">✕</button>

      <!-- LEFT: Game Details -->
      <div class="overflow-y-auto max-h-[88vh] border-b md:border-b-0 md:border-r border-dashed border-ink/20">
        <div v-if="loading" class="p-5 space-y-3">
          <div class="skeleton w-full aspect-video"></div>
          <div class="skeleton h-4 w-3/4 rounded-sm"></div>
        </div>
        <div v-else-if="game" class="p-0">
          <img :src="game.icon" :alt="game.title" class="w-full aspect-video object-cover" />
          <div class="p-5 space-y-3">
            <div class="flex flex-wrap gap-2 font-mono text-[10px] uppercase">
              <span class="bg-ink/10 px-2 py-1 rounded-sm">{{ game.releaseDate }}</span>
            </div>
            <div>
              <p class="font-mono text-[11px] uppercase text-ink/40 mb-0.5">Genres</p>
              <p class="text-sm">{{ game.genres.join(', ') || '—' }}</p>
            </div>
            <div>
              <p class="font-mono text-[11px] uppercase text-ink/40 mb-0.5">About</p>
              <p class="text-sm text-ink/80 leading-relaxed">{{ game.shortDescription || 'No description available.' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT: Tracker Form -->
      <div class="overflow-y-auto max-h-[88vh] p-6">
        <h3 class="font-mono text-[11px] uppercase tracking-widest text-ink/40 mb-1">Shelf It</h3>
        <p class="font-display text-3xl leading-none mb-5 text-stub">{{ game?.title || '—' }}</p>
        
        <form @submit.prevent="handleSave" class="space-y-5">
          <div>
            <label class="block font-mono text-xs uppercase text-ink/60 mb-1.5">Status</label>
            <select v-model="status" class="w-full bg-white border border-ink/15 rounded-sm px-3 py-2.5 font-body text-sm">
              <option value="Backlog">Backlog</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <label class="block font-mono text-xs uppercase text-ink/60 mb-1.5">Notes</label>
            <textarea v-model="notes" rows="5" class="w-full bg-white border border-ink/15 rounded-sm px-3 py-2.5 font-body text-sm resize-none"></textarea>
          </div>

          <button type="submit" :disabled="saving" class="w-full bg-ink text-paper font-mono text-xs uppercase tracking-widest py-3 rounded-sm hover:bg-stub transition-colors">
            {{ saving ? 'Saving...' : 'Save to Shelf' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>