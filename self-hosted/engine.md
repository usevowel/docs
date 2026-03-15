# Self-Hosted Realtime Engine

The realtime engine runs live voice sessions in a self-hosted deployment.

## What The Realtime Engine Does

The realtime engine is responsible for:

- accepting authenticated realtime connections
- creating and managing live sessions
- coordinating speech, model, and tool execution
- streaming responses back to clients

## How It Fits With Core

Core and the realtime engine have different responsibilities:

- **Core** prepares and issues short-lived access for session startup
- **Realtime engine** runs the session after the client connects

## What Operators Should Care About

For the realtime engine, operators typically care about:

- public WebSocket endpoint stability
- health and restart behavior
- upstream provider configuration
- TLS and proxy support for realtime traffic
- logs and metrics for session failures

## Typical Session Flow

1. The client receives a short-lived token.
2. The client connects to the realtime endpoint.
3. The realtime engine starts the session and processes speech, tools, and model responses.
4. The client receives audio, text, and state updates during the session.

## Source Repository

The realtime engine is open source at [github.com/usevowel/engine](https://github.com/usevowel/engine).

## Related Docs

- [Architecture](./architecture)
- [Core](./core)
- [Deployment](./deployment)
- [Troubleshooting](./troubleshooting)
