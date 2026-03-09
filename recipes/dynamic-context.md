# Dynamic Context

Learn how to dynamically update the AI's context during a voice session to keep it aware of current application state.

## Overview

Dynamic context allows you to update the AI's understanding of the current application state in real-time. The context object is stringified and appended to the system prompt, enabling the AI to provide more relevant and contextual responses.

**Key Features:**
- Set initial context when creating the client
- Update context anytime during a session
- Context is automatically sent via `session.update` when changed
- Context persists across session reconnections
- Works seamlessly with React hooks

## Basic Usage

### Initial Context

Set context when creating the client. This context is automatically included when the session starts:

```typescript
import { Vowel } from '@vowel.to/client';

const vowel = new Vowel({
  appId: 'your-app-id',
  initialContext: {
    page: 'product',
    productId: 'iphone-15-pro',
    price: 999.99
  }
});

// When you start the session, the context is automatically included
await vowel.startSession();
```

### Updating Context

Update context dynamically during a session:

```typescript
import { vowel } from './vowel.client';

// Update context with current page info
vowel.updateContext({
  page: 'product',
  productId: 'iphone-15-pro',
  price: 999.99
});

// Get current context
const context = vowel.getContext();
console.log(context); // { page: 'product', productId: 'iphone-15-pro', price: 999.99 }

// Clear context
vowel.updateContext(null);
```

## How It Works

### Initial Context

When you provide `initialContext` in the config:
1. Context is stored in the client during construction
2. When `startSession()` is called, the context is automatically included in the initial system instructions
3. The context is stringified and wrapped in `<context>` tags
4. It's sent to the AI as part of the initial connection

### Dynamic Updates

When you call `updateContext()`, the context object is:
1. Stored in the client
2. Stringified using `JSON.stringify(context, null, 2)` (pretty-printed)
3. Wrapped in `<context>` tags
4. Appended to the base system instructions
5. Sent to the AI via `session.update` (if session is active)

The AI receives the context in this format:

```
<context>
{
  "page": "product",
  "productId": "iphone-15-pro",
  "price": 999.99
}
</context>
```

## Common Patterns

### Page-Based Context

Update context when navigating between pages:

```typescript
// Product page
function showProductPage(productId: string) {
  const product = getProduct(productId);
  
  vowel.updateContext({
    page: 'product',
    productId: product.id,
    name: product.name,
    price: product.price,
    inStock: product.inStock,
    description: product.description
  });
}

// Checkout page
function showCheckoutPage(cart: Cart) {
  vowel.updateContext({
    page: 'checkout',
    cartTotal: cart.getTotal(),
    itemCount: cart.items.length,
    shippingAddress: cart.shippingAddress,
    paymentMethod: cart.paymentMethod
  });
}

// Home page
function showHomePage() {
  vowel.updateContext(null); // Clear context
}
```

### User State Context

Keep the AI aware of user information:

```typescript
async function loginUser(user: User) {
  await authenticate(user);
  
  vowel.updateContext({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      preferences: user.preferences
    }
  });
}

async function logoutUser() {
  await signOut();
  vowel.updateContext(null); // Clear user context
}
```

### Shopping Cart Context

Update context as cart changes:

```typescript
class CartManager {
  private cart: Cart;
  
  addItem(product: Product, quantity: number) {
    this.cart.add(product, quantity);
    this.updateContext();
  }
  
  removeItem(productId: string) {
    this.cart.remove(productId);
    this.updateContext();
  }
  
  updateQuantity(productId: string, quantity: number) {
    this.cart.updateQuantity(productId, quantity);
    this.updateContext();
  }
  
  private updateContext() {
    vowel.updateContext({
      cart: {
        items: this.cart.items.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: this.cart.getTotal(),
        itemCount: this.cart.items.length
      }
    });
  }
}
```

### Form Context

Provide form state to the AI:

```typescript
function handleFormChange(formData: FormData) {
  vowel.updateContext({
    form: {
      type: 'contact',
      fields: {
        name: formData.name,
        email: formData.email,
        message: formData.message
      },
      isValid: validateForm(formData),
      progress: calculateProgress(formData)
    }
  });
}

function handleFormSubmit() {
  // Clear form context after submission
  vowel.updateContext(null);
}
```

### Search Context

Keep AI aware of search state:

```typescript
function performSearch(query: string, filters: SearchFilters) {
  const results = search(query, filters);
  
  vowel.updateContext({
    search: {
      query,
      filters,
      resultCount: results.length,
      results: results.slice(0, 5).map(r => ({
        id: r.id,
        title: r.title,
        type: r.type
      }))
    }
  });
}

function clearSearch() {
  vowel.updateContext(null);
}
```

## React Integration

### Using `useSyncContext` Hook (Recommended)

The `useSyncContext` hook automatically syncs context with the Vowel client, handling updates and cleanup for you:

```tsx
import { useSyncContext } from '@vowel.to/client/react';

function ProductPage({ productId }: { productId: string }) {
  const product = useProduct(productId);
  
  // Automatically sync product context - updates on change, clears on unmount
  useSyncContext(
    product ? {
      page: 'product',
      productId: product.id,
      name: product.name,
      price: product.price,
      inStock: product.inStock
    } : null
  );
  
  return <div>{product?.name}</div>;
}
```

**Benefits:**
- ✅ Automatic updates when context changes
- ✅ Automatic cleanup on unmount
- ✅ Deep comparison to avoid unnecessary updates
- ✅ Simple, declarative API

### Using the `useVowel` Hook (Manual)

For more control, you can manually manage context updates:

```tsx
import { useVowel } from '@vowel.to/client/react';
import { useEffect } from 'react';

function ProductPage({ productId }: { productId: string }) {
  const { updateContext, getContext } = useVowel();
  const product = useProduct(productId);
  
  useEffect(() => {
    if (product) {
      updateContext({
        page: 'product',
        productId: product.id,
        name: product.name,
        price: product.price,
        inStock: product.inStock
      });
    }
    
    // Clear context when component unmounts
    return () => {
      updateContext(null);
    };
  }, [product, updateContext]);
  
  return <div>{product?.name}</div>;
}
```

### Custom Hook for Context Management

If you need custom logic, you can create your own hook:

```tsx
import { useVowel } from '@vowel.to/client/react';
import { useEffect, useRef } from 'react';

function usePageContext(context: Record<string, unknown> | null) {
  const { updateContext } = useVowel();
  const previousContext = useRef<Record<string, unknown> | null>(null);
  
  useEffect(() => {
    // Only update if context actually changed
    if (JSON.stringify(context) !== JSON.stringify(previousContext.current)) {
      updateContext(context);
      previousContext.current = context;
    }
    
    return () => {
      updateContext(null);
    };
  }, [context, updateContext]);
}

// Usage
function ProductPage({ product }) {
  usePageContext({
    page: 'product',
    productId: product.id,
    name: product.name
  });
  
  return <div>{product.name}</div>;
}
```

**Note:** The built-in `useSyncContext` hook provides the same functionality with better performance and less boilerplate. Use custom hooks only when you need additional logic beyond basic context syncing.

### Context Provider Pattern

Create a context provider that manages application-wide context:

```tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { useVowel } from '@vowel.to/client/react';

interface AppContext {
  user: User | null;
  currentPage: string;
  cart: Cart | null;
}

const AppContextContext = createContext<AppContext | null>(null);

export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const { updateContext } = useVowel();
  const [appContext, setAppContext] = useState<AppContext>({
    user: null,
    currentPage: 'home',
    cart: null
  });
  
  // Sync app context to Vowel context
  useEffect(() => {
    const vowelContext: Record<string, unknown> = {};
    
    if (appContext.user) {
      vowelContext.user = {
        id: appContext.user.id,
        name: appContext.user.name,
        role: appContext.user.role
      };
    }
    
    if (appContext.currentPage) {
      vowelContext.page = appContext.currentPage;
    }
    
    if (appContext.cart) {
      vowelContext.cart = {
        itemCount: appContext.cart.items.length,
        total: appContext.cart.getTotal()
      };
    }
    
    updateContext(Object.keys(vowelContext).length > 0 ? vowelContext : null);
  }, [appContext, updateContext]);
  
  return (
    <AppContextContext.Provider value={appContext}>
      {children}
    </AppContextContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContextContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppContextProvider');
  }
  return context;
}
```

## Advanced Patterns

### Debounced Context Updates

Prevent excessive context updates:

```typescript
import { debounce } from 'lodash';

const updateContextDebounced = debounce((context: Record<string, unknown> | null) => {
  vowel.updateContext(context);
}, 300);

// Usage
function handleCartChange(cart: Cart) {
  updateContextDebounced({
    cart: {
      itemCount: cart.items.length,
      total: cart.getTotal()
    }
  });
}
```

### Context Merging

Merge new context with existing context:

```typescript
function mergeContext(updates: Record<string, unknown>) {
  const current = vowel.getContext();
  const merged = {
    ...(current || {}),
    ...updates
  };
  vowel.updateContext(merged);
}

// Usage
mergeContext({ page: 'product' }); // Adds/updates page
mergeContext({ productId: '123' }); // Adds productId, keeps page
```

### Context History

Track context changes for debugging:

```typescript
class ContextManager {
  private history: Array<{ timestamp: number; context: Record<string, unknown> | null }> = [];
  
  updateContext(context: Record<string, unknown> | null) {
    this.history.push({
      timestamp: Date.now(),
      context: context ? { ...context } : null
    });
    
    // Keep only last 50 entries
    if (this.history.length > 50) {
      this.history.shift();
    }
    
    vowel.updateContext(context);
  }
  
  getHistory() {
    return this.history;
  }
  
  rollback(steps: number = 1) {
    if (this.history.length > steps) {
      const targetIndex = this.history.length - steps - 1;
      const targetContext = this.history[targetIndex].context;
      this.history = this.history.slice(0, targetIndex + 1);
      vowel.updateContext(targetContext);
    }
  }
}

const contextManager = new ContextManager();
```

### Conditional Context Updates

Only update context if session is active:

```typescript
function safeUpdateContext(context: Record<string, unknown> | null) {
  if (vowel.state.isConnected) {
    vowel.updateContext(context);
  } else {
    console.log('Context will be applied on next session start:', context);
    // Context is still stored and will be applied when session starts
    vowel.updateContext(context);
  }
}
```

## Best Practices

1. **Keep context concise** - Only include relevant information the AI needs
2. **Update on meaningful changes** - Don't update on every keystroke or mouse move
3. **Clear when appropriate** - Set context to `null` when leaving pages or resetting state
4. **Use structured data** - Objects with clear keys are easier for the AI to understand
5. **Avoid sensitive data** - Don't include passwords, tokens, or other sensitive information
6. **Debounce frequent updates** - Use debouncing for rapidly changing data (like form inputs)
7. **Check session state** - Context updates work even when disconnected (will apply on next connection)

## Common Use Cases

### E-commerce
- Product page context (product details, price, availability)
- Cart context (items, totals, shipping info)
- Checkout context (payment method, shipping address)

### Dashboards
- Current view/filter context
- Selected data context
- User preferences context

### Forms
- Form state and validation
- Progress tracking
- Field values

### Navigation
- Current page/route
- Navigation history
- Breadcrumbs

## Error Handling

```typescript
function safeUpdateContext(context: Record<string, unknown> | null) {
  try {
    vowel.updateContext(context);
  } catch (error) {
    console.error('Failed to update context:', error);
    // Context update failures are non-critical
    // The session will continue to work
  }
}
```

## Related

- [Vowel Client Guide](../guide/vowel-client) - Core client documentation
- [Event Notifications](./event-notifications) - Programmatic AI speech
- [Speaking State Tracking](./speaking-state) - Track AI speaking state
- [API Reference](/api/index/classes/Vowel) - Complete API documentation
