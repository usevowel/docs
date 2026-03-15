# Connection Models

Use this page to choose how your application connects to vowel.

## Overview

There are two primary ways to connect a client application:

- **Token-based flow**: your app fetches a short-lived token from your own backend or token service and connects with that token. This is the recommended path for the current open-source launch.
- **Hosted platform flow**: your app uses an `appId`, and the hosted platform manages session setup for you. This is coming soon.

Both approaches use the same client SDK. The difference is where session credentials come from and who operates the token service.

## Token-Based Flow

Use a token-based flow when you want your own backend to mint or broker session access.

How it works:

1. Your client requests a short-lived token from your backend.
2. Your backend checks auth, policy, or session context.
3. Your backend returns a token response to the client.
4. The client uses `tokenProvider` to connect.

This is the right choice for:

- self-hosted deployments
- the current open-source launch
- custom auth and backend policies
- advanced session orchestration
- server-assisted integrations

```ts
import { Vowel } from '@vowel.to/client';

const vowel = new Vowel({
  tokenProvider: async () => {
    const response = await fetch('/api/vowel/token', {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch token');
    }

    return response.json();
  },
});
```

## Hosted Platform Flow

Hosted platform setup is coming soon.

Use the hosted platform flow when you want the simplest path to integration.

How it works:

1. Create an app in the hosted platform.
2. Add the app's `appId` to your client configuration.
3. Connect with `@vowel.to/client`.

This will be the default choice for:

- hosted deployments
- teams that want managed app configuration
- projects that do not need their own token service

```ts
import { Vowel } from '@vowel.to/client';

const vowel = new Vowel({
  appId: 'your-app-id',
});
```

## Which One Should You Choose?

Choose the token-based flow if:

- you are integrating today
- you are self-hosting
- you need backend-issued tokens
- you need custom security, routing, or session rules

Choose the hosted platform flow later if:

- you want the fastest setup
- you want app management handled for you
- you plan to configure your agent through the hosted platform

## Related Docs

- [Getting Started](./getting-started)
- [Self-Hosted](/self-hosted/)
- [Platform](/platform/)
- [Connection Paradigms](../recipes/connection-paradigms)
