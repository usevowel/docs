/**
 * Logo component for VitePress docs
 * Uses the VowelLogo from the branding package
 */

import React from 'react'
import { VowelLogo } from '../../../branding/src/VowelLogo'

export function Logo() {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center',
      padding: '8px 0',
      fontSize: '1.5em' // 1.5x bigger
    }}>
      <VowelLogo size="xl" />
    </div>
  )
}

