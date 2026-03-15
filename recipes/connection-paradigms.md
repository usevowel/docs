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

### Design Notes

- never expose long-lived credentials in browser code
- prefer short-lived tokens wherever possible
- log session startup and upstream failures clearly

## Common Pitfalls

- token responses that do not match the SDK's expected shape
- expired tokens reused across reconnects
- mismatched client and backend assumptions about session ownership
- exposing trusted credentials in client bundles

## Related Docs

- [Connection Models](/guide/connection-models)
- [Self-Hosted](/self-hosted/)
