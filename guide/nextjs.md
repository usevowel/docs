# Next.js Integration

Learn how to integrate Vowel with Next.js for voice-controlled navigation and page interaction.

## Overview

Vowel provides dedicated helpers for Next.js:

- **createNextJSAdapters** - Creates navigation and automation adapters for Next.js
- Support for both App Router and Pages Router
- Automatic route detection
- Server and client component compatibility

## Installation

```bash
npm install @vowel.to/client
```

## App Router (Next.js 13+)

### Quick Start

```tsx
// app/providers.tsx
'use client';

import { VowelProvider, VowelAgent } from '@vowel.to/client/react';
import { Vowel, createNextJSAdapters } from '@vowel.to/client';
import { useRouter } from 'next/navigation';

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Create adapters
  const { navigationAdapter, automationAdapter } = createNextJSAdapters(router, {
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

  return (
    <VowelProvider client={vowel}>
      {children}
      <VowelAgent position="bottom-right" />
    </VowelProvider>
  );
}
```

```tsx
// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Configuration

```typescript
interface NextJSAdaptersOptions {
  routes: VowelRoute[];
  enableAutomation?: boolean;
}

const { navigationAdapter, automationAdapter } = createNextJSAdapters(
  router,  // Next.js router from useRouter()
  {
    routes,          // Your route definitions
    enableAutomation // Enable page automation (default: false)
  }
);
```

### Route Definitions

```typescript
const routes: VowelRoute[] = [
  { path: '/', description: 'Home page' },
  { path: '/products', description: 'Browse all products' },
  { path: '/products/[category]', description: 'Browse products by category' },
  { path: '/product/[id]', description: 'View product details' },
  { path: '/cart', description: 'Shopping cart' },
  { path: '/checkout', description: 'Checkout' },
  { path: '/account', description: 'User account' }
];
```

## Pages Router (Next.js 12 and below)

### Quick Start

```tsx
// pages/_app.tsx
import { VowelProvider, VowelAgent } from '@vowel.to/client/react';
import { Vowel, createNextJSAdapters } from '@vowel.to/client';
import { useRouter } from 'next/router';
import type { AppProps } from 'next/app';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Create adapters
  const { navigationAdapter, automationAdapter } = createNextJSAdapters(router, {
    routes: [
      { path: '/', description: 'Home page' },
      { path: '/products', description: 'Browse products' },
      { path: '/cart', description: 'Shopping cart' }
    ],
    enableAutomation: true
  });

  // Create client
  const vowel = new Vowel({
    appId: 'your-app-id',
    navigationAdapter,
    automationAdapter
  });

  return (
    <VowelProvider client={vowel}>
      <Component {...pageProps} />
      <VowelAgent position="bottom-right" />
    </VowelProvider>
  );
}

export default MyApp;
```

## Complete Example

```tsx
// app/providers.tsx
'use client';

import { VowelProvider, VowelAgent, useVowel } from '@vowel.to/client/react';
import { Vowel, createNextJSAdapters } from '@vowel.to/client';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

function VowelSetup({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Create adapters
  const { navigationAdapter, automationAdapter } = createNextJSAdapters(router, {
    routes: [
      { path: '/', description: 'Home page' },
      { path: '/products', description: 'Browse products' },
      { path: '/products/[category]', description: 'Browse category' },
      { path: '/product/[id]', description: 'Product details' },
      { path: '/cart', description: 'Shopping cart' },
      { path: '/checkout', description: 'Checkout' },
      { path: '/account', description: 'Account settings' }
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
    router.push(`/products?q=${encodeURIComponent(query)}`);
    return { success: true };
  });

  vowel.registerAction('addToCart', {
    description: 'Add product to cart',
    parameters: {
      productId: { type: 'string', description: 'Product ID' }
    }
  }, async ({ productId }) => {
    await addToCart(productId);
    return { success: true, message: 'Added to cart' };
  });

  return (
    <VowelProvider client={vowel}>
      {children}
      <VowelAgent position="bottom-right" />
    </VowelProvider>
  );
}

// Route change notifier
function RouteNotifier() {
  const { client } = useVowel();
  const pathname = usePathname();

  useEffect(() => {
    const routeNames: Record<string, string> = {
      '/': 'Home',
      '/products': 'Products',
      '/cart': 'Cart',
      '/checkout': 'Checkout'
    };

    const name = routeNames[pathname];
    if (name) {
      client.notifyEvent(`Navigated to ${name}`);
    }
  }, [pathname, client]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <VowelSetup>
      <RouteNotifier />
      {children}
    </VowelSetup>
  );
}
```

## Dynamic Routes

Handle Next.js dynamic routes:

```tsx
const routes: VowelRoute[] = [
  { path: '/product/[id]', description: 'View product details' },
  { path: '/category/[slug]', description: 'Browse category' },
  { path: '/blog/[...slug]', description: 'Blog post' }
];

// Register action for dynamic navigation
vowel.registerAction('viewProduct', {
  description: 'View a specific product',
  parameters: {
    productId: { type: 'string', description: 'Product ID' }
  }
}, async ({ productId }) => {
  router.push(`/product/${productId}`);
  return { success: true };
});
```

## Search Parameters

Handle query parameters:

```tsx
vowel.registerAction('filterProducts', {
  description: 'Filter products',
  parameters: {
    category: { type: 'string', description: 'Category' },
    minPrice: { type: 'number', description: 'Minimum price' },
    maxPrice: { type: 'number', description: 'Maximum price' }
  }
}, async ({ category, minPrice, maxPrice }) => {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (minPrice) params.set('min', minPrice.toString());
  if (maxPrice) params.set('max', maxPrice.toString());
  
  router.push(`/products?${params.toString()}`);
  return { success: true };
});
```

## Server Components

Vowel works with Next.js server components by using client components for voice functionality:

```tsx
// app/page.tsx (Server Component)
import { ProductList } from './components/ProductList';

export default async function Home() {
  const products = await fetchProducts();

  return (
    <main>
      <h1>Products</h1>
      <ProductList products={products} />
    </main>
  );
}
```

```tsx
// app/components/ProductList.tsx (Client Component)
'use client';

import { useVowel } from '@vowel.to/client/react';

export function ProductList({ products }: { products: Product[] }) {
  const { client } = useVowel();

  const handleAddToCart = async (productId: string) => {
    await addToCart(productId);
    await client.notifyEvent('Added to cart');
  };

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <button onClick={() => handleAddToCart(product.id)}>
            Add to Cart
          </button>
        </div>
      ))}
    </div>
  );
}
```

## API Routes Integration

Trigger voice notifications from API routes:

```tsx
// app/api/order/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const order = await request.json();
  
  // Process order
  const result = await processOrder(order);
  
  // Return success with notification data
  return NextResponse.json({
    success: true,
    order: result,
    notification: {
      message: 'Order placed successfully!',
      context: {
        orderId: result.id,
        total: result.total
      }
    }
  });
}
```

```tsx
// Client component
async function handleCheckout() {
  const response = await fetch('/api/order', {
    method: 'POST',
    body: JSON.stringify(orderData)
  });
  
  const data = await response.json();
  
  if (data.notification) {
    await client.notifyEvent(
      data.notification.message,
      data.notification.context
    );
  }
}
```

## Middleware Integration

Use Next.js middleware with Vowel:

```tsx
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check authentication
  const isAuthenticated = request.cookies.get('auth');
  
  if (!isAuthenticated && request.nextUrl.pathname.startsWith('/account')) {
    // Redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}
```

## Environment Variables

Store your Vowel app ID securely:

```bash
# .env.local
NEXT_PUBLIC_VOWEL_APP_ID=your-app-id
```

```tsx
const vowel = new Vowel({
  appId: process.env.NEXT_PUBLIC_VOWEL_APP_ID!,
  navigationAdapter,
  automationAdapter
});
```

## Best Practices

1. **Use Client Components** - Vowel requires client-side JavaScript
2. **Environment Variables** - Store app ID in environment variables
3. **Route Descriptions** - Provide clear descriptions for all routes
4. **Dynamic Routes** - Register actions for dynamic route navigation
5. **Server Components** - Keep voice logic in client components
6. **Error Boundaries** - Wrap Vowel components in error boundaries
7. **Loading States** - Handle loading states during navigation

## Troubleshooting

### "useRouter must be used in a Client Component"

Make sure your Vowel setup is in a client component:

```tsx
'use client';  // Add this at the top

import { useRouter } from 'next/navigation';
```

### Hydration Errors

Avoid using Vowel state during SSR:

```tsx
function MyComponent() {
  const { state } = useVowel();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <div>{state.isConnected && 'Connected'}</div>;
}
```

## Related

- [React](./react) - React integration guide
- [React Router](./react-router) - React Router integration
- [Adapters](./adapters) - Navigation adapter details
- [API Reference](/api/) - Complete API documentation

