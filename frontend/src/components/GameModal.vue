<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { LibraryItem, GameDetails } from '../types/game';
import { fetchGameDetails, saveLibraryItem, deleteLibraryItem } from '../api';
import GenreTag from './GenreTag.vue';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();

const props = defineProps<{
  steamId: number | null;
  existingEntry: LibraryItem | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved', item: LibraryItem): void;
  (e: 'deleted', id: string | number): void;
  (e: 'toast', msg: string, isError?: boolean): void;
}>();

const game = ref<GameDetails | null>(null);
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const formError = ref('');

const status = ref<'Backlog' | 'In Progress' | 'On Hold' | 'Dropped' | 'Completed' | 'Endless'>('Backlog');
const rating = ref<number>(0);
const hoverRating = ref<number | null>(null);
const hoursPlayed = ref<number | null>(null);
const review = ref('');
const isEditingReview = ref(false);

const isExistingInLibrary = computed(() => {
  return !!props.existingEntry && !!props.existingEntry.status;
});

// Hours, Rating, and Review will ONLY show for Completed or Endless
const isRateable = computed(() => {
  return status.value === 'Completed' || status.value === 'Endless';
});

// Normalizes legacy DB strings like 'Playing' to frontend equivalents
function normalizeStatus(rawStatus: string | undefined): 'Backlog' | 'In Progress' | 'On Hold' | 'Dropped' | 'Completed' | 'Endless' {
  switch (rawStatus) {
    case 'Playing':
      return 'In Progress';
    case 'Plan to Play':
      return 'Backlog';
    case 'Backlog':
    case 'In Progress':
    case 'On Hold':
    case 'Dropped':
    case 'Completed':
    case 'Endless':
      return rawStatus;
    default:
      return 'Backlog';
  }
}

watch(
  () => [props.steamId, props.existingEntry] as const,
  async ([newId, newEntry]) => {
    const parsedId = Number(newId);
    if (!newId || Number.isNaN(parsedId) || parsedId === 0) {
      game.value = null;
      loading.value = false;
      return;
    }

    if (newEntry) {
      const raw = newEntry as Record<string, any>;
      const rawStatus = newEntry.status || raw.status;
      status.value = normalizeStatus(rawStatus);
      rating.value = Number(newEntry.rating ?? raw.rating) || 0;
      hoursPlayed.value = newEntry.hoursPlayed ?? raw.playtimeHours ?? null;
      review.value = newEntry.notes || raw.reviewContent || '';
      isEditingReview.value = !review.value;
    } else {
      status.value = 'Backlog';
      rating.value = 0;
      hoursPlayed.value = null;
      review.value = '';
      isEditingReview.value = true;
    }

    formError.value = '';

    loading.value = true;
    try {
      game.value = await fetchGameDetails(parsedId);
    } catch (err) {
      game.value = null;
    } finally {
      loading.value = false;
    }
  },
  { immediate: true }
);

const activeRating = computed(() => (hoverRating.value !== null ? hoverRating.value : rating.value));

function clearRating() {
  rating.value = 0;
  hoverRating.value = null;
}

async function handleSave() {
  if (!props.steamId || !game.value) return;

  if (!authStore.firebaseUser) {
    emit('toast', 'Please sign in to save games to your shelf', true);
    authStore.loginWithGoogle();
    return;
  }

  if (authStore.needsProfileSetup) {
    emit('toast', 'Please set up your nickname first', true);
    return;
  }

  saving.value = true;
  formError.value = '';

  const rawEntry = (props.existingEntry as any) || {};

  // Reset metrics if the game is not in Completed or Endless status
  const finalRating = isRateable.value ? rating.value : 0;
  const finalHours = isRateable.value ? hoursPlayed.value : null;
  const finalNotes = isRateable.value ? review.value.trim() : '';

  const payload: Record<string, any> = {
    id: props.existingEntry?.id || rawEntry._id,
    _id: rawEntry._id || props.existingEntry?.id,
    steam_id: Number(props.steamId),
    appId: Number(props.steamId),
    name: game.value.title,
    background_image: game.value.icon,
    status: status.value,
    rating: finalRating,
    hoursPlayed: finalHours,
    playtimeHours: finalHours,
    notes: finalNotes,
    reviewContent: finalNotes,
  };

  try {
    const token = await authStore.getToken();
    const saved = await saveLibraryItem(payload as any, token);
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

async function handleDelete() {
  const entryId = props.existingEntry?.id || (props.existingEntry as any)?._id;
  if (!entryId) return;

  deleting.value = true;
  try {
    const token = await authStore.getToken();
    await deleteLibraryItem(entryId, token);
    emit('deleted', entryId);
    emit('toast', `Removed ${game.value?.title || 'game'} from shelf`);
    emit('close');
  } catch (err) {
    formError.value = "Couldn't remove entry. Try again.";
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <div v-if="props.steamId" class="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6">
    <div class="case-open bg-paper w-full max-w-4xl max-h-[90vh] md:max-h-[85vh] rounded-sm shadow-2xl overflow-hidden relative grid grid-cols-1 md:grid-cols-2">
      <!-- Close Button -->
      <button 
        type="button"
        @click="emit('close')" 
        class="absolute top-3 right-3 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-ink text-paper font-mono text-xs sm:text-sm hover:bg-stub transition-colors shadow-md flex items-center justify-center"
      >
        ✕
      </button>

      <!-- LEFT: Game Details from API -->
      <div class="overflow-y-auto max-h-[40vh] md:max-h-[85vh] border-b md:border-b-0 md:border-r border-dashed border-ink/20 flex flex-col justify-between">
        <div v-if="loading" class="p-4 sm:p-5 space-y-3">
          <div class="skeleton w-full aspect-video"></div>
          <div class="skeleton h-4 w-3/4 rounded-sm"></div>
        </div>

        <div v-else-if="game" class="p-0 flex-1 flex flex-col">
          <img :src="game.icon" :alt="game.title" class="w-full aspect-video object-cover" />
          <div class="p-4 sm:p-5 space-y-3 sm:space-y-4 flex-1">
            <div class="flex flex-wrap gap-2 font-mono text-[10px] uppercase">
              <span v-if="game.releaseDate" class="bg-ink/10 px-2 py-1 rounded-sm">{{ game.releaseDate }}</span>
            </div>

            <!-- Genres -->
            <div>
              <p class="font-mono text-[10px] sm:text-[11px] uppercase text-ink/40 mb-1">Genres</p>
              <div v-if="game.genres && game.genres.length > 0" class="flex flex-wrap gap-1.5">
                <GenreTag v-for="genre in game.genres" :key="genre" :genre="genre" />
              </div>
              <p v-else class="text-xs sm:text-sm text-ink/40 font-mono">—</p>
            </div>

            <!-- About -->
            <div>
              <p class="font-mono text-[10px] sm:text-[11px] uppercase text-ink/40 mb-0.5">About</p>
              <p class="text-xs sm:text-sm text-ink/80 leading-relaxed">{{ game.shortDescription || 'No description available.' }}</p>
            </div>
          </div>

          <!-- Steam Store Link -->
          <div class="p-4 sm:p-5 pt-0 mt-auto">
            <a 
              :href="`https://store.steampowered.com/app/${props.steamId}`" 
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

        <div v-else class="p-8 text-center text-ink/60 font-mono text-xs">
          Unable to fetch details for App ID {{ props.steamId }}.
        </div>
      </div>

      <!-- RIGHT: User Tracker Form -->
      <div class="overflow-y-auto max-h-[50vh] md:max-h-[85vh] p-4 sm:p-6">
        <h3 class="font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-ink/40 mb-0.5">
          {{ isExistingInLibrary ? 'Library Entry' : 'Shelf It' }}
        </h3>
        <p class="font-display text-2xl sm:text-3xl leading-tight mb-4 text-stub">{{ game?.title || '—' }}</p>
        
        <form @submit.prevent="handleSave" class="space-y-4 sm:space-y-5">
          <!-- Status Field -->
          <div>
            <label class="block font-mono text-xs uppercase text-ink/60 mb-1">Status</label>
            <select v-model="status" class="w-full bg-white border border-ink/15 rounded-sm px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-ink/40">
              <option value="Backlog">Backlog</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Dropped">Dropped</option>
              <option value="Endless">Endless</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <!-- ONLY SHOW HOURS, RATING, AND REVIEWS FOR COMPLETED OR ENDLESS -->
          <template v-if="isRateable">
            <!-- Hours Played Field -->
            <div>
              <div class="flex items-center justify-between mb-1">
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
                placeholder="e.g. 41" 
                class="w-full bg-white border border-ink/15 rounded-sm px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-ink/40"
              />
            </div>

            <!-- Star Rating Field -->
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

            <!-- Review Field -->
            <div>
              <div class="flex items-center justify-between mb-1">
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

              <textarea 
                v-if="isEditingReview || !review"
                v-model="review" 
                rows="3" 
                placeholder="Share your experience playing this game..." 
                class="w-full bg-white border border-ink/15 rounded-sm px-3 py-2 font-body text-sm text-ink resize-none focus:outline-none focus:border-ink/40"
              ></textarea>

              <div 
                v-else 
                class="w-full bg-ink/5 border border-ink/20 rounded-sm p-3 font-body text-sm text-ink/80 leading-relaxed whitespace-pre-wrap min-h-17.5"
              >
                {{ review }}
              </div>
            </div>
          </template>

          <p v-if="formError" class="font-mono text-xs text-red-500 font-bold">
            {{ formError }}
          </p>

          <!-- Action Buttons -->
          <div class="flex items-center gap-2 pt-2">
            <button 
              type="submit" 
              :disabled="saving || deleting" 
              class="flex-1 bg-ink text-paper font-mono text-xs uppercase tracking-widest py-3 rounded-sm hover:bg-stub transition-colors disabled:opacity-50"
            >
              {{ saving ? 'Saving...' : (isExistingInLibrary ? 'Update Changes' : 'Save to Shelf') }}
            </button>

            <button 
              v-if="isExistingInLibrary" 
              type="button" 
              @click="handleDelete" 
              :disabled="saving || deleting" 
              class="px-4 py-3 bg-red-50 border border-red-200 text-red-600 font-mono text-xs uppercase tracking-wider rounded-sm hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {{ deleting ? '...' : 'Remove' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>