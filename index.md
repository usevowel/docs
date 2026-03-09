---
layout: home

hero:
  text: "Voice-Powered AI Agents"
  tagline: Add real-time voice interaction to any web application in minutes
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/vowel-life/client
    - theme: alt
      text: API Reference
      link: /api/

features:
  - icon: 🎤
    title: Real-time Voice Interface
    details: Powered by Google's Gemini Live API for natural, conversational interactions
  
  - icon: 🧭
    title: Smart Navigation
    details: Voice-controlled routing with automatic route detection and navigation
  
  - icon: 🤖
    title: Page Automation
    details: Voice-controlled interaction - search, click, type, and more
  
  - icon: ⚡
    title: Custom Actions
    details: Define business logic and custom voice commands for your application
  
  - icon: 📢
    title: Event Notifications
    details: Programmatically trigger AI voice responses for app events
  
  - icon: 🔌
    title: Framework Agnostic
    details: Works with React, Vue, Next.js, vanilla JS, and more
  
  - icon: 📦
    title: Multiple Formats
    details: React components, web component, or standalone JavaScript
  
  - icon: 🎨
    title: Fully Customizable
    details: Configure voice, behavior, UI, and integrate with your design system
  
  - icon: 🔄
    title: Dual Adapter Architecture
    details: Independent navigation and automation adapters for maximum flexibility
---

## Quick Example

```typescript
import { Vowel, createDirectAdapters } from '@vowel.to/client';
import { useRouter } from 'next/navigation';

// Create adapters for navigation + page automation
const router = useRouter();
const { navigationAdapter, automationAdapter } = createDirectAdapters({
  navigate: (path) => router.push(path),
  routes: [
    { path: '/', description: 'Home page' },
    { path: '/products', description: 'Product catalog' }
  ],
  enableAutomation: true  // Enable voice page interaction
});

const vowel = new Vowel({
  appId: 'your-app-id',
  navigationAdapter,   // Voice navigation
  automationAdapter    // Voice page interaction
});

// Register a custom action
vowel.registerAction('search', {
  description: 'Search for products',
  parameters: {
    query: { type: 'string', description: 'Search query' }
  }
}, async ({ query }) => {
  // Your search logic
  return { success: true };
});

// Start voice session
await vowel.startSession();

// Programmatically notify user of events
await vowel.notifyEvent('Order placed successfully!', {
  orderId: '12345',
  total: 99.99
});
```

## Why Vowel?

Building voice interfaces from scratch is complex. Vowel handles the hard parts:

- **Audio Processing** - VAD, echo cancellation, noise suppression
- **AI Integration** - Gemini Live API connection and management
- **Navigation** - Automatic route detection and voice-controlled routing
- **Page Interaction** - DOM manipulation and element interaction
- **State Management** - Session, audio, and connection state
- **Error Handling** - Graceful degradation and recovery

You focus on your application logic and custom actions.

## Use Cases

- **E-commerce** - Voice shopping, product search, cart management
- **SaaS Applications** - Voice-controlled workflows and navigation
- **Customer Support** - Interactive voice assistance
- **Accessibility** - Hands-free navigation for users with disabilities
- **Productivity Tools** - Quick actions via voice commands

## Get Started

<div class="vp-doc">

[Get Started →](/guide/getting-started)

</div>

