<template>
  <div class="custom-hero-name">
    <LogoWrapper />
    <span class="hero-suffix">/client</span>
  </div>
</template>

<script setup lang="ts">
import LogoWrapper from './LogoWrapper.vue'
</script>

<style scoped>
.custom-hero-name {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  font-size: 3rem;
  font-weight: 700;
  line-height: 1;
}

.hero-suffix {
  font-family: OCR-A, monospace;
  font-weight: normal;
}

@media (max-width: 768px) {
  .custom-hero-name {
    font-size: 2rem;
  }
}
</style>

