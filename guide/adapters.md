# Adapters

Learn about Vowel's dual adapter architecture for navigation and page automation.

## Overview

Vowel uses two independent, optional adapters:

1. **Navigation Adapter** - Controls WHERE to go (routing)
2. **Automation Adapter** - Controls WHAT to do (page interaction)

This separation allows you to use just navigation, just automation, or both together.

## Navigation Adapter

The Navigation Adapter handles voice-controlled routing in your application.

### Direct Navigation (SPAs)

For Single Page Applications that don't reload the page:

```typescript
import { DirectNavigationAdapter } from '@vowel.to/client';

const navigationAdapter = new DirectNavigationAdapter({
  navigate: (path) => router.push(path),
  getCurrentPath: () => window.location.pathname,
  routes: [
    { path: '/', description: 'Home page' },
    { path: '/products', description: 'Browse products' },
    { path: '/cart', description: 'Shopping cart' }
  ]
});
```

### Controlled Navigation (Traditional Sites)

For traditional sites with page reloads (Shopify, WordPress, etc.):

```typescript
import { ControlledNavigationAdapter } from '@vowel.to/client';

// In voice agent tab
const navigationAdapter = new ControlledNavigationAdapter({
  channelName: 'vowel-nav'
});

// In content tab
const channel = new BroadcastChannel('vowel-nav');
channel.onmessage = (event) => {
  if (event.data.type === 'navigate') {
    window.location.href = event.data.url;
  }
};
```

## Automation Adapter

The Automation Adapter handles voice-controlled page interaction.

### Direct Automation (SPAs)

For same-tab DOM manipulation:

```typescript
import { DirectAutomationAdapter } from '@vowel.to/client';

const automationAdapter = new DirectAutomationAdapter();

// The AI can now:
// - Search for elements: "Find the add to cart button"
// - Click elements: "Click the search button"
// - Type into inputs: "Type 'wireless headphones' in the search box"
// - Focus elements: "Focus on the email input"
// - Scroll to elements: "Scroll to the footer"
// - Press keys: "Press Enter"
```

### Controlled Automation (Traditional Sites)

For cross-tab DOM manipulation:

```typescript
import { ControlledAutomationAdapter } from '@vowel.to/client';

// In voice agent tab
const automationAdapter = new ControlledAutomationAdapter('vowel-automation');

// In content tab - handled automatically by Vowel
```

## Helper Functions

Vowel provides helper functions for common setups:

### createDirectAdapters

For SPAs (React, Vue, Next.js, etc.):

```typescript
import { createDirectAdapters } from '@vowel.to/client';

const { navigationAdapter, automationAdapter } = createDirectAdapters({
  navigate: (path) => router.push(path),
  routes: [/* your routes */],
  enableAutomation: true
});
```

### createNextJSAdapters

For Next.js applications:

```typescript
import { createNextJSAdapters } from '@vowel.to/client';
import { useRouter } from 'next/navigation';

const router = useRouter();
const { navigationAdapter, automationAdapter } = createNextJSAdapters(router, {
  routes: [/* your routes */],
  enableAutomation: true
});
```

### createReactRouterAdapters

For React Router applications:

```typescript
import { createReactRouterAdapters } from '@vowel.to/client';
import { useNavigate, useLocation } from 'react-router-dom';

const navigate = useNavigate();
const location = useLocation();

const { navigationAdapter, automationAdapter } = createReactRouterAdapters({
  navigate,
  location,
  routes: [/* your routes */],
  enableAutomation: true
});
```

### createVueRouterAdapters

For Vue Router applications:

```typescript
import { createVueRouterAdapters } from '@vowel.to/client';
import { useRouter } from 'vue-router';

const router = useRouter();
const { navigationAdapter, automationAdapter } = createVueRouterAdapters(router, {
  routes: [/* your routes */],
  enableAutomation: true
});
```

### createTanStackAdapters

For TanStack Router (auto-detects routes):

```typescript
import { createTanStackAdapters } from '@vowel.to/client';
import { router } from './router';

const { navigationAdapter, automationAdapter } = createTanStackAdapters(router, {
  enableAutomation: true
});
```

### createControlledAdapters

For traditional sites (Shopify, WordPress):

```typescript
import { createControlledAdapters } from '@vowel.to/client';

const { navigationAdapter, automationAdapter } = createControlledAdapters({
  navigationChannel: 'vowel-nav',
  automationChannel: 'vowel-automation'
});
```

## Built-in Actions

When you provide adapters, Vowel automatically registers these actions:

### From NavigationAdapter

- `navigate_to_page` - Navigate to any route

### From AutomationAdapter

- `search_page_elements` - Search for elements on the page
- `get_page_snapshot` - Get page structure snapshot
- `click_element` - Click any element
- `type_into_element` - Type into inputs
- `focus_element` - Focus an element
- `scroll_to_element` - Scroll to an element
- `press_key` - Press keyboard keys

These work automatically - no configuration needed!

## Adapter Interface

### NavigationAdapter Interface

```typescript
interface NavigationAdapter {
  navigate(path: string): Promise<void>;
  getCurrentPath(): string;
  getRoutes?(): Promise<VowelRoute[]>;
  getContext?(): any;
}
```

### AutomationAdapter Interface

```typescript
interface AutomationAdapter {
  searchElements(query: string, options?: SearchOptions): Promise<SearchResults>;
  getPageSnapshot(): Promise<string>;
  clickElement(id: string): Promise<ActionResult>;
  typeIntoElement(id: string, text: string): Promise<ActionResult>;
  focusElement(id: string): Promise<ActionResult>;
  scrollToElement(id: string): Promise<ActionResult>;
  pressKey(key: string): Promise<ActionResult>;
  clearStore?(): void;
}
```

## Custom Adapters

You can create custom adapters by implementing these interfaces:

```typescript
class MyCustomNavigationAdapter implements NavigationAdapter {
  async navigate(path: string): Promise<void> {
    // Your custom navigation logic
  }
  
  getCurrentPath(): string {
    // Return current path
  }
  
  async getRoutes(): Promise<VowelRoute[]> {
    // Return available routes
  }
}
```

## Related

- [Vowel Client](./vowel-client) - Core client API
- [Actions](./actions) - Custom action registration
- [Navigation Recipe](../recipes/navigation) - Navigation patterns
- [Page Automation Recipe](../recipes/page-automation) - Automation patterns

