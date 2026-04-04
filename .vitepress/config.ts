import { defineConfig } from 'vitepress'
import react from '@vitejs/plugin-react'
import { generateRoutesPlugin } from './theme/generate-routes-plugin'

export default defineConfig({
  title: 'vowel Docs',
  description: 'Developer documentation for vowel',
  
  ignoreDeadLinks: true, // TODO: Remove once all pages are created
  
  // Logo configuration
  head: [
    ['link', { rel: 'icon', href: '/logo.svg' }],
  ],
  
  // Exclude repo-only docs from the published site
  srcExclude: ['**/README.md', '**/AGENTS.md', 'cloudflare-pages.md', 'guide/v2-api-migration.md', 'api/index/**', 'api/react/**'],
  
  vite: {
    plugins: [
      react(),
      generateRoutesPlugin() // Auto-generate routes for voice navigation
    ],
    define: {
      // Define env variables for voice agent
      'import.meta.env.VITE_VOWEL_APP_ID': JSON.stringify(process.env.VITE_VOWEL_APP_ID || ''),
      'import.meta.env.VITE_VOWEL_JWT_TOKEN': JSON.stringify(process.env.VITE_VOWEL_JWT_TOKEN || ''),
      'import.meta.env.VITE_VOWEL_URL': JSON.stringify(process.env.VITE_VOWEL_URL || ''),
      'import.meta.env.VITE_VOWEL_USE_JWT': JSON.stringify(process.env.VITE_VOWEL_USE_JWT || 'false'),
      'import.meta.env.VITE_VOWEL_HOSTED_URL': JSON.stringify('wss://realtime.vowel.to/v1')
    }
  },
  
  themeConfig: {
    // Logo displayed in the navigation bar
    // logo: '/logo.svg',
    siteTitle: false, // Hide default site title to use custom logo
    
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Client', link: '/guide/getting-started' },
      { text: 'Self-Hosted', link: '/self-hosted/' },
      { text: 'vowelbot', link: '/vowelbot/' },
      { text: 'Platform', link: '/platform/' },
      { text: 'Recipes', link: '/recipes/' },
      { text: 'API', link: '/api/' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Start',
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
            { text: 'Event Notifications', link: '/guide/event-notifications' },
            { text: 'Connection Models', link: '/guide/connection-models' }
          ]
        },
        {
          text: 'Frameworks',
          items: [
            { text: 'React', link: '/guide/react' },
            { text: 'React Router', link: '/guide/react-router' },
            { text: 'TanStack Router', link: '/guide/tanstack-router' },
            { text: 'Next.js', link: '/guide/nextjs' },
            { text: 'Vue Router', link: '/guide/vue-router' },
            { text: 'Web Component', link: '/guide/web-component' },
            { text: 'Vanilla JS', link: '/guide/standalone-js' }
          ]
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Transcripts', link: '/guide/TRANSCRIPTS' }
          ]
        }
      ],
      '/self-hosted/': [
        {
          text: 'Overview',
          items: [
            { text: 'Overview', link: '/self-hosted/' },
            { text: 'Architecture', link: '/self-hosted/architecture' }
          ]
        },
        {
          text: 'Components',
          items: [
            { text: 'Core', link: '/self-hosted/core' },
            { text: 'Realtime Engine', link: '/self-hosted/engine' }
          ]
        },
        {
          text: 'Operations',
          items: [
            { text: 'Configuration', link: '/self-hosted/configuration' },
            { text: 'Deployment', link: '/self-hosted/deployment' },
            { text: 'Troubleshooting', link: '/self-hosted/troubleshooting' }
          ]
        }
      ],
      '/platform/': [
        {
          text: 'Overview',
          items: [
            { text: 'Overview', link: '/platform/' }
          ]
        },
        {
          text: 'Hosted Product',
          items: [
            { text: 'Apps & Management', link: '/platform/apps-and-management' },
            { text: 'Billing & Organizations', link: '/platform/billing-and-organizations' }
          ]
        },
        {
          text: 'Automation',
          items: [
            { text: 'Hosted Realtime API', link: '/platform/hosted-realtime-api' }
          ]
        }
      ],
      '/vowelbot/': [
        {
          text: 'vowelbot',
          items: [
            { text: 'Overview', link: '/vowelbot/' }
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
            { text: 'Core Module', link: '/api/reference/index/' },
            { text: 'React Module', link: '/api/reference/react/' }
          ]
        },
        {
          text: 'Core Module',
          items: [
            { text: 'Classes', link: '/api/reference/index/classes/Vowel' },
            { text: 'Functions', link: '/api/reference/index/functions/createDirectAdapters' },
            { text: 'Interfaces', link: '/api/reference/index/interfaces/VowelConfig' },
            { text: 'Type Aliases', link: '/api/reference/index/type-aliases/ActionHandler' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/usevowel' }
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
