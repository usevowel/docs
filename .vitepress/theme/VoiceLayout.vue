<template>
  <Layout>
    <!-- Use the default VitePress layout as base -->
    <template #nav-bar-title-before>
      <!-- Custom logo in navbar -->
      <LogoWrapper />
    </template>
    <template #home-hero-name>
      <!-- Custom logo for homepage hero -->
      <HomeHero />
    </template>
    <template #layout-bottom>
      <!-- Add voice agent at the bottom of every page -->
      <VoiceAgent v-if="voiceEnabled" />
    </template>
  </Layout>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import VoiceAgent from './VoiceAgent.vue'
import LogoWrapper from './LogoWrapper.vue'
import HomeHero from './HomeHero.vue'

const { Layout } = DefaultTheme

// Get VitePress router in Vue setup context
const router = useRouter()

// Voice agent is only enabled when VITE_VOWEL_APP_ID is set at build time
const voiceEnabled = !!import.meta.env.VITE_VOWEL_APP_ID

onMounted(() => {
  if (!voiceEnabled) return
  // Initialize voice agent after the page loads (client-side only)
  if (typeof window !== 'undefined') {
    import('./voice-client').then(({ initVoiceAgent }) => {
      // Pass the router instance to the voice client
      initVoiceAgent(router)
    })
  }
})

onUnmounted(() => {
  if (!voiceEnabled) return
  // Clean up when navigating away
  if (typeof window !== 'undefined') {
    import('./voice-client').then(({ cleanupVoiceAgent }) => {
      cleanupVoiceAgent()
    })
  }
})
</script>

<style scoped>
#vowel-voice-container {
  /* Container for the voice agent */
  position: fixed;
  bottom: 0;
  right: 0;
  z-index: 9999;
}
</style>

