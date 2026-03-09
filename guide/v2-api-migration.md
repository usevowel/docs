# V2 API Migration Guide

**Status:** Draft - Migration Planning  
**Last Updated:** December 2025  
**Provider Focus:** Vowel Prime (primary), OpenAI Realtime (secondary)

---

## Overview

This document outlines the migration from **V1 (Legacy App ID Pattern)** to **V2 (Public API Key Pattern)** for authenticating with the Vowel platform and generating ephemeral tokens for voice sessions.

The V2 API introduces a more secure, scalable authentication model using public API keys instead of requiring authenticated user sessions with app IDs.

---

## Table of Contents

1. [Key Differences](#key-differences)
2. [V1 Architecture (Legacy)](#v1-architecture-legacy)
3. [V2 Architecture (New)](#v2-architecture-new)
4. [Migration Path](#migration-path)
5. [Client-Side Changes](#client-side-changes)
6. [Backend Changes](#backend-changes)
7. [Platform Management](#platform-management)
8. [Security Considerations](#security-considerations)
9. [Environment Variable Gating](#environment-variable-gating)
10. [Deprecation Timeline](#deprecation-timeline)

---

## Key Differences

| Aspect | V1 (Legacy) | V2 (New) |
|--------|-------------|----------|
| **Authentication** | `appId` in request body (no Authorization header) | Public API key in `Authorization: Bearer <key>` header |
| **Endpoint** | HTTP endpoint (`POST /vowel/api/generateToken`) | HTTP endpoint (`POST /vowel/api/generateToken`) |
| **Client Dependency** | Standard HTTP fetch (no Convex dependency) | Standard HTTP fetch (no Convex dependency) |
| **Backend Auth** | Convex user session (validated server-side) | API key verification (no session required) |
| **Security Model** | App ID in code (less secure) | API key-based (scoped, rate-limited, rotatable) |
| **Token Source** | HTTP endpoint → Provider API | HTTP endpoint → Provider API |
| **Domain Validation** | Not enforced | Enforced via API key metadata |
| **Rate Limiting** | Per-user session | Per API key (configurable) |
| **Key Rotation** | Not supported | Supported (create new, revoke old) |

---

## V1 Architecture (Legacy)

### Flow Diagram

```
┌─────────┐         ┌─────────┐         ┌─────────┐         ┌─────────────┐
│ Client  │────────▶│ HTTP    │────────▶│ Platform│────────▶│ Vowel Prime│
│         │ POST    │ Endpoint│ Verify  │ Token   │ Request │ Worker     │
│         │ + appId │         │ Session │ Provider│ Token   │            │
│         │ in body │         │ + App   │         │         │            │
│         │◀────────│         │◀────────│         │◀────────│            │
│         │ Token   │         │ Token   │         │ Token   │            │
└─────────┘         └─────────┘         └─────────┘         └─────────────┘
     │                   │                    │                      │
     │                   │                    │                      │
     │                   │                    │                      │
     └───────────────────┴────────────────────┴──────────────────────┘
                    WebSocket Connection (Direct)
```

### Client Implementation (V1)

```typescript
// No Convex dependency - uses standard HTTP fetch

// Client library internally calls HTTP endpoint
const client = new Vowel({
  appId: 'your-app-id', // Sent in request body
  routes: [...],
  actions: {...},
  voiceConfig: {
    provider: 'vowel-prime',
    // ...
  }
});

// Internally, the client does:
// fetch('https://wooden-herring-934.convex.site/vowel/api/generateToken', {
//   method: 'POST',
//   headers: { 'Content-Type': 'application/json' },
//   body: JSON.stringify({
//     appId: 'your-app-id',
//     origin: window.location.origin,
//     config: { ... }
//   })
// })
```

### Backend Implementation (V1)

**HTTP Endpoint:**
```typescript
// platform/convex/http.ts
http.route({
  path: "/vowel/api/generateToken",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { appId, origin, config } = body;
    
    // 1. Authenticate user via Convex session (from cookies/headers)
    const userId = await getUserId(ctx);
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: No user session" }),
        { status: 401 }
      );
    }
    
    // 2. Verify user owns app
    const app = await ctx.runQuery(internal.apps.getAppById, {
      appId: appId,
    });
    
    if (!app || app.userId !== userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: User does not own this app" }),
        { status: 403 }
      );
    }
    
    // 3. Get user's API key (encrypted)
    const apiKey = await getUserApiKey(ctx, userId, 'vowel-prime', appId);
    
    // 4. Generate token from Vowel Prime
    const tokenProvider = TokenProviderFactory.create('vowel-prime', apiKey);
    const token = await tokenProvider.generateToken({
      // ... config from request body
    });
    
    return new Response(JSON.stringify(token), {
      headers: { 'Content-Type': 'application/json' }
    });
  }),
});
```

### Security Concerns (V1)

1. **App ID Exposure**: App IDs are exposed in client-side code
2. **Session Dependency**: Requires active Convex user session (cookies/headers)
3. **No Key Rotation**: Cannot rotate credentials without code changes
4. **No Rate Limiting**: Limited per-user rate limiting
5. **No Domain Validation**: Cannot restrict which domains can use an app
6. **App ID in Code**: App IDs hardcoded in client applications

---

## V2 Architecture (New)

### Flow Diagram

```
┌─────────┐         ┌─────────┐         ┌─────────┐         ┌─────────────┐
│ Client  │────────▶│ HTTP    │────────▶│ Platform│────────▶│ Vowel Prime│
│         │ POST    │ Endpoint│ Verify  │ Token   │ Request │ Worker     │
│         │ + API   │         │ API Key │ Provider│ Token   │            │
│         │ Key     │         │ Extract │         │         │            │
│         │◀────────│         │ App ID  │         │◀────────│            │
│         │ Token   │         │◀────────│         │ Token   │            │
└─────────┘         └─────────┘         └─────────┘         └─────────────┘
     │                   │                    │                      │
     │                   │                    │                      │
     │                   │                    │                      │
     └───────────────────┴────────────────────┴──────────────────────┘
                    WebSocket Connection (Direct)
```

### Client Implementation (V2)

```typescript
// No Convex dependency required!

// Generate token via HTTP endpoint
const response = await fetch('https://wooden-herring-934.convex.site/vowel/api/generateToken', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${PUBLIC_API_KEY}`, // Public API key
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    origin: window.location.origin, // Required for domain validation
    config: {
      provider: 'vowel-prime',
      routes: [...],
      actions: {...},
      voiceConfig: {
        vowelPrimeConfig: {
          environment: 'staging',
        },
        llmProvider: 'groq',
        model: 'moonshotai/kimi-k2-instruct-0905',
        voice: 'Ashley',
      }
    }
  })
});

const tokenResponse = await response.json();

// Connect with token
const client = new Vowel({
  // No appId needed!
  voiceConfig: {
    token: tokenResponse.tokenName, // Direct token (bypasses platform)
    provider: 'vowel-prime',
    // ... other config
  },
  // OR use tokenProvider for automatic token refresh
  tokenProvider: async () => {
    return await fetchToken(PUBLIC_API_KEY);
  },
});
```

### Backend Implementation (V2)

**HTTP Endpoint:**
```typescript
// platform/convex/http.ts
http.route({
  path: "/vowel/api/generateToken",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // 1. Extract public API key from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401 }
      );
    }
    
    const publicApiKey = authHeader.substring(7);
    
    // 2. Verify API key and extract appId from metadata
    const { verifyApiKey } = await import("./lib/betterAuthApiKeys");
    const keyMetadata = await verifyApiKey(
      ctx, 
      publicApiKey, 
      "mint_ephemeral", // Required scope
      "public" // Must be public key
    );
    
    // 3. Get app using appId from API key metadata
    const app = await ctx.runQuery(internal.apps.getAppById, {
      appId: keyMetadata.appId,
    });
    
    // 4. Validate domain (if configured)
    const { origin } = await request.json();
    if (app.allowedDomains?.length > 0) {
      if (!isOriginAllowed(origin, app.allowedDomains)) {
        return new Response(
          JSON.stringify({ error: "Domain not authorized" }),
          { status: 403 }
        );
      }
    }
    
    // 5. Get user's Vowel Prime API key (encrypted)
    const userId = keyMetadata.userId;
    const providerApiKey = await getUserApiKey(
      ctx, 
      userId, 
      'vowel-prime', 
      keyMetadata.appId
    );
    
    // 6. Generate token from Vowel Prime
    const tokenProvider = TokenProviderFactory.create('vowel-prime', providerApiKey);
    const token = await tokenProvider.generateToken({
      // ... config from request body
    });
    
    return new Response(JSON.stringify(token), {
      headers: { 'Content-Type': 'application/json' }
    });
  }),
});
```

### Security Improvements (V2)

1. **API Key Authentication**: Keys can be rotated, scoped, and rate-limited
2. **No Session Dependency**: Works without user authentication
3. **Domain Validation**: API keys can be restricted to specific domains
4. **Rate Limiting**: Per-key rate limiting and usage quotas
5. **Key Rotation**: Create new keys, revoke old ones without code changes
6. **No Convex Dependency**: Client uses standard HTTP (smaller bundle size)
7. **Metadata-Based**: App ID extracted from key metadata (not exposed in code)

---

## Migration Path

### Phase 1: Backward Compatibility (Current)

**Goal**: Support both V1 and V2 simultaneously

**Implementation**:
- Add environment variable: `VOWEL_ENABLE_V1_LEGACY_SUPPORT=true` (default: `true`)
- HTTP endpoint checks for both patterns:
  1. If `Authorization: Bearer <key>` header → Use V2 (API key)
  2. If `appId` in body + Convex session → Use V1 (legacy, if enabled)
- Client library supports both:
  - If `appId` provided → Use V1 flow (HTTP endpoint with appId in body)
  - If `voiceConfig.token` or `tokenProvider` provided → Use V2 flow (HTTP endpoint with API key in header)

**Code Example**:
```typescript
// platform/convex/http.ts
const ENABLE_V1_LEGACY = process.env.VOWEL_ENABLE_V1_LEGACY_SUPPORT === 'true';

if (ENABLE_V1_LEGACY && !authHeader && body.appId) {
  // V1 Legacy path
  return handleV1LegacyRequest(ctx, request, body);
} else if (authHeader?.startsWith('Bearer ')) {
  // V2 API key path
  return handleV2ApiKeyRequest(ctx, request, body);
} else {
  return new Response(
    JSON.stringify({ error: 'Invalid authentication method' }),
    { status: 401 }
  );
}
```

### Phase 2: Deprecation Warnings

**Goal**: Encourage migration to V2

**Implementation**:
- Add deprecation warnings in V1 code paths
- Log warnings when V1 endpoints are used
- Update documentation to recommend V2

**Code Example**:
```typescript
if (ENABLE_V1_LEGACY && !authHeader && body.appId) {
  console.warn('⚠️ [DEPRECATED] V1 App ID authentication is deprecated. Migrate to V2 API keys.');
  // ... V1 logic
}
```

### Phase 3: V1 Disabled by Default

**Goal**: Prepare for V1 removal

**Implementation**:
- Change default: `VOWEL_ENABLE_V1_LEGACY_SUPPORT=false`
- V1 only works if explicitly enabled
- Provide migration guide for remaining V1 users

### Phase 4: V1 Removal

**Goal**: Remove V1 code entirely

**Implementation**:
- Remove V1 code paths
- Remove environment variable
- Update all documentation

---

## Client-Side Changes

### V1 Client Code

```typescript
import { ConvexHttpClient } from 'convex/browser';

const convexClient = new ConvexHttpClient(CONVEX_URL);

const client = new Vowel({
  appId: 'your-app-id', // Required
  routes: [...],
  actions: {...},
  voiceConfig: {
    provider: 'vowel-prime',
    // ...
  }
});
```

### V2 Client Code

**Option 1: Direct Token (Manual)**
```typescript
// Fetch token manually
const tokenResponse = await fetch('https://wooden-herring-934.convex.site/vowel/api/generateToken', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${PUBLIC_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    origin: window.location.origin,
    config: {
      provider: 'vowel-prime',
      routes: [...],
      actions: {...},
      voiceConfig: {
        vowelPrimeConfig: { environment: 'staging' },
        llmProvider: 'groq',
        model: 'moonshotai/kimi-k2-instruct-0905',
        voice: 'Ashley',
      }
    }
  })
});

const { tokenName, expiresAt, model, provider } = await tokenResponse.json();

const client = new Vowel({
  // No appId needed!
  voiceConfig: {
    token: tokenName, // Direct token
    provider: 'vowel-prime',
    // ... other config
  },
  routes: [...],
  actions: {...},
});
```

**Option 2: Token Provider (Automatic)**
```typescript
const client = new Vowel({
  // No appId needed!
  tokenEndpoint: 'https://wooden-herring-934.convex.site/vowel/api/generateToken',
  tokenProvider: async (config) => {
    const response = await fetch('https://wooden-herring-934.convex.site/vowel/api/generateToken', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PUBLIC_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin: window.location.origin,
        config: {
          provider: 'vowel-prime',
          ...config, // Routes, actions, voiceConfig from client
        }
      })
    });
    return await response.json();
  },
  routes: [...],
  actions: {...},
  voiceConfig: {
    provider: 'vowel-prime',
    vowelPrimeConfig: { environment: 'staging' },
    llmProvider: 'groq',
    model: 'moonshotai/kimi-k2-instruct-0905',
    voice: 'Ashley',
  }
});
```

### Client Library Changes

**SessionManager.ts**:
- Already uses `fetchToken()` method with HTTP endpoint (no Convex dependency)
- Support both `appId` in body (V1) and `Authorization` header (V2)
- Prefer V2 if API key provided, fall back to V1 if `appId` provided

**VowelClient.ts**:
- Keep `appId` optional (for V1 backward compatibility)
- Add support for `tokenEndpoint` and `tokenProvider` options (V2)
- Add support for API key in config (V2)
- Validate: either `appId` (V1) OR API key/`tokenProvider` (V2) must be provided

---

## Backend Changes

### Token Generation Flow

**V1 Flow**:
```
Client → HTTP Endpoint (appId in body) → Verify User Session → Get App → Get API Key → Generate Token
```

**V2 Flow**:
```
Client → HTTP Endpoint (API key in header) → Verify API Key → Extract App ID → Get App → Get API Key → Generate Token
```

### Key Differences

1. **Authentication Method**:
   - V1: Convex user session (`getUserId(ctx)`)
   - V2: API key verification (`verifyApiKey(ctx, key, scope, type)`)

2. **App ID Source**:
   - V1: From request body (`body.appId`)
   - V2: From API key metadata (`keyMetadata.appId`)

3. **Domain Validation**:
   - V1: Not enforced
   - V2: Enforced via `isOriginAllowed(origin, app.allowedDomains)`

4. **Error Handling**:
   - V1: Convex errors (action-level)
   - V2: HTTP status codes (401, 403, 404, etc.)

### API Key Verification

```typescript
// platform/convex/lib/betterAuthApiKeys.ts
export async function verifyApiKey(
  ctx: any,
  apiKey: string,
  requiredScope: string,
  keyType: 'public' | 'private'
): Promise<{
  valid: boolean;
  userId: string;
  appId: string;
  metadata: Record<string, any>;
}> {
  // 1. Hash the API key for lookup
  const hashedKey = await defaultKeyHasher(apiKey);
  
  // 2. Lookup key in database
  const key = await getApiKey(ctx, hashedKey);
  
  // 3. Validate key exists, enabled, not expired
  if (!key || !key.enabled || isExpired(key)) {
    throw new Error('Invalid API key');
  }
  
  // 4. Validate key type
  if (key.metadata?.keyType !== keyType) {
    throw new Error(`Invalid key type. Expected ${keyType}`);
  }
  
  // 5. Validate scope
  const scopes = key.metadata?.scopes || [];
  if (!scopes.includes(requiredScope)) {
    throw new Error(`Missing required scope: ${requiredScope}`);
  }
  
  // 6. Check rate limits
  if (isRateLimited(key)) {
    throw new Error('Rate limit exceeded');
  }
  
  // 7. Update usage tracking
  await updateKeyUsage(ctx, key);
  
  return {
    valid: true,
    userId: key.userId,
    appId: key.metadata.appId,
    metadata: key.metadata,
  };
}
```

---

## Platform Management

### Creating Public API Keys

**Via Admin UI**:
1. Navigate to App Settings → API Keys
2. Click "Create Public API Key"
3. Configure:
   - Name: "Production Key"
   - Scopes: `["mint_ephemeral"]`
   - Allowed Domains: `["https://example.com", "https://*.example.com"]`
   - Rate Limits: Requests per minute/day
4. Copy key (shown once!)

**Via API**:
```typescript
POST /api/auth/api-key/create
{
  "name": "Production Key",
  "prefix": "vkey_public_",
  "metadata": {
    "appId": "app_123",
    "keyType": "public",
    "scopes": ["mint_ephemeral"]
  },
  "permissions": {
    "apps": ["mint_ephemeral"]
  }
}
```

### API Key Metadata

```typescript
{
  appId: "app_123",           // App this key belongs to
  keyType: "public",          // "public" or "private"
  scopes: ["mint_ephemeral"], // Permission scopes
  isDefault: false,           // Whether this is the default key
  allowedDomains: [           // Domain restrictions (optional)
    "https://example.com",
    "https://*.example.com"
  ]
}
```

### Key Rotation

1. Create new key with same scopes/metadata
2. Update client code to use new key
3. Revoke old key (or let it expire)
4. Monitor for any errors from old key usage

### Domain Validation

**Configuration**:
```typescript
// In app settings
allowedDomains: [
  "https://example.com",        // Exact match
  "https://*.example.com",     // Wildcard subdomain
  "http://localhost:3000"       // Development
]
```

**Validation Logic**:
```typescript
function isOriginAllowed(origin: string, allowedDomains: string[]): boolean {
  for (const pattern of allowedDomains) {
    if (pattern === origin) {
      return true; // Exact match
    }
    if (pattern.startsWith('*.')) {
      const domain = pattern.slice(2);
      if (origin.endsWith(domain)) {
        return true; // Wildcard match
      }
    }
  }
  return false;
}
```

---

## Security Considerations

### V1 Security Issues

1. **App ID Exposure**: App IDs visible in client-side code
2. **No Key Rotation**: Cannot rotate without code changes
3. **Session Dependency**: Requires active user session
4. **No Domain Validation**: Any domain can use any app ID
5. **Limited Rate Limiting**: Per-user, not per-app

### V2 Security Improvements

1. **API Key Authentication**: Keys can be rotated independently (no code changes)
2. **No Session Dependency**: Works without user authentication
3. **Scoped Permissions**: Keys limited to specific actions (`mint_ephemeral`)
4. **Domain Validation**: Keys restricted to specific domains
5. **Rate Limiting**: Per-key rate limits and usage quotas
6. **Key Expiration**: Keys can have expiration dates
7. **Usage Tracking**: Track usage per key for auditing
8. **Revocation**: Keys can be disabled/revoked instantly
9. **No App ID in Code**: App ID extracted from key metadata (not exposed)

### Best Practices

1. **Never Commit Keys**: Store keys in environment variables
2. **Use Domain Restrictions**: Always configure `allowedDomains`
3. **Rotate Regularly**: Rotate keys every 90 days
4. **Monitor Usage**: Set up alerts for unusual usage patterns
5. **Use Separate Keys**: Different keys for dev/staging/production
6. **Revoke Immediately**: Revoke keys if compromised

---

## Environment Variable Gating

### Backend (Convex)

**Environment Variable**: `VOWEL_ENABLE_V1_LEGACY_SUPPORT`

**Values**:
- `true` (default): V1 and V2 both supported
- `false`: Only V2 supported (V1 requests rejected)

**Usage**:
```typescript
// platform/convex/http.ts
const ENABLE_V1_LEGACY = process.env.VOWEL_ENABLE_V1_LEGACY_SUPPORT === 'true';

if (ENABLE_V1_LEGACY && !authHeader && body.appId) {
  // V1 Legacy path
  console.warn('⚠️ [DEPRECATED] V1 App ID authentication');
  return handleV1LegacyRequest(ctx, request, body);
} else if (authHeader?.startsWith('Bearer ')) {
  // V2 API key path
  return handleV2ApiKeyRequest(ctx, request, body);
} else {
  return new Response(
    JSON.stringify({ 
      error: 'Invalid authentication method',
      hint: ENABLE_V1_LEGACY 
        ? 'Use Authorization: Bearer <api_key> (V2) or appId in body (V1)' 
        : 'Use Authorization: Bearer <api_key> (V2 only)'
    }),
    { status: 401 }
  );
}
```

### Client

**Environment Variable**: `VITE_VOWEL_API_VERSION`

**Values**:
- `v1`: Use V1 flow (Convex action)
- `v2`: Use V2 flow (HTTP endpoint)
- `auto` (default): Auto-detect based on config

**Usage**:
```typescript
// client/lib/vowel/managers/SessionManager.ts
const API_VERSION = import.meta.env.VITE_VOWEL_API_VERSION || 'auto';

if (API_VERSION === 'v2' || (API_VERSION === 'auto' && this.config.tokenProvider)) {
  // Use V2 HTTP endpoint (API key in header)
  return await this.fetchToken({...}, this.config.tokenEndpoint);
} else if (API_VERSION === 'v1' || (API_VERSION === 'auto' && this.config.appId)) {
  // Use V1 HTTP endpoint (appId in body)
  return await this.fetchToken({ appId: this.config.appId, ... });
}
```

---

## Deprecation Timeline

### Phase 1: Backward Compatibility (Current)
- **Duration**: 3-6 months
- **Status**: V1 and V2 both supported
- **Default**: `VOWEL_ENABLE_V1_LEGACY_SUPPORT=true`
- **Action**: Document V2, provide migration guides

### Phase 2: Deprecation Warnings
- **Duration**: 1-2 months
- **Status**: V1 still works, but warnings logged
- **Default**: `VOWEL_ENABLE_V1_LEGACY_SUPPORT=true`
- **Action**: Add deprecation warnings, update docs

### Phase 3: V1 Disabled by Default
- **Duration**: 1-2 months
- **Status**: V1 disabled unless explicitly enabled
- **Default**: `VOWEL_ENABLE_V1_LEGACY_SUPPORT=false`
- **Action**: Notify users, provide migration support

### Phase 4: V1 Removal
- **Duration**: Permanent
- **Status**: V1 code removed
- **Default**: N/A (V1 no longer exists)
- **Action**: Remove V1 code, update all documentation

---

## Migration Checklist

### For Developers

- [ ] Create public API key in Admin UI
- [ ] Update client code to use V2 HTTP endpoint
- [ ] Verify no Convex client dependency (should already be removed)
- [ ] Configure domain restrictions for API key
- [ ] Test token generation with new API key
- [ ] Update environment variables
- [ ] Remove `appId` from client config (if using V2)
- [ ] Monitor API key usage

### For Platform Administrators

- [ ] Set `VOWEL_ENABLE_V1_LEGACY_SUPPORT=false` in production
- [ ] Monitor V1 usage metrics
- [ ] Notify users about V2 migration
- [ ] Provide migration support
- [ ] Plan V1 removal date

---

## Examples

### Complete V2 Migration Example

**Before (V1)**:
```typescript
// No Convex import needed - already uses HTTP fetch internally

const client = new Vowel({
  appId: 'app_abc123', // Sent in request body (requires user session)
  routes: [
    { path: '/products', description: 'Product listing page' },
    { path: '/cart', description: 'Shopping cart' },
  ],
  actions: {
    addToCart: {
      description: 'Add product to cart',
      parameters: { productId: { type: 'string' } },
      handler: async ({ productId }) => { /* ... */ }
    }
  },
  voiceConfig: {
    provider: 'vowel-prime',
    vowelPrimeConfig: { environment: 'staging' },
    llmProvider: 'groq',
    model: 'moonshotai/kimi-k2-instruct-0905',
    voice: 'Ashley',
  }
});

// Internally calls:
// POST /vowel/api/generateToken
// Body: { appId: 'app_abc123', origin: '...', config: {...} }
// (No Authorization header - relies on Convex session cookies)
```

**After (V2)**:
```typescript
// No Convex import needed - same as V1!

const PUBLIC_API_KEY = import.meta.env.VITE_VOWEL_PUBLIC_API_KEY;

const client = new Vowel({
  // No appId needed!
  tokenEndpoint: 'https://wooden-herring-934.convex.site/vowel/api/generateToken',
  tokenProvider: async (config) => {
    const response = await fetch('https://wooden-herring-934.convex.site/vowel/api/generateToken', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PUBLIC_API_KEY}`, // API key in header
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin: window.location.origin, // Required for domain validation
        config: {
          provider: 'vowel-prime',
          routes: config.routes,
          actions: config.actions,
          voiceConfig: config.voiceConfig,
        }
        // No appId in body - extracted from API key metadata
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate token');
    }
    
    return await response.json();
  },
  routes: [
    { path: '/products', description: 'Product listing page' },
    { path: '/cart', description: 'Shopping cart' },
  ],
  actions: {
    addToCart: {
      description: 'Add product to cart',
      parameters: { productId: { type: 'string' } },
      handler: async ({ productId }) => { /* ... */ }
    }
  },
  voiceConfig: {
    provider: 'vowel-prime',
    vowelPrimeConfig: { environment: 'staging' },
    llmProvider: 'groq',
    model: 'moonshotai/kimi-k2-instruct-0905',
    voice: 'Ashley',
  }
});

// Calls same endpoint but with:
// POST /vowel/api/generateToken
// Headers: { Authorization: 'Bearer vkey_public_...' }
// Body: { origin: '...', config: {...} }
// (No appId in body - extracted from API key metadata)
```

---

## FAQ

### Q: Can I use both V1 and V2 simultaneously?

**A**: Yes, during the migration period. The client library will use V2 if `tokenProvider` is provided, otherwise fall back to V1 if `appId` is provided.

### Q: What happens if I don't migrate?

**A**: V1 will be deprecated and eventually removed. You'll need to migrate to V2 to continue using the platform.

### Q: Can I use the same API key for multiple apps?

**A**: No, each API key is scoped to a single app (via `appId` in metadata). Create separate keys for each app.

### Q: How do I rotate API keys?

**A**: Create a new key, update your client code, then revoke the old key. Both keys will work during the transition period.

### Q: What if my API key is compromised?

**A**: Revoke it immediately in the Admin UI. Create a new key and update your client code.

### Q: Can I restrict API keys to specific domains?

**A**: Yes, configure `allowedDomains` when creating the key. The platform will validate the `origin` header against this list.

### Q: Do I still need Convex for V2?

**A**: No, the client library doesn't require Convex for either V1 or V2. Both use standard HTTP fetch. The backend uses Convex, but clients never interact with Convex directly.

---

## Additional Resources

- [Connection Paradigms Guide](./connection-paradigms.md) - Advanced connection patterns
- [API Reference](../api/index.md) - Complete API documentation
- [Security Best Practices](./security.md) - Security guidelines
- [Platform Admin Guide](./admin.md) - Managing apps and API keys

---

**Last Updated**: December 2025  
**Status**: Draft - Under Review
