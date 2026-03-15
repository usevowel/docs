# Quick Start

This guide will walk you through building your first voice-enabled web application with Vowel.

## Step 1: Install Vowel

```bash
npm install @vowel.to/client
```

## Step 2: Get Your App ID

1. Visit [vowel.to](https://vowel.to)
2. Create a free account
3. Create a new app
4. Copy your App ID

## Step 3: Create a Vowel Client

Create a file to initialize your Vowel client:

```typescript
// vowel.client.ts
import { Vowel, createDirectAdapters } from '@vowel.to/client';

// Define your routes
const routes = [
  { path: '/', description: 'Home page' },
  { path: '/products', description: 'Browse our products' },
  { path: '/cart', description: 'Shopping cart' },
  { path: '/checkout', description: 'Checkout' }
];

// Create adapters
const { navigationAdapter, automationAdapter } = createDirectAdapters({
  navigate: (path) => {
    // Replace with your router's navigate function
    window.location.href = path;
  },
  routes,
  enableAutomation: true
});

// Initialize Vowel
export const vowel = new Vowel({
  appId: 'your-app-id', // Replace with your actual App ID
  navigationAdapter,
  automationAdapter
});
```

## Step 4: Start a Voice Session

```typescript
// Start the voice session when user clicks a button
document.getElementById('start-voice')?.addEventListener('click', async () => {
  await vowel.startSession();
});

// Stop the session
document.getElementById('stop-voice')?.addEventListener('click', () => {
  vowel.stopSession();
});
```

## Step 5: Register Custom Actions

Add business logic that the AI can execute:

```typescript
// Register a search action
vowel.registerAction('searchProducts', {
  description: 'Search for products',
  parameters: {
    query: {
      type: 'string',
      description: 'Search query'
    }
  }
}, async ({ query }) => {
  // Your search logic
  const results = await fetch(`/api/products/search?q=${query}`);
  return {
    success: true,
    results: await results.json()
  };
});

// Register an add to cart action
vowel.registerAction('addToCart', {
  description: 'Add a product to the shopping cart',
  parameters: {
    productId: {
      type: 'string',
      description: 'Product ID'
    },
    quantity: {
      type: 'number',
      description: 'Quantity to add',
      optional: true
    }
  }
}, async ({ productId, quantity = 1 }) => {
  // Your add to cart logic
  await fetch('/api/cart/add', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity })
  });
  
  return {
    success: true,
    message: `Added ${quantity} item(s) to cart`
  };
});
```

## Step 6: Test Voice Commands

Start your voice session and try these commands:

- "Navigate to products"
- "Search for wireless headphones"
- "Add product 123 to cart"
- "Go to checkout"

## React Integration

If you're using React, here's a complete example:

```tsx
// App.tsx
import { VowelProvider, VowelAgent } from '@vowel.to/client/react';
import { Vowel, createDirectAdapters } from '@vowel.to/client';
import { useRouter } from 'next/navigation';

function App() {
  const router = useRouter();
  
  // Create adapters
  const { navigationAdapter, automationAdapter } = createDirectAdapters({
    navigate: (path) => router.push(path),
    routes: [
      { path: '/', description: 'Home page' },
      { path: '/products', description: 'Browse products' },
      { path: '/cart', description: 'Shopping cart' }
    ],
    enableAutomation: true
  });

  // Initialize Vowel
  const vowel = new Vowel({
    appId: process.env.NEXT_PUBLIC_VOWEL_APP_ID!,
    navigationAdapter,
    automationAdapter
  });

  // Register custom actions
  vowel.registerAction('searchProducts', {
    description: 'Search for products',
    parameters: {
      query: { type: 'string', description: 'Search query' }
    }
  }, async ({ query }) => {
    // Your search logic
    return { success: true };
  });

  return (
    <VowelProvider client={vowel}>
      <YourApp />
      <VowelAgent 
        position="bottom-right"
        showTranscripts={true}
      />
    </VowelProvider>
  );
}
```

## What's Next?

Now that you have a basic voice-enabled application, explore these topics:

- [Vowel Client](./vowel-client) - Learn about all client methods
- [Adapters](./adapters) - Deep dive into navigation and automation
- [Actions](./actions) - Advanced action registration
- [Event Notifications](./event-notifications) - Programmatic AI responses
- [Recipes](../recipes/) - Common use cases and patterns

## Common Issues

### Microphone Not Working

Ensure you're running on HTTPS. Browsers block microphone access on HTTP (except localhost).

### Voice Commands Not Working

1. Check that your App ID is correct
2. Ensure routes are properly configured
3. Verify actions are registered before starting the session
4. Check browser console for errors

### Navigation Not Working

Make sure your `navigate` function is correctly wired to your router:

```typescript
// Next.js
navigate: (path) => router.push(path)

// React Router
navigate: (path) => navigate(path)

// Vue Router
navigate: (path) => router.push(path)
```

## Need Help?

- 📧 Email: support@vowel.to
- 💬 Discord: [Join our community](https://discord.gg/Kb4zFmmSRr)
- 📚 API Reference: [/api](/api/)

