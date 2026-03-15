# Self-Hosted

Self-hosted deployment lets you run vowel on infrastructure you control.

## Who This Is For

Choose self-hosted when you want:

- your own deployment boundary
- your own token issuance path
- custom networking, auth, or backend policy
- operator control over runtime configuration

## What The Self-Hosted Stack Includes

The self-hosted stack has two primary services:

- **Core** for configuration and short-lived token issuance
- **Realtime engine** for live voice session execution

Your application typically talks to Core or your own backend to get a token, then connects to the realtime engine with that token.

## Hosted Vs Self-Hosted

Use the **hosted platform** if you want:

- the fastest path to integration
- managed app configuration
- platform-managed setup with `appId`

Use **self-hosted** if you want:

- infrastructure control
- your own token and networking boundaries
- custom backend mediation for session access

## Source Repository

The self-hosted stack is open source at [github.com/usevowel/stack](https://github.com/usevowel/stack).

## Start Here

- [Architecture](./architecture)
- [Core](./core)
- [Realtime Engine](./engine)
- [Configuration](./configuration)
- [Deployment](./deployment)
- [Troubleshooting](./troubleshooting)
