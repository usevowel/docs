# Connection Paradigms

Use this recipe when the standard hosted `appId` flow is not enough and you need a more advanced connection pattern.

## Before You Start

For the conceptual overview, start with [Connection Models](/guide/connection-models).

This page focuses on advanced implementation patterns rather than first-time setup.

## Pattern 1: Server-Issued Tokens

Use this pattern when your backend should decide whether a browser session can start.

### Flow

1. The client requests a token from your backend.
2. Your backend checks auth, session context, or product rules.
3. Your backend returns a short-lived token response.
4. The client connects with `tokenProvider`.

### Example

```ts
import { Vowel } from '@vowel.to/client';

const vowel = new Vowel({
  tokenProvider: async () => {
    const response = await fetch('/api/vowel/token', {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Unable to fetch session token');
    }

    return response.json();
  },
});
```

### Good Fit

- custom auth requirements
- backend-controlled session policy
- self-hosted deployments

## Pattern 2: Sidecar Sessions

Use this pattern when a browser client and a backend service need to participate in the same session lifecycle.

Typical examples:

- server-assisted tool execution
- session monitoring
- multi-client coordination

### Design Notes

- keep session identifiers stable for the lifetime of the shared session
- make one system the source of truth for token issuance
- ensure each participant has the minimum permissions it needs

## Pattern 3: Trusted Server Connections

Use this pattern when a trusted backend service needs a realtime connection for automation or orchestration.

Typical examples:

- backend-to-backend voice workflows
- automated testing or scripted interactions
- server-managed tools that should not run in the browser

### How It Works

The trusted server pattern lets your backend connect directly to the realtime engine without a browser client in the loop. Your backend mints a short-lived token, opens a WebSocket, and manages the voice session programmatically.

Key concepts:

- **serviceId** - a unique identifier for your backend service. The engine uses it for logging, analytics, and tool routing.
- **serverTools** - tool definitions your backend registers at token-issuance time. The engine forwards tool calls to your backend instead of executing them client-side.
- **Scope gating** - only API keys with the `mint_trusted_session` scope can mint trusted-server tokens. This prevents accidental use by keys intended for browser flows.

### Flow

1. Your backend authenticates with a fixed API key that carries the `mint_trusted_session` scope.
2. Your backend requests a token, passing `connectionType: 'trusted_server'`, a `serviceId`, and optional `serverTools`.
3. Core validates the scope and forwards the request to the realtime engine.
4. The engine returns a short-lived ephemeral token.
5. Your backend opens a WebSocket to the engine using that token.
6. When the LLM calls a server tool, the engine forwards the call to your backend over the same WebSocket and waits for the result.

### Token Request Example

```ts
const response = await fetch('https://your-core-host/v1/realtime/sessions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    connectionType: 'trusted_server',
    config: {
      serviceId: 'order-service',
      provider: 'vowel-prime',
      voiceConfig: {
        model: 'openai/gpt-oss-120b',
        voice: 'Ashley',
      },
      serverTools: [
        {
          name: 'lookupOrder',
          description: 'Look up an order by ID',
          parameters: {
            type: 'object',
            properties: {
              orderId: { type: 'string', description: 'Order ID' },
            },
            required: ['orderId'],
          },
        },
      ],
    },
  }),
});
```

### Security Boundaries

- **API key scope** - the `mint_trusted_session` scope is separate from `mint_ephemeral`. A key meant for browser token minting cannot accidentally create trusted-server sessions.
- **Short-lived tokens** - ephemeral tokens expire after five minutes by default. Your backend should mint a fresh token for each session.
- **No browser exposure** - trusted-server tokens should never reach a browser. Keep them server-side.
- **Tool isolation** - server tools are registered at token-issuance time. The engine will only forward calls for tools declared in the token.

### Good Fit

- backend automation that drives voice sessions
- server-side tool execution (database lookups, order management, etc.)
- scripted testing or CI pipelines that exercise the voice stack
- multi-service architectures where a backend orchestrates the conversation

### See Also

- [Trusted Server Recipe](/recipes/trusted-server) for a full walkthrough
- [Self-Hosted Stack](/self-hosted/) for deployment details

## Common Pitfalls

- token responses that do not match the SDK's expected shape
- expired tokens reused across reconnects
- mismatched client and backend assumptions about session ownership
- exposing trusted credentials in client bundles

## Related Docs

- [Connection Models](/guide/connection-models)
- [Self-Hosted](/self-hosted/)
