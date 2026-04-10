# Self-Hosted Configuration

Self-hosted deployments require configuration for tokens, providers, networking, and browser connectivity. This page documents all environment variables and configuration options for the self-hosted stack.

## Environment File Location

The stack reads configuration from a `stack.env` file in the workspace root (one level up from the `stack/` directory):

```bash
cp stack/stack.env.example stack.env
```

## Required Variables

These variables must be set before starting the stack:

| Variable | Description | Example |
|----------|-------------|---------|
| `ENCRYPTION_KEY` | 32+ character secret for encrypting stored API keys | `abcd1234...` (64 char hex) |
| `ENGINE_API_KEY` | Server-side API key for engine authentication | `my-secure-api-key` |
| `JWT_SECRET` | 32+ character secret for JWT token signing | `my-jwt-secret-min-32-chars` |
| `CORE_BOOTSTRAP_PUBLISHABLE_KEY` | Publishable key for Core to auto-create on first boot | `vkey_...` (64 char hex) |
| `DEEPGRAM_API_KEY` | Deepgram API key for STT and TTS | Get from [deepgram.com](https://deepgram.com) |
| `GROQ_API_KEY` or `OPENROUTER_API_KEY` | LLM provider API key | Get from provider console |

### Generating Secure Keys

Generate secure random keys for secrets:

```bash
# 64-character hex string for ENCRYPTION_KEY and CORE_BOOTSTRAP_PUBLISHABLE_KEY
openssl rand -hex 32

# 32+ character random string for JWT_SECRET and ENGINE_API_KEY
openssl rand -base64 32
```

## Provider Configuration

### LLM Provider

Choose one LLM provider:

```bash
# Option 1: Groq (default, fast)
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_your_groq_key
GROQ_MODEL=openai/gpt-oss-20b

# Option 2: OpenRouter (100+ models)
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-your_key
OPENROUTER_MODEL=openrouter/healer-alpha

# Option 3: OpenAI-compatible gateway
LLM_PROVIDER=openai-compatible
OPENAI_COMPATIBLE_BASE_URL=http://host.docker.internal:8000/v1
OPENAI_COMPATIBLE_API_KEY=your_key
OPENAI_COMPATIBLE_MODEL=gpt-4o-mini
```

**LLM Provider Variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | `openrouter` | `groq`, `openrouter`, or `openai-compatible` |
| `GROQ_API_KEY` | - | Groq API key |
| `GROQ_MODEL` | `openai/gpt-oss-20b` | Groq model ID |
| `GROQ_WHISPER_MODEL` | `whisper-large-v3` | Groq Whisper model for STT |
| `OPENROUTER_API_KEY` | - | OpenRouter API key |
| `OPENROUTER_MODEL` | `openrouter/healer-alpha` | OpenRouter model ID |
| `OPENAI_COMPATIBLE_BASE_URL` | `http://host.docker.internal:8000/v1` | Base URL for compatible gateway |
| `OPENAI_COMPATIBLE_API_KEY` | - | API key for compatible gateway |
| `OPENAI_COMPATIBLE_MODEL` | `gpt-4o-mini` | Model ID for compatible gateway |

### STT/TTS Configuration

The stack can keep credentials for multiple speech providers at once. Core app settings choose which configured provider each app should use, while engine env values remain stack defaults and fallbacks.

```bash
STT_PROVIDER=deepgram
DEFAULT_STT_PROVIDER=deepgram
DEEPGRAM_API_KEY=your_deepgram_key
DEEPGRAM_STT_MODEL=nova-3
DEEPGRAM_STT_LANGUAGE=en-US
TTS_PROVIDER=deepgram
DEFAULT_TTS_PROVIDER=deepgram
DEEPGRAM_TTS_MODEL=aura-2-thalia-en
OPENAI_COMPATIBLE_BASE_URL=http://echoline:8000/v1
OPENAI_COMPATIBLE_API_KEY=
```

**STT/TTS Variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `STT_PROVIDER` | `deepgram` | Engine fallback/default STT provider |
| `DEFAULT_STT_PROVIDER` | `STT_PROVIDER` | Core bootstrap/app default STT provider |
| `DEEPGRAM_STT_MODEL` | `nova-3` | Deepgram STT model |
| `DEEPGRAM_STT_LANGUAGE` | `en-US` | STT language code |
| `TTS_PROVIDER` | `deepgram` | Engine fallback/default TTS provider |
| `DEFAULT_TTS_PROVIDER` | `TTS_PROVIDER` | Core bootstrap/app default TTS provider |
| `DEEPGRAM_TTS_MODEL` | `aura-2-thalia-en` | Deepgram TTS voice model |
| `OPENAI_COMPATIBLE_BASE_URL` | - | Base URL for an OpenAI-compatible audio service |
| `OPENAI_COMPATIBLE_API_KEY` | - | API key for that audio service, if required |
| `CORE_ENABLE_DEV_VOICE_OVERRIDES` | `false` | Allow hidden client `_voiceConfig` runtime overrides in Core |

### VAD Configuration

Voice Activity Detection (VAD) detects when users start and stop speaking:

```bash
VAD_PROVIDER=silero
VAD_ENABLED=true
```

**VAD Variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `VAD_PROVIDER` | `silero` | VAD provider (`silero` or `none`) |
| `VAD_ENABLED` | `true` | Enable server-side VAD |

## Bootstrap Configuration

Core auto-creates an app and publishable API key on first boot using these variables:

```bash
CORE_BOOTSTRAP_APP_ID=default
CORE_BOOTSTRAP_APP_NAME=Local Stack App
CORE_BOOTSTRAP_APP_DESCRIPTION=Bootstrap app for the self-hosted Docker stack
CORE_BOOTSTRAP_API_KEY_LABEL=Local Stack Key
CORE_BOOTSTRAP_SCOPES=mint_ephemeral
CORE_BOOTSTRAP_ALLOWED_PROVIDERS=vowel-prime
CORE_BOOTSTRAP_ALLOWED_ENDPOINT_PRESETS=staging
CORE_BOOTSTRAP_DEFAULT_ENDPOINT_PRESET=staging
CORE_BOOTSTRAP_PUBLISHABLE_KEY=vkey_0123456789abcdef...
```

**Bootstrap Variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `CORE_BOOTSTRAP_APP_ID` | `default` | App ID to create |
| `CORE_BOOTSTRAP_APP_NAME` | `Local Stack App` | Display name |
| `CORE_BOOTSTRAP_APP_DESCRIPTION` | `Bootstrap app for the self-hosted Docker stack` | Description |
| `CORE_BOOTSTRAP_API_KEY_LABEL` | `Local Stack Key` | API key label |
| `CORE_BOOTSTRAP_SCOPES` | `mint_ephemeral` | Comma-separated scopes |
| `CORE_BOOTSTRAP_ALLOWED_PROVIDERS` | `vowel-prime` | Comma-separated allowed providers |
| `CORE_BOOTSTRAP_ALLOWED_ENDPOINT_PRESETS` | `staging` | Comma-separated allowed presets |
| `CORE_BOOTSTRAP_DEFAULT_ENDPOINT_PRESET` | `staging` | Default preset |
| `CORE_BOOTSTRAP_PUBLISHABLE_KEY` | - | **Required.** Plaintext publishable key to seed |

The publishable key is what client applications use to request tokens from Core. It should be a 64-character hex string prefixed with `vkey_`.

## Port Configuration

Override default ports when they conflict with existing services:

```bash
CORE_HOST_PORT=3001
ENGINE_HOST_PORT=8788
```

**Port Variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `CORE_HOST_PORT` | `3000` | Host port for Core service |
| `ENGINE_HOST_PORT` | `8787` | Host port for Engine service |

After changing ports, update the Core environment to reflect the new engine port:

```bash
# In stack.env
ENGINE_URL=http://engine:8787
ENGINE_WS_URL=ws://localhost:8788/v1/realtime
ENDPOINT_PRESET_VOWEL_PRIME_STAGING_HTTP_URL=http://engine:8787
ENDPOINT_PRESET_VOWEL_PRIME_STAGING_WS_URL=ws://localhost:8788/v1/realtime
```

## Runtime Config Ownership

The engine persists its runtime configuration as YAML at `/app/data/config/runtime.yaml` on the `engine-data` Docker volume. Environment variables in `stack.env` act as bootstrap defaults for the first boot and as fallback values when a key is missing from the YAML.

### HTTP Config Endpoints

The engine exposes HTTP endpoints for inspecting and updating runtime configuration without rebuilding:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/config` | GET | Retrieve current runtime config |
| `/config` | PUT | Update runtime config |
| `/config/validate` | POST | Validate a config change |
| `/config/reload` | POST | Reload config from disk |
| `/presets` | GET | List available presets |

All config endpoints require the engine admin API key via `Authorization: Bearer ${ENGINE_API_KEY}`.

### Example: Update Runtime Config

```bash
# Get current config
curl http://localhost:8787/config \
  -H "Authorization: Bearer ${ENGINE_API_KEY}"

# Update a setting
curl -X PUT http://localhost:8787/config \
  -H "Authorization: Bearer ${ENGINE_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"llm": {"provider": "groq", "model": "openai/gpt-oss-20b"}}'

# Validate before applying
curl -X POST http://localhost:8787/config/validate \
  -H "Authorization: Bearer ${ENGINE_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"llm": {"provider": "openrouter"}}'

# Reload from disk
curl -X POST http://localhost:8787/config/reload \
  -H "Authorization: Bearer ${ENGINE_API_KEY}"
```

## Core Configuration Areas

### Provider Credentials

Store all provider API keys in `stack.env`. Core encrypts provider keys before storing them in its SQLite database using the `ENCRYPTION_KEY`.

### Service URLs

Core needs to know how to reach the engine:

```bash
# Internal Docker network URL (Core -> Engine)
ENGINE_URL=http://engine:8787

# External URL for clients (used in token responses)
ENGINE_WS_URL=ws://localhost:8787/v1/realtime
```

### Token Issuance Settings

Control who can request tokens and which providers they can use:

- `CORE_BOOTSTRAP_SCOPES`: Controls API key capabilities (`mint_ephemeral`, `mint_trusted_session`)
- `CORE_BOOTSTRAP_ALLOWED_PROVIDERS`: Which voice providers can be used
- `CORE_BOOTSTRAP_ALLOWED_ENDPOINT_PRESETS`: Which endpoint presets are available

### Browser-Facing Origins

For CORS, Core accepts requests from any origin by default in development. In production, configure your reverse proxy to handle CORS policy.

## Environment-Specific Configuration

### Development

```bash
TEST_MODE=true
NODE_ENV=development
```

### Production

```bash
TEST_MODE=false
NODE_ENV=production
```

## Security Guidance

- Rotate provider secrets regularly (every 90 days recommended)
- Scope credentials to the environments that need them
- Terminate TLS before exposing browser-facing endpoints
- Avoid embedding long-lived credentials in any client bundle
- Never commit `stack.env` to version control
- Use `STACK_ENV_FILE` to switch between environment files for different stages

## Complete Example Configuration

```bash
# stack.env - Production Example

# === REQUIRED SECRETS ===
ENCRYPTION_KEY=your-64-char-hex-encryption-key
ENGINE_API_KEY=your-secure-server-api-key
JWT_SECRET=your-32-char-minimum-jwt-secret
CORE_BOOTSTRAP_PUBLISHABLE_KEY=vkey_your-64-char-hex-key

# === PROVIDER CREDENTIALS ===
DEEPGRAM_API_KEY=your-deepgram-key

# LLM Provider (pick one)
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_your_groq_key

# === OPTIONAL OVERRIDES ===
CORE_HOST_PORT=3000
ENGINE_HOST_PORT=8787

# === BOOTSTRAP CONFIG ===
CORE_BOOTSTRAP_APP_ID=production-app
CORE_BOOTSTRAP_APP_NAME=Production Voice App
CORE_BOOTSTRAP_SCOPES=mint_ephemeral,mint_trusted_session
CORE_BOOTSTRAP_ALLOWED_PROVIDERS=vowel-prime
```
