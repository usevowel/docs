---
name: rag-prebuild
description: Pre-build RAG embeddings for VowelDocs documentation. Generates pre-computed chunk+embedding JSON artifacts that can be loaded directly into Haven VectorDB without client-side processing.
---

# RAG Prebuild Script

Generates pre-processed RAG data with embeddings for all documentation files.

## Gitignore Setup

Add these entries to `.gitignore` to exclude downloaded binaries and build state:

```gitignore
# RAG build artifacts - llama.cpp binaries and build state
scripts/llama-*/
scripts/.rag-build-state.yml
scripts/uv.lock
scripts/*.gguf
```

The generated `public/rag-index.yml` and `public/rag-documents.yml` contain pre-built embeddings. Keep them in version control for instant loading, or exclude them and generate during CI/CD.

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
