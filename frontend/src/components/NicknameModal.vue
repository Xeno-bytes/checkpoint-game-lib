<template>
  <div 
    v-if="authStore.needsProfileSetup" 
    class="fixed inset-0 bg-ink/75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
  >
    <div class="case-open bg-paper border border-ink/20 rounded-sm p-6 sm:p-8 w-full max-w-md shadow-2xl relative">
      <!-- Top Accent Line -->
      <div class="absolute top-0 left-0 right-0 h-1 bg-stub rounded-t-sm"></div>

      <div class="mb-6">
        <span class="font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-ink/40 block mb-1">
          Identity Verification
        </span>
        <h2 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink uppercase">
          Welcome to Checkpoint
        </h2>
        <p class="font-mono text-xs text-ink/60 mt-1 leading-relaxed">
          Choose a unique handle to personalize your game shelf and profile.
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-5">
        <div>
          <label class="block font-mono text-xs uppercase text-ink/70 font-bold mb-1.5">
            Nickname Handle
          </label>
          <div class="relative flex items-center">
            <span class="absolute left-3 font-mono text-sm text-ink/40 font-bold">@</span>
            <input
              v-model="nickname"
              type="text"
              placeholder="GamerTag99"
              class="w-full bg-white border border-ink/20 rounded-sm pl-8 pr-4 py-2.5 font-mono text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:border-ink/60 focus:ring-1 focus:ring-ink/20 transition-all"
              required
              minlength="3"
            />
          </div>
        </div>

        <!-- Error Feedback -->
        <div v-if="errorMessage" class="bg-red-500/10 border border-red-500/30 p-2.5 rounded-sm">
          <p class="font-mono text-xs text-red-700 leading-snug">{{ errorMessage }}</p>
        </div>

        <button
          type="submit"
          :disabled="isSubmitting || !nickname.trim()"
          class="w-full bg-ink text-paper font-mono text-xs font-bold uppercase tracking-widest py-3 rounded-sm hover:bg-stub transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {{ isSubmitting ? 'Registering Handle...' : 'Set Nickname' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const nickname = ref('');
const errorMessage = ref('');
const isSubmitting = ref(false);

async function handleSubmit() {
  errorMessage.value = '';
  isSubmitting.value = true;
  try {
    await authStore.setupProfile(nickname.value.trim());
  } catch (err: any) {
    errorMessage.value = err.message || 'Failed to register nickname';
  } finally {
    isSubmitting.value = false;
  }
}
</script>