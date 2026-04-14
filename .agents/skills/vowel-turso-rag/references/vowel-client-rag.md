# Vowel Client RAG Integration

Use this reference when making browser RAG available through a vowel voice agent.

## Principles

- Register custom actions before starting a vowel session.
- Prefer data/state actions over DOM automation.
- Keep retrieval deterministic: return compact search results, URLs, and citations; do not ask the model to scrape the page.
- Add RAG status to context so the assistant knows whether search is ready.
- Do not block the app shell while RAG initializes; fail open and update context later.

## Client Setup

For React apps, use the existing project pattern (`VowelProvider`, `useVowel`, or a singleton `Vowel` client). For vanilla or web component apps, expose equivalent actions through the existing client instance or readiness event.

The client configuration can use:

- `apiKey` or `appId` for the hosted/platform token issuer.
- `tokenEndpoint` or `tokenProvider` for self-hosted or proxy token generation.
- `navigationAdapter` for routing.
- `initialContext` for RAG availability, active page, and indexed document counts.
- `instructions` to tell the agent when to use RAG.

Avoid using legacy `router` configuration in new code when `navigationAdapter` is available.

## Action Registration

Register actions before `startSession()`:

```ts
vowel.registerAction(
  'searchDocs',
  {
    description: 'Search the local documentation index for relevant passages.',
    parameters: {
      query: {
        type: 'string',
        description: 'The natural-language search query.',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of passages to return.',
        optional: true,
      },
    },
  },
  async ({ query, limit = 5 }) => {
    const results = await prebuiltRAG.search(query, limit);

    return {
      query,
      results: results.map((result) => ({
        title: result.metadata.title,
        urlPath: result.metadata.urlPath,
        category: result.metadata.category,
        score: result.score,
        text: result.text.slice(0, 1200),
      })),
    };
  },
);
```

Useful companion actions:

- `getRagStatus`: return readiness, index size, model, dimensions, and last load error.
- `openSearchResult`: navigate to `metadata.urlPath` through the app router.
- `reloadRagIndex`: call `reload()` in development/debug builds only.
- `clearRagIndex`: debug-only destructive action; require an explicit confirmation parameter.

## Context

Pass initial RAG context when constructing the client:

```ts
const initialIndexSize = await prebuiltRAG.getIndexSize().catch(() => 0);

const vowel = new Vowel({
  apiKey,
  navigationAdapter,
  initialContext: {
    rag: {
      enabled: true,
      ready: prebuiltRAG.isReady(),
      indexSize: initialIndexSize,
    },
  },
  instructions: [
    'Use searchDocs before answering detailed documentation questions.',
    'When search results include urlPath, mention the relevant page naturally.',
  ].join('\n'),
});
```

After initialization completes, update context:

```ts
await prebuiltRAG.initialize();
vowel.updateContext({
  rag: {
    enabled: true,
    ready: true,
    indexSize: await prebuiltRAG.getIndexSize(),
  },
});
```

If the host app has a store, write RAG readiness and selected result into that store, then sync the store snapshot into vowel context.

## Voice UX

Return concise snippets. Keep full documents in the app, not in action returns.

Good action descriptions:

- "Search the local documentation index for relevant passages."
- "Open a documentation result by URL path."
- "Report whether the local RAG index is ready."

Avoid descriptions that imply hosted platform availability unless the target project actually uses hosted vowel platform features.

## Session Timing

If the user clicks a microphone button, `startSession()` may need to run directly inside the user gesture. Register RAG actions during app initialization, not inside the click handler.

When RAG loads after the session starts, call `updateContext()`. If needed, call `notifyEvent()` with a short status message such as "Documentation search is ready."
