<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const authStore = useAuthStore()

const showLogoutModal = ref(false)

function confirmLogout() {
  authStore.logout()
  showLogoutModal.value = false
}
</script>

<template>
  <header class="sticky top-0 z-30 bg-ink text-paper shelf-edge">
    <div class="max-w-6xl mx-auto px-4 sm:px-5 h-14 flex items-center justify-between gap-2 sm:gap-4">
      
      <!-- LOGO / BRANDING -->
      <div class="flex items-center gap-2 sm:gap-3">
        <span class="font-display text-2xl sm:text-4xl tracking-wider leading-none text-tag">Checkpoint</span>
        <span class="hidden md:inline-block font-mono text-[11px] uppercase tracking-[0.2em] text-paper/50 border-l border-paper/30 pl-3 py-0.5">
          your game shelf
        </span>
      </div>

      <!-- NAVIGATION & AUTH CONTROLS -->
      <div class="flex items-center gap-3 sm:gap-6">
        <nav class="flex items-center gap-3 sm:gap-6 font-mono text-xs sm:text-sm uppercase tracking-wider">
          <router-link 
            to="/" 
            class="relative py-1 transition-colors hover:text-tag"
            :class="route.path === '/' ? 'text-tag font-medium' : 'text-paper/80'"
          >
            Discover
            <span 
              v-if="route.path === '/'" 
              class="absolute -bottom-2.5 left-0 right-0 h-0.5 bg-tag"
            ></span>
          </router-link>

          <router-link 
            to="/search" 
            class="relative py-1 transition-colors hover:text-tag"
            :class="route.path === '/search' ? 'text-tag font-medium' : 'text-paper/80'"
          >
            Search
            <span 
              v-if="route.path === '/search'" 
              class="absolute -bottom-2.5 left-0 right-0 h-0.5 bg-tag"
            ></span>
          </router-link>

          <router-link 
            to="/library" 
            class="relative py-1 transition-colors hover:text-tag"
            :class="route.path === '/library' ? 'text-tag font-medium' : 'text-paper/80'"
          >
            <span class="sm:hidden">Library</span>
            <span class="hidden sm:inline">My Library</span>
            <span 
              v-if="route.path === '/library'" 
              class="absolute -bottom-2.5 left-0 right-0 h-0.5 bg-tag"
            ></span>
          </router-link>
        </nav>

        <!-- AUTH ACTION / PROFILE STATUS -->
        <div class="border-l border-paper/20 pl-3 sm:pl-4 font-mono text-xs uppercase tracking-wider">
          <!-- Loading State -->
          <div v-if="authStore.isLoading" class="text-paper/40 text-[11px]">
            ...
          </div>

          <!-- Logged In State -->
          <div v-else-if="authStore.firebaseUser" class="flex items-center gap-2 sm:gap-3">
            <span class="text-tag font-medium truncate max-w-[100px] sm:max-w-none">
              @{{ authStore.userProfile?.nickname || 'user' }}
            </span>
            <button 
              @click="showLogoutModal = true"
              class="text-[10px] sm:text-xs text-paper/60 hover:text-paper border border-paper/30 px-2 py-0.5 transition hover:border-paper"
            >
              Out
            </button>
          </div>

          <!-- Logged Out State -->
          <button 
            v-else 
            @click="authStore.loginWithGoogle"
            class="bg-tag text-ink font-semibold px-2.5 sm:px-3 py-1 transition hover:opacity-90 active:scale-95"
          >
            Sign In
          </button>
        </div>
      </div>

    </div>
  </header>

  <!-- LOGOUT CONFIRMATION POPUP -->
  <Teleport to="body">
    <Transition name="modal">
      <div 
        v-if="showLogoutModal" 
        class="fixed inset-0 z-50 bg-ink/70 backdrop-blur-xs flex items-center justify-center p-4"
        @click.self="showLogoutModal = false"
      >
        <div class="bg-paper border border-ink/20 w-full max-w-sm rounded-sm shadow-2xl p-5 sm:p-6 space-y-4 relative">
          
          <!-- Close Button -->
          <button 
            type="button"
            @click="showLogoutModal = false" 
            class="absolute top-3 right-3 w-7 h-7 rounded-full bg-ink text-paper font-mono text-xs hover:bg-stub transition-colors flex items-center justify-center"
          >
            ✕
          </button>

          <!-- Modal Header -->
          <div class="space-y-1">
            <h3 class="font-mono text-[11px] uppercase tracking-widest text-ink/40">
              Session Action
            </h3>
            <p class="font-display text-2xl leading-none text-stub">
              Sign Out?
            </p>
          </div>

          <!-- Modal Description -->
          <p class="text-xs sm:text-sm text-ink/80 leading-relaxed font-body">
            Are you sure you want to logout? You'll need to sign back in to access your game library and custom lists.
          </p>

          <!-- Themed Action Buttons -->
          <div class="flex items-center gap-2 pt-2 font-mono text-xs uppercase tracking-wider">
            <button 
              type="button" 
              @click="confirmLogout"
              class="flex-1 bg-ink text-paper py-2.5 rounded-sm hover:bg-stub transition-colors"
            >
              Log Out
            </button>

            <button 
              type="button" 
              @click="showLogoutModal = false"
              class="flex-1 bg-ink/10 hover:bg-ink hover:text-paper text-ink py-2.5 rounded-sm transition-colors border border-ink/10"
            >
              Cancel
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>