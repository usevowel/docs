# Integration Guide

To adapt voweldocs for your own documentation site:

## 1. Install Dependencies

```bash
bun add @vowel.to/client @ricky0123/vad-web haven
```

The `haven` package provides the local vector database for RAG functionality.

## 2. Copy Core Files

Copy these files from the voweldocs reference implementation:
- `.vitepress/theme/voice-client.ts` - Core client logic (includes RAG actions)
- `.vitepress/theme/VoiceLayout.vue` - Layout wrapper
- `.vitepress/theme/VoiceConfigModal.vue` - Configuration UI
- `.vitepress/theme/VoiceAgent.vue` - React wrapper component
- `.vitepress/theme/VoiceAgentWrapper.tsx` - React integration
- `.vitepress/theme/generate-routes-plugin.ts` - Route generation
- `.vitepress/theme/prebuilt-rag.ts` - Haven VectorDB initialization for local RAG
- `.vitepress/theme/rag-debug/` - Debug UI for viewing STT/RAG results (optional)

## 3. Configure VitePress Theme

Update `.vitepress/theme/index.ts`:

```typescript
import { generateRoutesPlugin } from './generate-routes-plugin'

export default {
  extends: DefaultTheme,
  Layout: VoiceLayout, // Your custom layout
  enhanceApp({ app, router, siteData }) {
    // ... other enhancements
  }
}
```

## 4. Add Route Generation Plugin

Update `vite.config.ts`:

```typescript
import { generateRoutesPlugin } from './.vitepress/theme/generate-routes-plugin'

export default defineConfig({
  plugins: [
    generateRoutesPlugin(),
    // ... other plugins
  ]
})
```

## 5. Configure Environment

Create `.env` based on your chosen mode (see [Configuration](./configuration)).

## 6. Generate RAG Index (Optional but Recommended)

For AI-powered answers grounded in your documentation, generate the pre-built embedding index:

```bash
# Generate RAG embeddings using llama.cpp with Vulkan acceleration
# This creates public/rag-index.yml with pre-computed embeddings for Haven VectorDB
bun run build:rag
```

This script (`scripts/build-rag.py`):
- Processes all markdown documentation files
- Chunks content into searchable segments
- Generates embeddings using llama.cpp with Vulkan GPU acceleration
- Outputs `public/rag-index.yml` ready for Haven VectorDB

For full production build (includes RAG + routes + VitePress):

```bash
bun run docs:build
```

The build process generates:
- `routes-manifest.ts` - Navigation routes for voice commands
- `public/rag-index.yml` - Pre-computed embeddings for semantic search

## 7. Customize Actions

Edit `voice-client.ts` to register documentation-specific actions for your content:

```typescript
vowel.registerAction(
  'myCustomAction',
  {
    description: 'Does something specific to my docs',
    parameters: { /* ... */ }
  },
  async (params) => {
    // Implementation
  }
)
```

## Agent Skills

When working with voweldocs in Cursor/Claude, reference these agent skills in `.agents/skills/`:

- **`voweldocs`** - Main skill for voice-enabling documentation sites (VitePress/Vue pattern)
- **`rag-prebuild`** - Pre-build RAG embeddings with `build-rag.py` (llama.cpp + Vulkan)
- **`haven-local-rag`** - Haven VectorDB, browser-based semantic search, and local RAG pipelines
