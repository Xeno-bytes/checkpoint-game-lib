<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { LibraryItem, GameDetails } from '../types/game';
import { fetchGameDetails, saveLibraryItem } from '../api';
import GenreTag from './GenreTag.vue';

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

const status = ref<'Backlog' | 'In Progress' | 'On Hold' | 'Completed'>('Backlog');
const rating = ref<number>(0);
const hoverRating = ref<number | null>(null);
const hoursPlayed = ref<number | null>(null);
const review = ref('');
const isEditingReview = ref(false);

const isExistingInLibrary = computed(() => {
  return !!props.existingEntry && !!props.existingEntry.status;
});

watch(() => props.steamId, async (newId) => {
  if (!newId || Number.isNaN(Number(newId))) {
    game.value = null;
    return;
  }
  
  status.value = (props.existingEntry?.status as any) || 'Backlog';
  rating.value = props.existingEntry?.rating || 0;
  hoursPlayed.value = (props.existingEntry as any)?.hoursPlayed || null;
  review.value = props.existingEntry?.notes || '';
  formError.value = '';
  isEditingReview.value = !props.existingEntry?.notes;

  loading.value = true;
  try {
    game.value = await fetchGameDetails(Number(newId));
  } catch (err) {
    game.value = null;
  } finally {
    loading.value = false;
  }
});

const activeRating = computed(() => hoverRating.value !== null ? hoverRating.value : rating.value);

function clearRating() {
  rating.value = 0;
  hoverRating.value = null;
}

async function handleSave() {
  if (!props.steamId || !game.value) return;
  saving.value = true;
  formError.value = '';

  const payload: Partial<LibraryItem> & Record<string, any> = {
    id: props.existingEntry?.id,
    steam_id: Number(props.steamId),
    name: game.value.title,
    background_image: game.value.icon,
    status: status.value,
    rating: status.value === 'Completed' ? rating.value : 0,
    hoursPlayed: status.value === 'Completed' ? hoursPlayed.value : null,
    notes: status.value === 'Completed' ? review.value.trim() : '',
  };

  try {
    const saved = await saveLibraryItem(payload as any);
    emit('saved', saved);
    const actionText = isExistingInLibrary.value ? 'Updated entry for' : 'Saved';
    emit('toast', `${actionText} ${game.value.title}`);
    emit('close');
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
      <div class="overflow-y-auto max-h-[88vh] border-b md:border-b-0 md:border-r border-dashed border-ink/20 flex flex-col justify-between">
        <div v-if="loading" class="p-5 space-y-3">
          <div class="skeleton w-full aspect-video"></div>
          <div class="skeleton h-4 w-3/4 rounded-sm"></div>
        </div>
        <div v-else-if="game" class="p-0 flex-1 flex flex-col">
          <img :src="game.icon" :alt="game.title" class="w-full aspect-video object-cover" />
          <div class="p-5 space-y-4 flex-1">
            <div class="flex flex-wrap gap-2 font-mono text-[10px] uppercase">
              <span class="bg-ink/10 px-2 py-1 rounded-sm">{{ game.releaseDate }}</span>
            </div>

            <!-- Genres -->
            <div>
              <p class="font-mono text-[11px] uppercase text-ink/40 mb-1.5">Genres</p>
              <div v-if="game.genres && game.genres.length > 0" class="flex flex-wrap gap-1.5">
                <GenreTag v-for="genre in game.genres" :key="genre" :genre="genre" />
              </div>
              <p v-else class="text-sm text-ink/40 font-mono">—</p>
            </div>

            <div>
              <p class="font-mono text-[11px] uppercase text-ink/40 mb-0.5">About</p>
              <p class="text-sm text-ink/80 leading-relaxed">{{ game.shortDescription || 'No description available.' }}</p>
            </div>
          </div>

          <!-- Steam Store Button -->
          <div class="p-5 pt-0 mt-auto">
            <a 
              :href="`https://store.steampowered.com/app/${steamId}`" 
              target="_blank" 
              rel="noopener noreferrer"
              class="inline-flex items-center justify-center gap-2 w-full bg-ink/10 hover:bg-ink hover:text-paper text-ink font-mono text-xs uppercase tracking-wider py-2.5 rounded-sm transition-colors"
            >
              <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.03 4.524 4.524s-2.03 4.524-4.524 4.524h-.105l-4.076 2.911c.002.052.006.105.006.158 0 1.807-1.465 3.272-3.272 3.272-1.32 0-2.463-.782-2.985-1.912L.357 16.115C1.722 20.756 5.98 24 11.979 24c6.627 0 12-5.373 12-12s-5.373-12-12-12z"/>
              </svg>
              View on Steam Store
            </a>
          </div>
        </div>
      </div>

      <!-- RIGHT: Tracker Form -->
      <div class="overflow-y-auto max-h-[88vh] p-6">
        <h3 class="font-mono text-[11px] uppercase tracking-widest text-ink/40 mb-1">
          {{ isExistingInLibrary ? 'Library Entry' : 'Shelf It' }}
        </h3>
        <p class="font-display text-3xl leading-none mb-5 text-stub">{{ game?.title || '—' }}</p>
        
        <form @submit.prevent="handleSave" class="space-y-5">
          <!-- Status Field -->
          <div>
            <label class="block font-mono text-xs uppercase text-ink/60 mb-1.5">Status</label>
            <select v-model="status" class="w-full bg-white border border-ink/15 rounded-sm px-3 py-2.5 font-body text-sm">
              <option value="Backlog">Backlog</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <template v-if="status === 'Completed'">
            <!-- Hours Played Field -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="font-mono text-xs uppercase text-ink/60">Hours Played (Optional)</label>
                <button 
                  v-if="hoursPlayed !== null" 
                  type="button" 
                  @click="hoursPlayed = null"
                  class="font-mono text-[10px] uppercase text-ink/40 hover:text-red-500 underline"
                >
                  Clear
                </button>
              </div>
              <input 
                v-model.number="hoursPlayed" 
                type="number" 
                step="0.1" 
                min="0" 
                placeholder="e.g. 45.5" 
                class="w-full bg-white border border-ink/15 rounded-sm px-3 py-2 font-body text-sm"
              />
            </div>

            <!-- Star Rating -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="font-mono text-xs uppercase text-ink/60">Game Rating (Optional)</label>
                <div class="flex items-center gap-2">
                  <span v-if="activeRating > 0" class="font-mono text-xs text-amber-600 font-bold">{{ activeRating }} / 5</span>
                  <button 
                    v-if="rating > 0" 
                    type="button" 
                    @click="clearRating"
                    class="font-mono text-[10px] uppercase text-ink/40 hover:text-red-500 underline"
                  >
                    Clear
                  </button>
                </div>
              </div>
              
              <div class="flex items-center gap-1" @mouseleave="hoverRating = null">
                <div 
                  v-for="i in 5" 
                  :key="`star-${i}`" 
                  class="relative w-7 h-7 text-2xl select-none"
                >
                  <div 
                    class="absolute left-0 top-0 w-1/2 h-full z-10 cursor-pointer"
                    @mouseenter="hoverRating = i - 0.5"
                    @click="rating = i - 0.5"
                  ></div>
                  <div 
                    class="absolute right-0 top-0 w-1/2 h-full z-10 cursor-pointer"
                    @mouseenter="hoverRating = i"
                    @click="rating = i"
                  ></div>

                  <span class="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span v-if="activeRating >= i" class="text-amber-400">★</span>
                    <span v-else-if="activeRating === i - 0.5" class="bg-linear-to-r from-amber-400 to-ink/20 bg-clip-text text-transparent">★</span>
                    <span v-else class="text-ink/20">★</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- Review Block -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="font-mono text-xs uppercase text-ink/60">Reviews & Comments (Optional)</label>
                <button 
                  v-if="!isEditingReview && review" 
                  type="button" 
                  @click="isEditingReview = true"
                  class="font-mono text-[10px] uppercase text-ink/60 hover:text-stub underline"
                >
                  Edit Review
                </button>
              </div>

              <!-- Textarea view mode when editing -->
              <textarea 
                v-if="isEditingReview || !review"
                v-model="review" 
                rows="4" 
                placeholder="Share your experience playing this game..." 
                class="w-full bg-white border border-ink/15 rounded-sm px-3 py-2.5 font-body text-sm resize-none focus:outline-none focus:border-ink/40"
              ></textarea>

              <!-- Display Mode with Warm Theme Border -->
              <div 
                v-else 
                class="w-full bg-ink/5 border border-ink/20 rounded-sm p-3 font-body text-sm text-ink/80 leading-relaxed whitespace-pre-wrap min-h-22.5"
              >
                {{ review }}
              </div>
            </div>
          </template>

          <!-- Dynamic Button Label -->
          <button 
            type="submit" 
            :disabled="saving" 
            class="w-full bg-ink text-paper font-mono text-xs uppercase tracking-widest py-3 rounded-sm hover:bg-stub transition-colors"
          >
            {{ saving ? 'Saving...' : (isExistingInLibrary ? 'Update Changes' : 'Save to Shelf') }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>