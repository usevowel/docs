# Self-Hosted

Self-hosted deployment lets you run vowel on infrastructure you control.

::: warning Beta Release
This open-source release is in beta. You may encounter rough edges, incomplete features, or breaking changes. We are actively reviewing and merging community PRs, but please expect some instability as we iterate toward a stable release. Your feedback and contributions are welcome.
:::

## Who This Is For

Choose self-hosted when you want:

- Your own deployment boundary
- Your own token issuance path
- Custom networking, auth, or backend policy
- Operator control over runtime configuration
- Data privacy with fully offline operation (optional)

<a href="https://youtu.be/Iv-ek5vXbhQ" style="display: block; position: relative; width: 50%; margin: 0 auto;">
  <img src="/images/self-host.png" alt="Self-Hosted Stack Overview" style="width: 100%; display: block; border-radius: 8px;">
  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80px; height: 80px; background: rgba(0,0,0,0.7); border-radius: 50%; display: flex; align-items: center; justify-content: center; pointer-events: none;">
    <svg viewBox="0 0 24 24" width="40" height="40" fill="white" style="margin-left: 4px;">
      <path d="M8 5v14l11-7z"/>
    </svg>
  </div>
</a>

## What The Self-Hosted Stack Includes

The self-hosted stack includes these services:

| Service | Default URL | Purpose |
|---------|-------------|---------|
| **Core** | http://localhost:3000 | Token issuance, app management, Web UI |
| **Realtime Engine** | ws://localhost:8787/v1/realtime | Voice AI WebSocket (OpenAI-compatible) |
| **Echoline** (optional) | http://localhost:8000 | Self-hosted STT/TTS with faster-whisper + Kokoro |

**Optional:**

| Service | Default URL | Purpose |
|---------|-------------|---------|
| **Echoline** | http://localhost:8000 | Self-hosted STT/TTS (no external APIs) |

Your application typically talks to Core or your own backend to get a token, then connects to the realtime engine with that token.

## Deployment Options

### Option 1: Deepgram-Powered (Default - Recommended)
Uses hosted STT/TTS from Deepgram. Works on all machines (no GPU required).

- **Pros**: Fast setup, professional-grade quality, no model downloads
- **Cons**: Requires Deepgram API key, ongoing API costs
- **Requirements**: Deepgram API key + LLM provider key (Groq or OpenRouter)
- **Command**: `bun run stack:up`

### Option 2: Fully Self-Hosted with Echoline
Local speech processing with faster-whisper + Kokoro. Requires NVIDIA GPU.

- **Pros**: No external APIs, data privacy, works offline, no API costs
- **Cons**: Requires GPU, ~5GB disk space, slower initial startup
- **Requirements**: NVIDIA GPU with 8GB+ VRAM
- **Command**: `bun run stack:up:full`

### Option 3: GPU-Accelerated (NVIDIA GPU Only)
Uses GPU for lower VAD latency with Deepgram quality.

- **Requirements**: NVIDIA GPU + Container Toolkit
- **Command**: `bun run stack:up:gpu`

## Command Reference

Common stack management commands:

| Command | Description |
|---------|-------------|
| `bun run stack:up` | Start CPU stack (default) |
| `bun run stack:up:gpu` | Start with GPU acceleration |
| `bun run stack:up:full` | Start with Echoline (self-hosted STT/TTS) |
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

Echoline (self-hosted STT/TTS option) does not require external API keys.

## Testing

The stack includes multiple testing capabilities:

**Smoke Test** (`bun run stack:test`)
A quick health check that verifies the Core and Engine services are running, validates token generation works, and confirms WebSocket connections can be established.

**Test Harness Framework**
An LLM-powered automated testing system in the Engine that simulates human users conducting conversations with your voice agent. It validates that the agent correctly uses tools, handles multi-turn conversations, and maintains context across interactions. The framework includes built-in test scenarios for weather lookups, calculations, multi-tool conversations, and context retention.

**Custom Test Scenarios**
Create your own test cases by defining conversation objectives, expected tool calls with validation logic, and mock return data. Tests can be run against different LLM providers and generate detailed Markdown logs of each run.

See the **[Testing](./testing)** page for detailed documentation on the Test Harness, creating custom scenarios, and CI/CD integration.

## Documentation

- **[Deployment](./deployment)** - Docker Compose setup, prerequisites, production deployment
- **[Configuration](./configuration)** - Complete environment variable reference
- **[Core](./core)** - Token service API, bootstrap process, Web UI
- **[Realtime Engine](./engine)** - WebSocket API, events, runtime config
- **[Self-Hosted Speech (Echoline)](./echoline)** - Run local STT/TTS without external APIs
- **[Architecture](./architecture)** - How components fit together
- **[Testing](./testing)** - Smoke tests, Test Harness framework, custom scenarios
- **[Troubleshooting](./troubleshooting)** - Debug common issues, logs, health checks

## Source Repository

The self-hosted stack is open source at [github.com/usevowel/stack](https://github.com/usevowel/stack).

Individual components:
- Core: [github.com/usevowel/core](https://github.com/usevowel/core)
- Engine: [github.com/usevowel/engine](https://github.com/usevowel/engine)
