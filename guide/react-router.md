# React Router Integration

Learn how to integrate Vowel with React Router for voice-controlled navigation in your React applications.

## Overview

Vowel provides dedicated helpers for React Router integration:

- **createReactRouterAdapters** - Creates navigation and automation adapters
- **ReactRouterNavigationAdapter** - Direct navigation adapter for React Router
- Automatic route detection from React Router

## Installation

```bash
npm install @vowel.to/client react-router-dom
```

## Quick Start

```tsx
import { VowelProvider, VowelAgent } from '@vowel.to/client/react';
import { Vowel, createReactRouterAdapters } from '@vowel.to/client';
import { useNavigate, useLocation } from 'react-router-dom';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Create adapters
  const { navigationAdapter, automationAdapter } = createReactRouterAdapters({
    navigate,
    location,
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
      <YourRoutes />
      <VowelAgent position="bottom-right" />
    </VowelProvider>
  );
}
```

## Configuration

### createReactRouterAdapters

```typescript
interface ReactRouterAdaptersOptions {
  navigate: NavigateFunction;
  location: Location;
  routes: VowelRoute[];
  enableAutomation?: boolean;
}

const { navigationAdapter, automationAdapter } = createReactRouterAdapters({
  navigate,        // React Router's navigate function
  location,        // React Router's location object
  routes,          // Your route definitions
  enableAutomation // Enable page automation (default: false)
});
```

### Route Definitions

Define routes with descriptions for voice navigation:

```typescript
const routes: VowelRoute[] = [
  { 
    path: '/', 
    description: 'Home page' 
  },
  { 
    path: '/products', 
    description: 'Browse all products' 
  },
  { 
    path: '/products/:category', 
    description: 'Browse products by category' 
  },
  { 
    path: '/product/:id', 
    description: 'View product details' 
  },
  { 
    path: '/cart', 
    description: 'Shopping cart' 
  },
  { 
    path: '/checkout', 
    description: 'Checkout and payment' 
  },
  { 
    path: '/account', 
    description: 'User account settings' 
  }
];
```

## Complete Example

```tsx
// App.tsx
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { VowelProvider, VowelAgent } from '@vowel.to/client/react';
import { Vowel, createReactRouterAdapters } from '@vowel.to/client';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';

function VowelSetup({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Create adapters
  const { navigationAdapter, automationAdapter } = createReactRouterAdapters({
    navigate,
    location,
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

  // Register custom actions
  vowel.registerAction('searchProducts', {
    description: 'Search for products',
    parameters: {
      query: { type: 'string', description: 'Search query' }
    }
  }, async ({ query }) => {
    navigate(`/products?q=${encodeURIComponent(query)}`);
    return { success: true };
  });

  return (
    <VowelProvider client={vowel}>
      {children}
      <VowelAgent position="bottom-right" />
    </VowelProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <VowelSetup>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>
      </VowelSetup>
    </BrowserRouter>
  );
}
```

## Dynamic Routes

Handle dynamic route parameters:

```tsx
const routes: VowelRoute[] = [
  { 
    path: '/product/:id', 
    description: 'View product details' 
  },
  { 
    path: '/category/:category', 
    description: 'Browse products in category' 
  },
  { 
    path: '/user/:username', 
    description: 'View user profile' 
  }
];

// Register action to navigate with parameters
vowel.registerAction('viewProduct', {
  description: 'View a specific product',
  parameters: {
    productId: { type: 'string', description: 'Product ID' }
  }
}, async ({ productId }) => {
  navigate(`/product/${productId}`);
  return { success: true };
});
```

## Search Parameters

Handle query parameters:

```tsx
vowel.registerAction('searchProducts', {
  description: 'Search for products',
  parameters: {
    query: { type: 'string', description: 'Search query' },
    category: { type: 'string', description: 'Category filter' }
  }
}, async ({ query, category }) => {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (category) params.set('category', category);
  
  navigate(`/products?${params.toString()}`);
  return { success: true };
});
```

## Navigation with State

Pass state during navigation:

```tsx
vowel.registerAction('viewProductWithContext', {
  description: 'View product with additional context',
  parameters: {
    productId: { type: 'string', description: 'Product ID' }
  }
}, async ({ productId }) => {
  navigate(`/product/${productId}`, {
    state: { fromVoice: true }
  });
  return { success: true };
});

// In the product page
function ProductPage() {
  const location = useLocation();
  const fromVoice = location.state?.fromVoice;

  useEffect(() => {
    if (fromVoice) {
      // Handle voice navigation
      console.log('Navigated via voice');
    }
  }, [fromVoice]);
}
```

## Programmatic Navigation

Trigger navigation from voice events:

```tsx
function ProductCard({ product }: { product: Product }) {
  const { client } = useVowel();
  const navigate = useNavigate();

  const handleAddToCart = async () => {
    await addToCart(product.id);
    
    // Notify and navigate
    await client.notifyEvent('Added to cart. Would you like to checkout?');
    
    // Navigate after delay
    setTimeout(() => navigate('/cart'), 2000);
  };

  return (
    <div>
      <h3>{product.name}</h3>
      <button onClick={handleAddToCart}>Add to Cart</button>
    </div>
  );
}
```

## Protected Routes

Handle authentication with voice navigation:

```tsx
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { client } = useVowel();
  const navigate = useNavigate();
  const isAuthenticated = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      client.notifyEvent('Please sign in to continue');
      navigate('/login');
    }
  }, [isAuthenticated, navigate, client]);

  return isAuthenticated ? <>{children}</> : null;
}

// Usage
<Route 
  path="/account" 
  element={
    <ProtectedRoute>
      <Account />
    </ProtectedRoute>
  } 
/>
```

## Route Change Notifications

Notify users of navigation:

```tsx
function RouteChangeNotifier() {
  const { client } = useVowel();
  const location = useLocation();

  useEffect(() => {
    const routeNames: Record<string, string> = {
      '/': 'Home',
      '/products': 'Products',
      '/cart': 'Shopping Cart',
      '/checkout': 'Checkout'
    };

    const routeName = routeNames[location.pathname];
    if (routeName) {
      client.notifyEvent(`Navigated to ${routeName}`);
    }
  }, [location.pathname, client]);

  return null;
}

// Add to your app
<VowelProvider client={vowel}>
  <RouteChangeNotifier />
  <Routes>...</Routes>
</VowelProvider>
```

## Nested Routes

Handle nested route structures:

```tsx
const routes: VowelRoute[] = [
  { path: '/dashboard', description: 'Dashboard' },
  { path: '/dashboard/overview', description: 'Dashboard overview' },
  { path: '/dashboard/analytics', description: 'Analytics dashboard' },
  { path: '/dashboard/settings', description: 'Dashboard settings' }
];

// Register action for nested navigation
vowel.registerAction('goToDashboardSection', {
  description: 'Navigate to dashboard section',
  parameters: {
    section: {
      type: 'string',
      description: 'Dashboard section',
      enum: ['overview', 'analytics', 'settings']
    }
  }
}, async ({ section }) => {
  navigate(`/dashboard/${section}`);
  return { success: true };
});
```

## Best Practices

1. **Clear Route Descriptions** - Use descriptive route names for better voice recognition
2. **Handle Parameters** - Register actions for dynamic routes
3. **State Management** - Pass state during navigation when needed
4. **Error Handling** - Handle navigation errors gracefully
5. **Route Notifications** - Optionally notify users of navigation changes
6. **Protected Routes** - Integrate with authentication
7. **Nested Routes** - Organize routes hierarchically

## Related

- [React](./react) - React integration guide
- [Next.js](./nextjs) - Next.js integration
- [Adapters](./adapters) - Navigation adapter details
- [Navigation Recipe](../recipes/navigation) - Advanced navigation patterns

