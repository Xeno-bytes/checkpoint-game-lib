<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const authStore = useAuthStore()

const showLogoutModal = ref(false)
const isMobileMenuOpen = ref(false)

// Close sidebar navigation automatically whenever route changes
watch(() => route.path, () => {
  isMobileMenuOpen.value = false
})

function confirmLogout() {
  authStore.logout()
  showLogoutModal.value = false
  isMobileMenuOpen.value = false
}
</script>

<template>
  <header class="sticky top-0 z-30 bg-ink text-paper shelf-edge">
    <div class="max-w-6xl mx-auto px-4 sm:px-5 h-14 flex items-center justify-between gap-2 sm:gap-4">
      
      <!-- LOGO / BRANDING -->
      <div class="flex items-center gap-2.5 sm:gap-3">
      <router-link to="/" class="flex items-center gap-2.5 group">
        <!-- CHECKPOINT LOGO -->
        <svg 
          viewBox="0 0 40 40" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          class="w-8 h-8 sm:w-10 sm:h-10 shrink-0 overflow-visible"
        >
          <path d="M6 31L20 37L34 31L20 25L6 31Z" class="fill-ink stroke-tag" stroke-width="2" stroke-linejoin="bevel" />

          <path d="M12 31L20 5L28 31" class="stroke-tag/60 beam-pulse" stroke-width="1.5" stroke-dasharray="2 2" fill="none" />

          <g class="crystal-spinner">
            <path d="M20 3L30 12L20 19L10 12L20 3Z" class="fill-tag" />
            <path d="M10 12L20 19V28L10 12Z" fill="#EAB308" />
            <path d="M30 12L20 19V28L30 12Z" fill="#CA8A04" />
          </g>
        </svg>

        <span class="font-display text-2xl sm:text-4xl tracking-wider leading-none text-tag">
          Checkpoint
        </span>
      </router-link>

      <span class="hidden md:inline-block font-mono text-[11px] uppercase tracking-[0.2em] text-paper/50 border-l border-paper/30 pl-3 py-0.5">
        your game shelf
      </span>
    </div>

      <!-- DESKTOP NAVIGATION & AUTH CONTROLS -->
      <div class="hidden md:flex items-center gap-6">
        <nav class="flex items-center gap-6 font-mono text-sm uppercase tracking-wider">
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
            :to="authStore.userProfile?.nickname ? `/library/${authStore.userProfile.nickname}` : '/library'" 
            class="relative py-1 transition-colors hover:text-tag"
            :class="route.path.startsWith('/library') ? 'text-tag font-medium' : 'text-paper/80'"
          >
            My Library
            <span 
              v-if="route.path.startsWith('/library')" 
              class="absolute -bottom-2.5 left-0 right-0 h-0.5 bg-tag"
            ></span>
          </router-link>
        </nav>

        <!-- AUTH ACTION / PROFILE STATUS -->
        <div class="border-l border-paper/20 pl-4 font-mono text-xs uppercase tracking-wider">
          <div v-if="authStore.isLoading" class="text-paper/40 text-[11px]">
            ...
          </div>

          <div v-else-if="authStore.firebaseUser" class="flex items-center gap-3">
            <span class="text-tag font-medium truncate">
              @{{ authStore.userProfile?.nickname || 'user' }}
            </span>
            <button 
              @click="showLogoutModal = true"
              class="text-xs text-paper/60 hover:text-paper border border-paper/30 px-2 py-0.5 transition hover:border-paper"
            >
              Out
            </button>
          </div>

          <button 
            v-else 
            @click="authStore.loginWithGoogle"
            class="bg-tag text-ink font-semibold px-3 py-1 transition hover:opacity-90 active:scale-95"
          >
            Sign In
          </button>
        </div>
      </div>

      <!-- MOBILE HAMBURGER BUTTON -->
      <button 
        @click="isMobileMenuOpen = true"
        type="button"
        aria-label="Open Navigation Menu"
        class="md:hidden p-2 text-paper/80 hover:text-tag focus:outline-none"
      >
        <svg class="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>
        </svg>
      </button>

    </div>
  </header>

  <!-- MOBILE SIDEBAR OVERLAY & DRAWER -->
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div 
        v-if="isMobileMenuOpen" 
        @click="isMobileMenuOpen = false"
        class="fixed inset-0 z-40 bg-ink/70 backdrop-blur-xs md:hidden"
      ></div>
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="slide">
      <aside 
        v-if="isMobileMenuOpen"
        class="fixed top-0 right-0 bottom-0 z-50 w-64 bg-ink text-paper border-l border-paper/20 p-6 flex flex-col justify-between shadow-2xl md:hidden font-mono"
      >
        <div class="space-y-6">
          <!-- Drawer Header -->
          <div class="flex items-center justify-between border-b border-paper/20 pb-4">
            <span class="font-display text-2xl tracking-wider text-tag">Checkpoint</span>
            <button 
              @click="isMobileMenuOpen = false"
              type="button"
              class="w-8 h-8 rounded-full bg-paper/10 text-paper hover:bg-stub transition flex items-center justify-center text-xs"
            >
              ✕
            </button>
          </div>

          <!-- Navigation Links -->
          <nav class="flex flex-col space-y-4 text-sm uppercase tracking-widest">
            <router-link 
              to="/" 
              class="py-2 border-b border-paper/10 transition-colors flex items-center justify-between"
              :class="route.path === '/' ? 'text-tag font-bold' : 'text-paper/80 hover:text-paper'"
            >
              Discover
              <span v-if="route.path === '/'" class="w-1.5 h-1.5 rounded-full bg-tag"></span>
            </router-link>

            <router-link 
              to="/search" 
              class="py-2 border-b border-paper/10 transition-colors flex items-center justify-between"
              :class="route.path === '/search' ? 'text-tag font-bold' : 'text-paper/80 hover:text-paper'"
            >
              Search
              <span v-if="route.path === '/search'" class="w-1.5 h-1.5 rounded-full bg-tag"></span>
            </router-link>

            <router-link 
              to="/library" 
              class="py-2 border-b border-paper/10 transition-colors flex items-center justify-between"
              :class="route.path === '/library' ? 'text-tag font-bold' : 'text-paper/80 hover:text-paper'"
            >
              My Library
              <span v-if="route.path === '/library'" class="w-1.5 h-1.5 rounded-full bg-tag"></span>
            </router-link>
          </nav>
        </div>

        <!-- Auth / Profile Status Footer -->
        <div class="pt-6 border-t border-paper/20">
          <div v-if="authStore.isLoading" class="text-paper/40 text-xs">
            Loading authentication status...
          </div>

          <div v-else-if="authStore.firebaseUser" class="space-y-3">
            <div class="text-xs text-paper/60 uppercase">Signed in as</div>
            <div class="text-tag font-medium truncate text-sm">
              @{{ authStore.userProfile?.nickname || 'user' }}
            </div>
            <button 
              @click="showLogoutModal = true"
              class="w-full text-center text-xs uppercase tracking-wider text-red-300 border border-red-400/30 bg-red-950/40 hover:bg-red-900/60 py-2.5 rounded-sm transition"
            >
              Log Out
            </button>
          </div>

          <button 
            v-else 
            @click="authStore.loginWithGoogle"
            class="w-full bg-tag text-ink font-semibold py-2.5 text-xs uppercase tracking-wider rounded-sm transition hover:opacity-90 active:scale-95"
          >
            Sign In with Google
          </button>
        </div>

      </aside>
    </Transition>
  </Teleport>

  <!-- LOGOUT CONFIRMATION POPUP -->
  <Teleport to="body">
    <Transition name="modal">
      <div 
        v-if="showLogoutModal" 
        class="fixed inset-0 z-50 bg-ink/70 backdrop-blur-xs flex items-center justify-center p-4"
        @click.self="showLogoutModal = false"
      >
        <div class="bg-paper border border-ink/20 w-full max-w-sm rounded-sm shadow-2xl p-5 sm:p-6 space-y-4 relative">
          
          <button 
            type="button"
            @click="showLogoutModal = false" 
            class="absolute top-3 right-3 w-7 h-7 rounded-full bg-ink text-paper font-mono text-xs hover:bg-stub transition-colors flex items-center justify-center"
          >
            ✕
          </button>

          <div class="space-y-1">
            <h3 class="font-mono text-[11px] uppercase tracking-widest text-ink/40">
              Session Action
            </h3>
            <p class="font-display text-2xl leading-none text-stub">
              Sign Out?
            </p>
          </div>

          <p class="text-xs sm:text-sm text-ink/80 leading-relaxed font-body">
            Are you sure you want to logout? You'll need to sign back in to access your game library and custom lists.
          </p>

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
/* Sidebar Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease-out;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.96);
}

/* Crystal 3D Rotation Animation */
.crystal-spinner {
  transform-origin: 20px 15.5px; /* Centers rotation on the crystal core */
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.group:hover .crystal-spinner {
  transform: rotateY(180deg);
}

.beam-pulse {
  transition: opacity 0.3s ease;
}

.group:hover .beam-pulse {
  opacity: 1;
  stroke-dashoffset: -4;
}
</style>