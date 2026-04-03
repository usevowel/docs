# Self-Hosted Troubleshooting

Use this page to narrow down the most common self-hosted failures and debug issues with practical commands.

## Quick Diagnostic Commands

### Check Service Health

```bash
# Engine health check
curl http://localhost:8787/health

# Core health check
curl http://localhost:3000/health

# Expected response: {"status":"ok"}
```

### View Service Logs

```bash
# All services (follow mode)
bun run stack:logs

# Filter for specific service
bun run stack:logs | grep engine
bun run stack:logs | grep core

# Check bootstrap confirmation
bun run stack:logs | grep bootstrap

# View last 100 lines
bun run stack:logs --tail 100
```

### Check Container Status

```bash
# List running containers
docker ps | grep vowel

# Check container logs directly
docker logs vowel-engine
docker logs vowel-core

# Follow container logs
docker logs -f vowel-engine
docker logs -f vowel-core
```

## Token Issuance Fails

### Diagnostic Steps

1. **Check Core is running:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Verify required secrets are set:**
   ```bash
   grep -E 'ENCRYPTION_KEY|JWT_SECRET|ENGINE_API_KEY' stack.env
   ```

3. **Test token endpoint directly:**
   ```bash
   curl -X POST http://localhost:3000/vowel/api/generateToken \
     -H "Content-Type: application/json" \
     -H "X-API-Key: vkey_your_bootstrap_key" \
     -d '{
       "appId": "default",
       "provider": "vowel-prime"
     }'
   ```

4. **Check Core logs for errors:**
   ```bash
   bun run stack:logs | grep core | grep -i error
   ```

### Common Causes and Solutions

| Symptom | Cause | Solution |
|---------|-------|----------|
| `401 Unauthorized` | Invalid or missing API key | Verify `X-API-Key` header matches `CORE_BOOTSTRAP_PUBLISHABLE_KEY` |
| `500 Internal Server` | Missing `ENCRYPTION_KEY` | Add `ENCRYPTION_KEY` to `stack.env` and restart |
| `404 Not Found` | Wrong endpoint URL | Use `POST /vowel/api/generateToken` |
| Empty response | Core not healthy | Check `curl http://localhost:3000/health` |

## Realtime Connection Fails

### Diagnostic Steps

1. **Check WebSocket endpoint is reachable:**
   ```bash
   # Using wscat (install with: npm install -g wscat)
   wscat -c "ws://localhost:8787/v1/realtime" \
     -H "Authorization: Bearer ek_your_ephemeral_token"

   # Or using curl (HTTP upgrade test)
   curl -i -N \
     -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Authorization: Bearer ek_your_token" \
     http://localhost:8787/v1/realtime
   ```

2. **Verify token validity:**
   ```bash
   # Decode JWT payload (second segment)
   echo "eyJ..." | base64 -d | jq .
   ```

3. **Check token expiration:**
   ```bash
   # Look for "exp" field in decoded JWT
   # Tokens expire after 5 minutes by default
   ```

4. **Check engine logs:**
   ```bash
   bun run stack:logs | grep engine | grep -i "websocket\|session\|auth"
   ```

### Common Causes and Solutions

| Symptom | Cause | Solution |
|---------|-------|----------|
| Connection refused | Engine not running | Check `docker ps` and `bun run stack:logs` |
| 401 on WebSocket | Invalid/expired token | Generate new token from Core |
| 403 Forbidden | Wrong environment | Verify token was minted for correct engine |
| TLS error | HTTPS required | Use WSS:// in production, or set `NODE_ENV=development` |
| Proxy 502 error | WebSocket not forwarded | Configure proxy to forward `Upgrade` headers |

## Browser Microphone Issues

### Diagnostic Steps

1. **Check HTTPS (required for microphone):**
   ```bash
   # Development exception: localhost works over HTTP
   # Production: must use HTTPS
   ```

2. **Verify microphone permissions in browser:**
   - Chrome: Click lock icon in address bar → Site settings → Microphone
   - Firefox: Click lock icon → Permissions → Microphone

3. **Test microphone availability:**
   ```javascript
   // In browser console
   navigator.mediaDevices.getUserMedia({ audio: true })
     .then(stream => console.log('Mic access granted'))
     .catch(err => console.error('Mic access denied:', err));
   ```

4. **Check browser console for errors:**
   - Look for `NotAllowedError` (permission denied)
   - Look for `NotFoundError` (no microphone)
   - Look for WebSocket connection errors

### Common Causes and Solutions

| Symptom | Cause | Solution |
|---------|-------|----------|
| `NotAllowedError` | Permission denied | Grant microphone permission in browser settings |
| `NotFoundError` | No microphone detected | Connect microphone and refresh |
| Silence after connecting | VAD not detecting speech | Check `VAD_ENABLED=true` and speak clearly |
| No audio output | TTS misconfigured | Verify `DEEPGRAM_API_KEY` and TTS model |

## Provider Misconfiguration

### Diagnostic Steps

1. **Check provider credentials in environment:**
   ```bash
   grep -E 'GROQ_API_KEY|OPENROUTER_API_KEY|DEEPGRAM_API_KEY' stack.env
   ```

2. **Test provider directly:**
   ```bash
   # Test Deepgram
   curl -X POST https://api.deepgram.com/v1/listen \
     -H "Authorization: Token ${DEEPGRAM_API_KEY}" \
     -H "Content-Type: audio/wav" \
     --data-binary @test.wav

   # Test Groq
   curl https://api.groq.com/openai/v1/models \
     -H "Authorization: Bearer ${GROQ_API_KEY}"
   ```

3. **Check engine logs for provider errors:**
   ```bash
   bun run stack:logs | grep engine | grep -i "groq\|deepgram\|provider\|error"
   ```

4. **Verify model names:**
   ```bash
   # Check available models in provider console
   # Groq: https://console.groq.com/docs/models
   # OpenRouter: https://openrouter.ai/models
   ```

### Common Causes and Solutions

| Symptom | Cause | Solution |
|---------|-------|----------|
| `401 Unauthorized` from provider | Invalid API key | Regenerate key from provider console |
| `404 Model not found` | Invalid model ID | Check provider docs for correct model string |
| `429 Rate limited` | Quota exceeded | Check provider usage dashboard |
| `500 Provider error` | Provider outage | Check provider status page |
| STT returns empty | Audio format issue | Verify PCM16, 24kHz, mono format |

## Port, Host, Or Proxy Issues

### Diagnostic Steps

1. **Check ports are not in use:**
   ```bash
   # macOS/Linux
   lsof -i :3000
   lsof -i :8787

   # Or use netstat
   netstat -tulpn | grep -E '3000|8787'
   ```

2. **Test with custom ports:**
   ```bash
   CORE_HOST_PORT=3001 ENGINE_HOST_PORT=8788 bun run stack:up
   ```

3. **Check reverse proxy configuration:**
   ```bash
   # Test WebSocket through proxy
   wscat -c "wss://your-domain.com/v1/realtime" \
     -H "Authorization: Bearer ek_your_token"
   ```

4. **Verify proxy forwards Upgrade headers:**
   ```nginx
   # nginx example
   proxy_http_version 1.1;
   proxy_set_header Upgrade $http_upgrade;
   proxy_set_header Connection "upgrade";
   proxy_read_timeout 86400;
   ```

### Common Causes and Solutions

| Symptom | Cause | Solution |
|---------|-------|----------|
| `bind: address already in use` | Port conflict | Use `CORE_HOST_PORT`/`ENGINE_HOST_PORT` to change ports |
| WebSocket closes immediately | Proxy drops Upgrade | Configure proxy to forward WebSocket headers |
| 502 Bad Gateway | Proxy can't reach service | Check service is running and proxy target is correct |
| CORS errors | Origin not allowed | Configure CORS in reverse proxy or Core |
| SSL error | TLS certificate issue | Verify certificate chain and domain match |

## Container Issues

### Container Won't Start

```bash
# Check container status
docker ps -a | grep vowel

# Check for port conflicts
docker logs vowel-core 2>&1 | head -50
docker logs vowel-engine 2>&1 | head -50

# Rebuild and restart
bun run stack:down
bun run stack:build
bun run stack:up
```

### Container Exits Immediately

Common causes:
- Missing required environment variables
- Invalid encryption key format
- Database permission issues

Check logs:
```bash
docker logs vowel-core
docker logs vowel-engine
```

### Volume Permission Issues

```bash
# Check volume contents
docker run --rm -v vowel-self-hosted_core-data:/data alpine ls -la /data
docker run --rm -v vowel-self-hosted_engine-data:/data alpine ls -la /data

# Reset volumes (WARNING: deletes data)
bun run stack:down
# Volumes are removed with --volumes flag
```

## Bootstrap Issues

### App Not Created

Check bootstrap logs:
```bash
bun run stack:logs | grep bootstrap
```

Expected output:
```
[core] bootstrap publishable key created for app=default
```

If bootstrap fails:
1. Verify `CORE_BOOTSTRAP_PUBLISHABLE_KEY` is set
2. Check `CORE_BOOTSTRAP_APP_ID` is valid (alphanumeric, no spaces)
3. Ensure Core can write to `/app/data` volume

### API Key Not Working

Verify the key matches:
```bash
# Check what you configured
grep CORE_BOOTSTRAP_PUBLISHABLE_KEY stack.env

# Check what Core created (in logs)
bun run stack:logs | grep -i "publishable key"
```

## Smoke Test Failures

The smoke test (`bun run stack:test`) validates:
1. Engine health endpoint
2. Core health endpoint
3. Token minting
4. WebSocket connection

If the smoke test fails:

```bash
# Run with verbose output
bun run stack:test --verbose

# Check individual components
curl http://localhost:8787/health
curl http://localhost:3000/health

# Test token generation manually
curl -X POST http://localhost:3000/vowel/api/generateToken \
  -H "Content-Type: application/json" \
  -H "X-API-Key: vkey_your_key" \
  -d '{"appId":"default","provider":"vowel-prime"}'
```

## Getting More Help

If issues persist:

1. **Collect diagnostic information:**
   ```bash
   # Service status
   docker ps | grep vowel

   # Recent logs
   bun run stack:logs --tail 200 > vowel-logs.txt

   # Environment (redact secrets)
   grep -v '^#' stack.env | grep -v '^$'
   ```

2. **Check provider status pages:**
   - Groq: https://status.groq.com
   - Deepgram: https://status.deepgram.com
   - OpenRouter: https://status.openrouter.ai

3. **Review the deployment and configuration docs:**
   - [Deployment](./deployment)
   - [Configuration](./configuration)
