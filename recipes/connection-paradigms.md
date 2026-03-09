# Connection Paradigms

Advanced connection patterns for server-side integrations, multi-client sessions, and enterprise deployments.

## Overview

Vowel supports multiple connection paradigms beyond the standard client-side integration:

- **Fixed API Keys** - Long-lived keys for trusted backend services
- **Developer-Managed Ephemeral Tokens** - Backend mints short-lived tokens for clients
- **Direct WebSocket Connections** - Server-to-server connections using fixed API keys
- **Sidecar Pattern** - Multiple connections (client + server) joining the same session

These paradigms enable:
- Server-side tool execution
- Multi-client collaboration
- Enterprise security requirements
- OpenAI Realtime API compatibility

## Prerequisites

- A Vowel account with API key management access
- Backend server (Node.js, Python, etc.)
- Understanding of WebSocket connections
- Basic knowledge of JWT tokens

## Fixed API Keys

Fixed API keys are long-lived credentials for trusted backend services. They enable server-side operations without user authentication.

### Creating an API Key

**⚠️ Note:** The admin UI for creating fixed API keys is currently under development. For now, use one of these methods:

#### Method 1: Convex Dashboard (Recommended)

1. Go to your Convex dashboard: https://dashboard.convex.dev
2. Navigate to your project → Functions tab
3. Find and run `apiKeys:create` action with:
   ```json
   {
     "appId": "your-app-id",
     "scopes": ["mint_ephemeral"],
     "label": "My API Key"
   }
   ```
4. **Copy the returned `key` immediately** - it's only shown once!
5. Format: `vkey_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

#### Method 2: Convex HTTP API

```bash
curl -X POST https://your-deployment.convex.cloud/api/action/apiKeys/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "appId": "your-app-id",
    "scopes": ["mint_ephemeral", "direct_ws"],
    "label": "Production Key"
  }'
```

#### Method 3: Admin UI (Coming Soon)

Once the admin UI is complete, you'll be able to:
1. Navigate to your app settings
2. Go to "API Keys" section  
3. Click "Create API Key"
4. Select scopes:
   - `mint_ephemeral` - Generate ephemeral tokens
   - `direct_ws` - Direct WebSocket connections
5. Copy the key (shown only once!)

### Using Fixed API Keys

```typescript
// Backend (Node.js example)
import fetch from 'node-fetch';

const API_KEY = 'vkey_your_fixed_api_key_here';
const BASE_URL = 'https://api.vowel.to';

// Generate ephemeral token for client
async function generateClientToken(sessionKey?: string) {
  const response = await fetch(`${BASE_URL}/v1/realtime/sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-realtime-preview',
      sessionKey: sessionKey, // Optional: join existing session
      tools: [
        {
          type: 'function',
          name: 'processOrder',
          description: 'Process a customer order',
          parameters: {
            type: 'object',
            properties: {
              orderId: { type: 'string' },
              amount: { type: 'number' },
            },
            required: ['orderId', 'amount'],
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.client_secret.value; // Ephemeral token
}
```

### Security Best Practices

- **Never expose fixed API keys** in client-side code
- **Store keys securely** using environment variables or secret management
- **Rotate keys regularly** for production deployments
- **Use scope restrictions** - only grant necessary permissions
- **Monitor key usage** in the admin dashboard

## Developer-Managed Ephemeral Tokens

Your backend generates short-lived tokens for clients, giving you full control over session creation and security.

### Flow

```
┌─────────┐         ┌─────────┐         ┌─────────┐
│ Client  │────────▶│ Backend │────────▶│  Vowel  │
│         │ Request │         │ Mint    │   API   │
│         │◀────────│         │◀────────│         │
│         │ Token   │         │ Token   │         │
└─────────┘         └─────────┘         └─────────┘
     │
     │ Connect with token
     ▼
┌─────────┐
│  Voice  │
│ Session │
└─────────┘
```

### Backend Implementation

```typescript
// Backend endpoint (Express.js example)
import express from 'express';
import { generateClientToken } from './vowel-api';

const app = express();

app.post('/api/vowel/token', async (req, res) => {
  try {
    // Authenticate your user (your own auth system)
    const userId = await authenticateUser(req);
    
    // Optional: Generate or reuse sessionKey for sidecar pattern
    const sessionKey = req.body.sessionKey || generateSessionKey();
    
    // Mint ephemeral token from Vowel
    const ephemeralToken = await generateClientToken(sessionKey);
    
    res.json({
      token: ephemeralToken,
      sessionKey: sessionKey, // Return for client to use
      expiresAt: Date.now() + 3600000, // 1 hour
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function generateSessionKey(): string {
  const randomBytes = crypto.randomBytes(16);
  return `sesskey_${randomBytes.toString('hex')}`;
}
```

### Client Implementation

```typescript
// Client-side (React example)
import { Vowel } from '@vowel.to/client';
import { useEffect, useState } from 'react';

function VoiceAgent() {
  const [vowel, setVowel] = useState<Vowel | null>(null);

  useEffect(() => {
    async function initialize() {
      // Request token from your backend
      const response = await fetch('/api/vowel/token', {
        method: 'POST',
        credentials: 'include', // Include auth cookies
      });
      
      const { token, sessionKey } = await response.json();
      
      // Create Vowel client with token
      const client = new Vowel({
        appId: 'your-app-id',
        voiceConfig: {
          provider: 'vowel-prime',
          // Pass token directly (bypasses platform token endpoint)
          token: token,
        },
      });
      
      await client.connect();
      setVowel(client);
    }
    
    initialize();
  }, []);

  return <div>Voice agent ready</div>;
}
```

### Benefits

- **Centralized control** - All token generation in your backend
- **Custom security** - Integrate with your auth system
- **Usage tracking** - Monitor token generation in your logs
- **Session management** - Control session lifecycle server-side

## Direct WebSocket Connections

Connect directly from your backend server to Vowel's WebSocket API using fixed API keys. Perfect for server-side tool execution and automation.

### Use Cases

- Server-side tool execution
- Automated voice interactions
- Backend-to-backend communication
- Integration testing

### Implementation

```typescript
// Backend WebSocket connection (Node.js)
import WebSocket from 'ws';

const API_KEY = 'vkey_your_fixed_api_key_here';
const WS_URL = 'wss://api.vowel.to/v1/realtime';

async function connectDirectWebSocket() {
  // Connect with fixed API key
  const ws = new WebSocket(WS_URL, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    },
  });

  ws.on('open', () => {
    console.log('Connected to Vowel WebSocket');
    
    // Send session update with tools
    ws.send(JSON.stringify({
      type: 'session.update',
      session: {
        tools: [
          {
            type: 'function',
            name: 'serverAction',
            description: 'Execute server-side action',
            parameters: {
              type: 'object',
              properties: {
                action: { type: 'string' },
                params: { type: 'object' },
              },
            },
          },
        ],
      },
    }));
  });

  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'conversation.item.created') {
      const item = message.item;
      
      if (item.type === 'message' && item.role === 'user') {
        console.log('User said:', item.content);
      }
    }
    
    if (message.type === 'response.audio_transcript.delta') {
      console.log('AI transcript:', message.delta);
    }
    
    // Handle tool calls
    if (message.type === 'response.function_call_arguments.done') {
      const toolCall = message.function_call;
      handleToolCall(toolCall);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('close', () => {
    console.log('WebSocket closed');
  });
}

async function handleToolCall(toolCall: any) {
  const { name, arguments: args } = toolCall;
  
  // Execute server-side tool
  if (name === 'serverAction') {
    const result = await executeServerAction(args.action, args.params);
    
    // Send tool result back
    ws.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id: toolCall.call_id,
        output: JSON.stringify(result),
      },
    }));
  }
}
```

## Sidecar Pattern

The sidecar pattern allows multiple connections (client + server) to join the same session. Both can define tools, and all connections share conversation history.

### Architecture

```
┌─────────┐         ┌─────────┐
│ Client  │────────▶│         │
│         │         │         │
└─────────┘         │  Vowel  │
                    │ Session │
┌─────────┐         │         │
│ Server  │────────▶│         │
│         │         │         │
└─────────┘         └─────────┘
     │                   │
     │ Same sessionKey   │
     └───────────────────┘
```

### Use Case: Client + Server Tools

Client defines UI tools, server defines backend tools - both work together:

```typescript
// Backend: Create session with server tools
async function createSessionWithServerTools() {
  const sessionKey = generateSessionKey();
  
  const response = await fetch(`${BASE_URL}/v1/realtime/sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionKey: sessionKey,
      tools: [
        {
          type: 'function',
          name: 'processPayment',
          description: 'Process payment on server',
          parameters: {
            type: 'object',
            properties: {
              amount: { type: 'number' },
              currency: { type: 'string' },
            },
          },
        },
      ],
    }),
  });
  
  const { client_secret } = await response.json();
  
  return {
    sessionKey: sessionKey,
    token: client_secret.value,
  };
}

// Client: Connect to same session with client tools
const client = new Vowel({
  appId: 'your-app-id',
  voiceConfig: {
    provider: 'vowel-prime',
    token: serverToken, // Token from backend
  },
});

// Register client-side tools
client.registerAction('updateUI', {
  description: 'Update UI element',
  parameters: {
    elementId: { type: 'string' },
    value: { type: 'string' },
  },
}, async ({ elementId, value }) => {
  document.getElementById(elementId)!.textContent = value;
});

// Both client and server tools are now available!
```

### Use Case: Multi-Client Collaboration

Multiple clients can join the same session:

```typescript
// Client 1: Creates session
const session1 = await createSession();
const { sessionKey, token } = session1;

// Client 2: Joins same session
const client2 = new Vowel({
  appId: 'your-app-id',
  voiceConfig: {
    provider: 'vowel-prime',
    token: await getTokenForSession(sessionKey), // Same sessionKey
  },
});

// Both clients share conversation and tools
```

### SessionKey Format

SessionKeys follow this format:
- Prefix: `sesskey_`
- Format: `sesskey_{32_hex_characters}`
- Example: `sesskey_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

### OpenAI Compatibility

For OpenAI Realtime API compatibility, use `call_id` query parameter:

```typescript
// Connect with call_id (OpenAI pattern)
const ws = new WebSocket(
  `wss://api.vowel.to/v1/realtime?call_id=${sessionKey}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }
);
```

## Complete Example: E-commerce Voice Assistant

Combining all paradigms for a complete solution:

```typescript
// Backend: Express.js server
import express from 'express';
import { VowelAPI } from './vowel-api';

const app = express();
const vowelAPI = new VowelAPI(process.env.VOWEL_API_KEY!);

// Endpoint: Create voice session with server tools
app.post('/api/voice/session', async (req, res) => {
  const userId = req.user.id; // Your auth
  
  // Generate sessionKey
  const sessionKey = generateSessionKey();
  
  // Create session with server-side tools
  const { token } = await vowelAPI.createSession({
    sessionKey: sessionKey,
    tools: [
      {
        type: 'function',
        name: 'getOrderStatus',
        description: 'Get order status from database',
        parameters: {
          type: 'object',
          properties: {
            orderId: { type: 'string' },
          },
        },
      },
      {
        type: 'function',
        name: 'processRefund',
        description: 'Process refund for order',
        parameters: {
          type: 'object',
          properties: {
            orderId: { type: 'string' },
            amount: { type: 'number' },
          },
        },
      },
    ],
  });
  
  // Store sessionKey for later server connection
  await storeSessionKey(userId, sessionKey);
  
  res.json({ token, sessionKey });
});

// WebSocket handler for server-side tool execution
app.ws('/api/voice/server', async (ws, req) => {
  const userId = req.user.id;
  const sessionKey = await getSessionKey(userId);
  
  // Connect server to same session
  const serverWs = await vowelAPI.connectToSession(sessionKey);
  
  serverWs.on('message', async (data) => {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'response.function_call_arguments.done') {
      const { name, arguments: args } = message.function_call;
      
      // Execute server-side tools
      let result;
      if (name === 'getOrderStatus') {
        result = await getOrderFromDB(args.orderId);
      } else if (name === 'processRefund') {
        result = await processRefundInDB(args.orderId, args.amount);
      }
      
      // Send result back
      serverWs.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: message.function_call.call_id,
          output: JSON.stringify(result),
        },
      }));
    }
  });
});

// Client: React component
function VoiceAssistant() {
  const [vowel, setVowel] = useState<Vowel | null>(null);
  
  useEffect(() => {
    async function init() {
      // Get token from backend
      const { token, sessionKey } = await fetch('/api/voice/session', {
        credentials: 'include',
      }).then(r => r.json());
      
      // Create client with client-side tools
      const client = new Vowel({
        appId: 'your-app-id',
        voiceConfig: {
          provider: 'vowel-prime',
          token: token,
        },
      });
      
      // Register client-side UI tools
      client.registerAction('showProduct', {
        description: 'Show product on screen',
        parameters: {
          productId: { type: 'string' },
        },
      }, async ({ productId }) => {
        navigate(`/products/${productId}`);
      });
      
      await client.connect();
      setVowel(client);
    }
    
    init();
  }, []);
  
  return <VowelMicrophone client={vowel} />;
}
```

## Security Considerations

### API Key Security

- **Never commit keys** to version control
- **Use environment variables** or secret management
- **Rotate keys regularly** (every 90 days recommended)
- **Monitor usage** for anomalies
- **Use least privilege** - only grant necessary scopes

### Token Security

- **Short expiration** - Ephemeral tokens expire in 1 hour
- **HTTPS only** - Always use secure connections
- **Validate origins** - Check request origins server-side
- **Rate limiting** - Prevent token generation abuse

### Session Security

- **SessionKey secrecy** - Treat sessionKeys as secrets
- **Access control** - Verify user permissions before joining sessions
- **Session cleanup** - Clean up abandoned sessions
- **Idle timeout** - Sessions close after inactivity

## Troubleshooting

### "Invalid API key"

- Check key format: Should start with `vkey_`
- Verify key is active in admin dashboard
- Ensure correct scope permissions

### "Token expired"

- Tokens expire after 1 hour
- Generate new token from backend
- Implement token refresh logic

### "Session not found"

- Verify sessionKey format
- Check session hasn't expired
- Ensure all connections use same sessionKey

### "Tool not found"

- Verify tool name matches exactly
- Check tool is registered before use
- Ensure tool definitions match between client/server

## Related Documentation

- [API Reference](/api/) - Complete API documentation
- [Custom Actions](./custom-actions) - Defining custom tools
- [Event Notifications](./event-notifications) - Programmatic responses
- [Getting Started](/guide/getting-started) - Basic integration guide

## Next Steps

- Set up your first API key in the admin dashboard
- Implement developer-managed tokens in your backend
- Try the sidecar pattern with client + server tools
- Explore OpenAI Realtime API compatibility

Need help? Check out our [Discord community](https://discord.gg/vowel-life) or [GitHub discussions](https://github.com/vowel-life/discussions).

