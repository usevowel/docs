/**
 * VitePress Custom Theme
 * Extends the default theme and adds voice functionality
 */

import DefaultTheme from 'vitepress/theme'
import VoiceLayout from './VoiceLayout.vue'
import LogoWrapper from './LogoWrapper.vue'
import './custom.css'

// Import Vowel client styles
import '@vowel.to/client/css'

export default {
  extends: DefaultTheme,
  Layout: VoiceLayout,
  enhanceApp({ app }) {
    // Register the logo component globally
    app.component('VitePressLogo', LogoWrapper)
  }
}

