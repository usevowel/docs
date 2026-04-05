# Self-Hosted

Self-hosted deployment lets you run vowel on infrastructure you control.

## Quick Start

Get the self-hosted stack running in minutes:

```bash
# 1. Clone the repository
git clone https://github.com/usevowel/stack.git
cd stack

# 2. Copy and configure environment
cp stack/stack.env.example stack.env
# Edit stack.env and add your API keys

# 3. Start the stack
bun run stack:up

# 4. Verify with smoke test
bun run stack:test

# 5. View logs
bun run stack:logs
```

Services will be available at:
- **Core**: http://localhost:3000 (token service, Web UI)
- **Engine**: ws://localhost:8787/v1/realtime (WebSocket for voice)

## Who This Is For

Choose self-hosted when you want:

- Your own deployment boundary
- Your own token issuance path
- Custom networking, auth, or backend policy
- Operator control over runtime configuration

## What The Self-Hosted Stack Includes

The self-hosted stack has two primary services:

| Service | Default URL | Purpose |
|---------|-------------|---------|
| **Core** | http://localhost:3000 | Token issuance, app management, Web UI |
| **Realtime Engine** | ws://localhost:8787/v1/realtime | Voice AI WebSocket (OpenAI-compatible) |

**Optional:**

| Service | Default URL | Purpose |
|---------|-------------|---------|
| **Echoline** | http://localhost:8000 | Self-hosted STT/TTS (no external APIs) |

Your application typically talks to Core or your own backend to get a token, then connects to the realtime engine with that token.

## Command Reference

Common stack management commands:

| Command | Description |
|---------|-------------|
| `bun run stack:up` | Start all services |
| `bun run stack:down` | Stop and remove containers |
| `bun run stack:logs` | View service logs |
| `bun run stack:build` | Rebuild container images |
| `bun run stack:test` | Run smoke tests |

## Hosted Vs Self-Hosted

Use the **hosted platform** if you want:

- The fastest path to integration
- Managed app configuration
- Platform-managed setup with `appId`

Use **self-hosted** if you want:

- Infrastructure control
- Your own token and networking boundaries
- Custom backend mediation for session access

## Required API Keys

Before deploying, obtain API keys from:

| Provider | Purpose | Where to Get |
|----------|---------|--------------|
| **Deepgram** | Speech-to-text and text-to-speech | [deepgram.com](https://deepgram.com) |
| **Groq** or **OpenRouter** | LLM for AI responses | [groq.com](https://groq.com) or [openrouter.ai](https://openrouter.ai) |

### Fully Self-Hosted (No External Speech APIs)

If you run Echoline for self-hosted STT/TTS, you can eliminate the Deepgram dependency:

```bash
docker compose --profile echoline up
```

Echoline requires a GPU for real-time performance. See [Self-Hosted Speech](./echoline) for setup instructions.

## Documentation

- **[Deployment](./deployment)** - Docker Compose setup, prerequisites, production deployment
- **[Configuration](./configuration)** - Complete environment variable reference
- **[Core](./core)** - Token service API, bootstrap process, Web UI
- **[Realtime Engine](./engine)** - WebSocket API, events, runtime config
- **[Self-Hosted Speech (Echoline)](./echoline)** - Run local STT/TTS without external APIs
- **[Architecture](./architecture)** - How components fit together
- **[Troubleshooting](./troubleshooting)** - Debug common issues, logs, health checks

## Source Repository

The self-hosted stack is open source at [github.com/usevowel/stack](https://github.com/usevowel/stack).

Individual components:
- Core: [github.com/usevowel/core](https://github.com/usevowel/core)
- Engine: [github.com/usevowel/engine](https://github.com/usevowel/engine)
