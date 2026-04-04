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
    <template #nav-bar-content-after>
      <!-- Voice configuration button in navbar -->
      <button
        class="voice-config-btn"
        @click="openConfigModal"
        :class="{ 'has-config': hasStoredConfig, 'voice-active': voiceEnabled }"
        :title="voiceEnabled ? 'Voice active - Click to configure' : (hasStoredConfig ? 'Voice configured - Click to edit' : 'Configure voice agent')"
      >
        <!-- Microphone icon -->
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" x2="12" y1="19" y2="22"/>
        </svg>
        <span class="btn-text"><span class="vowel-brand">voweldocs</span></span>
        <!-- Blue checkmark when voice is enabled -->
        <svg v-if="voiceEnabled" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="status-icon checkmark-icon">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        <!-- Settings icon shown when voice not enabled (click to configure) -->
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="status-icon settings-icon">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </button>
    </template>
  </Layout>

  <!-- Voice Configuration Modal -->
  <VoiceConfigModal
    v-model="showConfigModal"
    @configured="onVoiceConfigured"
    @cleared="onVoiceCleared"
    ref="configModalRef"
  />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useRouter } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import VoiceAgent from './VoiceAgent.vue'
import LogoWrapper from './LogoWrapper.vue'
import HomeHero from './HomeHero.vue'
import VoiceConfigModal from './VoiceConfigModal.vue'
import {
  initVoiceAgent,
  cleanupVoiceAgent,
  hasVoiceConfig,
  getVoiceConfig,
  type StoredCredentials
} from './voice-client'

const { Layout } = DefaultTheme

// Get VitePress router in Vue setup context
const router = useRouter()

// Modal state
const showConfigModal = ref(false)
const configModalRef = ref<InstanceType<typeof VoiceConfigModal> | null>(null)

// Track if voice is configured
const hasStoredConfig = ref(false)
const voiceEnabled = ref(false)

/**
 * Check if voice configuration exists
 */
function checkVoiceConfig() {
  const hasConfig = hasVoiceConfig()
  hasStoredConfig.value = hasConfig
  return hasConfig
}

/**
 * Open the configuration modal
 */
function openConfigModal() {
  showConfigModal.value = true
}

/**
 * Handle voice configuration saved
 */
async function onVoiceConfigured(credentials: StoredCredentials) {
  hasStoredConfig.value = true

  // Initialize voice agent with the new configuration
  const success = await initVoiceAgent(router, credentials)
  voiceEnabled.value = success

  if (success) {
    console.log('🎤 Voice agent enabled with new configuration')
  } else {
    console.error('❌ Failed to enable voice agent with new configuration')
  }
}

/**
 * Handle voice configuration cleared
 */
function onVoiceCleared() {
  hasStoredConfig.value = false
  voiceEnabled.value = false
  cleanupVoiceAgent()
  console.log('🎤 Voice configuration cleared')
}

/**
 * Initialize voice on mount if configuration exists
 */
onMounted(async () => {
  if (typeof window === 'undefined') return

  // Check for existing configuration
  const hasConfig = checkVoiceConfig()

  if (hasConfig) {
    // Initialize voice agent with stored configuration
    const success = await initVoiceAgent(router)
    voiceEnabled.value = success

    if (success) {
      console.log('🎤 Voice agent initialized from stored configuration')
    }
  }

  // Listen for storage changes (e.g., from other tabs)
  window.addEventListener('storage', handleStorageChange)
})

/**
 * Handle localStorage changes from other tabs
 */
function handleStorageChange(event: StorageEvent) {
  if (event.key === 'voweldoc-config') {
    const newConfig = event.newValue
    const oldConfig = event.oldValue

    if (newConfig && !oldConfig) {
      // Config was added
      hasStoredConfig.value = true
      initVoiceAgent(router).then((success) => {
        voiceEnabled.value = success
      })
    } else if (!newConfig && oldConfig) {
      // Config was removed
      hasStoredConfig.value = false
      voiceEnabled.value = false
      cleanupVoiceAgent()
    }
  }
}

/**
 * Clean up on unmount
 */
onUnmounted(() => {
  cleanupVoiceAgent()
  window.removeEventListener('storage', handleStorageChange)
})
</script>

<style scoped>
.voice-config-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: transparent;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: 0.75rem;
}

.voice-config-btn:hover {
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg-soft);
}

.voice-config-btn.has-config {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.voice-config-btn.has-config:hover {
  background: var(--vp-c-brand-1);
  color: white;
}

.voice-config-btn.voice-active {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.voice-config-btn.voice-active:hover {
  background: var(--vp-c-brand-1);
  color: white;
}

.btn-text {
  display: inline;
}

/* Vowel brand styling with OCR-A font */
.vowel-brand {
  font-family: 'OCR-A', 'Courier New', monospace;
  letter-spacing: 0.05em;
}

/* Status icon styling - positioned to right of label */
.status-icon {
  margin-left: 0.25rem;
  opacity: 0.9;
}

/* Blue checkmark for active voice state */
.checkmark-icon {
  color: #3b82f6; /* Tailwind blue-500 */
  stroke: #3b82f6;
}

.voice-config-btn.voice-active .checkmark-icon {
  color: #3b82f6;
  stroke: #3b82f6;
  opacity: 1;
}

.voice-config-btn.voice-active:hover .checkmark-icon {
  color: white;
  stroke: white;
}

/* Settings icon styling */
.settings-icon {
  opacity: 0.7;
}

.voice-config-btn:hover .settings-icon {
  opacity: 1;
}

/* Hide text on smaller screens */
@media (max-width: 768px) {
  .btn-text {
    display: none;
  }

  .voice-config-btn {
    padding: 0.375rem;
  }

  .status-icon {
    display: none;
  }
}
</style>
