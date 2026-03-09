# Installation

This guide covers different ways to install and use @vowel.to/client in your project.

## Package Manager Installation

### npm

```bash
npm install @vowel.to/client
```

### Yarn

```bash
yarn add @vowel.to/client
```

### Bun

```bash
bun add @vowel.to/client
```

### pnpm

```bash
pnpm add @vowel.to/client
```

## CDN Installation

For quick prototyping or static sites, you can use the CDN version:

### Standalone JavaScript Bundle

```html
<script src="https://unpkg.com/@vowel.to/client@latest/standalone-js"></script>

<script>
  const { Vowel } = window.VowelClient;
  
  const vowel = new Vowel({
    appId: 'your-app-id',
    routes: [
      { path: '/', description: 'Home page' },
      { path: '/products', description: 'Products' }
    ]
  });
  
  vowel.startSession();
</script>
```

### Web Component

```html
<script src="https://unpkg.com/@vowel.to/client@latest/webcomponent"></script>

<vowel-voice-widget 
  id="widget"
  app-id="your-app-id">
</vowel-voice-widget>

<script>
  const widget = document.getElementById('widget');
  
  widget.addEventListener('vowel-ready', () => {
    console.log('Vowel is ready!');
  });
</script>
```

## TypeScript Support

@vowel.to/client is written in TypeScript and includes full type definitions. No additional `@types` package is needed.

```typescript
import { Vowel, VowelConfig, VowelRoute } from '@vowel.to/client';

const config: VowelConfig = {
  appId: 'your-app-id',
  routes: [
    { path: '/', description: 'Home' }
  ]
};

const vowel = new Vowel(config);
```

## Framework-Specific Setup

### Next.js

```typescript
// app/vowel.client.ts
import { Vowel, createNextJSAdapters } from '@vowel.to/client';
import { useRouter } from 'next/navigation';

export function useVowelClient() {
  const router = useRouter();
  
  const { navigationAdapter, automationAdapter } = createNextJSAdapters(router, {
    routes: [
      { path: '/', description: 'Home' },
      { path: '/products', description: 'Products' }
    ],
    enableAutomation: true
  });

  return new Vowel({
    appId: process.env.NEXT_PUBLIC_VOWEL_APP_ID!,
    navigationAdapter,
    automationAdapter
  });
}
```

### React with React Router

```typescript
import { Vowel, createReactRouterAdapters } from '@vowel.to/client';
import { useNavigate, useLocation } from 'react-router-dom';

function useVowelClient() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { navigationAdapter, automationAdapter } = createReactRouterAdapters({
    navigate,
    location,
    routes: [
      { path: '/', description: 'Home' },
      { path: '/products', description: 'Products' }
    ],
    enableAutomation: true
  });

  return new Vowel({
    appId: import.meta.env.VITE_VOWEL_APP_ID,
    navigationAdapter,
    automationAdapter
  });
}
```

### Vue with Vue Router

```typescript
import { Vowel, createVueRouterAdapters } from '@vowel.to/client';
import { useRouter } from 'vue-router';

export function useVowelClient() {
  const router = useRouter();
  
  const { navigationAdapter, automationAdapter } = createVueRouterAdapters(router, {
    routes: [
      { path: '/', description: 'Home' },
      { path: '/products', description: 'Products' }
    ],
    enableAutomation: true
  });

  return new Vowel({
    appId: import.meta.env.VITE_VOWEL_APP_ID,
    navigationAdapter,
    automationAdapter
  });
}
```

### TanStack Router

```typescript
import { Vowel, createTanStackAdapters } from '@vowel.to/client';
import { router } from './router';

const { navigationAdapter, automationAdapter } = createTanStackAdapters(router, {
  enableAutomation: true
});

export const vowel = new Vowel({
  appId: 'your-app-id',
  navigationAdapter,
  automationAdapter
});
```

## Environment Variables

Store your App ID in environment variables:

### Next.js (.env.local)

```bash
NEXT_PUBLIC_VOWEL_APP_ID=your-app-id
```

### Vite (.env)

```bash
VITE_VOWEL_APP_ID=your-app-id
```

### Create React App (.env)

```bash
REACT_APP_VOWEL_APP_ID=your-app-id
```

## Browser Requirements

Vowel requires a modern browser with:

- WebRTC support
- Microphone access
- HTTPS (for microphone permissions)

### Supported Browsers

- ✅ Chrome/Edge 89+ (Recommended)
- ✅ Firefox 88+
- ✅ Safari 14.1+
- ⚠️ Mobile browsers (limited support)

## Troubleshooting

### Microphone Permission Denied

Ensure your site is served over HTTPS. Browsers block microphone access on HTTP (except localhost).

### Module Not Found

If you see module resolution errors:

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  }
}
```

## Next Steps

- [Quick Start](./quick-start) - Build your first voice-enabled app
- [Vowel Client](./vowel-client) - Learn about the core API
- [Adapters](./adapters) - Understand navigation and automation

