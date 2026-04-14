# RAG Knowledge Base

The voice agent includes a **privacy-first RAG (Retrieval-Augmented Generation)** system powered by [Turso](https://turso.tech/blog/introducing-turso-in-the-browser) (Limbo) WASM, using a browser-local database with in-browser query embeddings.

## How It Works

1. **Build-time indexing**: Run `bun run build:rag` to generate embeddings from all documentation using llama.cpp with Vulkan acceleration
2. **Local embeddings**: Uses Transformers.js with Xenova/all-MiniLM-L6-v2 for fast, local semantic query embeddings
3. **Semantic search**: When the user asks a question, the AI first searches the knowledge base for relevant docs
4. **Grounded responses**: The AI formulates answers based on retrieved context, ensuring factual accuracy

## Generated Files

When you run `bun run build:rag`, the system generates pre-computed embedding artifacts that are loaded directly into the browser. These files contain chunked documentation content with corresponding vector embeddings, ready for instant semantic search without any client-side processing.



The build process creates a complete RAG knowledge base including:
- `rag-index.yml` — chunked documentation content with metadata and precomputed vectors
- `rag-documents.yml` — full document content for hierarchical retrieval

These files are served as static assets and loaded into the browser-local Turso database on page initialization.

## Key Features

- **Zero cloud costs**: No API calls or external services for search
- **Privacy-preserving**: All data stays in the browser
- **Offline-capable**: Works without internet after initial page load
- **Instant responses**: ~50ms search latency for 10K+ documents
- **Source citations**: The AI can reference specific documentation pages

## Debug Mode

Set `VITE_VOWEL_DEBUG_RAG=true` to enable a debug panel that shows:
- Real-time STT (speech-to-text) transcripts
- RAG search queries and retrieved documents
- Confidence scores and source paths

Users can also say "Open the debug chat" to see this panel.

The debug interface provides complete visibility into the RAG pipeline:

![RAG Debug Chat](https://blog-assets.vowel.to/assets/RAG-debug-chat-2.png)

The files panel displays all loaded documentation chunks and their metadata:

![RAG Debug Files](https://blog-assets.vowel.to/assets/RAG-debug-files-2.png)

## Agent Skills

- **`haven-local-rag`** (`.agents/skills/haven-local-rag/`) - Browser-based semantic search and local RAG pipeline background
- **`rag-prebuild`** (`.agents/skills/rag-prebuild/`) - Pre-build embeddings with `build-rag.py` for production
