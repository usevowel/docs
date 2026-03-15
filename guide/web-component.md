# Web Component Integration

Learn how to use Vowel as a web component for framework-agnostic integration.

## Overview

Vowel provides pre-built web components that work in any framework or vanilla JavaScript:

- **`<vowel-agent>`** - Complete voice agent UI
- **`<vowel-microphone>`** - Standalone microphone button
- **`<vowel-floating-cursor>`** - Visual automation feedback
- **`<controlled-by-vowel-frame>`** - Banner for controlled sites

## Installation

```bash
npm install @vowel.to/client
```

## Quick Start

### Register Components

```typescript
import { registerAllVowelWebComponents } from '@vowel.to/client';

// Register all web components
registerAllVowelWebComponents();
```

Or register individually:

```typescript
import { 
  registerFloatingMicButtonWebComponent,
  registerFloatingCursorWebComponent,
  registerControlledBannerWebComponent
} from '@vowel.to/client';

registerFloatingMicButtonWebComponent();
registerFloatingCursorWebComponent();
registerControlledBannerWebComponent();
```

### Use in HTML

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body>
  <h1>Welcome</h1>
  
  <!-- Vowel Agent -->
  <vowel-agent 
    app-id="your-app-id"
    position="bottom-right">
  </vowel-agent>

  <script type="module">
    import { registerAllVowelWebComponents, Vowel } from '@vowel.to/client';
    
    // Register components
    registerAllVowelWebComponents();
    
    // Create and configure client
    const vowel = new Vowel({
      appId: 'your-app-id'
    });
    
    // Make available globally
    window.vowel = vowel;
  </script>
</body>
</html>
```

## Web Components

### `<vowel-microphone>`

Floating microphone button for voice interaction.

```html
<vowel-microphone
  position="bottom-right"
  size="medium"
  auto-start="false">
</vowel-microphone>
```

**Attributes:**
- `position` - `bottom-right | bottom-left | top-right | top-left` (default: `bottom-right`)
- `size` - `small | medium | large` (default: `medium`)
- `auto-start` - Auto-start session on load (default: `false`)

**JavaScript API:**

```javascript
const mic = document.querySelector('vowel-microphone');

// Start session
await mic.startSession();

// Stop session
await mic.stopSession();

// Check state
console.log(mic.isConnected);
console.log(mic.isListening);
```

### `<vowel-floating-cursor>`

Visual feedback for page automation.

```html
<vowel-floating-cursor></vowel-floating-cursor>
```

**JavaScript API:**

```javascript
const cursor = document.querySelector('vowel-floating-cursor');

// Show cursor at position
cursor.show({ x: 100, y: 100 });

// Hide cursor
cursor.hide();

// Move cursor
cursor.moveTo({ x: 200, y: 200 });
```

### `<controlled-by-vowel-frame>`

Banner for controlled/cross-tab sites (Shopify, WordPress).

```html
<controlled-by-vowel-frame
  channel-name="vowel-automation">
</controlled-by-vowel-frame>
```

**Attributes:**
- `channel-name` - BroadcastChannel name (default: `vowel-automation`)

## Framework Integration

### Vanilla JavaScript

```html
<!DOCTYPE html>
<html>
<head>
  <title>Vowel Demo</title>
</head>
<body>
  <h1>My Store</h1>
  <div id="products"></div>
  
  <vowel-microphone position="bottom-right"></vowel-microphone>

  <script type="module">
    import { 
      registerAllVowelWebComponents,
      Vowel,
      createDirectAdapters
    } from '@vowel.to/client';
    
    // Register components
    registerAllVowelWebComponents();
    
    // Create adapters
    const { navigationAdapter, automationAdapter } = createDirectAdapters({
      navigate: (path) => {
        window.location.href = path;
      },
      routes: [
        { path: '/', description: 'Home' },
        { path: '/products', description: 'Products' },
        { path: '/cart', description: 'Cart' }
      ],
      enableAutomation: true
    });
    
    // Create client
    const vowel = new Vowel({
      appId: 'your-app-id',
      navigationAdapter,
      automationAdapter
    });
    
    // Register actions
    vowel.registerAction('searchProducts', {
      description: 'Search for products',
      parameters: {
        query: { type: 'string', description: 'Search query' }
      }
    }, async ({ query }) => {
      // Search logic
      return { success: true };
    });
    
    // Start session
    await vowel.startSession();
  </script>
</body>
</html>
```

### React

```tsx
import { useEffect, useRef } from 'react';
import { registerAllVowelWebComponents } from '@vowel.to/client';

// Register once
registerAllVowelWebComponents();

function App() {
  return (
    <div>
      <h1>My App</h1>
      {/* Use web component in React */}
      <vowel-microphone position="bottom-right" />
    </div>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import { onMounted } from 'vue';
import { registerAllVowelWebComponents } from '@vowel.to/client';

onMounted(() => {
  registerAllVowelWebComponents();
});
</script>

<template>
  <div>
    <h1>My App</h1>
    <!-- Use web component in Vue -->
    <vowel-microphone position="bottom-right" />
  </div>
</template>
```

### Angular

```typescript
// app.component.ts
import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { registerAllVowelWebComponents } from '@vowel.to/client';

@Component({
  selector: 'app-root',
  template: `
    <h1>My App</h1>
    <vowel-microphone position="bottom-right"></vowel-microphone>
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppComponent implements OnInit {
  ngOnInit() {
    registerAllVowelWebComponents();
  }
}
```

### Svelte

```svelte
<script>
  import { onMount } from 'svelte';
  import { registerAllVowelWebComponents } from '@vowel.to/client';
  
  onMount(() => {
    registerAllVowelWebComponents();
  });
</script>

<h1>My App</h1>
<vowel-microphone position="bottom-right" />
```

## Controlled Sites (Shopify, WordPress)

For traditional sites with page reloads:

### Voice Agent Tab

```html
<!-- voice-agent.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Voice Agent</title>
</head>
<body>
  <h1>Voice Agent</h1>
  <vowel-microphone position="center"></vowel-microphone>

  <script type="module">
    import { 
      registerAllVowelWebComponents,
      Vowel,
      createControlledAdapters
    } from '@vowel.to/client';
    
    registerAllVowelWebComponents();
    
    // Create controlled adapters
    const { navigationAdapter, automationAdapter } = createControlledAdapters({
      navigationChannel: 'vowel-nav',
      automationChannel: 'vowel-automation'
    });
    
    // Create client
    const vowel = new Vowel({
      appId: 'your-app-id',
      navigationAdapter,
      automationAdapter
    });
    
    await vowel.startSession();
  </script>
</body>
</html>
```

### Content Tab

```html
<!-- Your regular pages -->
<!DOCTYPE html>
<html>
<head>
  <title>My Store</title>
</head>
<body>
  <h1>Products</h1>
  
  <!-- Banner showing voice control is active -->
  <controlled-by-vowel-frame 
    channel-name="vowel-automation">
  </controlled-by-vowel-frame>

  <script type="module">
    import { registerControlledBannerWebComponent } from '@vowel.to/client';
    
    registerControlledBannerWebComponent();
    
    // Listen for navigation commands
    const navChannel = new BroadcastChannel('vowel-nav');
    navChannel.onmessage = (event) => {
      if (event.data.type === 'navigate') {
        window.location.href = event.data.url;
      }
    };
  </script>
</body>
</html>
```

## Styling

### CSS Custom Properties

```css
vowel-microphone {
  --vowel-primary-color: #007bff;
  --vowel-background: #ffffff;
  --vowel-border-radius: 50%;
  --vowel-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

vowel-floating-cursor {
  --cursor-color: #007bff;
  --cursor-size: 24px;
}

controlled-by-vowel-frame {
  --banner-background: #f8f9fa;
  --banner-text-color: #212529;
  --banner-border-color: #dee2e6;
}
```

### Custom Styling

```css
/* Override default styles */
vowel-microphone::part(button) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
}

vowel-microphone::part(button):hover {
  transform: scale(1.1);
}
```

## Events

Listen to custom events:

```javascript
const mic = document.querySelector('vowel-microphone');

// Session started
mic.addEventListener('session-started', (event) => {
  console.log('Session started');
});

// Session stopped
mic.addEventListener('session-stopped', (event) => {
  console.log('Session stopped');
});

// State changed
mic.addEventListener('state-changed', (event) => {
  console.log('State:', event.detail);
});

// Error occurred
mic.addEventListener('error', (event) => {
  console.error('Error:', event.detail);
});
```

## TypeScript Support

```typescript
import type { VowelMicrophoneElement } from '@vowel.to/client';

const mic = document.querySelector('vowel-microphone') as VowelMicrophoneElement;

// Typed properties and methods
await mic.startSession();
console.log(mic.isConnected);
```

## Best Practices

1. **Register Once** - Register web components once at app initialization
2. **Custom Elements** - Enable custom elements schema in your framework
3. **Event Listeners** - Use event listeners for state changes
4. **Styling** - Use CSS custom properties for theming
5. **Cleanup** - Remove event listeners when components unmount
6. **TypeScript** - Use type definitions for better DX

## Browser Support

Web components require:
- Chrome/Edge 67+
- Firefox 63+
- Safari 10.1+

For older browsers, use a polyfill:

```html
<script src="https://unpkg.com/@webcomponents/webcomponentsjs@2/webcomponents-loader.js"></script>
```

## Related

- [Standalone JS](./standalone-js) - Vanilla JavaScript integration
- [React](./react) - React integration
- [Adapters](./adapters) - Navigation and automation
- [API Reference](/api/) - Complete API documentation
