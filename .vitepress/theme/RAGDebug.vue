<template>
  <div ref="containerRef"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { createRoot } from 'react-dom/client'
import { createElement } from 'react'
import { RAGDebugTool } from './rag-debug/RAGDebugTool'

const containerRef = ref<HTMLElement | null>(null)
let reactRoot: any = null

onMounted(() => {
  const container = containerRef.value
  if (!container) return

  try {
    reactRoot = createRoot(container)
    reactRoot.render(createElement(RAGDebugTool))
    console.log('[RAGDebug] Vue wrapper mounted')
  } catch (error) {
    console.error('[RAGDebug] Failed to create React root:', error)
  }
})

onUnmounted(() => {
  if (reactRoot) {
    reactRoot.unmount()
    reactRoot = null
    console.log('[RAGDebug] React root unmounted')
  }
})
</script>