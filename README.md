# vowel Documentation

This directory contains the documentation site for the vowel platform, built with VitePress.

## Platform Overview

This documentation covers the complete vowel platform:

- **Client** - SDK installation, framework integrations (React, Vue, vanilla JS), connection models, and core concepts
- **Self-Hosted** - Deploy Core, the realtime engine, and optional Echoline speech services on your own infrastructure
- **vowelbot** - GitHub-based onboarding service for adding vowel to repositories via add.vowel.to
- **Platform** - Hosted platform documentation (coming soon after the initial self-hosted launch)
- **Recipes** - Task-oriented examples for actions, events, navigation, automation, and advanced flows
- **API Reference** - Generated SDK reference for the Client library
- **voweldocs** - Reference implementation for voice-powered documentation sites

## 🎤 Voice Navigation with RAG

The documentation includes a voice-powered AI navigation system with **privacy-first RAG (Retrieval-Augmented Generation)** built on Turso WASM:

- **Navigate by voice** - "Take me to the installation guide"
- **Ask questions with grounded answers** - "What is vowel?" with answers retrieved from the docs
- **Interact with content** - "Copy the first code example"
- **Search documentation** - "Search for adapters"

**RAG Architecture:**
- Browser-local [Turso](https://turso.tech) WASM database with vector search
- Transformers.js for in-browser query embeddings
- Pre-built embedding index generated at build time from all documentation
- Zero cloud dependencies - all processing happens client-side

**Quick Setup:**
1. Run `bun install`
2. Run `bun run build:rag` to generate the RAG index
3. Run `bun run dev`
4. Click the microphone button and configure voice access:
   - **Hosted mode**: Enter your App ID from [vowel.to](https://vowel.to)
   - **Self-hosted mode**: Enter your base URL and App ID (or JWT token)
5. Say "Go to getting started"

**Optional Pre-configuration:**
You can pre-configure credentials via environment variables (see `.env.example`) to skip the setup modal:
- `VITE_VOWEL_URL` + `VITE_VOWEL_APP_ID` - For self-hosted mode
- `VITE_VOWEL_JWT_TOKEN` + `VITE_VOWEL_USE_JWT=true` - For JWT-based self-hosted

See [voweldocs README](./voweldocs-README.md) for complete integration documentation.

## Structure

```
docs/
├── .vitepress/                 # VitePress configuration
│   ├── config.ts
│   └── theme/                  # Custom theme with voice integration
│       ├── VoiceLayout.vue
│       ├── VoiceAgent.vue
│       ├── voice-client.ts
│       └── custom.css
├── guide/                      # Client SDK guides
│   ├── getting-started.md
│   ├── installation.md
│   ├── quick-start.md
│   ├── adapters.md
│   └── ...
├── self-hosted/                # Self-hosted deployment docs
│   ├── index.md
│   ├── architecture.md
│   ├── core.md
│   └── ...
├── vowelbot/                   # GitHub onboarding docs
│   └── index.md
├── platform/                   # Hosted platform docs
│   ├── index.md
│   └── ...
├── recipes/                    # Practical examples
│   ├── index.md
│   ├── event-notifications.md
│   └── ...
├── voweldocs/                  # Voice navigation docs
│   ├── index.md
│   ├── architecture.md
│   ├── rag.md
│   └── ...
├── api/                        # Auto-generated API reference
│   └── reference/
├── index.md                    # Home page
└── package.json
```

## Development

### Install Dependencies

```bash
bun install
```

### Generate RAG Index

Build the semantic search index for voice navigation:

```bash
bun run build:rag
```

This generates `public/rag-index.yml` with pre-computed embeddings using llama.cpp.

### Start Dev Server

```bash
bun run dev
```

Visit https://localhost:5173 (HTTPS is required for microphone access)

### Build for Production

```bash
bun run docs:build
```

Output will be in `.vitepress/dist/`

### Preview Production Build

```bash
bun run docs:preview
```

## Documentation Sources

- **Guides** - Hand-written markdown files in `guide/`
- **Recipes** - Hand-written examples in `recipes/`
- **Self-Hosted** - Deployment and operations docs in `self-hosted/`
- **voweldocs** - Voice navigation implementation docs in `voweldocs/`
- **API Reference** - Auto-generated from TypeScript source

## Deployment

This documentation site is configured for deployment to **Cloudflare Pages** at `docs.vowel.to`.

**Quick Deploy:**

```bash
# Build and deploy to Cloudflare Pages
bun run deploy

# Deploy a preview
bun run deploy:preview
```

**Configuration Files:**
- `wrangler.toml` - Cloudflare Pages configuration
- `.node-version` - Node.js version specification
- `public/_headers` - HTTP headers for security and caching
- `public/_redirects` - URL redirects for SPA routing

**Alternative Deployment Options:**

This site can also be deployed to:
- **GitHub Pages** - Automatic via GitHub Actions
- **Vercel** - Connect your repo and deploy
- **Netlify** - Connect your repo and deploy
- **Any static host** - Upload `.vitepress/dist/` contents

## Contributing

When contributing to documentation:

1. Follow the existing structure and style
2. Use clear, concise language
3. Include code examples
4. Test your changes locally before committing
5. Run `bun run build:rag` to update the RAG index if documentation content changes

## Support

- 📧 Email: support@vowel.to
- 💬 Discord: [Join our community](https://discord.gg/Kb4zFmmSRr)
- 🐛 Issues: [GitHub Issues](https://github.com/usevowel/vowel/issues)
