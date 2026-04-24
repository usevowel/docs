import { defineConfig } from 'vitepress'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'
import { generateRoutesPlugin } from './theme/generate-routes-plugin'
import { config } from 'dotenv'
import { MermaidMarkdown, MermaidPlugin } from 'vitepress-plugin-mermaid'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const docsRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

config({ path: resolve(docsRoot, '.env') })
config({ path: resolve(docsRoot, '.env.local'), override: true })

const CROSS_ORIGIN_ISOLATION_HEADERS = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'credentialless'
} as const

function crossOriginIsolationHeaders(): Plugin {
  const applyHeaders = (_req: unknown, res: { setHeader: (key: string, value: string) => void }, next: () => void) => {
    for (const [key, value] of Object.entries(CROSS_ORIGIN_ISOLATION_HEADERS)) {
      res.setHeader(key, value)
    }

    next()
  }

  return {
    name: 'voweldocs-cross-origin-isolation-headers',
    configureServer(server) {
      server.middlewares.use(applyHeaders)
    },
    configurePreviewServer(server) {
      server.middlewares.use(applyHeaders)
    }
  }
}

export default defineConfig({
  title: 'vowel Docs',
  description: 'Developer documentation for vowel',
  
  ignoreDeadLinks: true, // TODO: Remove once all pages are created
  
  // Logo configuration
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/images/favicon-32.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/images/favicon-192.png' }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/images/favicon-180.png' }],
    ['link', { rel: 'stylesheet', href: '/vowel-client.css' }],
    // Respect user's stored theme preference, default to dark only for new visitors
    ['script', { id: 'theme-preference' }, `
      (function() {
        const key = 'vitepress-theme-appearance';
        const stored = localStorage.getItem(key);
        // If no preference stored, or if 'auto', default to dark
        if (!stored || stored === 'auto') {
          localStorage.setItem(key, 'dark');
          document.documentElement.classList.add('dark');
          document.documentElement.style.colorScheme = 'dark';
        } else if (stored === 'dark') {
          // Respect stored dark preference
          document.documentElement.classList.add('dark');
          document.documentElement.style.colorScheme = 'dark';
        }
        // If stored === 'light', don't add dark class - let it stay light
      })();
    `],
  ],
  
  // Exclude repo-only docs from the published site
  srcExclude: ['**/README.md', '**/AGENTS.md', 'cloudflare-pages.md', 'guide/v2-api-migration.md', 'api/index/**', 'api/react/**'],
  
  vite: {
    server: {
      https: true,
      headers: CROSS_ORIGIN_ISOLATION_HEADERS
    },
    preview: {
      headers: CROSS_ORIGIN_ISOLATION_HEADERS
    },
    plugins: [
      crossOriginIsolationHeaders(),
      react(),
      mkcert(), // Auto-generate local SSL certificates for HTTPS dev server
      generateRoutesPlugin(), // Auto-generate routes for voice navigation
      MermaidPlugin() // Enable Mermaid diagrams
    ],
    define: {
      // Define env variables for voice agent
      'import.meta.env.VITE_VOWEL_APP_ID': JSON.stringify(process.env.VITE_VOWEL_APP_ID || ''),
      'import.meta.env.VITE_VOWEL_JWT_TOKEN': JSON.stringify(process.env.VITE_VOWEL_JWT_TOKEN || ''),
      'import.meta.env.VITE_VOWEL_URL': JSON.stringify(process.env.VITE_VOWEL_URL || ''),
      'import.meta.env.VITE_VOWEL_USE_JWT': JSON.stringify(process.env.VITE_VOWEL_USE_JWT || 'false'),
      'import.meta.env.VITE_VOWEL_HOSTED_URL': JSON.stringify('wss://realtime.vowel.to/v1'),
      // RAG debug tool - set VITE_VOWEL_DEBUG_RAG=true to enable
      'import.meta.env.VITE_VOWEL_DEBUG_RAG': JSON.stringify(process.env.VITE_VOWEL_DEBUG_RAG || 'false')
    },
    resolve: {
      alias: [
        { find: /^react$/, replacement: resolve(docsRoot, 'node_modules/react/index.js') },
        { find: /^react\/jsx-runtime$/, replacement: resolve(docsRoot, 'node_modules/react/jsx-runtime.js') },
        { find: /^react\/jsx-dev-runtime$/, replacement: resolve(docsRoot, 'node_modules/react/jsx-dev-runtime.js') },
        { find: /^react-dom$/, replacement: resolve(docsRoot, 'node_modules/react-dom/index.js') },
        { find: /^react-dom\/client$/, replacement: resolve(docsRoot, 'node_modules/react-dom/client.js') },
        // @wllama/wllama@2.3.7 publishes a broken package entrypoint;
        // Haven's optional WllamaProvider can still load the real ESM build.
        {
          find: '@wllama/wllama',
          replacement: '@wllama/wllama/esm/index.js',
        },
      ],
      dedupe: ['react', 'react-dom'],
      // Ensure .ts extensions are resolved properly for theme imports
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
    },
    optimizeDeps: {
      include: ['js-yaml', 'mermaid'],
      exclude: ['@tursodatabase/database-wasm', '@tursodatabase/database-wasm/vite', '@wllama/wllama'],
      esbuildOptions: {
        target: 'es2022'
      }
    },
    esbuild: {
      target: 'es2022'
    },
    ssr: {
      external: ['@vowel.to/client', '@vowel.to/client/react', '@vowel.to/client/css', 'haven', '@r2wc/core', '@r2wc/react-to-web-component']
    },
    build: {
      target: 'esnext',
      commonjsOptions: {
        transformMixedEsModules: true
      }
    }
  },
  
  themeConfig: {
    // Dark mode default with toggle - VitePress will read localStorage set by our script above
    // @ts-ignore - appearance is a valid VitePress themeConfig property
    appearance: true,

    // Logo displayed in the navigation bar
    // logo: '/logo.svg',
    siteTitle: false, // Hide default site title to use custom logo

    nav: [
      { text: 'Home', link: '/', activeMatch: '^/$' },
      { text: 'Client', link: '/guide/getting-started', activeMatch: '^/guide/' },
      { text: 'Self-Hosted', link: '/self-hosted/', activeMatch: '^/self-hosted/' },
      { text: 'vowelbot', link: '/vowelbot/', activeMatch: '^/vowelbot/' },
      { text: 'Platform', link: '/platform/', activeMatch: '^/platform/' },
      { text: 'Recipes', link: '/recipes/', activeMatch: '^/recipes/' },
      { text: 'voweldocs', link: '/voweldocs/', activeMatch: '^/voweldocs/' },
      { text: 'API', link: '/api/', activeMatch: '^/api/' }
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
            { text: 'Connection Models', link: '/guide/connection-models' },
            { text: 'WebMCP', link: '/guide/webmcp' }
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
            { text: 'Quickstart', link: '/self-hosted/quickstart' },
            { text: 'Architecture', link: '/self-hosted/architecture' }
          ]
        },
        {
          text: 'Components',
          items: [
            { text: 'Core', link: '/self-hosted/core' },
            { text: 'Realtime Engine', link: '/self-hosted/engine' },
            { text: 'Self-Hosted Speech (Echoline)', link: '/self-hosted/echoline' }
          ]
        },
        {
          text: 'Operations',
          items: [
            { text: 'Configuration', link: '/self-hosted/configuration' },
            { text: 'Deployment', link: '/self-hosted/deployment' },
            { text: 'Testing', link: '/self-hosted/testing' },
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
            { text: 'WebMCP', link: '/recipes/webmcp' },
            { text: 'Navigation Control', link: '/recipes/navigation' },
            { text: 'Page Automation', link: '/recipes/page-automation' },
            { text: 'Speaking State Tracking', link: '/recipes/speaking-state' },
            { text: 'Connection Paradigms', link: '/recipes/connection-paradigms' },
            { text: 'E-commerce Integration', link: '/recipes/ecommerce' }
          ]
        }
      ],
      '/voweldocs/': [
        {
          text: 'voweldocs',
          items: [
            { text: 'Overview', link: '/voweldocs/' },
            { text: 'Architecture', link: '/voweldocs/architecture' },
            { text: 'Configuration', link: '/voweldocs/configuration' },
            { text: 'RAG', link: '/voweldocs/rag' },
            { text: 'Integration', link: '/voweldocs/integration' },
            { text: 'Troubleshooting', link: '/voweldocs/troubleshooting' }
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
      copyright: 'Copyright © 2026 vowel.to'
    }
  },

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    config: (md) => {
      MermaidMarkdown(md, undefined)
    }
  }
})
