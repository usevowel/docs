# Getting Started

Welcome to @vowel.to/client! This guide will help you add voice-powered AI agents to your web application in minutes.

## What is Vowel?

Vowel is a framework-agnostic voice agent library that enables real-time voice interaction in web applications. Powered by Google's Gemini Live API, it provides:

- 🎤 **Real-time Voice Interface** - Natural, conversational interactions
- 🧭 **Smart Navigation** - Voice-controlled routing
- 🤖 **Page Automation** - Voice-controlled interaction (click, type, search)
- ⚡ **Custom Actions** - Define business logic for voice commands
- 📢 **Event Notifications** - Programmatic AI voice responses

## Prerequisites

Before you begin, ensure you have:

- Node.js 18+ or Bun
- A modern browser with microphone support
- HTTPS (required for microphone access)
- A Vowel App ID (get one at [vowel.to](https://vowel.to))

## Installation

Install the package using your preferred package manager:

```bash
# npm
npm install @vowel.to/client

# yarn
yarn add @vowel.to/client

# bun
bun add @vowel.to/client
```

## Quick Start

Here's a minimal example to get you started:

```typescript
import { Vowel, createDirectAdapters } from '@vowel.to/client';

// Create adapters for navigation and automation
const { navigationAdapter, automationAdapter } = createDirectAdapters({
  navigate: (path) => {
    // Your navigation logic (e.g., router.push(path))
    window.location.href = path;
  },
  routes: [
    { path: '/', description: 'Home page' },
    { path: '/products', description: 'Product catalog' },
    { path: '/cart', description: 'Shopping cart' }
  ],
  enableAutomation: true
});

// Initialize Vowel client
const vowel = new Vowel({
  appId: 'your-app-id',
  navigationAdapter,
  automationAdapter
});

// Start voice session
await vowel.startSession();
```

## With React

If you're using React, use the provided components:

```tsx
import { VowelProvider, VowelAgent } from '@vowel.to/client/react';
import { Vowel, createDirectAdapters } from '@vowel.to/client';
import { useRouter } from 'next/navigation';

function App() {
  const router = useRouter();
  
  const { navigationAdapter, automationAdapter } = createDirectAdapters({
    navigate: (path) => router.push(path),
    routes: [
      { path: '/', description: 'Home page' },
      { path: '/products', description: 'Browse products' }
    ],
    enableAutomation: true
  });

  const vowel = new Vowel({
    appId: 'your-app-id',
    navigationAdapter,
    automationAdapter
  });

  return (
    <VowelProvider client={vowel}>
      <YourApp />
      <VowelAgent position="bottom-right" />
    </VowelProvider>
  );
}
```

## Next Steps

Now that you have Vowel installed and running, explore these topics:

- [Installation](./installation) - Detailed installation instructions
- [Quick Start](./quick-start) - Complete quick start guide
- [Vowel Client](./vowel-client) - Core client API
- [Adapters](./adapters) - Navigation and automation adapters
- [Actions](./actions) - Custom action registration

## Getting Your App ID

Visit [vowel.to](https://vowel.to) to:

1. Create a free account
2. Configure your voice agent
3. Get your app ID

## Need Help?

- 📧 Email: support@vowel.to
- 💬 Discord: [Join our community](https://discord.gg/vowel-life)
- 📚 Docs: [vowel.to/docs](https://vowel.to/docs)
- 🐛 Issues: [GitHub Issues](https://github.com/vowel-life/client/issues)

