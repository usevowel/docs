/**
 * VitePress Custom Theme
 * Extends the default theme and adds voice functionality
 */

import DefaultTheme from 'vitepress/theme'
import VoiceLayout from './VoiceLayout.vue'
import LogoWrapper from './LogoWrapper.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout: VoiceLayout,
  async enhanceApp({ app, router }) {
    app.component('VitePressLogo', LogoWrapper)

    if (typeof window !== 'undefined') {
      await import('@vowel.to/client/css')
    }

    if (typeof window !== 'undefined') {
      const setupThemeWatcher = () => {
        const toggle = document.querySelector('.VPSwitchAppearance')
        if (toggle) {
          toggle.addEventListener('click', () => {
            setTimeout(() => {
              const isDark = document.documentElement.classList.contains('dark')
              localStorage.setItem('vitepress-theme-appearance', isDark ? 'dark' : 'light')
            }, 50)
          })
        }
      }

      router.onAfterRouteChanged = () => {
        setTimeout(() => {
          setupThemeWatcher()
        }, 100)
      }

      const init = () => {
        setTimeout(() => {
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

