<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="w-full bg-ink text-paper shelf-edge-top mt-auto border-t border-paper/10">
    <div class="max-w-6xl mx-auto px-4 sm:px-5 py-8 space-y-6">
      
      <!-- LOGO & TAGLINE ON THE RIGHT -->
      <div class="flex flex-col items-end text-right space-y-1 pb-3 border-b border-paper/10">
        <div class="flex items-center gap-3">
          <span class="font-display text-3xl tracking-wider text-tag uppercase">
            Checkpoint
          </span>

          <!-- CHECKPOINT LOGO SVG -->
          <svg 
            viewBox="0 0 40 40" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            class="w-8 h-8 shrink-0 overflow-visible"
          >
            <path d="M6 31L20 37L34 31L20 25L6 31Z" class="fill-ink stroke-tag" stroke-width="2" stroke-linejoin="bevel" />
            <path d="M12 31L20 5L28 31" class="stroke-tag/60 beam-pulse" stroke-width="1.5" stroke-dasharray="2 2" fill="none" />
            <g class="crystal-spinner">
              <path d="M20 3L30 12L20 19L10 12L20 3Z" class="fill-tag" />
              <path d="M10 12L20 19V28L10 12Z" fill="#EAB308" />
              <path d="M30 12L20 19V28L30 12Z" fill="#CA8A04" />
            </g>
          </svg>
        </div>
      </div>

      <!-- ATTRIBUTION & COPYRIGHT -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-[11px] text-paper/50 uppercase tracking-widest">
        <div>
          &copy; {{ currentYear }} CHECKPOINT. ALL RIGHTS RESERVED.
        </div>

        <div class="flex items-center gap-2">
          <span>DATA PROVIDED BY</span>
          <a 
            href="https://store.steampowered.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="text-paper/80 hover:text-tag transition-colors underline decoration-paper/30"
          >
            STEAM WEB API
          </a>
        </div>
      </div>

    </div>
  </footer>
</template>

<style scoped>
.crystal-spinner {
  transform-origin: 20px 15.5px;
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.crystal-spinner:hover {
  transform: rotateY(180deg);
}
</style>