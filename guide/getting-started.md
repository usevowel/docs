# Getting Started

Welcome to vowel. This guide helps you add voice-powered interactions to a web application with `@vowel.to/client`.

## What is Vowel?

Vowel is a client SDK for voice-powered web experiences. For the initial open-source launch, the primary path is a token-based connection flow backed by the self-hosted stack. Hosted platform flows are coming soon.

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
- A backend or token service that can provide session tokens

## Choose a Connection Model

Before you integrate, choose one of these connection models:

- **Token-based flow**: fetch a short-lived token from your own backend and connect with `tokenProvider`. This is the recommended path today.
- **Hosted platform flow**: use an `appId` and let vowel manage session setup for you. This is coming soon.

See [Connection Models](./connection-models) for details.

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
  tokenProvider: async () => {
    const response = await fetch('/api/vowel/token', {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch token');
    }

    return response.json();
  },
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
    tokenProvider: async () => {
      const response = await fetch('/api/vowel/token', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch token');
      }

      return response.json();
    },
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
- [Connection Models](./connection-models) - Choose between token-based setup today and the hosted `appId` flow coming soon
- [Vowel Client](./vowel-client) - Core client API
- [Adapters](./adapters) - Navigation and automation adapters
- [Actions](./actions) - Custom action registration

## Source Repository

The client SDK is open source at [github.com/usevowel/client](https://github.com/usevowel/client).

## Need Help?

- 📧 Email: support@vowel.to
- 💬 Discord: [Join our community](https://discord.gg/Kb4zFmmSRr)
- 📚 Docs: [vowel.to/docs](https://vowel.to/docs)
