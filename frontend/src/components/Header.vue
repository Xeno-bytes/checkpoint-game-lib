<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const authStore = useAuthStore()
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
              @click="authStore.logout"
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
</template>