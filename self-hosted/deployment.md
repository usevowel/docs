# Self-Hosted Deployment

Use the self-hosted stack when you want to run both the token service and the realtime runtime on your own infrastructure.

## Prerequisites

Before deploying, ensure you have:

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Docker | 20.10+ | Container runtime |
| Docker Compose | v2+ | Multi-service orchestration |
| Bun | 1.1.0+ | Workspace scripts and demo |
| API Keys | - | Provider credentials (see below) |

### Required API Keys

You need keys for two services: an **LLM provider** and **Deepgram** (STT + TTS).

**LLM Provider** (pick one):

| Provider | Env Var | Where to get a key |
|----------|---------|--------------------|
| Groq | `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) |
| OpenRouter | `OPENROUTER_API_KEY` | [openrouter.ai](https://openrouter.ai) |
| OpenAI-compatible | `OPENAI_COMPATIBLE_API_KEY` | Any OpenAI-compatible gateway |

**Deepgram** (default STT + TTS):

| Env Var | Purpose |
|---------|---------|
| `DEEPGRAM_API_KEY` | Speech-to-text and text-to-speech |

Get a key at [deepgram.com](https://deepgram.com). The defaults use Deepgram for both STT and TTS (`nova-3` for STT, `aura-2-thalia-en` for TTS).

## Quick Start (Docker Compose)

The fastest way to run the self-hosted stack is with Docker Compose:

```bash
# 1. Clone the stack repository
git clone https://github.com/usevowel/stack.git
cd stack

# 2. Copy the environment template
cp stack.env.example ../stack.env

# 3. Edit stack.env with your API keys
# Required: ENCRYPTION_KEY, ENGINE_API_KEY, JWT_SECRET, CORE_BOOTSTRAP_PUBLISHABLE_KEY
# Required: DEEPGRAM_API_KEY and either GROQ_API_KEY or OPENROUTER_API_KEY

# 4. Start the stack
bun run stack:up

# 5. Verify with the smoke test
bun run stack:test

# 6. View logs to confirm bootstrap
bun run stack:logs | grep bootstrap
```

After startup, the services are available at:

| Service | URL | Purpose |
|---------|-----|---------|
| Core | `http://localhost:3000` | Token issuance, app management, Web UI |
| Engine | `ws://localhost:8787/v1/realtime` | Realtime voice AI WebSocket |

## Stack Management Commands

The workspace provides several commands for managing the stack:

| Command | Description |
|---------|-------------|
| `bun run stack:up` | Build and start all services |
| `bun run stack:down` | Stop and remove containers (with volumes) |
| `bun run stack:logs` | Follow logs from all services |
| `bun run stack:build` | Rebuild container images |
| `bun run stack:test` | Run smoke tests against the stack |
| `bun run stack:sync-secrets` | Sync secrets from engine `.dev.vars` to `stack.env` |

### Log Inspection

View logs for specific services:

```bash
# All services
bun run stack:logs

# Filter for engine only
bun run stack:logs | grep engine

# Filter for core only
bun run stack:logs | grep core

# Check bootstrap confirmation
bun run stack:logs | grep bootstrap
```

### Custom Environment File

To use a different environment file:

```bash
STACK_ENV_FILE=production.env bun run stack:up
```

## Docker Compose Services

The stack consists of two services defined in `docker-compose.yml`:

### Core (`vowel-core`)

- **Container**: `vowel-core`
- **Default Port**: `3000` (configurable via `CORE_HOST_PORT`)
- **Purpose**: Token issuance, app management, Web UI
- **Depends on**: Engine (health check)
- **Volume**: `core-data` for SQLite database

### Engine (`vowel-engine`)

- **Container**: `vowel-engine`
- **Default Port**: `8787` (configurable via `ENGINE_HOST_PORT`)
- **Purpose**: Realtime voice AI (OpenAI-compatible WebSocket)
- **Volume**: `engine-data` for runtime config persistence
- **Health Check**: `/health` endpoint

## Deployment Modes

### Local Evaluation

For development and testing, use the default Docker Compose setup:

```bash
bun run stack:up
```

Validation checklist:

- [ ] Core is reachable over HTTP (`curl http://localhost:3000/health`)
- [ ] Engine is reachable over WebSocket (`wscat -c ws://localhost:8787/v1/realtime`)
- [ ] Token issuance succeeds (`bun run stack:test`)
- [ ] Browser client can complete a live connection

### Single-Environment Deployment

For internal tooling or staging without full production complexity:

```bash
# Use custom ports to avoid conflicts
CORE_HOST_PORT=3001 ENGINE_HOST_PORT=8788 bun run stack:up
```

Considerations:

- Use a dedicated host or VM
- Enable basic authentication on Core
- Set up simple log rotation
- Monitor disk usage for Docker volumes

### Production Deployment

For production workloads, plan for:

#### HTTPS and WSS Endpoints

```bash
# Example nginx reverse proxy configuration
server {
    listen 443 ssl;
    server_name core.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 443 ssl;
    server_name engine.yourdomain.com;
    
    location /v1/realtime {
        proxy_pass http://localhost:8787/v1/realtime;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
```

#### Health Check Endpoints

Monitor these endpoints:

```bash
# Engine health
curl http://localhost:8787/health

# Core health
curl http://localhost:3000/health
```

#### Secret Rotation

Rotate secrets periodically:

1. Generate new `ENCRYPTION_KEY`, `JWT_SECRET`, `ENGINE_API_KEY`
2. Update `stack.env`
3. Run `bun run stack:down && bun run stack:up`
4. Regenerate publishable keys in Core UI

#### Volume Persistence

Data is stored in Docker volumes:

- `core-data`: SQLite database at `/app/data/core.db`
- `engine-data`: Runtime config at `/app/data/config/runtime.yaml`

Back up volumes for disaster recovery:

```bash
docker run --rm -v vowel-self-hosted_core-data:/data -v $(pwd):/backup alpine tar czf /backup/core-data.tar.gz -C /data .
docker run --rm -v vowel-self-hosted_engine-data:/data -v $(pwd):/backup alpine tar czf /backup/engine-data.tar.gz -C /data .
```

## Network Expectations

A production deployment usually exposes:

- An HTTP endpoint for token issuance or control-plane access
- A WSS endpoint for realtime sessions

Keep the realtime endpoint stable so client applications do not need to change between deploys.

### Port Configuration

Override default ports via environment variables:

```bash
CORE_HOST_PORT=3001 ENGINE_HOST_PORT=8788 bun run stack:up
```

## Acceptance Checklist

Before shipping a self-hosted deployment, verify:

- [ ] Browser clients can fetch tokens from Core
- [ ] Browser clients can connect to the realtime engine
- [ ] Microphone flows work over HTTPS (not just HTTP)
- [ ] Session startup, speech input, and responses complete successfully
- [ ] Failure states produce actionable logs
- [ ] Health check endpoints respond correctly
- [ ] Logs are being collected and rotated
- [ ] Secrets are stored securely (not in version control)
- [ ] Backup strategy is in place for volumes

## Demo Application Connection

To connect the demo application to your self-hosted stack:

```bash
cd demos/demo
```

Create `.env.local`:

```bash
VITE_USE_CORE_COMPOSE=1
VITE_CORE_BASE_URL=http://localhost:3000
VITE_CORE_TOKEN_ENDPOINT=http://localhost:3000/vowel/api/generateToken
VITE_CORE_API_KEY=vkey_your-bootstrap-publishable-key
VITE_CORE_APP_ID=default
```

Start the demo:

```bash
bun run dev
```

## Troubleshooting

See [Troubleshooting](./troubleshooting) for common issues and debugging commands.
