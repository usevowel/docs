/**
 * @module rag-debug/chat
 * 
 * Chat interface for the RAG debug tool.
 * 
 * Provides an interactive chat UI for testing RAG queries
 * and viewing search results with full markdown rendering
 * and chunk highlighting.
 * 
 * @packageDocumentation
 */

import type { ChatMessage, SearchResult } from './types';
import { state, debugDialog, getLocalRAG } from './state';
import { ICONS } from './icons';
import { escapeHtml, formatTime } from './utils';
import * as yaml from 'js-yaml';
import { marked } from 'marked';

/**
 * Cache for full document content from rag-documents.yml
 * @internal
 */
let documentsCache: Map<string, { content: string; title: string }> | null = null;

/**
 * Fetch and cache full document content from rag-documents.yml
 * @returns Map of path to document content
 * @internal
 */
async function getDocumentsCache(): Promise<Map<string, { content: string; title: string }>> {
  if (documentsCache) return documentsCache;

  try {
    const response = await fetch('/rag-documents.yml');
    if (!response.ok) {
      throw new Error(`Failed to fetch documents: ${response.status}`);
    }

    const yamlText = await response.text();
    const data = yaml.load(yamlText) as {
      version: string;
      document_count: number;
      documents: Record<string, { title: string; content: string; url_path: string }>;
    };

    documentsCache = new Map();
    for (const [key, doc] of Object.entries(data.documents)) {
      // Map by both the key and url_path for flexible lookup
      documentsCache.set(key, { content: doc.content, title: doc.title });
      if (doc.url_path) {
        // Also map by url_path for lookup by URL
        documentsCache.set(doc.url_path, { content: doc.content, title: doc.title });
      }
    }

    return documentsCache;
  } catch (error) {
    console.error('[rag-debug] Failed to load documents cache:', error);
    return new Map();
  }
}

/**
 * Convert markdown to HTML using marked library
 * @param markdown - Raw markdown text
 * @returns HTML string
 * @internal
 */
function markdownToHtml(markdown: string): string {
  // Configure marked for safe rendering
  marked.setOptions({
    gfm: true,
    breaks: true,
  });
  
  return marked.parse(markdown) as string;
}

/**
 * Normalize text for comparison (remove extra whitespace, lowercase)
 * @param text - Text to normalize
 * @returns Normalized text
 * @internal
 */
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Find and highlight chunk text within rendered markdown HTML
 * Uses a text-based approach that works with HTML from marked
 * @param html - The rendered markdown HTML
 * @param chunkText - The chunk text to highlight
 * @returns HTML with highlighted chunk
 * @internal
 */
function highlightChunkInHtml(html: string, chunkText: string): string {
  if (!chunkText || chunkText.length < 10) return html;
  
  // Get the first significant sentence or paragraph from the chunk
  // Chunks often have context prefixes, so we extract the main content
  const chunkLines = chunkText.split('\n').filter(line => line.trim().length > 10);
  if (chunkLines.length === 0) return html;
  
  // Try to find significant text segments to highlight
  // We look for sentences that are at least 20 chars and don't start with "Context:"
  const significantSegments = chunkLines
    .map(line => line.trim())
    .filter(line => 
      line.length >= 20 && 
      !line.startsWith('Context:') && 
      !line.startsWith('Previous:') &&
      !line.startsWith('---')
    )
    .slice(0, 3); // Limit to first 3 significant segments
  
  if (significantSegments.length === 0) return html;
  
  let modifiedHtml = html;
  const highlightId = 'chunk-highlight-' + Math.random().toString(36).substr(2, 9);
  
  for (const segment of significantSegments) {
    // Clean up the segment for matching (remove extra whitespace)
    const cleanSegment = segment.replace(/\s+/g, ' ').trim();
    
    // Try to find this segment in the HTML
    // We need to be careful about HTML tags in the way
    const escapedSegment = escapeHtml(cleanSegment.substring(0, Math.min(100, cleanSegment.length)));
    
    // Try exact match first
    if (modifiedHtml.includes(escapedSegment)) {
      modifiedHtml = modifiedHtml.replace(
        escapedSegment,
        `<mark class="rag-debug-chunk-highlight" id="${highlightId}">${escapedSegment}</mark>`
      );
      continue;
    }
    
    // If no exact match, try matching substrings (at least 30 chars)
    const searchLength = Math.min(80, cleanSegment.length);
    if (searchLength >= 30) {
      const searchText = escapeHtml(cleanSegment.substring(0, searchLength));
      
      // Find the position in the HTML (not inside a tag)
      let searchIndex = 0;
      while ((searchIndex = modifiedHtml.indexOf(searchText, searchIndex)) !== -1) {
        // Check if we're inside an HTML tag
        const beforeText = modifiedHtml.substring(0, searchIndex);
        const afterText = modifiedHtml.substring(searchIndex + searchText.length);
        
        // Count open/close brackets before this position
        const openBrackets = (beforeText.match(/</g) || []).length;
        const closeBrackets = (beforeText.match(/>/g) || []).length;
        
        // If equal, we're not inside a tag
        if (openBrackets === closeBrackets) {
          modifiedHtml = beforeText + 
            `<mark class="rag-debug-chunk-highlight" id="${highlightId}">${searchText}</mark>` + 
            afterText;
          break; // Only highlight first occurrence per segment
        }
        
        searchIndex += searchText.length;
      }
    }
  }
  
  return modifiedHtml;
}

/**
 * Group search results by file path, keeping the highest score for each file
 * 
 * @param results - Search results to group
 * @returns Grouped results by file path
 * @internal
 */
function groupResultsByFile(results: SearchResult[]): Map<string, SearchResult[]> {
  const grouped = new Map<string, SearchResult[]>();
  
  for (const result of results) {
    const path = result.metadata.path;
    if (!grouped.has(path)) {
      grouped.set(path, []);
    }
    grouped.get(path)!.push(result);
  }
  
  // Sort each group's results by score descending
  for (const [, chunks] of grouped) {
    chunks.sort((a, b) => b.score - a.score);
  }
  
  return grouped;
}

/**
 * Get document key from path for lookup in documents cache
 * The path format varies, so we need to normalize it
 * @internal
 */
function getDocumentKeyFromPath(path: string): string {
  // Remove common prefixes and extract the document key
  // Examples: 
  //   '../../content/docs/getting-started.mdx' -> 'getting-started'
  //   'getting-started' -> 'getting-started'
  
  const cleanPath = path.replace(/^\.\.\/\.\.\/content\/docs\//, '')
    .replace(/^src\/content\/docs\//, '')
    .replace(/^content\/docs\//, '')
    .replace(/\.mdx?$/, '');
  
  return cleanPath.split('/').pop() || cleanPath;
}

/**
 * Render full document content with highlighted chunks
 * @param content - Full document markdown content
 * @param chunks - Chunks to highlight
 * @returns HTML with highlighted chunks
 * @internal
 */
function renderDocumentWithHighlights(content: string, chunks: SearchResult[]): string {
  // Convert markdown to HTML
  let html = markdownToHtml(content);

  // Highlight each chunk in the HTML
  for (const chunk of chunks) {
    html = highlightChunkInHtml(html, chunk.text);
  }

  return html;
}

/**
 * Add a message to the chat
 * 
 * @param role - Message role (user, assistant, system)
 * @param content - Message content
 * @param results - Optional search results to display
 * @public
 */
export async function addChatMessage(role: ChatMessage['role'], content: string, results?: SearchResult[]): Promise<void> {
  const message: ChatMessage = {
    role,
    content,
    timestamp: Date.now(),
    results,
  };

  state.chatMessages.push(message);

  const container = debugDialog?.querySelector('#rag-debug-chat-messages');
  if (!container) return;

  const messageEl = document.createElement('div');
  messageEl.className = `rag-debug-message ${role}`;

  let html = `<div class="rag-debug-message-content">${escapeHtml(content)}</div>`;

  if (role !== 'system') {
    html += `<div class="rag-debug-message-time">${formatTime(message.timestamp)}</div>`;
  }

  // Render search results if present - grouped by file with full markdown rendering
  if (results && results.length > 0) {
    const groupedResults = groupResultsByFile(results.slice(0, 5));
    const uniqueFiles = Array.from(groupedResults.entries());
    
    html += '<div class="rag-debug-results">';
    html += `<div class="rag-debug-results-title">Retrieved ${uniqueFiles.length} unique document${uniqueFiles.length > 1 ? 's' : ''}</div>`;
    
    // Generate unique IDs for this message's collapsible items
    const messageId = `msg-${message.timestamp}`;

    // Get the documents cache for full content lookup
    const docCache = await getDocumentsCache();

    for (let i = 0; i < uniqueFiles.length; i++) {
      const [path, chunks] = uniqueFiles[i]!;
      const topResult = chunks[0]!; // Highest scoring chunk for this file
      const fileId = `${messageId}-file-${i}`;
      
      // Try to get the full document content
      const docKey = getDocumentKeyFromPath(path);
      const fullDoc = docCache.get(docKey) || docCache.get(topResult.metadata.urlPath);
      
      // Collapsed header (always visible)
      html += `
        <div class="rag-debug-result-file" data-file-id="${fileId}" id="${fileId}">
          <div class="rag-debug-result-file-header" onclick="this.closest('.rag-debug-result-file').classList.toggle('expanded')">
            <span class="rag-debug-result-toggle">${ICONS['chevron-right']}</span>
            <div class="rag-debug-result-file-info">
              <div class="rag-debug-result-file-name">${escapeHtml(topResult.metadata.title)}</div>
              <div class="rag-debug-result-file-path">${escapeHtml(path)}</div>
            </div>
            <span class="rag-debug-result-file-score">${Math.round(topResult.score * 100)}%</span>
          </div>
          <div class="rag-debug-result-file-content">
            ${fullDoc 
              ? `<div class="rag-debug-result-full-doc">${renderDocumentWithHighlights(fullDoc.content, chunks)}</div>`
              : chunks.map((chunk, chunkIdx) => `
                <div class="rag-debug-result-chunk">
                  <div class="rag-debug-result-chunk-header">Chunk ${chunkIdx + 1} (${Math.round(chunk.score * 100)}%)</div>
                  <div class="rag-debug-result-chunk-text">${escapeHtml(chunk.text)}</div>
                </div>
              `).join('')
            }
          </div>
        </div>
      `;
    }

    html += '</div>';
  }

  messageEl.innerHTML = html;
  container.appendChild(messageEl);
  container.scrollTop = container.scrollHeight;
}

/**
 * Send a chat message and get RAG results
 * 
 * @param query - User query string
 * @public
 */
export async function sendChatMessage(query: string): Promise<void> {
  console.log('[rag-debug] sendChatMessage called with query:', query);
  await addChatMessage('user', query);

  try {
    await addChatMessage('system', 'Loading Turso Browser RAG and searching...');

    const localRAG = await getLocalRAG();
    console.log('[rag-debug] localRAG ready:', localRAG.isReady());

    if (!localRAG.isReady()) {
      await localRAG.initialize();
    }

    // Remove the loading message
    const container = debugDialog?.querySelector('#rag-debug-chat-messages');
    const messages = container?.querySelectorAll('.rag-debug-message.system');
    messages?.forEach(m => {
      if (m.textContent?.includes('Loading Turso Browser RAG')) {
        m.remove();
      }
    });

    console.log('[rag-debug] Calling search with query:', query);
    const results = await localRAG.search(query, 5);
    console.log('[rag-debug] Search returned', results.length, 'results');

    if (results.length === 0) {
      await addChatMessage('assistant', 'No relevant documents found for your query.');
    } else {
      const response = formatSearchResultsForChat(results);
      await addChatMessage('assistant', response, results);
    }
  } catch (error) {
    console.error('[rag-debug] Chat search failed:', error);
    await addChatMessage('assistant', `Error: ${error instanceof Error ? error.message : 'Search failed'}`);
    await addChatMessage('system', 'Tip: If Turso Browser RAG keeps failing to load, refresh the page. If it still stalls, the persistent local database may be unavailable and the app should fall back to memory mode.');
  }
}

/**
 * Format search results as a chat response
 * 
 * @param results - Search results from RAG
 * @returns Formatted response string
 * @internal
 */
function formatSearchResultsForChat(results: SearchResult[]): string {
  if (results.length === 0) return 'No results found.';

  // Group by file to count unique documents
  const uniquePaths = new Set(results.map(r => r.metadata.path));
  const uniqueCount = uniquePaths.size;
  
  return `Found ${uniqueCount} relevant document${uniqueCount > 1 ? 's' : ''}. Expand items below to see details.`;
}
