# React Integration

Learn how to integrate Vowel into your React applications using the provided React components and hooks.

## Overview

Vowel provides React-specific exports for seamless integration:

- **VowelProvider** - Context provider for the Vowel client
- **useVowel** - Hook to access the Vowel client
- **useSyncContext** - Hook to automatically sync context with the AI
- **VowelAgent** - Pre-built voice agent UI component
- **VowelMicrophone** - Standalone microphone button component

## Installation

```bash
npm install @vowel.to/client
```

## Basic Setup

### 1. Create Vowel Client

First, create and configure your Vowel client:

```typescript
// vowel.client.ts
import { Vowel, createDirectAdapters } from '@vowel.to/client';

export function createVowelClient(router: any) {
  const { navigationAdapter, automationAdapter } = createDirectAdapters({
    navigate: (path) => router.push(path),
    routes: [
      { path: '/', description: 'Home page' },
      { path: '/products', description: 'Product catalog' },
      { path: '/cart', description: 'Shopping cart' }
    ],
    enableAutomation: true
  });

  const vowel = new Vowel({
    appId: 'your-app-id',
    navigationAdapter,
    automationAdapter,
    voiceConfig: {
      name: 'Puck',
      language: 'en-US'
    }
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

  return vowel;
}
```

### 2. Wrap App with VowelProvider

```tsx
// App.tsx
import { VowelProvider, VowelAgent } from '@vowel.to/client/react';
import { createVowelClient } from './vowel.client';
import { useRouter } from 'next/navigation';

function App() {
  const router = useRouter();
  const vowel = createVowelClient(router);

  return (
    <VowelProvider client={vowel}>
      <YourApp />
      <VowelAgent position="bottom-right" />
    </VowelProvider>
  );
}
```

### 3. Use the Hook

Access the Vowel client anywhere in your component tree:

```tsx
import { useVowel } from '@vowel.to/client/react';

function MyComponent() {
  const { client, state } = useVowel();

  const handleNotify = async () => {
    await client.notifyEvent('Hello from React!');
  };

  return (
    <div>
      <p>Connected: {state.isConnected ? 'Yes' : 'No'}</p>
      <p>AI Speaking: {state.isAISpeaking ? 'Yes' : 'No'}</p>
      <button onClick={handleNotify}>Notify</button>
    </div>
  );
}
```

## Components

### VowelProvider

Context provider that makes the Vowel client available to all child components.

```tsx
import { VowelProvider } from '@vowel.to/client/react';

<VowelProvider client={vowel}>
  {children}
</VowelProvider>
```

**Props:**
- `client` - The Vowel client instance (required)
- `children` - React children

### VowelAgent

Pre-built voice agent UI with microphone button and visual feedback.

```tsx
import { VowelAgent } from '@vowel.to/client/react';

<VowelAgent 
  position="bottom-right"
  showTranscript={true}
  autoStart={false}
/>
```

**Props:**
- `position` - `'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'` (default: `'bottom-right'`)
- `showTranscript` - Show live transcript (default: `true`)
- `autoStart` - Auto-start session on mount (default: `false`)
- `className` - Additional CSS classes
- `style` - Inline styles

### VowelMicrophone

Standalone microphone button component.

```tsx
import { VowelMicrophone } from '@vowel.to/client/react';

<VowelMicrophone 
  size="medium"
  variant="floating"
/>
```

**Props:**
- `size` - `'small' | 'medium' | 'large'` (default: `'medium'`)
- `variant` - `'floating' | 'inline'` (default: `'floating'`)
- `className` - Additional CSS classes
- `style` - Inline styles

## Hooks

### useVowel

Access the Vowel client and state:

```tsx
import { useVowel } from '@vowel.to/client/react';

function MyComponent() {
  const { client, state } = useVowel();

  // Access client methods
  const startSession = () => client.startSession();
  const stopSession = () => client.stopSession();
  const notify = (msg: string) => client.notifyEvent(msg);

  // Access state
  console.log(state.isConnected);
  console.log(state.isUserSpeaking);
  console.log(state.isAISpeaking);
  console.log(state.isAIThinking);

  return (
    <div>
      {state.isConnected ? 'Connected' : 'Disconnected'}
    </div>
  );
}
```

**Returns:**
```typescript
{
  client: Vowel;
  state: VoiceSessionState;
}
```

### useSyncContext

Automatically sync context with the Vowel client. This hook updates the AI's context whenever the provided value changes, making it easy to keep the AI aware of dynamic application state.

```tsx
import { useSyncContext } from '@vowel.to/client/react';

function ProductPage({ productId }: { productId: string }) {
  const product = useProduct(productId);
  
  // Automatically sync product context to Vowel
  useSyncContext({
    page: 'product',
    productId: product.id,
    productName: product.name,
    price: product.price,
    inStock: product.inStock
  });
  
  return <div>{product.name}</div>;
}
```

**Parameters:**
- `context` - Context object to sync (`Record<string, unknown> | null`). Use `null` to clear context.

**Features:**
- Automatically updates context when the value changes
- Clears context on component unmount
- Uses deep comparison to avoid unnecessary updates
- Works seamlessly with React state and props

**Example: Conditional Context**

```tsx
function UserProfile({ userId }: { userId: string | null }) {
  const user = useUser(userId);
  
  // Sync user context, or clear if no user
  useSyncContext(
    user ? {
      userId: user.id,
      userName: user.name,
      userRole: user.role
    } : null
  );
  
  return user ? <div>{user.name}</div> : <div>No user</div>;
}
```

**Example: Page Context**

```tsx
function CheckoutPage() {
  const cart = useCart();
  
  // Sync cart context
  useSyncContext({
    page: 'checkout',
    cartTotal: cart.total,
    itemCount: cart.items.length,
    shippingAddress: cart.shippingAddress
  });
  
  return <div>Checkout</div>;
}
```

See the [Dynamic Context recipe](../recipes/dynamic-context) for more examples and patterns.

## Common Patterns

### Auto-Start Session

```tsx
function App() {
  const { client } = useVowel();

  useEffect(() => {
    client.startSession();
    
    return () => {
      client.stopSession();
    };
  }, [client]);

  return <YourApp />;
}
```

### Conditional Rendering Based on State

```tsx
function VoiceStatus() {
  const { state } = useVowel();

  return (
    <div>
      {state.isConnected && (
        <div className="status-indicator">
          {state.isUserSpeaking && <span>🎤 Listening...</span>}
          {state.isAIThinking && <span>🤔 Thinking...</span>}
          {state.isAISpeaking && <span>🔊 Speaking...</span>}
        </div>
      )}
    </div>
  );
}
```

### Event Notification on Action

```tsx
function AddToCartButton({ productId }: { productId: string }) {
  const { client } = useVowel();

  const handleAddToCart = async () => {
    await addToCart(productId);
    
    // Notify via voice
    await client.notifyEvent('Item added to cart');
  };

  return (
    <button onClick={handleAddToCart}>
      Add to Cart
    </button>
  );
}
```

### Custom Voice Action Hook

```tsx
function useVoiceAction<T>(
  name: string,
  definition: VowelAction,
  handler: ActionHandler<T>
) {
  const { client } = useVowel();

  useEffect(() => {
    client.registerAction(name, definition, handler);
  }, [client, name, definition, handler]);
}

// Usage
function ProductSearch() {
  useVoiceAction('searchProducts', {
    description: 'Search for products',
    parameters: {
      query: { type: 'string', description: 'Search query' }
    }
  }, async ({ query }) => {
    const results = await searchProducts(query);
    return { success: true, data: results };
  });

  return <SearchResults />;
}
```

### Voice Notification Hook

```tsx
function useVoiceNotification() {
  const { client } = useVowel();

  const notify = useCallback(async (message: string, context?: any) => {
    if (client.state.isConnected) {
      await client.notifyEvent(message, context);
    }
  }, [client]);

  return { notify };
}

// Usage
function OrderConfirmation({ order }: { order: Order }) {
  const { notify } = useVoiceNotification();

  useEffect(() => {
    notify('Order confirmed!', { orderId: order.id });
  }, [order, notify]);

  return <div>Order #{order.id} confirmed!</div>;
}
```

## Complete Example

```tsx
// App.tsx
import { VowelProvider, VowelAgent, useVowel } from '@vowel.to/client/react';
import { Vowel, createDirectAdapters } from '@vowel.to/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Create client
function createVowelClient(router: any) {
  const { navigationAdapter, automationAdapter } = createDirectAdapters({
    navigate: (path) => router.push(path),
    routes: [
      { path: '/', description: 'Home' },
      { path: '/products', description: 'Products' },
      { path: '/cart', description: 'Cart' }
    ],
    enableAutomation: true
  });

  const vowel = new Vowel({
    appId: 'your-app-id',
    navigationAdapter,
    automationAdapter
  });

  // Register actions
  vowel.registerAction('addToCart', {
    description: 'Add product to cart',
    parameters: {
      productId: { type: 'string', required: true }
    }
  }, async ({ productId }) => {
    await addToCart(productId);
    return { success: true };
  });

  return vowel;
}

// Main app component
function AppContent() {
  const { client, state } = useVowel();

  useEffect(() => {
    // Auto-start session
    client.startSession();

    return () => {
      client.stopSession();
    };
  }, [client]);

  return (
    <div>
      <header>
        <h1>My Store</h1>
        {state.isConnected && (
          <div className="voice-status">
            Voice: {state.isAISpeaking ? 'Speaking' : 'Ready'}
          </div>
        )}
      </header>
      
      <main>
        <YourContent />
      </main>

      {/* Voice agent UI */}
      <VowelAgent position="bottom-right" />
    </div>
  );
}

// Root component
export default function App() {
  const router = useRouter();
  const vowel = createVowelClient(router);

  return (
    <VowelProvider client={vowel}>
      <AppContent />
    </VowelProvider>
  );
}
```

## TypeScript Support

Full TypeScript support with type definitions:

```tsx
import type { 
  VowelProviderProps,
  VowelAgentProps,
  VowelMicrophoneProps,
  VowelContextType
} from '@vowel.to/client/react';

// Typed component
const MyComponent: React.FC = () => {
  const { client, state }: VowelContextType = useVowel();
  
  return <div>{state.isConnected && 'Connected'}</div>;
};
```

## Styling

### Custom Styles

```tsx
<VowelAgent 
  position="bottom-right"
  style={{
    '--vowel-primary-color': '#007bff',
    '--vowel-background': '#ffffff',
    '--vowel-border-radius': '12px'
  } as React.CSSProperties}
/>
```

### CSS Classes

```tsx
<VowelAgent 
  position="bottom-right"
  className="my-custom-agent"
/>
```

```css
.my-custom-agent {
  /* Your custom styles */
}
```

## Related

- [React Router](./react-router) - React Router integration
- [Next.js](./nextjs) - Next.js integration
- [Adapters](./adapters) - Navigation and automation adapters
- [API Reference](/api/react/) - React API documentation

