# WebMCP integration

This recipe explains how the vowel **client library** works with [WebMCP](https://github.com/webmachinelearning/webmcp) (Web Model Context Protocol) tooling: sharing tools between the browser’s Model Context surface and the voice session. See the [W3C Web Machine Learning community draft](https://webmachinelearning.github.io/webmcp) for the `navigator.modelContext` API.

## What you get

| Direction | Behavior |
|-----------|----------|
| **Vowel → WebMCP** | Each `registerAction` tool can be exposed to the browser via `navigator.modelContext.registerTool` so other on-page Model Context clients can call the same handler. |
| **WebMCP → Vowel** | Optional discovery of tools already registered in the page (testing API or a global registry) and registration as Vowel actions so the voice model can call them. |

The implementation lives in the client under the WebMCP module; configuration is on `VowelClient` via `webMCP` in your client config.

## Configuration

```typescript
import { Vowel } from '@vowel.to/client';

const vowel = new Vowel({
  apiKey: 'vkey_...',
  // ... other config
  webMCP: {
    /** Discover third-party / page-registered WebMCP tools and register them as Vowel actions */
    enableDiscovery: true,
    /** Expose each Vowel action to WebMCP (default: true) */
    enableExposure: true,
  },
});
```

- **`enableExposure`** (default `true`) — When the native API is available, Vowel registers each of your actions with the browser’s tool registry so non-voice Model Context clients can execute the same functions.
- **`enableDiscovery`** (default `false`) — When `true`, the client looks for tools exposed via the WebMCP testing API (`navigator.modelContextTesting.getTools`) or, as a fallback, the page-level `window.__webmcp_tools` array used by some hosts (e.g. rooter), and registers them as Vowel actions before the session uses them.

## Manual rediscovery

If tools appear **after** first load (dynamic imports, client-side registration), call:

```typescript
await vowel.rediscoverWebMCPTools();
```

Discovery must remain enabled in config (`webMCP.enableDiscovery: true`).

## Action shape: legacy vs WebMCP

The client accepts **legacy** parameter-style actions and **WebMCP-style** actions that use a JSON Schema-style `inputSchema`. Helpers and type guards (for example `isWebMCPAction` / `isWebMCPActionFormat`) let you support both in one app. For WebMCP-style definitions, the client converts schemas when registering tools with the browser.

## Browser support

- Native `navigator.modelContext` / `registerTool` is **experimental** and may require a Chromium build with the Model Context / WebMCP feature enabled.
- If the native API is missing, exposure may be limited; discovery can still use the testing API or `__webmcp_tools` where your host provides them.
- For current behavior and logs, use the client debug log level and watch `[webmcp]` / `[VowelClient]` console lines at startup and when registering actions.

## See also

- [Custom actions](./custom-actions) — Registering tools before `startSession()`.
- [Connection paradigms](./connection-paradigms) — Token and session setup.

## Changelog

Client releases note WebMCP in `@vowel.to/client` [CHANGELOG](https://github.com/usevowel/client/blob/main/CHANGELOG.md) under **Unreleased** / version sections.
