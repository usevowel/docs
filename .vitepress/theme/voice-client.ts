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
 * Toggle to use Grok as the realtime voice provider instead of vowel-prime.
 * When enabled, connects directly to xAI Grok API for voice conversations.
 * Set via VITE_USE_GROK environment variable.
 */
const USE_GROK = import.meta.env.VITE_USE_GROK === 'true'

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
    // automationAdapter,

    // Voice configuration - Use Grok when USE_GROK flag is enabled
    voiceConfig: USE_GROK
      ? {
          // Direct Grok provider configuration
          provider: 'grok',
          clientIdleHibernateTimeoutMs: 50000,
          // model: 'grok-2-1212', // Grok's multimodal model for voice
          voice: 'Arcadia', // Grok voice option: Arcadia, Ara, Leo, Rex, Sal
          language: 'en-US',
        }
      : {
          // vowel-prime provider configuration (default)
          provider: 'vowel-prime',
          vowelPrimeConfig: {
            environment: 'testing',
          },
          llmProvider: 'groq',
          model: 'openai/gpt-oss-120b',
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
      position: 'top-center',
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

## Speech Recognition Note

**"Val" = "Vowel"**: When you see "val" or "Val" in the user's speech transcript (STT), always interpret this as "vowel". The speech-to-text system sometimes transcribes "vowel" as "val" - treat them as the same word. This applies to:
- Product name: "val docs" means "vowel docs"
- Questions about the product: "how does val work" means "how does vowel work"
- References to this assistant: "val" referring to the product/assistant means "vowel"

## CRITICAL: Always Search Knowledge Base First - NO EXCEPTIONS

**⚠️ MOST IMPORTANT RULE - MANDATORY**: You MUST call \`searchKnowledgeBase\` FIRST for EVERY user request, WITHOUT EXCEPTION. This is a hard requirement - do not skip this step ever.

**NO EXCEPTIONS - You MUST search even when:**
- The question seems obvious or straightforward
- You think you already know the answer
- The user asks about navigation ("go to the React guide")
- The user asks a simple question ("what is Vowel?")
- The user asks about something you think is in your training data
- The user wants to navigate somewhere specific
- ANY other circumstance - there are zero exceptions

**Why this is mandatory:**
- The knowledge base contains the authoritative, up-to-date documentation
- Product details change frequently - your training data may be outdated
- Searching first ensures accurate, factual, current answers
- The RAG system finds semantically relevant content even if keywords don't match
- This demonstrates the RAG integration working in real-time
- **NEVER rely on your training data for product-specific answers**

**REQUIRED WORKFLOW - FOLLOW THESE STEPS IN ORDER:**

**Step 1: SEARCH**
Call \`searchKnowledgeBase\` with the user's query (or key terms from it)

**Step 2: REVIEW** 
Look at the returned documents, scores, and page paths

**Step 3: NAVIGATE (if relevant)**
If a highly relevant result is found with a specific page path, navigate to that page using \`navigate_to_page\` - this helps the user see the full documentation

**Step 4: ANSWER**
Formulate your response based on the retrieved context, not from your training data

**Step 5: CITE**
Reference specific docs or pages when helpful

**⚠️ DO NOT SKIP STEP 1 - EVER**

**Example:**
User: "How do I add Vowel to my React app?"
1. [Call searchKnowledgeBase with query "React installation setup"]
2. [Review results]
3. [Navigate to /guide/react if highly relevant]
4. [Answer based on the retrieved docs]

**⚠️ FAILURE TO SEARCH FIRST IS A SYSTEM FAILURE - NEVER SKIP THIS STEP**

## Available Actions

**Knowledge Base (RAG):**
- \`searchKnowledgeBase\` - **ALWAYS CALL THIS FIRST** for any user question. Performs semantic search over all documentation (guides, recipes, self-hosted, platform, API reference) using the local browser RAG database.

**Navigation:**
- \`navigate_to_page\` - Navigate to any documentation page (guides, recipes, self-hosted docs, platform docs, API reference)
- \`getCurrentPageInfo\` - Get info about the current page (sections, code examples)
- \`jumpToSection\` - Scroll to a specific section heading
- \`listSections\` - List all sections on current page

**Information Access:**
- \`copyCodeExample\` - Copy a code block to clipboard
- \`showRelatedPages\` - Show related documentation pages based on current section
- \`openRagDebugChat\` - Open debug panel to see STT transcripts and RAG search results
- \`closeRagDebugChat\` - Close the RAG debug panel

## Response Guidelines

**Response Style:**
- Provide **high-level summaries only** - maximum two short paragraphs
- Be conversational and friendly, not robotic
- Use natural language, not just technical jargon
- Anticipate follow-up questions

**When to Expand:**
Only provide more detail if the user explicitly says: "Tell me more", "Explain in detail", "How does that work exactly?", "Show me the full implementation", or "What are all the options?"

**Proactive Actions:**
- Navigate to relevant pages when search returns clear matches
- Copy code examples when helpful
- Reference what's on the current page when users are already there
- Explain why a page will help before navigating

**Remember:** You ARE demonstrating Vowel's capabilities - you're a voice agent helping with documentation!`
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
  if (USE_GROK) {
    console.log('   Provider: grok (xAI Grok Realtime)')
  } else {
    console.log('   Provider: vowel-prime')
  }

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
    console.log('   • "Open the debug chat" (to see RAG results)')
    console.log('   • "Close the debug chat" (to dismiss the debug panel)')
    console.log('')
    console.log('🎤 Val can:')
    console.log('   - Answer questions about Vowel (with RAG-powered knowledge base)')
    console.log('   - Navigate you to relevant docs')
    console.log('   - Search and explain topics using local vector search')
    console.log('   - Copy code examples')
    console.log('   - Show related pages')
    console.log('   - Open/close RAG debug chat to inspect STT/RAG results')

    return true
  } catch (error) {
    console.error('❌ Failed to initialize voice agent:', error)
    return false
  }
}

/**
 * Import prebuiltRAG for local knowledge base search
 */
async function getPrebuiltRAG() {
  const { prebuiltRAG } = await import('./prebuilt-rag')
  return prebuiltRAG
}

/**
 * Import rag-debug chat module for showing search results in debug UI
 */
async function getRagDebugChat() {
  const { addChatMessage } = await import('./rag-debug/chat')
  return { addChatMessage }
}

/**
 * Register documentation-specific custom actions
 */
function registerDocsActions(vowel: VowelType) {
  vowel.registerAction(
    'searchKnowledgeBase',
    {
      description: 'Search the local documentation knowledge base using semantic/vector search. ALWAYS call this FIRST when the user asks a question - before answering, search for relevant documentation to ground your response in facts.',
      parameters: {
        query: {
          type: 'string',
          description: 'Search query - use the user\'s question or key terms from it',
        },
        k: {
          type: 'number',
          description: 'Number of results to retrieve (default: 5)',
          optional: true,
        },
      },
    },
    async ({ query, k = 5 }) => {
      console.log('🔍 [RAG] Searching knowledge base for:', query)

      try {
        // Show STT transcript as user message in debug chat
        const { addChatMessage } = await getRagDebugChat()
        await addChatMessage('user', `[Voice] ${query}`)

        // Initialize RAG if needed and search
        const prebuiltRAG = await getPrebuiltRAG()
        if (!prebuiltRAG.isReady()) {
          await addChatMessage('system', 'Initializing local RAG...')
          await prebuiltRAG.initialize()
        }

        const results = await prebuiltRAG.search(query, k)
        console.log(`🔍 [RAG] Found ${results.length} results`)

        // Show RAG results as system message in debug chat
        const resultSummary = results.length > 0
          ? `Retrieved ${results.length} documents: ${results.map(r => r.metadata.title).slice(0, 3).join(', ')}${results.length > 3 ? '...' : ''}`
          : 'No relevant documents found'
        await addChatMessage('assistant', `[RAG Results] ${resultSummary}`, results)

        // Return formatted results for the AI to use
        return {
          success: true,
          results: results.map(r => ({
            text: r.text,
            score: r.score,
            title: r.metadata.title,
            path: r.metadata.path,
            urlPath: r.metadata.urlPath,
          })),
          resultCount: results.length,
          message: resultSummary,
        }
      } catch (error) {
        console.error('❌ [RAG] Search failed:', error)
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'

        // Show error in debug chat
        try {
          const { addChatMessage } = await getRagDebugChat()
          await addChatMessage('system', `[RAG Error] ${errorMsg}`)
        } catch { /* ignore secondary errors */ }

        return {
          success: false,
          error: errorMsg,
          message: `Failed to search knowledge base: ${errorMsg}`,
        }
      }
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

  // 7. Open RAG Debug Chat - allows users to see STT and RAG results
  vowel.registerAction(
    'openRagDebugChat',
    {
      description: 'Open the RAG debug chat panel to see STT transcripts and RAG search results. Use this to inspect what the knowledge base retrieved.',
      parameters: {},
    },
    async () => {
      try {
        // Import the rag-debug module dynamically
        const { state, openDialog } = await import('./rag-debug/index')

        // Switch to chat tab and open the dialog
        state.activeTab = 'chat'
        if (!state.isOpen) {
          openDialog()
        }

        await vowel.notifyEvent('RAG debug chat opened. You can see STT transcripts and search results here.')

        return {
          success: true,
          message: 'RAG debug chat opened',
        }
      } catch (error) {
        console.error('Failed to open RAG debug chat:', error)
        return {
          success: false,
          message: 'Failed to open RAG debug chat',
        }
      }
    }
  )

  // 8. Close RAG Debug Chat - allows users to close the debug dialog via voice
  vowel.registerAction(
    'closeRagDebugChat',
    {
      description: 'Close the RAG debug chat panel. Use this to dismiss the debug dialog after reviewing STT transcripts and search results.',
      parameters: {},
    },
    async () => {
      try {
        // Import the rag-debug module dynamically
        const { state, closeDialog } = await import('./rag-debug/index')

        // Close the dialog if it's open
        if (state.isOpen) {
          closeDialog()
          await vowel.notifyEvent('RAG debug chat closed.')
          return {
            success: true,
            message: 'RAG debug chat closed',
          }
        }

        return {
          success: true,
          message: 'RAG debug chat was already closed',
        }
      } catch (error) {
        console.error('Failed to close RAG debug chat:', error)
        return {
          success: false,
          message: 'Failed to close RAG debug chat',
        }
      }
    }
  )

  console.log('✅ Registered 7 custom documentation actions (including searchKnowledgeBase)')
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
