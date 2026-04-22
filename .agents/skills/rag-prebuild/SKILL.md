---
name: rag-prebuild
description: Pre-build RAG embeddings for VowelDocs documentation. Generates pre-computed chunk+embedding JSON artifacts that can be loaded directly into Haven VectorDB without client-side processing.
---

# RAG Prebuild Script

Generates pre-processed RAG data with embeddings for all documentation files.

## Gitignore Setup

Ignore **local RAG build inputs** (llama.cpp extract, GGUF weights, venv) so they are not committed by mistake. **Do not** gitignore the post-build YAML artifacts:

- `public/rag-index.yml` — chunk index + embeddings
- `public/rag-documents.yml` — full-document index
- `scripts/.rag-build-state.yml` — incremental build state (text manifest)

Typical `.gitignore` entries (already in vowel docs):

```gitignore
# RAG build inputs (heavy / reproducible via build-rag.py)
scripts/llama-*/
scripts/*.gguf
scripts/.venv/
scripts/__pycache__/
```

Commit `scripts/uv.lock` when you use `uv` for reproducible Python deps. If you prefer to generate only in CI, you may omit the YAML outputs from version control in your own fork — the default for vowel docs is to commit them for instant site loads.

## Usage

```bash
# Run from emdash-cms directory
uv run python scripts/build-rag.py
```

## Output

Creates `public/rag-index.json` - a pre-built artifact containing:
- Document chunks with cleaned text
- 384-dimensional embeddings (all-MiniLM-L6-v2)
- Metadata (title, path, category, chunk position)

## Client Integration

The client loads the pre-built index instead of chunking/embedding at runtime:

```typescript
import prebuiltIndex from '../public/rag-index.json';

// Load into Haven VectorDB
await db.import(prebuiltIndex);
```

## Build Pipeline

Add to build process in `package.json`:

```json
{
  "scripts": {
    "build:rag": "uv run python scripts/build-rag.py",
    "build": "npm run build:rag && astro build"
  }
}
```
