# Turso Browser RAG

Use this reference when implementing the browser database and retrieval layer.

## Install

For Vite apps:

```bash
npm install @tursodatabase/database-wasm js-yaml @huggingface/transformers
```

Use the Vite subpath import:

```ts
import { connect, type Database } from '@tursodatabase/database-wasm/vite';
```

For non-Vite browser apps, start with `@tursodatabase/database-wasm`. For sync-backed browser apps, use `@tursodatabase/sync-wasm` or `@tursodatabase/sync-wasm/vite` and add explicit auth/token handling.

## Browser Headers

Turso WASM requires `SharedArrayBuffer`. Set these headers in local dev and production:

```ts
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
});
```

Use `credentialless` unless the app already has stricter cross-origin requirements.

## Runtime Shape

Prefer a small runtime object with:

- `initialize(progressCallback?)`
- `search(query, k?)`
- `isReady()`
- `getIndexSize()`
- `reload(progressCallback?)`
- `clearIndex()`
- `getDocuments()`
- optional state subscription for progress UI

Use an initialization promise to dedupe concurrent calls.

## Persistence

Attempt OPFS persistence first:

```ts
const db = await connect('app-rag.db');
```

If persistent open times out or fails, log the issue and fall back:

```ts
const db = await connect(':memory:');
```

Keep the app usable even if RAG is unavailable. RAG should fail open for docs and app navigation.

## Schema

For 384-dimensional embeddings:

```sql
CREATE TABLE IF NOT EXISTS rag_chunks (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  metadata TEXT NOT NULL,
  embedding F32_BLOB(384) NOT NULL
);
```

Use `F32_BLOB(dimensions)` when storing float32 embeddings. Store metadata as JSON so the result can carry title, route/path, category, chunk index, total chunks, and position.

## Loading A Prebuilt Index

Prefer build-time chunking and embedding for docs:

```ts
interface PrebuiltChunk {
  id: string;
  text: string;
  vector?: number[];
  embedding?: number[];
  content_hash?: string;
  metadata: {
    title: string;
    path: string;
    urlPath: string;
    category: string;
    chunkIndex: number;
    totalChunks: number;
    position: number;
  };
}

interface PrebuiltIndex {
  version: string;
  model: string;
  dimensions: number;
  metric: string;
  generated_at: string;
  chunk_count: number;
  manifest_hash?: string;
  chunks: PrebuiltChunk[];
}
```

Load from a static artifact such as `/rag-index.yml` or `/rag-index.json`. Validate dimensions, filter internal-only documents, and keep the model/dimensions in sync with query embedding generation.

## Build-Time Embeddings

Use `../scripts/build-rag.py` as the bundled starting point for generating a prebuilt index. The script:

- scans documentation files
- chunks cleaned content
- generates 384-dimensional embeddings with an All-MiniLM-L6-v2 GGUF model through llama.cpp
- keeps incremental build state
- writes a static `rag-index.yml` artifact
- records manifest and content hashes for cache-aware browser loading

Adapt project-specific paths, ignored files, output format, model settings, and download/runtime assumptions before using it in another project.

Python dependencies for the script are listed in `../scripts/requirements.txt`.

## Insert

Prepare once and insert in batches:

```ts
const insert = db.prepare(`
  INSERT OR REPLACE INTO rag_chunks (id, text, metadata, embedding)
  VALUES (?, ?, ?, vector32(?))
`);

await insert.run(
  chunk.id,
  chunk.text,
  JSON.stringify(chunk.metadata),
  JSON.stringify(chunk.vector ?? chunk.embedding),
);
```

Small batches are fine during initial load; larger batches are better for incremental updates. Track progress by processed chunk count.

## Search

Lower vector distance is closer. Always sort ascending:

```ts
const results = await db.prepare(`
  SELECT
    text,
    metadata,
    vector_distance_cos(embedding, vector32(?)) AS distance
  FROM rag_chunks
  ORDER BY distance ASC
  LIMIT ?
`).all(JSON.stringify(queryEmbedding), k);
```

Convert distance to an app-friendly score when needed:

```ts
const score = Math.max(0, Math.min(1, 1 - Number(distance)));
```

For text embeddings, cosine distance is the default. Use L2 or Jaccard only when the embedding/model choice makes that better.

## Cache Validation

Store cache metadata in localStorage:

- database name
- manifest hash
- per-chunk content hashes
- chunk count
- synced timestamp

If the manifest hash and stored row count match, reuse the database. If only some chunks changed, delete removed ids and upsert changed ids instead of clearing the whole table.

## Query Embeddings

Open `source/query-embeddings.ts` for the browser query embedding provider used by the reference implementation. It uses `@huggingface/transformers`, `Xenova/all-MiniLM-L6-v2`, mean pooling, normalized vectors, WebGPU when available, and WASM fallback.

Keep the query embedding model aligned with the build-time document embedding model and dimensions.

## Source Reference

Open `source/prebuilt-rag.ts` for a complete implementation with OPFS fallback, YAML loading, schema setup, manifest hashing, incremental sync, search, document listing, and progress subscriptions.

The copied files are reference/template material. Adapt imports, model loading, artifact URLs, and environment flags to the target project instead of assuming this skill folder is an installable package.
