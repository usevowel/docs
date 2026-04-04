/**
 * Logo component for VitePress docs
 * Self-contained implementation to avoid external monorepo dependencies
 */

import React from 'react'

/**
 * VowelLogo - Branded logo component using OCR-A font
 * Inline implementation to avoid leaking internal repository structure
 */
const VowelLogo: React.FC<{
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}> = ({ className = '', size = 'lg' }) => {
  const sizeClasses = {
    xs: 'text-lg',
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  }

  return (
    <span
      className={`${sizeClasses[size]} font-normal tracking-tight leading-none ${className}`}
      style={{ fontFamily: 'OCR-A, monospace' }}
    >
      vowel
    </span>
  )
}

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

