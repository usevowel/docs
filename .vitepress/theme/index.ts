/**
 * VitePress Custom Theme
 * Extends the default theme and adds voice functionality
 */

import DefaultTheme from 'vitepress/theme'
import VoiceLayout from './VoiceLayout.vue'
import LogoWrapper from './LogoWrapper.vue'
import './custom.css'

// Import RAG debug tool
import { initializeRAGDebug } from './rag-debug'

export default {
  extends: DefaultTheme,
  Layout: VoiceLayout,
  enhanceApp({ app, router }) {
    // Register the logo component globally
    app.component('VitePressLogo', LogoWrapper)

    // Initialize RAG debug tool after navigation
    // Only runs if PUBLIC_VOWEL_DEBUG_RAG is enabled
    if (typeof window !== 'undefined') {
      // Set up theme toggle watcher - ensures toggle works with dark default
      const setupThemeWatcher = () => {
        // Watch for toggle clicks and sync localStorage
        const toggle = document.querySelector('.VPSwitchAppearance')
        if (toggle) {
          toggle.addEventListener('click', () => {
            // Let VitePress handle the toggle, but ensure we track it
            setTimeout(() => {
              const isDark = document.documentElement.classList.contains('dark')
              localStorage.setItem('vitepress-theme-appearance', isDark ? 'dark' : 'light')
            }, 50)
          })
        }
      }

      // Initialize on app mount
      router.onAfterRouteChanged = () => {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          initializeRAGDebug()
          setupThemeWatcher()
        }, 100)
      }

      // Also try to initialize immediately (for initial page load)
      const init = () => {
        setTimeout(() => {
          initializeRAGDebug()
          setupThemeWatcher()
        }, 100)
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init)
      } else {
        init()
      }
    }
  }
}

