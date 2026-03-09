<template>
  <div ref="containerRef"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { createRoot } from 'react-dom/client'
import { createElement } from 'react'
import { VoiceAgentContainer } from './VoiceAgentWrapper'

const containerRef = ref<HTMLElement | null>(null)
let reactRoot: any = null

onMounted(() => {
  const container = containerRef.value
  if (!container) return

  // Create React root and render VoiceAgentContainer
  reactRoot = createRoot(container)
  reactRoot.render(createElement(VoiceAgentContainer))
})

onUnmounted(() => {
  if (reactRoot) {
    reactRoot.unmount()
    reactRoot = null
  }
})
</script>

