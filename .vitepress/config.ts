import { defineConfig } from 'vitepress'
import react from '@vitejs/plugin-react'
import { generateRoutesPlugin } from './theme/generate-routes-plugin'

export default defineConfig({
  title: '@vowel.to/client',
  description: 'Voice-powered AI agents for web applications',
  
  ignoreDeadLinks: true, // TODO: Remove once all pages are created
  
  // Logo configuration
  head: [
    ['link', { rel: 'icon', href: '/logo.svg' }],
  ],
  
  // Exclude README.md from the site (it's for developers, not end users)
  srcExclude: ['**/README.md'],
  
  vite: {
    plugins: [
      react(),
      generateRoutesPlugin() // Auto-generate routes for voice navigation
    ],
    define: {
      // Define env variables for voice agent
      'import.meta.env.VITE_VOWEL_APP_ID': JSON.stringify(process.env.VITE_VOWEL_APP_ID || '')
    }
  },
  
  themeConfig: {
    // Logo displayed in the navigation bar
    // logo: '/logo.svg',
    siteTitle: false, // Hide default site title to use custom logo
    
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Recipes', link: '/recipes/' },
      { text: 'API Reference', link: '/api/' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick Start', link: '/guide/quick-start' }
          ]
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Vowel Client', link: '/guide/vowel-client' },
            { text: 'Adapters', link: '/guide/adapters' },
            { text: 'Actions', link: '/guide/actions' },
            { text: 'Event Notifications', link: '/guide/event-notifications' }
          ]
        },
        {
          text: 'Integration',
          items: [
            { text: 'React', link: '/guide/react' },
            { text: 'React Router', link: '/guide/react-router' },
            { text: 'TanStack Router', link: '/guide/tanstack-router' },
            { text: 'Next.js', link: '/guide/nextjs' },
            { text: 'Vue Router', link: '/guide/vue-router' },
            { text: 'Web Component', link: '/guide/web-component' },
            { text: 'Standalone JS', link: '/guide/standalone-js' }
          ]
        }
      ],
      '/recipes/': [
        {
          text: 'Recipes',
          items: [
            { text: 'Overview', link: '/recipes/' },
            { text: 'Event Notifications', link: '/recipes/event-notifications' },
            { text: 'Custom Actions', link: '/recipes/custom-actions' },
            { text: 'Navigation Control', link: '/recipes/navigation' },
            { text: 'Page Automation', link: '/recipes/page-automation' },
            { text: 'Speaking State Tracking', link: '/recipes/speaking-state' },
            { text: 'Connection Paradigms', link: '/recipes/connection-paradigms' },
            { text: 'E-commerce Integration', link: '/recipes/ecommerce' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'Core API', link: '/api/index/' }
          ]
        },
        {
          text: 'Core API',
          items: [
            { text: 'Classes', link: '/api/index/classes/Vowel' },
            { text: 'Functions', link: '/api/index/functions/createDirectAdapters' },
            { text: 'Interfaces', link: '/api/index/interfaces/VowelConfig' },
            { text: 'Type Aliases', link: '/api/index/type-aliases/ActionHandler' }
          ]
        },
        {
          text: 'React API',
          items: [
            { text: 'Overview', link: '/api/react/' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vowel-life/client' }
    ],

    search: {
      provider: 'local'
    },

    footer: {
      copyright: 'Copyright © 2025 vowel.to'
    }
  },

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    }
  }
})

