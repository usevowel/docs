---
name: vowel-turso-rag
description: Add browser-local Retrieval-Augmented Generation to vowel-powered web apps using Turso WASM/OPFS vector search, prebuilt document embeddings, debug UI components, and @vowel.to/client actions/context. Use when implementing Turso browser RAG, Vite/VitePress docs RAG, local vector search, semantic documentation search, RAG debug panels, or voice-accessible search actions for vowel clients.
---

# Vowel Turso RAG

Use this skill to add a privacy-first browser RAG layer that stores prebuilt chunks in Turso WASM, searches them with vector distance SQL, exposes a debug panel, and connects retrieval to vowel voice actions.

## Dependencies

### JavaScript/TypeScript Runtime Dependencies

```bash
bun add @tursodatabase/database-wasm@^0.5.3 @vowel.to/client@^0.3.3-beta @huggingface/transformers@^4.0.1 js-yaml@^4.1.1
```

| Package | Version | Purpose |
|---------|---------|---------|
| `@tursodatabase/database-wasm` | ^0.5.3 | Turso WASM/OPFS vector database for browser |
| `@vowel.to/client` | ^0.3.3-beta | Vowel voice client for action registration |
| `@huggingface/transformers` | ^4.0.1 | Query embedding generation in browser |
| `js-yaml` | ^4.1.1 | Loading prebuilt YAML index files |

### Python Build Dependencies

For the build-time embedding generation script:

```bash
# Using pip
pip install pyyaml numpy tqdm requests

# Using uv
uv add --dev pyyaml numpy tqdm requests
```

| Package | Purpose |
|---------|---------|
| `pyyaml` | YAML index file serialization |
| `numpy` | Vector operations and array handling |
| `tqdm` | Progress bars for embedding generation |
| `requests` | llama-server HTTP API client |

### Optional Dependencies

- `@wllama/wllama@^2.3.7` - Alternative local LLM runner (if not using llama.cpp server)
- `marked@^17.0.6` - Markdown rendering for preview panels

## Workflow

1. Identify the host app framework and bundler.
   - For Vite, prefer `@tursodatabase/database-wasm/vite`.
   - Confirm COOP/COEP headers are set so `SharedArrayBuffer` is available.
   - Use OPFS persistence when the app can reuse the index; fall back to `:memory:` when persistent open fails.

2. Build or reuse a prebuilt index artifact.
   - Prefer build-time chunking and embedding for docs and static content.
   - Use `scripts/build-rag.py` as the bundled reference script for generating chunk and embedding artifacts; adapt its paths/model settings to the target project.
   - Use `scripts/requirements.txt` for the Python dependencies required by the bundled script.
   - Store a manifest hash and per-chunk content hashes so reloads can do incremental sync.
   - Keep the browser path focused on loading, caching, indexing, and query embedding.

3. Add the Turso RAG runtime.
   - Create a chunks table with `id`, `text`, JSON `metadata`, and a typed vector column such as `F32_BLOB(384)`.
   - Insert vectors with `vector32(?)`, passing a JSON stringified embedding.
   - Search with `vector_distance_cos(embedding, vector32(?))`, `ORDER BY distance ASC`, and convert distance to a bounded score for UI.
   - Read `references/turso-browser-rag.md` for the implementation pattern and `references/source/prebuilt-rag.ts` for the complete source reference.

4. Add the debug UI only as a dev/debug surface.
   - Include a floating action button, tabbed dialog, document tree, chat panel, progress state, import/export, add/remove ad hoc docs, clear/reload controls, icons, and styles as needed.
   - Gate it behind an explicit flag such as `PUBLIC_VOWEL_DEBUG_RAG=true`.
   - Read `references/debug-components.md` first, then load specific files in `references/debug-components/` only as needed.

5. Wire retrieval into vowel.
   - Register RAG actions before `startSession()`.
   - Prefer state/data actions over DOM automation.
   - Add current RAG status and indexed document count to `initialContext` or call `updateContext()` after initialization.
   - Use `sendText()` or `notifyEvent()` only for user-visible follow-up when the app already has an active session.
   - Read `references/vowel-client-rag.md` for action shapes and client integration notes.

## Project Checks

Before editing, inspect the target project for:

- Existing vowel setup: `@vowel.to/client`, `Vowel`, `VowelProvider`, `useVowel`, router adapters, or a web component.
- Existing RAG/search code: `rag`, `embedding`, `vector`, `@tursodatabase`, `database-wasm`, `rag-index`, `semantic search`.
- Build headers: Vite `server.headers`, deployment headers, or middleware setting `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy`.
- Existing debug UI conventions before copying the bundled debug DOM pattern.

## References

- `references/turso-browser-rag.md`: Turso WASM, schema, caching, prebuilt index, query flow, and browser deployment notes.
- `references/vowel-client-rag.md`: vowel client integration, action registration, context, and voice UX guidance.
- `references/debug-components.md`: map of the bundled debug UI source files and when to open each.
- `scripts/build-rag.py`: build-time chunking and embedding script copied from VowelDocs; use as an adaptable starting point.
- `scripts/requirements.txt`: Python dependencies for the bundled embedding script.
- `references/source/prebuilt-rag.ts`: complete reference implementation from VowelDocs.
- `references/source/query-embeddings.ts`: browser query embedding provider used by the reference runtime.
- `references/query-embeddings.ts`: compatibility copy so `references/prebuilt-rag.ts` resolves its local import.
- `references/prebuilt-rag.ts`: compatibility copy so debug component relative imports resolve if the reference tree is copied together.
- `references/debug-components/*.ts`: complete debug UI component source tree for FAB, buttons, tabs, tree, chat, document management, icons, state, styles, and utilities.
