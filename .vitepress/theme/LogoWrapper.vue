<template>
  <div ref="containerRef" class="vowel-logo-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { createRoot } from 'react-dom/client'
import { createElement } from 'react'
import { Logo } from './Logo'

const containerRef = ref<HTMLElement | null>(null)
let reactRoot: any = null

onMounted(() => {
  const container = containerRef.value
  if (!container) return

  // Create React root and render Logo
  reactRoot = createRoot(container)
  reactRoot.render(createElement(Logo))
})

onUnmounted(() => {
  if (reactRoot) {
    reactRoot.unmount()
    reactRoot = null
  }
})
</script>

<style scoped>
.vowel-logo-container {
  display: flex;
  align-items: center;
  height: 100%;
  margin-right: 12px;
}
</style>

