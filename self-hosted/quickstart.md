# Quickstart

Complete walkthrough from clone to working voice demo.

## Prerequisites

Before starting, ensure you have:

- [Bun](https://bun.sh) installed (recommended) or Node.js with npm/yarn
- [Docker](https://docker.com) and Docker Compose
- API keys from [Deepgram](https://deepgram.com) (speech-to-text) and either [Groq](https://groq.com) or [OpenRouter](https://openrouter.ai) (LLM)

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone https://github.com/usevowel/stack.git
cd stack
```

The stack includes submodules for Core, Engine, Client SDK, and demos:

```bash
# Initialize all submodules
git submodule update --init --recursive
```

### 2. Install Dependencies

Install dependencies for all workspaces:

```bash
# Install root dependencies
bun install --no-cache

# Install client SDK dependencies
cd client && bun install --no-cache && cd ..

# Install Core dependencies
cd core && bun install --no-cache && cd ..

# Install demo dependencies
cd demos/demo && bun install --no-cache && cd ../..
```

### 3. Build Client and UI Assets

Build the Client SDK and Core UI assets before starting the stack:

```bash
bun run build
```

### 4. Copy Environment Template

Create your environment file from the example template:

```bash
cp stack.env.example .env
```

### 5. Configure Required Variables

Edit `.env` and configure the following:

| Variable | Description | How to Set |
|----------|-------------|------------|
| `DEEPGRAM_API_KEY` | Speech-to-text API key | Get from [deepgram.com](https://deepgram.com) |
| `LLM_PROVIDER` | Choose `groq` or `openrouter` | Set provider name |
| `GROQ_API_KEY` or `OPENROUTER_API_KEY` | LLM API key | Get from your chosen provider |
| `VAD_PROVIDER` | Voice activity detection | Set to `none` if using Deepgram Nova-3 (has built-in VAD) |
| `VAD_ENABLED` | Enable/disable VAD | Set to `false` when using Deepgram Nova-3 |
| `ENCRYPTION_KEY` | Encryption for sensitive data | Generate a secure random string |
| `ENGINE_API_KEY` | Engine authentication | Generate a secure random string |
| `JWT_SECRET` | Token signing secret | Generate a secure random string |
| `CORE_BOOTSTRAP_PUBLISHABLE_KEY` | Bootstrap API key | Generate a secure random string |

**Security key generation tip:** Use a secure random generator for all keys (64+ character hex strings recommended).

### 6. Start the Stack

Start all services with Docker Compose:

```bash
bun run stack:up
```

This builds and starts Core (token service + Web UI) and the Realtime Engine (WebSocket voice server).

Services will be available at:
- **Core**: http://localhost:3000 (token service, Web UI)
- **Engine**: ws://localhost:8787/v1/realtime (WebSocket for voice)

### 7. Create an App and API Key in Core UI

1. Open the Core UI at `http://localhost:3000`
2. Navigate to **Apps** and click **"Create app"**
   - Give your app a name (e.g., "Local Stack App")
   - Save to create the app
3. Create a publishable key:
   - Click **"Manage keys"** on your new app
   - Click **"Create key"**
   - Add a label for the key
   - Select **"Generate session tokens"** scope
   - Select **"Vowel Engine"** as an allowed provider
   - Click **Create**
4. Copy the key (starts with `vkey_`) - you'll need it for the demo configuration
5. Also copy the **App ID** displayed in the app details

### 8. Validate Setup via Test Lab

Before integrating your own application, verify the stack works:

1. In Core UI, navigate to **Test Lab** (left sidebar)
2. Click **"Generate and inspect token"** to create a sample token
3. Scroll to **Live validation client**
4. Click the microphone icon, allow browser permissions, and speak (e.g., "Hello, can you hear me?")
5. Verify transcript appears and AI responds - this confirms the full pipeline works

### 9. Configure Demo Environment

To run the included e-commerce demo application:

```bash
# Create demo environment file
cat > demos/demo/.env.local << 'EOF'
VITE_USE_CORE_COMPOSE=1
VITE_CORE_BASE_URL=http://localhost:3000
VITE_CORE_TOKEN_ENDPOINT=http://localhost:3000/vowel/api/generateToken
VITE_CORE_API_KEY=vkey_your-64-char-hex-key-here
VITE_CORE_APP_ID=your-app-id-from-core-ui
EOF
```

Replace:
- `vkey_your-64-char-hex-key-here` with your publishable key from step 7
- `your-app-id-from-core-ui` with your app ID from step 7

### 10. Start the Demo

Launch the demo development server:

```bash
bun run demo:dev
```

Open the provided localhost URL (e.g., `http://localhost:3902`) in your browser. Click the microphone and speak to test real-time voice interaction with the demo e-commerce application.

## Next Steps

- **[Architecture](./architecture)** - Understand how the components work together
- **[Configuration](./configuration)** - Complete environment variable reference
- **[Core](./core)** - Token service API details
- **[Realtime Engine](./engine)** - WebSocket API and events
- **[Troubleshooting](./troubleshooting)** - Debug common issues
