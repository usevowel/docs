/**
 * Voice Agent Configuration for VitePress Docs
 *
 * This module initializes the Vowel voice client for the documentation site,
 * allowing users to navigate pages and interact with the docs using voice commands.
 *
 * Supports both hosted (SaaS) and self-hosted configurations via localStorage.
 */

import { Vowel, createDirectAdapters } from '@vowel.to/client'
import type { Vowel as VowelType, VowelConfig } from '@vowel.to/client'

let vowelInstance: VowelType | null = null

/**
 * Configuration modes for vowel voice agent
 */
type ConfigMode = 'hosted' | 'selfhosted'

/**
 * SaaS realtime URL - can be overridden via env var but defaults to hosted endpoint
 */
const HOSTED_REALTIME_URL = import.meta.env.VITE_VOWEL_URL || 'wss://realtime.vowel.to/v1'

/**
 * Extract realtime URL from JWT payload (JWRT format)
 * JWT may contain url, endpoint, or rtu claim
 */
function extractUrlFromJwt(jwt: string): string | null {
  try {
    const parts = jwt.split('.')
    if (parts.length !== 3) return null
    
    const payload = JSON.parse(atob(parts[1]))
    return payload.url || payload.endpoint || payload.rtu || null
  } catch {
    return null
  }
}

/**
 * Get self-hosted realtime URL: JWT claim > env var > fallback
 */
function getSelfHostedUrl(jwt: string): string {
  // 1. Try to extract from JWT (JWRT format)
  const jwtUrl = extractUrlFromJwt(jwt)
  if (jwtUrl) {
    console.log('📡 Using realtime URL from JWT:', jwtUrl)
    return jwtUrl
  }
  
  // 2. Fall back to environment variable
  const envUrl = import.meta.env.VITE_VOWEL_URL
  if (envUrl) {
    console.log('📡 Using realtime URL from env:', envUrl)
    return envUrl
  }
  
  // 3. Final fallback
  const fallbackUrl = 'wss://your-selfhosted-instance.com/realtime'
  console.warn('⚠️ No URL found in JWT or env, using fallback:', fallbackUrl)
  return fallbackUrl
}

/**
 * Hosted (SaaS) configuration - URL is hardcoded
 */
interface HostedConfig {
  appId: string
}

/**
 * Self-hosted configuration - supports JWT (when env var set) or appId + URL
 */
interface SelfHostedConfig {
  appId?: string
  url?: string
  jwt?: string
}

/**
 * Stored credentials format from localStorage
 */
export interface StoredCredentials {
  mode: ConfigMode
  hosted?: HostedConfig
  selfHosted?: SelfHostedConfig
  timestamp: number
}

/**
 * Check if voice configuration exists in localStorage
 */
export function hasVoiceConfig(): boolean {
  if (typeof window === 'undefined') return false

  try {
    const stored = localStorage.getItem('voweldoc-config')
    if (!stored) return false

    const config: StoredCredentials = JSON.parse(stored)
    // Valid if: hosted has appId, OR self-hosted has jwt, OR self-hosted has appId+url
    const hasHosted = !!config.hosted?.appId
    const hasSelfHostedJwt = !!config.selfHosted?.jwt
    const hasSelfHostedAppUrl = !!(config.selfHosted?.appId && config.selfHosted?.url)
    return hasHosted || hasSelfHostedJwt || hasSelfHostedAppUrl
  } catch {
    return false
  }
}

/**
 * Get stored voice configuration from localStorage
 */
export function getVoiceConfig(): StoredCredentials | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem('voweldoc-config')
    if (!stored) return null

    return JSON.parse(stored) as StoredCredentials
  } catch (error) {
    console.error('Error reading voice config:', error)
    return null
  }
}

/**
 * Clear stored voice configuration
 */
export function clearVoiceConfig(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem('voweldoc-config')
  } catch (error) {
    console.error('Error clearing voice config:', error)
  }
}

/**
 * Get VitePress routes dynamically
 * Routes are auto-generated at build time by the generate-routes-plugin
 */
async function getDocRoutes() {
  try {
    // Import the auto-generated routes manifest
    const { getRoutes } = await import('./routes-manifest')
    return getRoutes()
  } catch (error) {
    console.warn('⚠️ Could not load routes manifest, using fallback routes')
    // Fallback routes if manifest isn't available yet
    return [
      { path: '/', description: 'Home page - documentation overview' },
      { path: '/guide/getting-started.html', description: 'Getting Started guide' },
      { path: '/guide/installation.html', description: 'Installation instructions' },
      { path: '/guide/quick-start.html', description: 'Quick Start tutorial' },
      { path: '/api/', description: 'API Reference' },
    ]
  }
}

/**
 * Build Vowel configuration based on stored credentials
 */
async function buildVowelConfig(
  router: any,
  credentials: StoredCredentials
): Promise<VowelConfig> {
  // Get routes from auto-generated manifest
  const routes = await getDocRoutes()
  console.log(`📍 Loaded ${routes.length} routes from manifest`)

  // Create navigation adapter for VitePress
  const { navigationAdapter, automationAdapter } = createDirectAdapters({
    navigate: async (path: string) => {
      console.log('🧭 Voice navigation to:', path)

      // VitePress router expects paths without .html extension
      let targetPath = path
      if (targetPath.endsWith('.html')) {
        targetPath = targetPath.slice(0, -5)
      }

      // Use VitePress router.go() for navigation
      await router.go(targetPath)
      console.log('✅ Navigation completed to:', targetPath)
    },
    getCurrentPath: () => router.route.path,
    routes,
    enableAutomation: true, // Enable page automation for docs interaction
  })

  // Base configuration common to both modes
  const baseConfig: Partial<VowelConfig> = {
    navigationAdapter,
    automationAdapter,

    // Voice configuration
    voiceConfig: {
      provider: 'vowel-prime',
      llmProvider: 'groq',
      model: 'openai/gpt-oss-20b',
      // model: 'moonshotai/kimi-k2-instruct-0905',
      voice: 'vowel', // Vowel branded voice with OCR-A aesthetic
      language: 'en-US',
      // Server-side VAD configuration for more accurate speech detection
      turnDetection: {
        mode: 'server_vad',
      },
    },

    // Enable captions display for transcription visibility
    _caption: {
      enabled: true,
      position: 'bottom-center',
      showRole: true,
      showStreaming: true,
    },

    // Disable floating cursor
    floatingCursor: {
      enabled: false,
    },

    // Enable page border glow with vowel docs button color (blue-500)
    borderGlow: {
      enabled: true,
      color: '#3b82f6',
      intensity: 20,
      width: 4,
      pulse: true,
    },

    // System instruction override for docs context
    systemInstructionOverride: getSystemInstruction(),

    // Speaking state callbacks
    onUserSpeakingChange: (isSpeaking) => {
      console.log(isSpeaking ? '🗣️ User speaking' : '🔇 User stopped speaking')
    },

    onAISpeakingChange: (isSpeaking) => {
      console.log(isSpeaking ? '🔊 AI speaking' : '🔇 AI stopped speaking')
    },
  }

  // Build config based on mode
  if (credentials.mode === 'hosted' && credentials.hosted) {
    // SaaS: Always use hardcoded URL, never from localStorage
    return {
      ...baseConfig,
      appId: credentials.hosted.appId,
      realtimeApiUrl: HOSTED_REALTIME_URL,
    } as VowelConfig
  } else if (credentials.mode === 'selfhosted' && credentials.selfHosted) {
    // Self-hosted: Two modes - JWT (when env var set) or appId + URL (default)
    if (credentials.selfHosted.jwt) {
      // JWT mode: URL is extracted from JWT, env, or fallback
      const realtimeUrl = getSelfHostedUrl(credentials.selfHosted.jwt)
      return {
        ...baseConfig,
        token: credentials.selfHosted.jwt,
        realtimeApiUrl: realtimeUrl,
      } as VowelConfig
    } else if (credentials.selfHosted.appId && credentials.selfHosted.url) {
      // AppId + URL mode: use directly from stored config
      return {
        ...baseConfig,
        appId: credentials.selfHosted.appId,
        realtimeApiUrl: credentials.selfHosted.url,
      } as VowelConfig
    }
  }

  throw new Error('Invalid credentials configuration')
}

/**
 * Get system instruction for the voice agent
 */
function getSystemInstruction(): string {
  return `You are Val, the voice assistant for Vowel.to - a voice-powered AI agent library for web applications.

## About Vowel.to

Vowel is a JavaScript/TypeScript library that adds real-time voice interaction to any web application. It's powered by Google's Gemini Live API and provides:

**Core Features:**
- Real-time voice interface with natural conversation
- Smart navigation - voice-controlled routing with automatic route detection
- Page automation - users can click, type, search, and interact with page elements using voice
- Custom actions - define business logic and voice commands
- Event notifications - trigger AI voice responses programmatically
- Framework agnostic - works with React, Vue, Next.js, vanilla JS, and more

**Architecture:**
- VowelClient - main client class that manages sessions
- NavigationAdapter - handles WHERE to go (routing)
- AutomationAdapter - handles WHAT to do (page interaction)
- Both adapters are optional and independent

**Integration Types:**
- React components (VowelProvider, VowelAgent, VowelMicrophone)
- Web Component (vowel-voice-widget custom element)
- Standalone JavaScript bundle
- Platform-specific adapters (React Router, TanStack Router, Next.js, Vue Router)

## Your Role

Help users understand and implement Vowel by:

1. **Answering Questions**: Explain concepts, features, and implementation details
2. **Navigating Docs**: Guide users to relevant pages using navigate_to_page
3. **Finding Information**: Use searchDocs to find specific topics
4. **Showing Code**: Use copyCodeExample to help users grab code snippets
5. **Contextual Guidance**: Based on what page they're on, suggest next steps

## Documentation Structure

**Getting Started:**
- /guide/getting-started - Overview and first steps
- /guide/installation - How to install the package
- /guide/quick-start - Minimal working example

**Core Concepts:**
- /guide/vowel-client - The Vowel client class
- /guide/adapters - Navigation and automation adapters
- /guide/actions - Custom action registration
- /guide/event-notifications - Programmatic voice responses

**Framework Integration:**
- /guide/react - React components and hooks
- /guide/react-router - React Router integration
- /guide/nextjs - Next.js App Router integration
- /guide/vue-router - Vue Router integration
- /guide/web-component - Web component usage
- /guide/standalone-js - Vanilla JavaScript integration

**Recipes (Practical Examples):**
- /recipes/custom-actions - Creating custom voice commands
- /recipes/navigation - Navigation control patterns
- /recipes/page-automation - DOM interaction patterns
- /recipes/event-notifications - Notification examples
- /recipes/speaking-state - Track AI speaking state
- /recipes/ecommerce - E-commerce integration example

**API Reference:**
- /api/ - Full API documentation
- /api/index/ - Core API (classes, functions, interfaces)
- /api/react/ - React-specific APIs

## Response Guidelines

**When users ask "What is Vowel?" or similar:**
Explain it's a library for adding voice interaction to web apps, highlight the key features, and suggest /guide/getting-started

**When users ask "How do I..." questions:**
- Identify the right documentation page
- Briefly explain the concept
- Navigate them to the page or show them relevant code
- Suggest related topics

**When users ask about specific features:**
- Explain the feature clearly
- Mention relevant adapters or components
- Guide them to the right guide or recipe
- Offer to show code examples

**When users seem stuck:**
- Ask clarifying questions
- Offer to search the docs
- Suggest starting with /guide/quick-start
- Offer to walk them through an example

**Best Practices:**
- Be conversational and friendly, not robotic
- Use natural language, not just technical jargon
- Anticipate follow-up questions
- When showing navigation, explain why that page will help
- When users are on a page, reference what's on the current page
- Use actions proactively (navigate, search, copy code) when helpful

**Example Interactions:**

User: "What is Vowel?"
You: "Vowel is a library that adds voice interaction to web applications. It lets your users control your app with their voice - navigating pages, clicking buttons, filling forms, and triggering custom actions. It's powered by Google's Gemini Live API for natural conversations. Want me to take you to the getting started guide?"

User: "How do I add it to my React app?"
You: "Great question! For React, you'll use the VowelProvider component to wrap your app, then add the VowelAgent component for the voice UI. Let me navigate you to our React integration guide which has complete examples."
[Use navigate_to_page to go to /guide/react]

User: "Show me an example"
You: "Sure! Let me take you to the quick start guide which has a minimal working example, or if you want more detailed patterns, the recipes section has lots of practical examples. Which would you prefer?"

Remember: You ARE demonstrating Vowel's capabilities right now - you're a voice agent helping with documentation, showing users what's possible!`
}

/**
 * Initialize the voice agent with stored credentials
 * @param router - VitePress router instance from useRouter()
 * @param credentials - Optional credentials to use (if not provided, reads from localStorage)
 */
export async function initVoiceAgent(
  router: any,
  credentials?: StoredCredentials
): Promise<boolean> {
  // Only initialize in browser environment
  if (typeof window === 'undefined') {
    return false
  }

  // Don't reinitialize if already initialized
  if (vowelInstance) {
    console.log('🎤 Voice agent already initialized')
    return true
  }

  // Get credentials from localStorage if not provided
  const config = credentials || getVoiceConfig()
  if (!config) {
    console.warn('⚠️ No voice configuration found - voice functionality disabled')
    return false
  }

  // Validate credentials
  if (config.mode === 'hosted' && !config.hosted?.appId) {
    console.warn('⚠️ Hosted mode configured but no appId provided')
    return false
  }
  if (config.mode === 'selfhosted') {
    const hasJwt = !!config.selfHosted?.jwt
    const hasAppIdUrl = !!(config.selfHosted?.appId && config.selfHosted?.url)
    if (!hasJwt && !hasAppIdUrl) {
      console.warn('⚠️ Self-hosted mode configured but no JWT or appId+URL provided')
      return false
    }
  }

  console.log('🎤 Initializing voice agent for VitePress docs...')
  console.log(`   Mode: ${config.mode}`)

  try {
    // Build configuration based on credentials
    const vowelConfig = await buildVowelConfig(router, config)

    // Initialize Vowel client
    vowelInstance = new Vowel(vowelConfig)

    // Register custom actions for docs-specific functionality
    registerDocsActions(vowelInstance)

    console.log('✅ Voice agent "Val" initialized')
    console.log(`   📍 Routes loaded for navigation`)
    console.log(`   🎯 Actions: ${Object.keys(vowelInstance.getActionsConfig()).length} total`)
    console.log('')
    console.log('💬 Try saying:')
    console.log('   • "What is Vowel?"')
    console.log('   • "How do I add this to my React app?"')
    console.log('   • "Show me an example"')
    console.log('   • "Search for adapters"')
    console.log('   • "What sections are on this page?"')
    console.log('   • "Copy the first code example"')
    console.log('')
    console.log('🎤 Val can:')
    console.log('   - Answer questions about Vowel')
    console.log('   - Navigate you to relevant docs')
    console.log('   - Search and explain topics')
    console.log('   - Copy code examples')
    console.log('   - Show related pages')

    return true
  } catch (error) {
    console.error('❌ Failed to initialize voice agent:', error)
    return false
  }
}

/**
 * Register documentation-specific custom actions
 */
function registerDocsActions(vowel: VowelType) {
  // 1. Search documentation
  vowel.registerAction(
    'searchDocs',
    {
      description: 'Search the documentation for a specific topic or keyword',
      parameters: {
        query: {
          type: 'string',
          description: 'Search query - can be a topic, feature name, or keyword',
        },
      },
    },
    async ({ query }) => {
      console.log('🔍 Searching docs for:', query)

      const searchButton = document.querySelector(
        '.DocSearch-Button, .VPNavBarSearch button'
      )
      if (searchButton) {
        ;(searchButton as HTMLElement).click()

        setTimeout(async () => {
          const searchInput = document.querySelector(
            '.DocSearch-Input'
          ) as HTMLInputElement
          if (searchInput) {
            searchInput.value = query
            searchInput.dispatchEvent(new Event('input', { bubbles: true }))
            await vowel.notifyEvent(`Searching for "${query}"`)
          }
        }, 300)
      }

      return { success: true, message: `Searching for "${query}"` }
    }
  )

  // 2. Get current page information
  vowel.registerAction(
    'getCurrentPageInfo',
    {
      description:
        'Get information about the current documentation page including title, sections, and available code examples',
      parameters: {},
    },
    async () => {
      const title = document.querySelector('h1')?.textContent || 'Unknown page'
      const headings = Array.from(document.querySelectorAll('h2, h3')).map(
        (h) => h.textContent
      )
      const codeBlocks = document.querySelectorAll('div[class*="language-"]').length
      const path = window.location.pathname

      const info = {
        title,
        path,
        sections: headings,
        codeBlockCount: codeBlocks,
      }

      console.log('📄 Current page info:', info)

      // Provide a natural summary
      const summary = `You're on "${title}". This page has ${headings.length} sections${codeBlocks > 0 ? ` and ${codeBlocks} code examples` : ''}.`

      await vowel.notifyEvent(summary)

      return { success: true, data: info, message: summary }
    }
  )

  // 3. Copy code example
  vowel.registerAction(
    'copyCodeExample',
    {
      description: 'Copy a code example from the current page to clipboard',
      parameters: {
        index: {
          type: 'number',
          description: 'Which code block to copy (1 for first, 2 for second, etc.)',
          optional: true,
        },
      },
    },
    async ({ index = 1 }) => {
      const codeBlocks = document.querySelectorAll(
        '.vp-code-group, div[class*="language-"]'
      )
      const targetBlock = codeBlocks[index - 1]

      if (!targetBlock) {
        await vowel.notifyEvent(`Code block ${index} not found on this page`)
        return { success: false, message: `Code block ${index} not found` }
      }

      const copyButton = targetBlock.querySelector('.copy') as HTMLElement
      if (copyButton) {
        copyButton.click()
        await vowel.notifyEvent(`Copied code block ${index} to clipboard`)
        return { success: true, message: `Copied code block ${index}` }
      } else {
        const codeElement = targetBlock.querySelector('code')
        if (codeElement) {
          await navigator.clipboard.writeText(codeElement.textContent || '')
          await vowel.notifyEvent(`Copied code block ${index} to clipboard`)
          return { success: true, message: `Copied code block ${index}` }
        }
      }

      return { success: false, message: 'Could not copy code' }
    }
  )

  // 4. Jump to section
  vowel.registerAction(
    'jumpToSection',
    {
      description: 'Scroll to a specific section on the current page',
      parameters: {
        sectionName: {
          type: 'string',
          description: 'Name or part of the name of the section heading to jump to',
        },
      },
    },
    async ({ sectionName }) => {
      const headings = Array.from(
        document.querySelectorAll('h1, h2, h3, h4, h5, h6')
      )
      const targetHeading = headings.find((h) =>
        h.textContent?.toLowerCase().includes(sectionName.toLowerCase())
      )

      if (targetHeading) {
        targetHeading.scrollIntoView({ behavior: 'smooth', block: 'start' })
        await vowel.notifyEvent(`Jumping to ${targetHeading.textContent}`)
        return { success: true, message: `Jumped to: ${targetHeading.textContent}` }
      }

      await vowel.notifyEvent(`Section "${sectionName}" not found on this page`)
      return { success: false, message: `Section "${sectionName}" not found` }
    }
  )

  // 5. List available sections
  vowel.registerAction(
    'listSections',
    {
      description: 'List all sections available on the current page',
      parameters: {},
    },
    async () => {
      const headings = Array.from(document.querySelectorAll('h2, h3'))
        .map((h) => h.textContent)
        .filter(Boolean)

      if (headings.length === 0) {
        await vowel.notifyEvent('This page has no sections')
        return { success: true, sections: [], message: 'No sections found' }
      }

      const sectionList = headings.join(', ')
      await vowel.notifyEvent(
        `This page has ${headings.length} sections: ${headings.slice(0, 3).join(', ')}${headings.length > 3 ? ', and more' : ''}`
      )

      return {
        success: true,
        sections: headings,
        message: `Found ${headings.length} sections`,
      }
    }
  )

  // 6. Show related pages
  vowel.registerAction(
    'showRelatedPages',
    {
      description: 'Show related documentation pages based on the current page',
      parameters: {},
    },
    async () => {
      const currentPath = window.location.pathname

      // Get related pages from sidebar
      const sidebarLinks = Array.from(
        document.querySelectorAll('.VPSidebar a, .sidebar-item a')
      )
        .map((link) => ({
          text: link.textContent?.trim(),
          href: (link as HTMLAnchorElement).getAttribute('href'),
        }))
        .filter(
          (item) =>
            item.href && item.href !== currentPath && !item.href.startsWith('http')
        )
        .slice(0, 5)

      if (sidebarLinks.length === 0) {
        return { success: true, related: [], message: 'No related pages found' }
      }

      const pageNames = sidebarLinks.map((p) => p.text).join(', ')
      await vowel.notifyEvent(
        `Related pages: ${sidebarLinks.slice(0, 3).map((p) => p.text).join(', ')}`
      )

      return {
        success: true,
        related: sidebarLinks,
        message: `Found ${sidebarLinks.length} related pages`,
      }
    }
  )

  console.log('✅ Registered 6 custom documentation actions')
}

/**
 * Clean up the voice agent
 */
export function cleanupVoiceAgent() {
  if (vowelInstance) {
    console.log('🧹 Cleaning up voice agent')
    vowelInstance.stopSession()
    vowelInstance = null
  }
}

/**
 * Get the current voice agent instance
 */
export function getVoiceAgent(): VowelType | null {
  return vowelInstance
}
