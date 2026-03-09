# @vowel.to/client Documentation

This directory contains the documentation site for the @vowel.to/client library, built with VitePress and TypeDoc.

## 🎤 Voice Navigation

**NEW!** The documentation now includes voice-powered navigation! You can use voice commands to navigate between pages, search documentation, and interact with code examples.

**Quick Setup:**
1. Create `.env.local` with your `VITE_VOWEL_APP_ID`
2. Run `bun run dev`
3. Click the microphone button and say "Go to getting started"

📖 See [VOICE_SETUP_QUICK_START.md](./VOICE_SETUP_QUICK_START.md) for setup instructions  
📚 See [VOICE_INTEGRATION.md](./VOICE_INTEGRATION.md) for full documentation

## Important Licensing Note

**The client library source code (`../client/`) is proprietary and NOT open source.** Only this documentation is publicly accessible. The documentation provides usage guides and API reference for developers using the library, but the source code itself remains closed-source.

## Structure

```
docs/
├── .ai/                        # Future features documentation
│   └── interactive-examples-approach.md
├── .vitepress/                 # VitePress configuration
│   ├── config.ts
│   └── theme/                  # Custom theme with voice integration
│       ├── index.ts
│       ├── VoiceLayout.vue
│       ├── VoiceAgent.vue
│       ├── voice-client.ts
│       └── custom.css
├── api/                        # Auto-generated API reference (from TypeDoc)
│   ├── index.md
│   ├── index-1.md             # Main module documentation
│   └── react.md               # React module documentation
├── guide/                      # User guides
│   ├── getting-started.md
│   ├── installation.md
│   ├── quick-start.md
│   ├── adapters.md
│   └── ...
├── recipes/                    # Practical examples
│   ├── index.md
│   ├── event-notifications.md
│   └── ...
├── index.md                    # Home page
├── package.json
├── typedoc.json               # TypeDoc configuration
└── tsconfig.typedoc.json      # TypeScript config for TypeDoc

```

## Development

### Install Dependencies

```bash
bun install
```

### Start Dev Server

```bash
bun run docs:dev
```

Visit http://localhost:5173

### Generate API Documentation

```bash
bun run docs:generate-api
```

This runs TypeDoc to generate API reference from the `../client` source code.

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
- **API Reference** - Auto-generated from TypeScript source in `../client` using TypeDoc

## TypeDoc Configuration

TypeDoc is configured to:
- Parse `../client/index.ts` and `../client/react.ts` entry points
- Include all files in `../client/lib/`
- Exclude examples, tests, and config files
- Generate markdown output in `api/` directory
- Use the `typedoc-plugin-markdown` plugin for markdown generation

## Adding New Documentation

### Adding a Guide

1. Create a new `.md` file in `guide/`
2. Add it to the sidebar in `.vitepress/config.ts`
3. Write your content using markdown

### Adding a Recipe

1. Create a new `.md` file in `recipes/`
2. Add it to the sidebar in `.vitepress/config.ts`
3. Include problem, solution, and explanation sections

### Updating API Reference

The API reference is automatically generated from TypeScript source code. To update:

1. Add/update TSDoc comments in `../client` source files
2. Run `bun run docs:generate-api`
3. The API docs will be regenerated

## Future Features

See `.ai/interactive-examples-approach.md` for planned interactive examples feature that will allow users to input their App ID and see live demos.

## Deployment

This documentation site is configured for deployment to **Cloudflare Pages** at `docs.vowel.to`.

### Cloudflare Pages Deployment

See [cloudflare-pages.md](./cloudflare-pages.md) for detailed deployment instructions.

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
5. Ensure TypeDoc generation still works

## Support

- 📧 Email: support@vowel.to
- 💬 Discord: [Join our community](https://discord.gg/vowel-life)
- 🐛 Issues: [GitHub Issues](https://github.com/vowel-life/client/issues)

