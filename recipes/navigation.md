# Navigation Control Recipe

Advanced patterns for voice-controlled navigation in your application.

## Overview

This recipe covers advanced navigation patterns, including dynamic routes, protected routes, navigation with state, and cross-tab navigation.

## Dynamic Route Navigation

### Route Parameters

Navigate to routes with dynamic parameters:

```typescript
vowel.registerAction('viewProduct', {
  description: 'View a specific product',
  parameters: {
    productId: {
      type: 'string',
      description: 'Product ID',
      required: true
    }
  }
}, async ({ productId }) => {
  await router.push(`/product/${productId}`);
  
  // Fetch and announce product
  const product = await getProduct(productId);
  await vowel.notifyEvent(`Viewing ${product.name}`);
  
  return { success: true };
});
```

### Category Navigation

```typescript
vowel.registerAction('browseCategory', {
  description: 'Browse products by category',
  parameters: {
    category: {
      type: 'string',
      description: 'Product category',
      enum: ['electronics', 'clothing', 'books', 'home'],
      required: true
    }
  }
}, async ({ category }) => {
  await router.push(`/products/${category}`);
  
  const count = await getProductCount(category);
  await vowel.notifyEvent(
    `Showing ${count} products in ${category}`
  );
  
  return { success: true };
});
```

### Search Navigation

```typescript
vowel.registerAction('searchAndNavigate', {
  description: 'Search and navigate to results',
  parameters: {
    query: {
      type: 'string',
      description: 'Search query',
      required: true
    },
    category: {
      type: 'string',
      description: 'Category filter'
    }
  }
}, async ({ query, category }) => {
  const params = new URLSearchParams({ q: query });
  if (category) params.set('category', category);
  
  await router.push(`/search?${params.toString()}`);
  
  return { success: true };
});
```

## Protected Routes

### Authentication Check

```typescript
vowel.registerAction('goToAccount', {
  description: 'Navigate to account settings',
  parameters: {}
}, async () => {
  const user = getCurrentUser();
  
  if (!user) {
    await vowel.notifyEvent('Please sign in to access your account');
    await router.push('/login');
    return {
      success: false,
      error: 'Authentication required'
    };
  }
  
  await router.push('/account');
  return { success: true };
});
```

### Role-Based Navigation

```typescript
vowel.registerAction('goToAdmin', {
  description: 'Navigate to admin dashboard',
  parameters: {}
}, async () => {
  const user = getCurrentUser();
  
  if (!user) {
    await vowel.notifyEvent('Please sign in');
    await router.push('/login');
    return { success: false, error: 'Authentication required' };
  }
  
  if (!user.roles.includes('admin')) {
    await vowel.notifyEvent('You do not have admin access');
    return { success: false, error: 'Insufficient permissions' };
  }
  
  await router.push('/admin');
  await vowel.notifyEvent('Navigated to admin dashboard');
  return { success: true };
});
```

## Navigation with State

### Passing Context

```typescript
vowel.registerAction('viewProductFromSearch', {
  description: 'View product from search results',
  parameters: {
    productId: { type: 'string', required: true }
  }
}, async ({ productId }) => {
  await router.push(`/product/${productId}`, {
    state: {
      fromSearch: true,
      searchQuery: getCurrentSearchQuery(),
      returnUrl: '/search'
    }
  });
  
  return { success: true };
});

// In product page
function ProductPage() {
  const location = useLocation();
  const state = location.state;
  
  if (state?.fromSearch) {
    // Show back to search button
    // Highlight search terms
  }
}
```

### Breadcrumb Navigation

```typescript
class NavigationHistory {
  private history: string[] = [];
  
  push(path: string) {
    this.history.push(path);
  }
  
  goBack() {
    this.history.pop();
    return this.history[this.history.length - 1];
  }
  
  getCrumbs() {
    return this.history;
  }
}

const navHistory = new NavigationHistory();

vowel.registerAction('goBack', {
  description: 'Go back to previous page',
  parameters: {}
}, async () => {
  const previousPath = navHistory.goBack();
  
  if (previousPath) {
    await router.push(previousPath);
    await vowel.notifyEvent('Navigated back');
    return { success: true };
  }
  
  return {
    success: false,
    error: 'No previous page'
  };
});
```

## Smart Navigation

### Context-Aware Navigation

```typescript
vowel.registerAction('goToCheckout', {
  description: 'Proceed to checkout',
  parameters: {}
}, async () => {
  const cart = await getCart();
  
  // Check if cart is empty
  if (cart.items.length === 0) {
    await vowel.notifyEvent('Your cart is empty. Add some items first.');
    await router.push('/products');
    return { success: false, error: 'Cart is empty' };
  }
  
  // Check authentication
  const user = getCurrentUser();
  if (!user) {
    await vowel.notifyEvent('Please sign in to checkout');
    await router.push('/login?redirect=/checkout');
    return { success: false, error: 'Authentication required' };
  }
  
  // Navigate to checkout
  await router.push('/checkout');
  await vowel.notifyEvent(`Proceeding to checkout with ${cart.items.length} items`);
  
  return { success: true };
});
```

### Conditional Navigation

```typescript
vowel.registerAction('continueToPayment', {
  description: 'Continue to payment',
  parameters: {}
}, async () => {
  const checkout = getCheckoutState();
  
  // Validate shipping address
  if (!checkout.shippingAddress) {
    await vowel.notifyEvent('Please provide a shipping address');
    await router.push('/checkout/shipping');
    return { success: false, error: 'Shipping address required' };
  }
  
  // Validate shipping method
  if (!checkout.shippingMethod) {
    await vowel.notifyEvent('Please select a shipping method');
    await router.push('/checkout/shipping');
    return { success: false, error: 'Shipping method required' };
  }
  
  // Navigate to payment
  await router.push('/checkout/payment');
  await vowel.notifyEvent('Proceeding to payment');
  
  return { success: true };
});
```

## Cross-Tab Navigation

### Controlled Navigation

For traditional sites with page reloads (Shopify, WordPress):

```typescript
// In voice agent tab
import { ControlledNavigationAdapter } from '@vowel.to/client';

const navigationAdapter = new ControlledNavigationAdapter({
  channelName: 'vowel-nav'
});

const vowel = new Vowel({
  appId: 'your-app-id',
  navigationAdapter
});

// In content tabs
const navChannel = new BroadcastChannel('vowel-nav');

navChannel.onmessage = (event) => {
  if (event.data.type === 'navigate') {
    // Optionally show loading indicator
    showLoadingIndicator();
    
    // Navigate
    window.location.href = event.data.url;
  }
};
```

### Cross-Tab State Sync

```typescript
// Sync navigation state across tabs
const stateChannel = new BroadcastChannel('vowel-state');

// Send navigation event
router.afterEach((to) => {
  stateChannel.postMessage({
    type: 'navigation',
    path: to.path,
    timestamp: Date.now()
  });
});

// Receive in other tabs
stateChannel.onmessage = (event) => {
  if (event.data.type === 'navigation') {
    console.log('Navigation in another tab:', event.data.path);
    // Update UI accordingly
  }
};
```

## Navigation Notifications

### Route Change Announcements

```typescript
// Announce navigation
router.afterEach((to) => {
  const routeNames: Record<string, string> = {
    '/': 'Home',
    '/products': 'Products',
    '/cart': 'Shopping Cart',
    '/checkout': 'Checkout'
  };
  
  const name = routeNames[to.path];
  if (name) {
    vowel.notifyEvent(`Navigated to ${name}`);
  }
});
```

### Loading States

```typescript
vowel.registerAction('navigateWithLoading', {
  description: 'Navigate to page',
  parameters: {
    path: { type: 'string', required: true }
  }
}, async ({ path }) => {
  // Announce navigation start
  await vowel.notifyEvent('Loading page...');
  
  // Navigate
  await router.push(path);
  
  // Wait for page load
  await waitForPageLoad();
  
  // Announce completion
  await vowel.notifyEvent('Page loaded');
  
  return { success: true };
});

function waitForPageLoad(): Promise<void> {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      window.addEventListener('load', () => resolve(), { once: true });
    }
  });
}
```

## Multi-Step Navigation

### Wizard Navigation

```typescript
class CheckoutWizard {
  private steps = ['cart', 'shipping', 'payment', 'review'];
  private currentStep = 0;
  
  async next() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      const step = this.steps[this.currentStep];
      await router.push(`/checkout/${step}`);
      await vowel.notifyEvent(`Step ${this.currentStep + 1}: ${step}`);
      return true;
    }
    return false;
  }
  
  async previous() {
    if (this.currentStep > 0) {
      this.currentStep--;
      const step = this.steps[this.currentStep];
      await router.push(`/checkout/${step}`);
      await vowel.notifyEvent(`Back to ${step}`);
      return true;
    }
    return false;
  }
  
  getCurrentStep() {
    return this.steps[this.currentStep];
  }
}

const wizard = new CheckoutWizard();

vowel.registerAction('nextCheckoutStep', {
  description: 'Continue to next checkout step',
  parameters: {}
}, async () => {
  const success = await wizard.next();
  return {
    success,
    message: success ? 'Moved to next step' : 'Already at last step'
  };
});

vowel.registerAction('previousCheckoutStep', {
  description: 'Go back to previous checkout step',
  parameters: {}
}, async () => {
  const success = await wizard.previous();
  return {
    success,
    message: success ? 'Moved to previous step' : 'Already at first step'
  };
});
```

## Deep Linking

### URL State Management

```typescript
vowel.registerAction('filterAndNavigate', {
  description: 'Filter products and navigate',
  parameters: {
    category: { type: 'string' },
    minPrice: { type: 'number' },
    maxPrice: { type: 'number' },
    sortBy: { type: 'string', enum: ['price', 'name', 'rating'] }
  }
}, async (params) => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.set(key, value.toString());
    }
  });
  
  await router.push(`/products?${searchParams.toString()}`);
  
  return { success: true };
});
```

### Shareable URLs

```typescript
vowel.registerAction('shareCurrentPage', {
  description: 'Share current page',
  parameters: {}
}, async () => {
  const url = window.location.href;
  
  // Copy to clipboard
  await navigator.clipboard.writeText(url);
  
  await vowel.notifyEvent('Page URL copied to clipboard');
  
  return {
    success: true,
    data: { url }
  };
});
```

## Best Practices

1. **Clear Descriptions** - Provide clear route descriptions
2. **Validate State** - Check prerequisites before navigation
3. **Handle Errors** - Gracefully handle navigation failures
4. **Provide Feedback** - Announce navigation changes
5. **Context Awareness** - Consider user state and permissions
6. **Loading States** - Show feedback during navigation
7. **Deep Linking** - Support URL parameters for shareable links
8. **Breadcrumbs** - Maintain navigation history
9. **Protected Routes** - Enforce authentication and authorization
10. **Cross-Tab Sync** - Coordinate navigation across tabs

## Related

- [Adapters Guide](../guide/adapters) - Navigation adapter details
- [React Router](../guide/react-router) - React Router integration
- [Next.js](../guide/nextjs) - Next.js integration
- [API Reference](/api/) - Complete API documentation

