---
name: haven-local-rag
description: Build privacy-first RAG applications with Haven - a local vector database, embedding engine, and LLM stack that runs entirely in the browser. Use when working with the Haven npm package, browser-based vector search, local RAG pipelines, MCP integration, or when the user mentions @vectordb/browser-vectordb, semantic search, embeddings, or local AI.
---

# Haven Local RAG

Haven is a complete privacy-first AI stack that runs entirely in the browser. It combines a vector database, embedding generation, and LLM inference - no server required.

## Core Components

- **VectorDB**: IndexedDB-based vector storage with kdtree indexing
- **TransformersEmbedding**: HuggingFace model embeddings via Transformers.js
- **LLM Providers**: Local inference via Wllama (WASM) or WebLLM (WebGPU)
- **RAG Pipeline**: Retrieval-augmented generation with context assembly
- **MCP Server**: Model Context Protocol for AI assistant integration

## Quick Start

### Installation

```bash
npm install haven
```

### Basic Setup

```typescript
import { VectorDB } from 'haven';

const db = new VectorDB({
  storage: { dbName: 'my-app' },
  index: { indexType: 'kdtree', dimensions: 384, metric: 'cosine' },
  embedding: {
    model: 'Xenova/all-MiniLM-L6-v2',
    device: 'wasm',  // or 'webgpu' if available
    cache: true,
  },
});

await db.initialize();
```

## Core Operations

### Insert Documents

```typescript
// Single document
const id = await db.insert({
  text: 'Machine learning enables computers to learn from data',
  metadata: { title: 'ML Intro', category: 'AI' },
});

// Batch insert (much faster)
const ids = await db.insertBatch([
  { text: 'Doc 1', metadata: { category: 'tech' } },
  { text: 'Doc 2', metadata: { category: 'science' } },
]);
```

### Semantic Search

```typescript
// Basic search
const results = await db.search({
  text: 'artificial intelligence',
  k: 5,
});

// Filtered search
const techResults = await db.search({
  text: 'programming',
  k: 10,
  filter: {
    field: 'category',
    operator: 'eq',
    value: 'tech',
  },
});
```

### Update and Delete

```typescript
// Update metadata
await db.update(id, {
  metadata: { category: 'updated-category', lastModified: Date.now() },
});

// Delete
const deleted = await db.delete(id);

// Clear all
await db.clear();

// Get count
const count = await db.size();
```

## RAG Pipeline

### Setup

```typescript
import {
  VectorDB,
  RAGPipelineManager,
  WllamaProvider,
  TransformersEmbedding,
} from 'haven';

// Initialize components
const db = new VectorDB({
  storage: { dbName: 'rag-app' },
  index: { indexType: 'kdtree', dimensions: 384, metric: 'cosine' },
  embedding: { model: 'Xenova/all-MiniLM-L6-v2', device: 'wasm' },
});
await db.initialize();

const llm = new WllamaProvider({
  model: 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf',
  nThreads: 4,
  nContext: 2048,
});
await llm.initialize();

const embedding = new TransformersEmbedding({
  model: 'Xenova/all-MiniLM-L6-v2',
  device: 'wasm',
});
await embedding.initialize();

// Create RAG pipeline
const rag = new RAGPipelineManager(db, llm, embedding);
```

### Query

```typescript
// Standard query
const result = await rag.query('What is machine learning?', {
  topK: 3,
  generateOptions: { maxTokens: 256, temperature: 0.7 },
});

console.log(result.answer);
console.log('Sources:', result.sources.length);

// Streaming query
const stream = rag.queryStream('Explain neural networks', { topK: 3 });
for await (const chunk of stream) {
  if (chunk.type === 'retrieval') {
    console.log(`Retrieved ${chunk.sources?.length} documents`);
  } else if (chunk.type === 'generation') {
    process.stdout.write(chunk.content);
  }
}
```

### Document Chunking

```typescript
function chunkDocument(text: string, chunkSize = 500, overlap = 50): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlap;
  }
  return chunks;
}

// Use chunks
const chunks = chunkDocument(longDocument);
const documents = chunks.map((chunk, i) => ({
  text: chunk,
  metadata: { title: 'Doc', chunkIndex: i, totalChunks: chunks.length },
}));
await db.insertBatch(documents);
```

## MCP Integration

### Setup MCP Server

```typescript
import { VectorDB, MCPServer, RAGPipelineManager } from 'haven';

const db = new VectorDB({
  storage: { dbName: 'mcp-demo' },
  index: { indexType: 'kdtree', dimensions: 384, metric: 'cosine' },
  embedding: { model: 'Xenova/all-MiniLM-L6-v2', device: 'wasm' },
});
await db.initialize();

const rag = new RAGPipelineManager(db, llm, embedding);
const mcp = new MCPServer(db, rag);
```

### Available MCP Tools

```typescript
// Search vectors
const results = await mcp.executeTool('search_vectors', {
  query: 'machine learning',
  k: 5,
});

// Insert document
const id = await mcp.executeTool('insert_document', {
  content: 'Document text',
  metadata: { category: 'tech' },
});

// Delete document
const deleted = await mcp.executeTool('delete_document', { id: 'doc-id-123' });

// RAG query
const result = await mcp.executeTool('rag_query', {
  query: 'What is AI?',
  topK: 3,
});
```

## Configuration Reference

### StorageConfig

```typescript
interface StorageConfig {
  dbName: string;        // IndexedDB database name
  version?: number;      // Default: 1
  maxVectors?: number;   // Maximum vectors to store
}
```

### IndexConfig

```typescript
interface IndexConfig {
  indexType: 'kdtree';                           // Currently only kdtree
  dimensions: number;                            // Must match embedding model
  metric: 'cosine' | 'euclidean' | 'dot';       // Distance metric
}
```

### EmbeddingConfig

```typescript
interface EmbeddingConfig {
  model: string;              // HuggingFace model ID
  device: 'wasm' | 'webgpu'; // Computation device
  cache?: boolean;            // Enable model caching
  quantized?: boolean;        // Use quantized model
}
```

### Recommended Models

| Model | Dimensions | Size | Speed | Quality |
|-------|-----------|------|-------|---------|
| Xenova/all-MiniLM-L6-v2 | 384 | 23MB | Fast | Good |
| Xenova/bge-small-en-v1.5 | 384 | 33MB | Fast | Better |
| Xenova/bge-base-en-v1.5 | 768 | 109MB | Slower | Best |
| Xenova/clip-vit-base-patch32 | 512 | 150MB | Medium | Multimodal |

## Performance Optimization

### Use WebGPU

```typescript
const hasWebGPU = 'gpu' in navigator;

const db = new VectorDB({
  embedding: {
    model: 'Xenova/all-MiniLM-L6-v2',
    device: hasWebGPU ? 'webgpu' : 'wasm',
  },
});
```

### Batch Operations

```typescript
// Fast - single transaction
await db.insertBatch(documents);

// Slow - multiple transactions
for (const doc of documents) {
  await db.insert(doc);
}
```

### Filter Early

```typescript
// Good - filter during search
const results = await db.search({
  text: query,
  k: 10,
  filter: { field: 'category', operator: 'eq', value: 'tech' },
});

// Bad - filter after search
const allResults = await db.search({ text: query, k: 100 });
const filtered = allResults.filter(r => r.metadata.category === 'tech');
```

### Cache Query Embeddings

```typescript
const queryCache = new Map<string, Float32Array>();

async function search(query: string, k: number) {
  let vector = queryCache.get(query);
  if (!vector) {
    vector = await db.embedding.embed(query);
    queryCache.set(query, vector);
  }
  return await db.search({ vector, k });
}
```

## Data Persistence

### Export

```typescript
const data = await db.export();
const json = JSON.stringify(data);

// Save to file
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'backup.json';
a.click();
```

### Import

```typescript
const json = localStorage.getItem('db-backup');
const data = JSON.parse(json);
await db.import(data);
```

## Error Handling

```typescript
import { VectorDBError, StorageQuotaError, DimensionMismatchError } from 'haven';

try {
  await db.insert(data);
} catch (error) {
  if (error instanceof StorageQuotaError) {
    const backup = await db.export();
    await db.clear();
  } else if (error instanceof DimensionMismatchError) {
    console.error('Vector dimensions do not match index configuration');
  }
}
```

## Best Practices

1. **Initialize Once**: Create one VectorDB instance and reuse it
2. **Use Batch Operations**: 10-50x faster than individual inserts
3. **Enable Caching**: Cache models and embeddings for better performance
4. **Use WebGPU**: 3-5x faster embedding generation when available
5. **Filter Early**: Apply metadata filters during search, not after
6. **Limit Results**: Only request the number of results you need (k)
7. **Chunk Documents**: Split long documents into 500-character chunks
8. **Clean Up**: Always call `db.dispose()` when done

## CDN Usage

```html
<script type="module">
  import { VectorDB } from 'https://cdn.jsdelivr.net/npm/haven@latest/dist/index.js';
  
  const db = new VectorDB({
    storage: { dbName: 'demo' },
    index: { indexType: 'kdtree', dimensions: 384, metric: 'cosine' },
    embedding: { model: 'Xenova/all-MiniLM-L6-v2', device: 'wasm' },
  });
  
  await db.initialize();
</script>
```

## Additional Resources

- See `docs/API.md` for complete API reference
- See `docs/RAG_TUTORIAL.md` for detailed RAG guide
- See `docs/MCP_INTEGRATION.md` for MCP setup
- See `docs/PERFORMANCE.md` for optimization tips
- See `examples/` for working code samples
