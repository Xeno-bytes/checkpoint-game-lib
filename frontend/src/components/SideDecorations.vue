<template>
  <div class="hidden 2xl:block absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
    <!-- Gentle Radial Vignette with Warm Phosphor Pulse -->
    <div class="absolute inset-0 bg-crt-vignette opacity-15 animate-warm-pulse"></div>

    <!-- Micro-Fine CRT Scanline Mesh Pattern -->
    <div class="absolute inset-0 bg-scanlines opacity-10"></div>
  </div>
</template>

<style scoped>
/* Ultra-Fine 2px Scanline Mesh */
.bg-scanlines {
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0),
    rgba(0, 0, 0, 0) 50%,
    rgba(0, 0, 0, 0.25) 50%,
    rgba(0, 0, 0, 0.25)
  );
  background-size: 100% 2px;
}

/* Very Gentle Radial Edge Shadow */
.bg-crt-vignette {
  background: radial-gradient(
    circle at center,
    transparent 65%,
    rgba(0, 0, 0, 0.22) 100%
  );
}

/* Slow, subtle ambient breathing effect (10-second cycle) */
@keyframes warmPulse {
  0%, 100% {
    opacity: 0.12;
  }
  50% {
    opacity: 0.18;
  }
}

.animate-warm-pulse {
  animation: warmPulse 10s ease-in-out infinite;
}
</style>