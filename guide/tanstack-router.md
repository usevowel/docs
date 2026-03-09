# TanStack Router Integration

Learn how to integrate Vowel with TanStack Router for automatic route detection and voice-controlled navigation.

## Overview

Vowel provides first-class support for TanStack Router with automatic route discovery. The `createTanStackAdapters` helper automatically extracts routes from your router configuration.

## Installation

```bash
npm install @vowel.to/client @tanstack/react-router
```

## Basic Setup

### 1. Create Your Router

```typescript
// router.ts
import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router'

const rootRoute = createRootRoute()

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/products',
  component: ProductsPage,
})

const productRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/product/$productId',
  component: ProductPage,
})

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cart',
  component: CartPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  productsRoute,
  productRoute,
  cartRoute,
])

export const router = createRouter({ routeTree })
```

### 2. Configure Vowel Client

```typescript
// vowel.client.ts
import { Vowel, createTanStackAdapters } from '@vowel.to/client'
import { router } from './router'

// Create adapters with automatic route detection
const { navigationAdapter, automationAdapter } = createTanStackAdapters({
  router,
  enableAutomation: true  // Enable voice page interaction
})

export const vowel = new Vowel({
  appId: 'your-app-id',
  navigationAdapter,
  automationAdapter,
  voiceConfig: {
    model: 'gemini-live-2.5-flash-preview',
    voice: 'Puck',
    language: 'en-US'
  }
})

// Register custom actions
vowel.registerAction('searchProducts', {
  description: 'Search for products',
  parameters: {
    query: { type: 'string', description: 'Search query' }
  }
}, async ({ query }) => {
  await vowel.navigate(`/products?q=${query}`)
  return { success: true }
})
```

### 3. Wrap App with VowelProvider

```tsx
// App.tsx
import { RouterProvider } from '@tanstack/react-router'
import { VowelProvider, VowelAgent } from '@vowel.to/client/react'
import { router } from './router'
import { vowel } from './vowel.client'

function App() {
  return (
    <VowelProvider client={vowel}>
      <RouterProvider router={router} />
      <VowelAgent position="bottom-right" />
    </VowelProvider>
  )
}

export default App
```

## Automatic Route Detection

TanStack Router integration automatically detects routes from your router configuration:

```typescript
const { navigationAdapter } = createTanStackAdapters({
  router
})

// Routes are automatically extracted:
// - / → "Home"
// - /products → "Products" 
// - /product/:productId → "Product details"
// - /cart → "Shopping cart"
```

### Route Descriptions

Routes are automatically described based on their paths. You can enhance descriptions by using descriptive path names:

```typescript
const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about-us',  // Becomes "About us"
  component: AboutPage,
})

const contactRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/contact-support',  // Becomes "Contact support"
  component: ContactPage,
})
```

## Dynamic Routes

TanStack Router's dynamic routes are fully supported:

```typescript
const productRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/product/$productId',
  component: ProductPage,
})

const userRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/user/$userId/profile',
  component: UserProfilePage,
})

// Users can say:
// "Navigate to product 123"
// "Go to user profile for user 456"
```

## Search Parameters

Handle search parameters with custom actions:

```typescript
vowel.registerAction('filterProducts', {
  description: 'Filter products by category and price range',
  parameters: {
    category: { 
      type: 'string', 
      description: 'Product category',
      optional: true 
    },
    minPrice: { 
      type: 'number', 
      description: 'Minimum price',
      optional: true 
    },
    maxPrice: { 
      type: 'number', 
      description: 'Maximum price',
      optional: true 
    }
  }
}, async ({ category, minPrice, maxPrice }) => {
  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (minPrice) params.set('minPrice', minPrice.toString())
  if (maxPrice) params.set('maxPrice', maxPrice.toString())
  
  await vowel.navigate(`/products?${params.toString()}`)
  return { success: true }
})
```

## Page Automation

With `enableAutomation: true`, users can interact with your pages using voice:

```typescript
const { navigationAdapter, automationAdapter } = createTanStackAdapters({
  router,
  enableAutomation: true
})

// Users can now say:
// "Click the add to cart button"
// "Type 'laptop' in the search box"
// "Select the electronics category"
// "Scroll to the checkout button"
```

## Complete Example

```typescript
// vowel.client.ts
import { Vowel, createTanStackAdapters } from '@vowel.to/client'
import { router } from './router'
import { addToCart, searchProducts } from './api'

const { navigationAdapter, automationAdapter } = createTanStackAdapters({
  router,
  enableAutomation: true
})

export const vowel = new Vowel({
  appId: 'your-app-id',
  navigationAdapter,
  automationAdapter,
  voiceConfig: {
    model: 'gemini-live-2.5-flash-preview',
    voice: 'Puck',
    language: 'en-US'
  }
})

// Search products
vowel.registerAction('searchProducts', {
  description: 'Search for products',
  parameters: {
    query: { type: 'string', description: 'Search query' }
  }
}, async ({ query }) => {
  const results = await searchProducts(query)
  await vowel.navigate(`/products?q=${query}`)
  await vowel.notifyEvent(`Found ${results.length} products`)
  return { success: true }
})

// Add to cart
vowel.registerAction('addToCart', {
  description: 'Add a product to the shopping cart',
  parameters: {
    productId: { type: 'string', description: 'Product ID' },
    quantity: { type: 'number', description: 'Quantity', optional: true }
  }
}, async ({ productId, quantity = 1 }) => {
  await addToCart(productId, quantity)
  await vowel.notifyEvent(`Added ${quantity} item(s) to cart`)
  return { success: true }
})

// View product details
vowel.registerAction('viewProduct', {
  description: 'View details of a specific product',
  parameters: {
    productId: { type: 'string', description: 'Product ID' }
  }
}, async ({ productId }) => {
  await vowel.navigate(`/product/${productId}`)
  return { success: true }
})
```

```tsx
// App.tsx
import { RouterProvider } from '@tanstack/react-router'
import { VowelProvider, VowelAgent } from '@vowel.to/client/react'
import { router } from './router'
import { vowel } from './vowel.client'

function App() {
  return (
    <VowelProvider client={vowel}>
      <RouterProvider router={router} />
      <VowelAgent position="bottom-right" />
    </VowelProvider>
  )
}

export default App
```

## Voice Commands

With this setup, users can:

- **Navigate**: "Go to products", "Show me the cart", "Navigate to home"
- **Search**: "Search for wireless headphones"
- **Actions**: "Add product 123 to cart", "View product details for item 456"
- **Automation**: "Click the buy now button", "Type 'laptop' in search"

## Advanced Configuration

### Custom Voice Settings

```typescript
export const vowel = new Vowel({
  appId: 'your-app-id',
  navigationAdapter,
  automationAdapter,
  voiceConfig: {
    model: 'gemini-live-2.5-flash-preview',
    voice: 'Aoede',  // Try different voices
    language: 'en-US'
  },
  systemInstructionOverride: `You are a shopping assistant. Help users find products, 
    add items to their cart, and navigate the store.`
})
```

### Speaking State Tracking

```typescript
export const vowel = new Vowel({
  appId: 'your-app-id',
  navigationAdapter,
  automationAdapter,
  onUserSpeakingChange: (isSpeaking) => {
    console.log(isSpeaking ? 'User is speaking' : 'User stopped')
  },
  onAISpeakingChange: (isSpeaking) => {
    console.log(isSpeaking ? 'AI is speaking' : 'AI stopped')
  },
  onAIThinkingChange: (isThinking) => {
    console.log(isThinking ? 'AI is thinking' : 'AI done thinking')
  }
})
```

## TypeScript Support

Full TypeScript support with type inference:

```typescript
import type { Vowel } from '@vowel.to/client'
import { createTanStackAdapters } from '@vowel.to/client'

const { navigationAdapter, automationAdapter } = createTanStackAdapters({
  router,  // TypeScript knows the router type
  enableAutomation: true
})
```

## Related

- [React Integration](./react) - React components and hooks
- [React Router](./react-router) - React Router integration
- [Custom Actions](../recipes/custom-actions) - Creating custom voice commands
- [Page Automation](../recipes/page-automation) - Voice-controlled page interaction
- [API Reference](/api/index/functions/createTanStackAdapters) - TanStack Router adapter API

