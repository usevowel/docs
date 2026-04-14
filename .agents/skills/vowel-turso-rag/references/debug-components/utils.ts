/**
 * @module rag-debug/utils
 * 
 * Utility functions for the RAG debug tool.
 * 
 * @packageDocumentation
 */

/**
 * Escape HTML entities to prevent XSS
 * 
 * @param text - Raw text that may contain HTML
 * @returns Escaped HTML string
 * @public
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format timestamp as HH:MM
 * 
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted time string
 * @public
 */
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Check if debug mode is enabled via environment variable
 * Uses multiple methods: import.meta.env, window global, meta tag, localStorage
 *
 * @returns Whether debug mode is enabled
 * @public
 */
export function checkDebugEnabled(): boolean {
  // Check build-time env var (VitePress/Vite)
  // @ts-ignore - import.meta.env is available in Vite but TypeScript may not know
  const envValue = import.meta.env?.VITE_VOWEL_DEBUG_RAG;
  console.log('[rag-debug] Checking import.meta.env.VITE_VOWEL_DEBUG_RAG:', envValue);
  if (envValue === 'true') {
    console.log('[rag-debug] Debug enabled via import.meta.env');
    return true;
  }

  // Check window global (set by build process as fallback)
  if (typeof window !== 'undefined') {
    const win = window as typeof window & {
      __VOWEL_CONFIG__?: { VITE_VOWEL_DEBUG_RAG?: string | boolean };
    };
    const windowValue = win.__VOWEL_CONFIG__?.VITE_VOWEL_DEBUG_RAG;
    console.log('[rag-debug] Checking window.__VOWEL_CONFIG__.VITE_VOWEL_DEBUG_RAG:', windowValue);
    if (windowValue === true || windowValue === 'true') {
      console.log('[rag-debug] Debug enabled via window global');
      return true;
    }
  }

  // Check meta tag
  const meta = document.querySelector('meta[name="voweldocs-debug-rag"]');
  const metaValue = meta?.getAttribute('content');
  console.log('[rag-debug] Checking meta[name="voweldocs-debug-rag"]:', metaValue);
  if (metaValue === 'true') {
    console.log('[rag-debug] Debug enabled via meta tag');
    return true;
  }

  // Check localStorage override (for debugging)
  try {
    const lsValue = localStorage.getItem('voweldocs-rag-debug-force');
    console.log('[rag-debug] Checking localStorage override:', lsValue);
    if (lsValue === 'true') {
      console.log('[rag-debug] Debug enabled via localStorage override');
      return true;
    }
  } catch {
    // Ignore
  }

  console.log('[rag-debug] Debug NOT enabled - set VITE_VOWEL_DEBUG_RAG=true or run localStorage.setItem("voweldocs-rag-debug-force", "true") and refresh');
  return false;
}

/**
 * Programmatically enable/disable the debug tool
 * For use from browser console
 * 
 * @param enabled - Whether to enable or disable
 * @public
 */
export function setDebugEnabled(enabled: boolean): void {
  try {
    localStorage.setItem('voweldocs-rag-debug-force', enabled ? 'true' : 'false');
    window.location.reload();
  } catch (error) {
    console.error('[rag-debug] Failed to set debug mode:', error);
  }
}

/**
 * Storage key for adhoc documents in localStorage
 * @internal
 */
export const ADHOC_DOCS_KEY = 'voweldocs-rag-adhoc';

/**
 * Get adhoc documents from localStorage
 * 
 * @returns Array of adhoc documents
 * @public
 */
export function getAdhocDocuments(): Array<{ id: string; title: string; path: string; content: string }> {
  try {
    const stored = localStorage.getItem(ADHOC_DOCS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save adhoc documents to localStorage
 * 
 * @param docs - Array of adhoc documents to save
 * @public
 */
export function saveAdhocDocuments(docs: Array<{ id: string; title: string; path: string; content: string }>): void {
  localStorage.setItem(ADHOC_DOCS_KEY, JSON.stringify(docs));
}
