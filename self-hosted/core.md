# Self-Hosted Core

Core is the control plane for the self-hosted stack.

## What Core Does

Core is responsible for:

- app and session configuration
- issuing short-lived session tokens
- holding the configuration used when sessions are created
- providing the browser-facing or backend-facing token entry point

## When You Interact With Core

You interact with Core when you need to:

- configure a self-hosted app
- request a session token
- control how new sessions are initialized

In many deployments, the browser does not talk directly to the realtime engine first. It fetches a token from Core or from your backend, then uses that token to start the live session.

## How Core Fits Into The Flow

1. Your app or backend requests a session token.
2. Core validates the request and applies configuration.
3. Core returns a short-lived token response.
4. The client connects to the realtime engine with that token.

## What Core Does Not Replace

Core is not the realtime runtime itself. It does not replace the service that executes the live voice session. That role belongs to the realtime engine.

## Source Repository

Core is open source at [github.com/usevowel/core](https://github.com/usevowel/core).

## Next Steps

- [Architecture](./architecture)
- [Realtime Engine](./engine)
- [Configuration](./configuration)
