# Vue Router Integration

Learn how to integrate Vowel with Vue Router for voice-controlled navigation in your Vue applications.

## Overview

Vowel provides dedicated helpers for Vue Router:

- **createVueRouterAdapters** - Creates navigation and automation adapters for Vue Router
- Automatic route detection from Vue Router
- Support for Vue 3 Composition API

## Installation

```bash
npm install @vowel.to/client vue-router
```

## Quick Start

```typescript
// vowel.ts
import { Vowel, createVueRouterAdapters } from '@vowel.to/client';
import { useRouter } from 'vue-router';

export function createVowelClient() {
  const router = useRouter();

  // Create adapters
  const { navigationAdapter, automationAdapter } = createVueRouterAdapters(router, {
    routes: [
      { path: '/', description: 'Home page' },
      { path: '/products', description: 'Browse products' },
      { path: '/cart', description: 'Shopping cart' },
      { path: '/checkout', description: 'Checkout' }
    ],
    enableAutomation: true
  });

  // Create client
  const vowel = new Vowel({
    appId: 'your-app-id',
    navigationAdapter,
    automationAdapter
  });

  return vowel;
}
```

```vue
<!-- App.vue -->
<script setup lang="ts">
import { provide, onMounted, onUnmounted } from 'vue';
import { createVowelClient } from './vowel';

const vowel = createVowelClient();

// Provide to child components
provide('vowel', vowel);

onMounted(async () => {
  await vowel.startSession();
});

onUnmounted(async () => {
  await vowel.stopSession();
});
</script>

<template>
  <div id="app">
    <router-view />
  </div>
</template>
```

## Configuration

```typescript
interface VueRouterAdaptersOptions {
  routes: VowelRoute[];
  enableAutomation?: boolean;
}

const { navigationAdapter, automationAdapter } = createVueRouterAdapters(
  router,  // Vue Router instance
  {
    routes,          // Your route definitions
    enableAutomation // Enable page automation (default: false)
  }
);
```

## Route Definitions

```typescript
const routes: VowelRoute[] = [
  { path: '/', description: 'Home page' },
  { path: '/products', description: 'Browse all products' },
  { path: '/products/:category', description: 'Browse products by category' },
  { path: '/product/:id', description: 'View product details' },
  { path: '/cart', description: 'Shopping cart' },
  { path: '/checkout', description: 'Checkout' },
  { path: '/account', description: 'User account' }
];
```

## Complete Example

```typescript
// vowel.ts
import { Vowel, createVueRouterAdapters } from '@vowel.to/client';
import type { Router } from 'vue-router';

export function setupVowel(router: Router) {
  // Create adapters
  const { navigationAdapter, automationAdapter } = createVueRouterAdapters(router, {
    routes: [
      { path: '/', description: 'Home page' },
      { path: '/products', description: 'Browse products' },
      { path: '/products/:category', description: 'Browse category' },
      { path: '/product/:id', description: 'Product details' },
      { path: '/cart', description: 'Shopping cart' },
      { path: '/checkout', description: 'Checkout' }
    ],
    enableAutomation: true
  });

  // Create client
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
    await router.push(`/products?q=${encodeURIComponent(query)}`);
    return { success: true };
  });

  vowel.registerAction('addToCart', {
    description: 'Add product to cart',
    parameters: {
      productId: { type: 'string', description: 'Product ID' }
    }
  }, async ({ productId }) => {
    // Your cart logic
    return { success: true, message: 'Added to cart' };
  });

  return vowel;
}
```

```vue
<!-- App.vue -->
<script setup lang="ts">
import { provide, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { setupVowel } from './vowel';

const router = useRouter();
const vowel = setupVowel(router);
const isConnected = ref(false);

// Provide to child components
provide('vowel', vowel);

// Subscribe to state changes
const unsubscribe = vowel.onStateChange((state) => {
  isConnected.value = state.isConnected;
});

onMounted(async () => {
  await vowel.startSession();
});

onUnmounted(async () => {
  await vowel.stopSession();
  unsubscribe();
});
</script>

<template>
  <div id="app">
    <header>
      <h1>My Store</h1>
      <div v-if="isConnected" class="voice-status">
        Voice: Connected
      </div>
    </header>
    
    <router-view />
  </div>
</template>
```

## Composable

Create a composable for easy access:

```typescript
// composables/useVowel.ts
import { inject } from 'vue';
import type { Vowel } from '@vowel.to/client';

export function useVowel() {
  const vowel = inject<Vowel>('vowel');
  
  if (!vowel) {
    throw new Error('Vowel not provided. Make sure to provide it in App.vue');
  }
  
  return vowel;
}
```

```vue
<!-- ProductCard.vue -->
<script setup lang="ts">
import { useVowel } from '@/composables/useVowel';

const props = defineProps<{
  product: Product;
}>();

const vowel = useVowel();

async function handleAddToCart() {
  // Add to cart logic
  await addToCart(props.product.id);
  
  // Voice notification
  await vowel.notifyEvent('Added to cart', {
    productName: props.product.name
  });
}
</script>

<template>
  <div class="product-card">
    <h3>{{ product.name }}</h3>
    <button @click="handleAddToCart">Add to Cart</button>
  </div>
</template>
```

## Dynamic Routes

Handle Vue Router dynamic routes:

```typescript
const routes: VowelRoute[] = [
  { path: '/product/:id', description: 'View product details' },
  { path: '/category/:slug', description: 'Browse category' },
  { path: '/user/:username', description: 'User profile' }
];

// Register action for dynamic navigation
vowel.registerAction('viewProduct', {
  description: 'View a specific product',
  parameters: {
    productId: { type: 'string', description: 'Product ID' }
  }
}, async ({ productId }) => {
  await router.push({ name: 'product', params: { id: productId } });
  return { success: true };
});
```

## Query Parameters

Handle query parameters:

```typescript
vowel.registerAction('filterProducts', {
  description: 'Filter products',
  parameters: {
    category: { type: 'string', description: 'Category' },
    minPrice: { type: 'number', description: 'Minimum price' },
    maxPrice: { type: 'number', description: 'Maximum price' }
  }
}, async ({ category, minPrice, maxPrice }) => {
  await router.push({
    path: '/products',
    query: {
      category,
      min: minPrice?.toString(),
      max: maxPrice?.toString()
    }
  });
  return { success: true };
});
```

## Navigation Guards

Integrate with Vue Router navigation guards:

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [/* your routes */]
});

// Global before guard
router.beforeEach((to, from, next) => {
  // Check authentication
  if (to.meta.requiresAuth && !isAuthenticated()) {
    // Notify via voice
    vowel.notifyEvent('Please sign in to continue');
    next('/login');
  } else {
    next();
  }
});

// Global after hook
router.afterEach((to) => {
  // Notify of navigation
  if (to.meta.title) {
    vowel.notifyEvent(`Navigated to ${to.meta.title}`);
  }
});

export default router;
```

## State Management (Pinia)

Integrate with Pinia for state management:

```typescript
// stores/cart.ts
import { defineStore } from 'pinia';
import { useVowel } from '@/composables/useVowel';

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[]
  }),
  
  actions: {
    async addToCart(product: Product) {
      this.items.push(product);
      
      // Voice notification
      const vowel = useVowel();
      await vowel.notifyEvent('Added to cart', {
        productName: product.name,
        cartTotal: this.items.length
      });
    }
  }
});
```

## Route Change Notifications

Notify users of navigation:

```vue
<script setup lang="ts">
import { watch } from 'vue';
import { useRoute } from 'vue-router';
import { useVowel } from '@/composables/useVowel';

const route = useRoute();
const vowel = useVowel();

const routeNames: Record<string, string> = {
  '/': 'Home',
  '/products': 'Products',
  '/cart': 'Cart',
  '/checkout': 'Checkout'
};

watch(() => route.path, (newPath) => {
  const name = routeNames[newPath];
  if (name) {
    vowel.notifyEvent(`Navigated to ${name}`);
  }
});
</script>
```

## TypeScript Support

Full TypeScript support:

```typescript
import type { Vowel } from '@vowel.to/client';
import type { Router } from 'vue-router';

// Typed composable
export function useVowel(): Vowel {
  const vowel = inject<Vowel>('vowel');
  if (!vowel) throw new Error('Vowel not provided');
  return vowel;
}

// Typed setup
export function setupVowel(router: Router): Vowel {
  // Implementation
}
```

## Best Practices

1. **Provide/Inject Pattern** - Use Vue's provide/inject for global access
2. **Composables** - Create composables for reusable voice logic
3. **Route Descriptions** - Provide clear descriptions for all routes
4. **Navigation Guards** - Integrate with Vue Router guards
5. **State Management** - Integrate with Pinia or Vuex
6. **Cleanup** - Always cleanup on unmount
7. **TypeScript** - Use TypeScript for type safety

## Related

- [React](./react) - React integration guide
- [Adapters](./adapters) - Navigation adapter details
- [Navigation Recipe](../recipes/navigation) - Advanced navigation patterns
- [API Reference](/api/) - Complete API documentation

