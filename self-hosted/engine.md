# Self-Hosted Realtime Engine

The realtime engine runs live voice sessions in a self-hosted deployment. It provides an OpenAI-compatible WebSocket API for real-time voice AI.

## What The Realtime Engine Does

The realtime engine is responsible for:

- Accepting authenticated realtime WebSocket connections
- Creating and managing live voice sessions
- Coordinating speech-to-text, model inference, and text-to-speech
- Executing custom tools and actions
- Streaming audio and text responses back to clients
- Managing conversation history and session state

## WebSocket Endpoint

The primary endpoint for voice sessions:

```
ws://localhost:8787/v1/realtime
```

In production with TLS:

```
wss://your-domain.com/v1/realtime
```

**Connection requires:**
- Valid ephemeral token in `Authorization` header or query parameter
- WebSocket protocol upgrade support

### Example Connection

```bash
# Using wscat (install with: npm install -g wscat)
wscat -c "ws://localhost:8787/v1/realtime" \
  -H "Authorization: Bearer ek_your_ephemeral_token"
```

```javascript
// Using native WebSocket
const ws = new WebSocket(
  'ws://localhost:8787/v1/realtime',
  [],
  {
    headers: {
      'Authorization': 'Bearer ek_your_ephemeral_token'
    }
  }
);
```

## Ephemeral Token Flow

### 1. Request Token from Core

```bash
curl -X POST http://localhost:3000/vowel/api/generateToken \
  -H "Content-Type: application/json" \
  -H "X-API-Key: vkey_your_bootstrap_key" \
  -d '{
    "appId": "default",
    "provider": "vowel-prime"
  }'
```

**Response:**
```json
{
  "token": "ek_eyJhbGciOiJIUzI1NiIs...",
  "expiresAt": "2024-01-15T10:30:00Z",
  "wsUrl": "ws://localhost:8787/v1/realtime"
}
```

### 2. Connect with Token

```bash
wscat -c "ws://localhost:8787/v1/realtime" \
  -H "Authorization: Bearer ek_eyJhbGciOiJIUzI1NiIs..."
```

### 3. Session Established

Upon successful connection, the engine sends:

```json
{
  "type": "session.created",
  "session": {
    "id": "sess_abc123",
    "model": "openai/gpt-oss-20b",
    "voice": "aura-2-thalia-en"
  }
}
```

## HTTP Endpoints

### Health Check

```bash
GET http://localhost:8787/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Runtime Configuration

The engine exposes HTTP endpoints for managing runtime configuration without restarting:

**Get current config:**
```bash
curl http://localhost:8787/config \
  -H "Authorization: Bearer ${ENGINE_API_KEY}"
```

**Update config:**
```bash
curl -X PUT http://localhost:8787/config \
  -H "Authorization: Bearer ${ENGINE_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "llm": {
      "provider": "groq",
      "model": "openai/gpt-oss-20b"
    }
  }'
```

**Validate config change:**
```bash
curl -X POST http://localhost:8787/config/validate \
  -H "Authorization: Bearer ${ENGINE_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"llm": {"provider": "openrouter"}}'
```

**Reload config from disk:**
```bash
curl -X POST http://localhost:8787/config/reload \
  -H "Authorization: Bearer ${ENGINE_API_KEY}"
```

**List available presets:**
```bash
curl http://localhost:8787/presets \
  -H "Authorization: Bearer ${ENGINE_API_KEY}"
```

## WebSocket Events

### Client → Server Events

| Event | Description |
|-------|-------------|
| `session.update` | Update session configuration |
| `input_audio_buffer.append` | Stream audio chunk (PCM16, 24kHz, mono) |
| `input_audio_buffer.commit` | Signal end of speech |
| `conversation.item.create` | Add text message to conversation |
| `response.create` | Request AI response |
| `response.cancel` | Cancel in-progress response |

### Server → Client Events

| Event | Description |
|-------|-------------|
| `session.created` | Session initialized |
| `input_audio_buffer.speech_started` | Speech detected |
| `input_audio_buffer.speech_stopped` | Speech ended |
| `conversation.item.created` | New conversation item |
| `response.text.delta` | Streaming text response |
| `response.audio.delta` | Streaming audio response (PCM16) |
| `response.done` | Response complete |
| `error` | Error occurred |

### Example: Update Session

```json
{
  "type": "session.update",
  "session": {
    "instructions": "You are a helpful assistant.",
    "voice": "aura-2-thalia-en",
    "turn_detection": {
      "type": "server_vad",
      "threshold": 0.5,
      "silence_duration_ms": 550
    }
  }
}
```

### Example: Send Audio

```json
{
  "type": "input_audio_buffer.append",
  "audio": "base64EncodedPcm16AudioData..."
}
```

## How It Fits With Core

Core and the realtime engine have different responsibilities:

- **Core** prepares and issues short-lived access for session startup (token generation, app management)
- **Realtime engine** runs the session after the client connects (audio processing, AI inference, TTS)

```mermaid
flowchart LR
    A[Browser] -->|Request Token| B[Core]
    B -->|JWT Token| A
    A -->|WebSocket + Token| C[Realtime Engine]
    C -->|Audio/Text Stream| A
```

## What Operators Should Care About

### Public WebSocket Endpoint Stability

Keep the WebSocket URL stable between deployments. Clients store this URL in their configuration.

### Health and Restart Behavior

The engine includes a health check endpoint (`/health`) used by Docker and load balancers. The container restarts automatically on failure (`restart: unless-stopped`).

### Upstream Provider Configuration

Provider settings are loaded from:
1. Environment variables (bootstrap/fallback)
2. Runtime YAML config (`/app/data/config/runtime.yaml`)
3. Runtime config HTTP API

Update providers without restarting:
```bash
curl -X PUT http://localhost:8787/config \
  -H "Authorization: Bearer ${ENGINE_API_KEY}" \
  -d '{"llm": {"provider": "openrouter", "model": "anthropic/claude-3-sonnet"}}'
```

### TLS and Proxy Support

For production deployments behind a reverse proxy:

```nginx
# nginx configuration
location /v1/realtime {
    proxy_pass http://localhost:8787/v1/realtime;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 86400;
    proxy_send_timeout 86400;
}
```

### Logs and Metrics

View engine logs:
```bash
# All logs
bun run stack:logs | grep engine

# Errors only
bun run stack:logs | grep engine | grep -i error

# Session events
bun run stack:logs | grep engine | grep -i "session\|speech\|response"
```

## Provider Configuration

### LLM Providers

Configure the LLM provider via environment variables or runtime config:

**Groq (default, fast):**
```bash
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_your_key
GROQ_MODEL=openai/gpt-oss-20b
```

**OpenRouter (100+ models):**
```bash
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-your_key
OPENROUTER_MODEL=anthropic/claude-3-sonnet
```

### Speech-to-Text

Default: Deepgram Nova-3

```bash
STT_PROVIDER=deepgram
DEEPGRAM_API_KEY=your_key
DEEPGRAM_STT_MODEL=nova-3
DEEPGRAM_STT_LANGUAGE=en-US
```

### Text-to-Speech

Default: Deepgram Aura-2

```bash
TTS_PROVIDER=deepgram
DEEPGRAM_TTS_MODEL=aura-2-thalia-en
```

### Voice Activity Detection

Default: Silero VAD

```bash
VAD_PROVIDER=silero
VAD_ENABLED=true
VAD_THRESHOLD=0.5
VAD_MIN_SILENCE_MS=550
```

## Runtime Config Ownership

The engine persists its runtime configuration as YAML at `/app/data/config/runtime.yaml` on the `engine-data` Docker volume. Environment variables act as bootstrap defaults and fallbacks.

**Config hierarchy (highest priority first):**
1. Runtime config HTTP API updates
2. Runtime YAML file (`/app/data/config/runtime.yaml`)
3. Environment variables

This allows updating configuration without rebuilding or restarting containers.

## Typical Session Flow

1. **Token Acquisition**: Client requests token from Core
2. **WebSocket Connection**: Client connects to engine with token
3. **Session Creation**: Engine validates token and creates session
4. **Audio Streaming**: Client sends audio chunks
5. **Speech Detection**: VAD detects speech start/end
6. **Transcription**: STT converts speech to text
7. **AI Processing**: LLM generates response
8. **Synthesis**: TTS converts text to audio
9. **Streaming**: Audio/text streamed back to client

## Source Repository

The realtime engine is open source at [github.com/usevowel/engine](https://github.com/usevowel/engine).

## Related Docs

- [Architecture](./architecture) - How the engine fits in the stack
- [Core](./core) - Token service and control plane
- [Configuration](./configuration) - Environment variables and config options
- [Deployment](./deployment) - Deploying the full stack
- [Troubleshooting](./troubleshooting) - Debugging engine issues
