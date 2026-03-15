# Self-Hosted Deployment

Use the self-hosted stack when you want to run both the token service and the realtime runtime on your own infrastructure.

## Deployment Modes

The most common deployment modes are:

- **Local evaluation** for development and testing
- **Single-environment deployment** for internal tooling or staging
- **Production deployment** behind your own gateway, TLS, and monitoring stack

## Local Evaluation

For local evaluation, start the reference Docker Compose stack with your environment file and provider credentials.

Typical local validation should confirm:

- Core is reachable over HTTP
- the realtime engine is reachable over WebSocket
- token issuance succeeds
- a browser client can complete a live connection

## Production Deployment Considerations

In production, plan for:

- HTTPS and WSS endpoints
- origin and auth policy
- secret rotation
- health checks
- logs and metrics
- deploy-time rollback procedures

## Network Expectations

A production deployment usually exposes:

- an HTTP endpoint for token issuance or control-plane access
- a WSS endpoint for realtime sessions

Keep the realtime endpoint stable so client applications do not need to change between deploys.

## Acceptance Checklist

Before shipping a self-hosted deployment, verify:

- browser clients can fetch tokens
- browser clients can connect to the realtime engine
- microphone flows work over HTTPS
- session startup, speech input, and responses complete successfully
- failure states produce actionable logs
