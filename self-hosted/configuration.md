# Self-Hosted Configuration

Self-hosted deployments require configuration for tokens, providers, networking, and browser connectivity.

## Core Configuration Areas

Expect to configure:

- provider credentials
- service URLs
- token issuance settings
- browser-facing origins
- environment-specific hostnames and ports

## Recommended Configuration Model

Use environment variables for:

- provider API keys
- service endpoints
- deployment mode
- secrets used for token issuance

Keep secrets server-side only. Do not expose provider credentials in browser code.

## Browser Connectivity

Your browser client needs:

- an HTTPS origin in production
- microphone permissions
- a path to either:
  - a hosted `appId` flow, or
  - a backend token endpoint

For self-hosted deployments, the most common browser setup is:

1. the app calls your backend or Core for a short-lived token
2. the client connects to the realtime engine with that token

## Realtime Endpoint Planning

Before deployment, decide:

- the public WebSocket URL for the realtime engine
- whether Core and the engine are exposed separately or behind one gateway
- how health checks are exposed
- which origins may request browser sessions

## Security Guidance

- rotate provider secrets regularly
- scope credentials to the environments that need them
- terminate TLS before exposing browser-facing endpoints
- avoid embedding long-lived credentials in any client bundle
