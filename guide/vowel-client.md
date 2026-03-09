# Vowel Client

The Vowel client is the core of the library. It manages voice sessions, actions, state, and coordinates between navigation and automation adapters.

## Overview

The `Vowel` class provides:

- 🎤 **Session Management** - Start/stop voice sessions
- 🔧 **Action Registration** - Define custom voice commands
- 📢 **Event Notifications** - Programmatically trigger AI speech
- 📊 **State Management** - Track connection, audio, and session state
- 🧭 **Navigation Integration** - Voice-controlled routing
- 🤖 **Automation Integration** - Voice-controlled page interaction

## Basic Setup

```typescript
import { Vowel, createDirectAdapters } from '@vowel.to/client';

// Create adapters
const { navigationAdapter, automationAdapter } = createDirectAdapters({
  navigate: (path) => router.push(path),
  routes: [
    { path: '/', description: 'Home page' },
    { path: '/products', description: 'Product catalog' },
    { path: '/cart', description: 'Shopping cart' }
  ],
  enableAutomation: true
});

// Initialize client
const vowel = new Vowel({
  appId: 'your-app-id',
  navigationAdapter,
  automationAdapter
});
```

## Configuration

### VowelClientConfig

The `Vowel` constructor accepts a configuration object:

```typescript
interface VowelClientConfig {
  // Required: Your Vowel app ID from vowel.to
  appId: string;
  
  // Optional: Navigation adapter for voice routing
  navigationAdapter?: NavigationAdapter;
  
  // Optional: Automation adapter for page interaction
  automationAdapter?: AutomationAdapter;
  
  // Optional: Voice configuration
  voiceConfig?: VowelVoiceConfig;
  
  // Optional: System instruction override
  systemInstructionOverride?: string;
  
  // Optional: Initial context object (included when session starts)
  initialContext?: Record<string, unknown> | null;
  
  // Optional: Enable floating cursor for automation feedback
  enableFloatingCursor?: boolean;
}
```

### Voice Configuration

Customize the AI voice:

```typescript
const vowel = new Vowel({
  appId: 'your-app-id',
  voiceConfig: {
    name: 'Puck',  // Voice name (Gemini Live voices)
    language: 'en-US'
  }
});
```

### System Instructions

Override the default system instructions:

```typescript
const vowel = new Vowel({
  appId: 'your-app-id',
  systemInstructionOverride: `
    You are a helpful shopping assistant.
    Always be friendly and concise.
    Help users find products and complete purchases.
  `
});
```

### Dynamic Context

Update the AI's context dynamically during a session. Context is stringified and appended to the system prompt, allowing the AI to stay aware of current application state.

#### Initial Context

Set initial context when creating the client. This context is automatically included when the session starts:

```typescript
const vowel = new Vowel({
  appId: 'your-app-id',
  initialContext: {
    page: 'product',
    productId: 'iphone-15-pro',
    price: 999.99,
    inStock: true
  }
});

// When you start the session, the context is automatically included
await vowel.startSession();
```

#### Updating Context

Update context dynamically during a session:

```typescript
// Update context with current page info
vowel.updateContext({
  page: 'product',
  productId: 'iphone-15-pro',
  price: 999.99,
  inStock: true
});

// Update with multiple details
vowel.updateContext({
  page: 'checkout',
  cartTotal: 199.99,
  itemCount: 2,
  shippingAddress: '123 Main St'
});

// Clear context
vowel.updateContext(null);
```

When context changes, a `session.update` event is automatically sent to update the system prompt. The context object is stringified with `JSON.stringify()` and wrapped in `<context>` tags before being appended to the base system instructions.

**With React:**

```tsx
import { useVowel } from '@vowel.to/client/react';

function ProductPage({ product }) {
  const { updateContext } = useVowel();
  
  useEffect(() => {
    // Update context when product changes
    updateContext({
      page: 'product',
      productId: product.id,
      name: product.name,
      price: product.price
    });
    
    // Clear context when component unmounts
    return () => updateContext(null);
  }, [product, updateContext]);
  
  return <div>{product.name}</div>;
}
```

See [Dynamic Context Recipe](../recipes/dynamic-context) for detailed patterns and examples.

## Session Management

### Starting a Session

```typescript
// Start voice session
await vowel.startSession();
```

### Stopping a Session

```typescript
// Stop voice session
await vowel.stopSession();
```

### Checking Session State

```typescript
// Get current state
const state = vowel.state;

console.log(state.isConnected);      // Is session connected?
console.log(state.isUserSpeaking);   // Is user speaking?
console.log(state.isAISpeaking);     // Is AI speaking?
console.log(state.isAIThinking);     // Is AI thinking?
console.log(state.error);            // Any error?
```

### State Helpers

```typescript
// Convenience methods
if (vowel.isUserSpeaking()) {
  console.log('User is speaking');
}

if (vowel.isAISpeaking()) {
  console.log('AI is speaking');
}

if (vowel.isAIThinking()) {
  console.log('AI is thinking');
}
```

## Action Registration

Register custom voice commands:

```typescript
vowel.registerAction('addToCart', {
  description: 'Add product to shopping cart',
  parameters: {
    productId: {
      type: 'string',
      description: 'Product ID'
    },
    quantity: {
      type: 'number',
      description: 'Quantity to add',
      default: 1
    }
  }
}, async ({ productId, quantity }) => {
  // Your business logic
  await addProductToCart(productId, quantity);
  
  return {
    success: true,
    message: `Added ${quantity} item(s) to cart`
  };
});
```

See [Actions Guide](./actions) for detailed information.

## Event Notifications

Programmatically trigger AI speech:

```typescript
// Simple notification
await vowel.notifyEvent('Order placed successfully!');

// With context
await vowel.notifyEvent('New message received', {
  from: 'John Doe',
  preview: 'Hey, are you available?'
});
```

See [Event Notifications Guide](./event-notifications) for detailed patterns.

## State Subscription

Listen to state changes:

```typescript
// Subscribe to state changes
const unsubscribe = vowel.onStateChange((state) => {
  console.log('State changed:', state);
  
  if (state.isConnected) {
    console.log('Session connected');
  }
  
  if (state.error) {
    console.error('Error:', state.error);
  }
});

// Cleanup
unsubscribe();
```

## Adapters

### Navigation Adapter

Provides voice-controlled routing:

```typescript
const vowel = new Vowel({
  appId: 'your-app-id',
  navigationAdapter: new DirectNavigationAdapter({
    navigate: (path) => router.push(path),
    getCurrentPath: () => window.location.pathname,
    routes: [/* your routes */]
  })
});
```

When provided, automatically registers the `navigate_to_page` action.

### Automation Adapter

Provides voice-controlled page interaction:

```typescript
const vowel = new Vowel({
  appId: 'your-app-id',
  automationAdapter: new DirectAutomationAdapter()
});
```

When provided, automatically registers these actions:
- `search_page_elements`
- `get_page_snapshot`
- `click_element`
- `type_into_element`
- `focus_element`
- `scroll_to_element`
- `press_key`

See [Adapters Guide](./adapters) for detailed information.

## Floating Cursor

Enable visual feedback for automation:

```typescript
const vowel = new Vowel({
  appId: 'your-app-id',
  automationAdapter: new DirectAutomationAdapter(),
  enableFloatingCursor: true
});

// Access cursor manager
const cursor = vowel.floatingCursor;
if (cursor) {
  cursor.show({ x: 100, y: 100 });
  cursor.hide();
}
```

## Error Handling

Handle errors gracefully:

```typescript
try {
  await vowel.startSession();
} catch (error) {
  console.error('Failed to start session:', error);
  // Show user-friendly error message
}

// Or subscribe to state errors
vowel.onStateChange((state) => {
  if (state.error) {
    console.error('Session error:', state.error);
    // Handle error
  }
});
```

## Cleanup

Always cleanup when done:

```typescript
// Stop session
await vowel.stopSession();

// Unsubscribe from state changes
unsubscribe();

// Clear automation store (if using controlled adapters)
automationAdapter.clearStore?.();
```

## Complete Example

```typescript
import { Vowel, createDirectAdapters } from '@vowel.to/client';
import { useRouter } from 'next/navigation';

// Setup
const router = useRouter();
const { navigationAdapter, automationAdapter } = createDirectAdapters({
  navigate: (path) => router.push(path),
  routes: [
    { path: '/', description: 'Home page' },
    { path: '/products', description: 'Browse products' },
    { path: '/cart', description: 'Shopping cart' }
  ],
  enableAutomation: true
});

// Initialize client
const vowel = new Vowel({
  appId: 'your-app-id',
  navigationAdapter,
  automationAdapter,
  voiceConfig: {
    name: 'Puck',
    language: 'en-US'
  },
  enableFloatingCursor: true
});

// Register custom actions
vowel.registerAction('searchProducts', {
  description: 'Search for products',
  parameters: {
    query: { type: 'string', description: 'Search query' }
  }
}, async ({ query }) => {
  const results = await searchProducts(query);
  return { success: true, results };
});

// Subscribe to state
const unsubscribe = vowel.onStateChange((state) => {
  console.log('Connection:', state.isConnected);
  console.log('User speaking:', state.isUserSpeaking);
  console.log('AI speaking:', state.isAISpeaking);
});

// Start session
await vowel.startSession();

// Notify events
await vowel.notifyEvent('Welcome to our store!');

// Later: cleanup
await vowel.stopSession();
unsubscribe();
```

## Related

- [Actions](./actions) - Custom action registration
- [Event Notifications](./event-notifications) - Programmatic AI speech
- [Dynamic Context](../recipes/dynamic-context) - Dynamic context management
- [Adapters](./adapters) - Navigation and automation
- [API Reference](/api/index/classes/Vowel) - Complete API documentation

