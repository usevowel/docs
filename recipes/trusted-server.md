# Trusted Server Connections

This recipe walks through the full trusted-server workflow: minting a token, connecting from a backend service, and handling server-side tool calls.

## Before You Start

Make sure you have:

- A running self-hosted stack (see [Self-Hosted](/self-hosted/))
- An API key with the `mint_trusted_session` scope
- A backend service that can open WebSocket connections

For an overview of all connection patterns, see [Connection Paradigms](/recipes/connection-paradigms).

## What Is a Trusted Server Connection?

A trusted server connection lets your backend participate directly in a voice session. Instead of a browser client, your backend opens the WebSocket, sends audio or text, and receives responses. The realtime engine can also forward tool calls to your backend for server-side execution.

This is useful when:

- you need to drive a voice session from code (automation, testing, orchestration)
- your tools require server-side access (databases, internal APIs, order systems)
- you want to run voice workflows without a browser in the loop

## Key Concepts

### serviceId

A unique string that identifies your backend service. The engine logs it, uses it for analytics, and includes it in tool-call routing. Pick something descriptive, like `order-service` or `ci-test-runner`.

### serverTools

Tool definitions you declare at token-issuance time. Each tool has a name, description, and JSON Schema parameters. When the LLM decides to call one of these tools, the engine forwards the call to your backend over the WebSocket instead of trying to execute it client-side.

### Scope Gating

Trusted-server tokens require the `mint_trusted_session` scope on the API key. This is a separate scope from `mint_ephemeral` (used for browser tokens). A key without the right scope will get a 403 response.

## Step-by-Step

### 1. Create an API Key with the Right Scope

Use the Core API or admin UI to create a fixed API key. The key must carry the `mint_trusted_session` scope.

```bash
curl -X POST https://your-core-host/api/api-keys \
  -H "Authorization: Bearer ${ADMIN_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "your-app-id",
    "scopes": ["mint_trusted_session"],
    "label": "Trusted server key"
  }'
```

Save the returned key. It will look like `vkey_...`.

### 2. Mint a Token

Your backend calls the token endpoint with `connectionType: 'trusted_server'`.

```ts
const tokenResponse = await fetch('https://your-core-host/v1/realtime/sessions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    connectionType: 'trusted_server',
    config: {
      serviceId: 'my-service',
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

const { token, expiresAt } = await tokenResponse.json();
```

The token expires after five minutes. Mint a fresh one for each session.

### 3. Connect via WebSocket

Open a WebSocket to the realtime engine using the token.

```ts
import WebSocket from 'ws';

const ws = new WebSocket('wss://your-engine-host/v1/realtime', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

ws.on('open', () => {
  console.log('Connected to realtime engine');
});

ws.on('message', (data) => {
  const event = JSON.parse(data.toString());
  handleEvent(event);
});
```

### 4. Handle Server Tool Calls

When the LLM calls a server tool, the engine emits a `response.output_item.added` event with a `function_call` item. Your backend executes the tool and sends the result back.

```ts
function handleEvent(event: any) {
  if (event.type === 'response.output_item.added' && event.item?.type === 'function_call') {
    const { call_id, name, arguments: argsJson } = event.item;
    const args = JSON.parse(argsJson || '{}');

    if (name === 'lookupOrder') {
      const result = lookupOrder(args.orderId);

      ws.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id,
          output: JSON.stringify(result),
        },
      }));
    }
  }
}
```

### 5. Send Text or Audio

You can drive the conversation by sending text messages or audio buffers.

```ts
// Send a text message
ws.send(JSON.stringify({
  type: 'conversation.item.create',
  item: {
    type: 'message',
    role: 'user',
    content: [{ type: 'input_text', text: 'What is the status of order 12345?' }],
  },
}));

// Request a response
ws.send(JSON.stringify({ type: 'response.create' }));
```

## Security Checklist

- **Never expose trusted-server tokens in browser code.** They are for backend use only.
- **Use separate API keys** for trusted-server and browser token minting. The scope separation exists for a reason.
- **Rotate keys periodically.** If a key is compromised, revoke it and create a new one.
- **Validate tool inputs.** The engine forwards tool calls as-is. Your backend should validate arguments before executing.
- **Log session lifecycle.** Track token minting, WebSocket connections, and tool-call results for debugging and auditing.

## Troubleshooting

### 403 Forbidden

The API key does not carry the `mint_trusted_session` scope. Create a new key with the correct scope.

### Token Expired

Ephemeral tokens last five minutes. If your backend takes too long between minting and connecting, mint a fresh token.

### Tool Calls Not Arriving

- Verify the tool name in `serverTools` matches exactly what the LLM sees in its tool list.
- Check engine logs for tool-registration messages.
- Make sure the tool is not also registered as a client tool (client tools take priority).

### WebSocket Disconnects

- Check the `maxCallDurationMs` and `maxIdleDurationMs` token claims. Sessions end when either limit is hit.
- Look for error events on the WebSocket. The engine sends `error` events before closing.

## Reference Implementation

If you already use a server-issued token flow for browser clients, the token-minting step is almost identical for trusted-server connections. The main difference is that your backend keeps the WebSocket open itself and handles forwarded tool calls directly.

## Related Docs

- [Connection Paradigms](/recipes/connection-paradigms)
- [Self-Hosted Stack](/self-hosted/)
- [API Reference](/api/)
