/**
 * @module hierarchical-retrieval
 *
 * Hierarchical document retrieval system for voice AI tools.
 *
 * Enables "Parent Document Retrieval" pattern:
 * - Search uses small chunks (better semantic matching)
 * - Retrieved chunks map to full documents
 * - Full document content sent to AI for rich context
 *
 * This overcomes the limitation of small chunks lacking context while
 * maintaining the search accuracy benefits of chunking.
 *
 * @packageDocumentation
 */

import yaml from 'js-yaml';
import type { SearchResult } from './prebuilt-rag.ts';

/**
 * Full document entry from rag-documents.yml
 *
 * @public
 */
export interface DocumentEntry {
  /** Document title */
  title: string;
  /** Document description */
  description?: string;
  /** Document category */
  category: string;
  /** URL path for the document */
  url_path: string;
  /** Full document content */
  content: string;
  /** Word count */
  word_count: number;
  /** Character count */
  char_count: number;
}

/**
 * Documents index loaded from rag-documents.yml
 *
 * @internal
 */
interface DocumentsIndex {
  version: string;
  generated_at: string;
  document_count: number;
  documents: Record<string, DocumentEntry>;
}

/** Cache for loaded documents index */
let documentsCache: DocumentsIndex | null = null;
let documentsLoadPromise: Promise<DocumentsIndex> | null = null;

/**
 * Load the documents index from rag-documents.yml
 *
 * @returns Promise resolving to the documents index
 * @internal
 */
async function loadDocumentsIndex(): Promise<DocumentsIndex> {
  if (documentsCache) {
    return documentsCache;
  }

  if (documentsLoadPromise) {
    return documentsLoadPromise;
  }

  documentsLoadPromise = (async () => {
    try {
      const response = await fetch('/rag-documents.yml');
      if (!response.ok) {
        throw new Error(`Failed to load documents: ${response.status} ${response.statusText}`);
      }

      const yamlText = await response.text();
      const index = yaml.load(yamlText) as DocumentsIndex;
      documentsCache = index;
      console.log(`[hierarchical-retrieval] Loaded ${index.document_count} documents`);
      return index;
    } catch (error) {
      console.error('[hierarchical-retrieval] Failed to load documents index:', error);
      throw error;
    } finally {
      documentsLoadPromise = null;
    }
  })();

  return documentsLoadPromise;
}

/**
 * Clear the documents cache (useful for reloads)
 *
 * @public
 */
export function clearDocumentsCache(): void {
  documentsCache = null;
}

/**
 * Result of hierarchical retrieval containing both chunk and parent document
 *
 * @public
 */
export interface HierarchicalResult {
  /** The chunk that matched the search (for reference) */
  matched_chunk: SearchResult;
  /** Full parent document content */
  document: DocumentEntry;
  /** Document path identifier */
  path: string;
  /** Relevance score from chunk search */
  score: number;
}

/**
 * Context prepared for AI consumption from retrieved documents
 *
 * @public
 */
export interface AIContext {
  /** Combined document contents formatted for AI */
  context_text: string;
  /** Metadata about retrieved documents */
  sources: Array<{
    title: string;
    path: string;
    category: string;
    score: number;
  }>;
  /** Total documents included */
  document_count: number;
  /** Total characters in context */
  total_chars: number;
}

/**
 * Options for hierarchical retrieval
 *
 * @public
 */
export interface RetrievalOptions {
  /** Maximum number of unique documents to retrieve (default: 3) */
  max_documents?: number;
  /** Maximum characters per document (0 = no limit, default: 8000) */
  max_chars_per_doc?: number;
  /** Include document metadata in context (default: true) */
  include_metadata?: boolean;
  /** Separator between documents in context (default: "\n\n---\n\n") */
  document_separator?: string;
}

/**
 * Perform hierarchical retrieval:
 * 1. Search chunks to find relevant document paths
 * 2. Deduplicate by path
 * 3. Retrieve full document content for each path
 * 4. Return enriched results with full context
 *
 * @param search_results - Raw chunk search results from VectorDB
 * @param options - Retrieval options
 * @returns Hierarchical results with full document content
 * @public
 */
export async function retrieveHierarchical(
  search_results: SearchResult[],
  options: RetrievalOptions = {}
): Promise<HierarchicalResult[]> {
  const {
    max_documents = 3,
  } = options;

  // Load documents index
  const docsIndex = await loadDocumentsIndex();

  // Deduplicate by path, keeping highest scoring chunk per document
  const seenPaths = new Map<string, SearchResult>();
  for (const result of search_results) {
    const path = result.metadata.path as string;
    if (!path) continue;

    const existing = seenPaths.get(path);
    if (!existing || result.score > existing.score) {
      seenPaths.set(path, result);
    }
  }

  // Sort by score and take top N
  const uniquePaths = Array.from(seenPaths.entries())
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, max_documents);

  // Retrieve full documents
  const results: HierarchicalResult[] = [];
  for (const [path, matchedChunk] of uniquePaths) {
    const doc = docsIndex.documents[path];
    if (!doc) {
      console.warn(`[hierarchical-retrieval] Document not found: ${path}`);
      continue;
    }

    results.push({
      matched_chunk: matchedChunk,
      document: doc,
      path,
      score: matchedChunk.score,
    });
  }

  return results;
}

/**
 * Format hierarchical results into AI-ready context string
 *
 * @param results - Hierarchical retrieval results
 * @param options - Formatting options
 * @returns Formatted context ready for AI consumption
 * @public
 */
export function formatContextForAI(
  results: HierarchicalResult[],
  options: RetrievalOptions = {}
): AIContext {
  const {
    max_chars_per_doc = 8000,
    include_metadata = true,
    document_separator = '\n\n---\n\n',
  } = options;

  let totalChars = 0;
  const contextParts: string[] = [];
  const sources: AIContext['sources'] = [];

  for (const result of results) {
    const doc = result.document;

    // Track source metadata
    sources.push({
      title: doc.title,
      path: result.path,
      category: doc.category,
      score: result.score,
    });

    // Build document context
    let docContent = '';

    if (include_metadata) {
      docContent += `[Document: ${doc.title}]\n`;
      docContent += `[Category: ${doc.category}]\n`;
      if (doc.description) {
        docContent += `[Description: ${doc.description}]\n`;
      }
      docContent += `[Relevance: ${Math.round(result.score * 100)}%]\n\n`;
    }

    // Add content (with optional truncation)
    let content = doc.content;
    if (max_chars_per_doc > 0 && content.length > max_chars_per_doc) {
      content = content.substring(0, max_chars_per_doc) + '\n\n[... content truncated ...]';
    }
    docContent += content;

    contextParts.push(docContent);
    totalChars += docContent.length;
  }

  const context_text = contextParts.join(document_separator);
  totalChars += document_separator.length * (contextParts.length - 1);

  return {
    context_text,
    sources,
    document_count: results.length,
    total_chars: totalChars,
  };
}

/**
 * Complete hierarchical RAG retrieval pipeline:
 * 1. Search chunks
 * 2. Retrieve full documents
 * 3. Format for AI
 *
 * @param search_fn - Search function that returns chunk results
 * @param query - Search query
 * @param options - Retrieval and formatting options
 * @returns Formatted AI context
 * @public
 */
export async function hierarchicalRAG(
  search_fn: (query: string, k: number) => Promise<SearchResult[]>,
  query: string,
  options: RetrievalOptions & { chunk_k?: number } = {}
): Promise<AIContext> {
  const { chunk_k = 10, ...retrievalOptions } = options;

  console.log(`[hierarchical-retrieval] Performing hierarchical RAG for: "${query}"`);

  // Step 1: Search chunks (more chunks = better chance of finding relevant docs)
  const chunkResults = await search_fn(query, chunk_k);

  if (chunkResults.length === 0) {
    return {
      context_text: '',
      sources: [],
      document_count: 0,
      total_chars: 0,
    };
  }

  // Step 2: Hierarchical retrieval (get full documents)
  const hierarchicalResults = await retrieveHierarchical(chunkResults, retrievalOptions);

  if (hierarchicalResults.length === 0) {
    return {
      context_text: '',
      sources: [],
      document_count: 0,
      total_chars: 0,
    };
  }

  // Step 3: Format for AI
  const context = formatContextForAI(hierarchicalResults, retrievalOptions);

  console.log(
    `[hierarchical-retrieval] Retrieved ${context.document_count} documents ` +
    `(${context.total_chars} chars) from ${chunkResults.length} chunk matches`
  );

  return context;
}
