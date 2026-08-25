<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
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

      <!-- NAVIGATION -->
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

    </div>
  </header>
</template>