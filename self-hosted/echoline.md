# Self-Hosted Speech with Echoline

Echoline provides fully self-hosted speech-to-text (STT) and text-to-speech (TTS) for the vowel stack. It's an optional component that eliminates external speech API dependencies.

## Overview

[Echoline](https://github.com/usevowel/echoline) is an OpenAI-compatible audio server that runs locally:

- **STT:** Uses faster-whisper for speech recognition
- **TTS:** Uses Kokoro for high-quality speech synthesis
- **API:** OpenAI-compatible `/v1/audio/*` endpoints
- **No external dependencies:** Runs entirely within your infrastructure

## When to Use Echoline

**Choose Echoline when:**

- Data privacy requires audio to stay on your infrastructure
- You want to eliminate external API dependencies
- Lower latency is critical (local processing)
- You need offline/air-gapped operation

**Use Deepgram when:**

- You prefer managed, high-quality speech APIs
- GPU resources are limited or unavailable
- Simplicity of setup is prioritized over data locality

## Architecture

When running with Echoline, the stack looks like this:

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Browser   │────▶│     Core     │────▶│    Engine   │
│   (Client)  │     │ (Token/API)  │     │ (Realtime)  │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                    ┌──────────────┐            │ OpenAI-compatible
                    │   Echoline   │◀───────────┘ audio API
                    │ (STT + TTS) │
                    └──────────────┘
```

**Key points:**

- The engine treats Echoline as an `openai-compatible` audio provider
- Echoline runs as a separate container in the Docker Compose stack
- Core and engine remain unchanged - only the audio backend switches
- Echoline itself can use the engine for LLM completions (circular dependency for Realtime API features)

## Quick Start

### 1. Prerequisites

**GPU Mode (Recommended):**
- NVIDIA GPU with 8GB+ VRAM
- NVIDIA drivers installed
- [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html)

**CPU Mode (Development Only):**
- No special requirements
- Significantly slower transcription

### 2. Configure Environment

Edit your `stack.env`:

```bash
# Switch audio providers
STT_PROVIDER=openai-compatible
TTS_PROVIDER=openai-compatible

# Point to echoline container
OPENAI_COMPATIBLE_BASE_URL=http://echoline:8000/v1

# Echoline model configuration
ECHOLINE_STT_MODEL=Systran/faster-whisper-tiny
ECHOLINE_TTS_MODEL=onnx-community/Kokoro-82M-v1.0-ONNX
ECHOLINE_TTS_VOICE=af_heart
DEFAULT_VOICE=af_heart

# Echoline container settings
ECHOLINE_HOST_PORT=8000
ECHOLINE_CHAT_COMPLETION_BASE_URL=http://host.docker.internal:8787/v1
```

### 3. Start the Stack with Echoline

```bash
# From workspace root
cp stack/stack.env.example stack.env
# Edit stack.env with your configuration

docker compose --profile echoline up
```

### 4. Verify Setup

```bash
# Check echoline health
curl http://localhost:8000/health

# Test STT
curl -X POST http://localhost:8000/v1/audio/transcriptions \
  -F file=@test.wav \
  -F model=Systran/faster-whisper-tiny

# Run smoke test
bun run stack:test
```

## Configuration Reference

### Engine Configuration (stack.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `STT_PROVIDER` | Set to `openai-compatible` | `openai-compatible` |
| `TTS_PROVIDER` | Set to `openai-compatible` | `openai-compatible` |
| `OPENAI_COMPATIBLE_BASE_URL` | Echoline URL (Docker internal) | `http://echoline:8000/v1` |
| `ECHOLINE_STT_MODEL` | Whisper model name | `Systran/faster-whisper-tiny` |
| `ECHOLINE_TTS_MODEL` | Kokoro model name | `onnx-community/Kokoro-82M-v1.0-ONNX` |
| `ECHOLINE_TTS_VOICE` | Default TTS voice | `af_heart` |
| `DEFAULT_VOICE` | Engine default voice | `af_heart` |

### Echoline Container Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `ECHOLINE_HOST_PORT` | Host port mapping | `8000` |
| `ECHOLINE_CHAT_COMPLETION_BASE_URL` | LLM backend URL | `http://host.docker.internal:8787/v1` |
| `ECHOLINE_CHAT_COMPLETION_API_KEY` | API key for LLM | `${ENGINE_API_KEY}` |
| `HF_TOKEN` | HuggingFace token (optional) | - |
| `ECHOLINE_LOG_LEVEL` | Logging verbosity | `INFO` |

## Model Selection

### STT Models (faster-whisper)

| Model | Size | VRAM Required | Quality | Use Case |
|-------|------|---------------|---------|----------|
| `tiny` | ~400MB | 2GB | Good | Development, testing |
| `small` | ~900MB | 3GB | Better | Balanced quality/speed |
| `base` | ~1.5GB | 4GB | Good | - |
| `medium` | ~5GB | 8GB | Best | Production quality |
| `large-v3` | ~6GB | 10GB | Excellent | Maximum accuracy |

Set in `stack.env`:
```bash
ECHOLINE_STT_MODEL=Systran/faster-whisper-small
```

### TTS Voices (Kokoro)

Kokoro voices use the format `{gender}{number}_{name}`:

| Voice | Gender | Description |
|-------|--------|-------------|
| `af_heart` | Female | Default, warm |
| `af_bella` | Female | Clear, professional |
| `af_nicole` | Female | Natural, conversational |
| `am_adam` | Male | Deep, authoritative |
| `am_michael` | Male | Warm, friendly |

Set in `stack.env`:
```bash
ECHOLINE_TTS_VOICE=af_heart
DEFAULT_VOICE=af_heart
```

## Docker Compose Profiles

The stack supports multiple deployment profiles:

### Default (Core + Engine + Deepgram)

```bash
docker compose up
```

Uses hosted Deepgram for STT/TTS. Requires `DEEPGRAM_API_KEY`.

### Echoline Profile (Fully Self-Hosted)

```bash
docker compose --profile echoline up
```

Includes Echoline container for local STT/TTS. Requires GPU or CPU mode.

### Full Self-Hosted Profile

```bash
docker compose --profile full-self-hosted up
```

Alias for the full self-hosted deployment.

## CPU-Only Mode

For development without a GPU:

1. Edit `docker-compose.yml` or create `docker-compose.override.yml`:

```yaml
services:
  echoline:
    image: ghcr.io/vowel/echoline:latest-cpu
    deploy:
      resources: {}  # Remove GPU reservation
```

2. Use a smaller model:

```bash
ECHOLINE_STT_MODEL=Systran/faster-whisper-tiny
```

**Warning:** CPU mode is ~10x slower than GPU for real-time transcription. Not recommended for production voice interactions.

## Troubleshooting

### Echoline Won't Start

**Check NVIDIA setup:**
```bash
# Verify drivers
nvidia-smi

# Test Docker GPU access
docker run --rm --gpus all nvidia/cuda:12.0-base nvidia-smi
```

**If no GPU, switch to CPU image:**
```yaml
image: ghcr.io/vowel/echoline:latest-cpu
```

### Slow Transcription

- **GPU:** Check `nvidia-smi` - GPU being used?
- **Model:** Use a smaller model (tiny vs small)
- **CPU mode:** Expected to be slow; upgrade to GPU for production

### Model Download Fails

```bash
# Check disk space
docker system df

# Check echoline logs
docker logs vowel-echoline

# Set HF_TOKEN for gated models
HF_TOKEN=your_huggingface_token
```

### Audio Quality Issues

- Check audio format: Echoline expects PCM16, 16kHz for STT
- Verify voice name is valid: use exact Kokoro voice ID
- Test directly: `curl http://localhost:8000/v1/audio/speech ...`

### Engine Can't Connect to Echoline

```bash
# Check both services are on same network
docker network ls
docker network inspect vowel-self-hosted_default

# Test from engine container
docker exec -it vowel-engine wget -qO- http://echoline:8000/health

# Verify OPENAI_COMPATIBLE_BASE_URL uses container name, not localhost
OPENAI_COMPATIBLE_BASE_URL=http://echoline:8000/v1  # Correct
```

## Performance Tuning

### GPU Optimization

- Use CUDA 12.x for best compatibility
- Ensure models fit in GPU memory (watch `nvidia-smi`)
- Share GPU between echoline and other services if VRAM permits

### Model Warmup

First transcription is slower due to model loading. Keep Echoline running for consistent performance.

### Caching

Models are cached in the `echoline-cache` Docker volume:

```bash
# View cache location
docker volume inspect vowel-self-hosted_echoline-cache

# To reset models (if corrupted)
docker compose down -v  # WARNING: deletes all data
```

## Comparison: Echoline vs Deepgram

| Feature | Echoline | Deepgram |
|---------|----------|----------|
| **Setup Complexity** | Higher (GPU/Docker) | Lower (API key only) |
| **Latency** | Lower (local) | Higher (network) |
| **Data Privacy** | Complete (on-prem) | Hosted (transmission) |
| **Cost** | Infrastructure | Per-usage |
| **Quality** | Good (Whisper/Kokoro) | Excellent (Nova/Aura) |
| **Offline Operation** | Yes | No |
| **Maintenance** | Self-managed | Managed |

## Migration: Deepgram to Echoline

1. Set `STT_PROVIDER=openai-compatible` and `TTS_PROVIDER=openai-compatible`
2. Add `OPENAI_COMPATIBLE_BASE_URL=http://echoline:8000/v1`
3. Configure `ECHOLINE_*` models and voices
4. Remove `DEEPGRAM_API_KEY` (optional, for fallback)
5. Start with `--profile echoline`
6. Test: `bun run stack:test`

## See Also

- [Echoline Repository](https://github.com/usevowel/echoline)
- [Self-Hosted Overview](/self-hosted/)
- [Engine Configuration](/self-hosted/engine)
- [Troubleshooting](/self-hosted/troubleshooting)
