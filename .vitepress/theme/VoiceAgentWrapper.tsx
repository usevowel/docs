/**
 * Voice Agent Wrapper for VitePress
 * 
 * This component handles the React integration for the Vowel voice agent.
 * It's imported by the Vue layout component.
 */

import React, { useEffect, useState } from 'react'
import { VowelProvider, VowelAgent } from '@vowel.to/client/react'
import type { Vowel } from '@vowel.to/client'

interface VoiceAgentWrapperProps {
  vowelClient: Vowel
}

export function VoiceAgentWrapper({ vowelClient }: VoiceAgentWrapperProps) {
  return (
    <VowelProvider client={vowelClient}>
      <VowelAgent position="bottom-right" />
    </VowelProvider>
  )
}

/**
 * Container component that waits for the voice client to initialize
 */
export function VoiceAgentContainer() {
  const [vowelClient, setVowelClient] = useState<Vowel | null>(null)

  useEffect(() => {
    // Import the getVoiceAgent function dynamically to avoid circular deps
    const checkForClient = async () => {
      try {
        const { getVoiceAgent } = await import('./voice-client')
        
        const checkInterval = setInterval(() => {
          const client = getVoiceAgent()
          if (client) {
            console.log('✅ VowelAgent React component initializing...')
            setVowelClient(client)
            clearInterval(checkInterval)
          }
        }, 100)

        // Cleanup after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval)
          if (!vowelClient) {
            console.warn('⚠️ Voice agent failed to initialize within 10 seconds')
          }
        }, 10000)

        return () => clearInterval(checkInterval)
      } catch (error) {
        console.error('❌ Error loading voice client:', error)
      }
    }

    checkForClient()
  }, [])

  if (!vowelClient) {
    return null
  }

  return <VoiceAgentWrapper vowelClient={vowelClient} />
}

