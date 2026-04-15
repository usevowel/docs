/**
 * @module rag-debug
 * 
 * RAG Debug Tool for Prebuilt Vector Database
 * 
 * Provides a development interface for debugging and managing the prebuilt RAG system:
 * - Floating action button with Turso icon (lower left corner)
 * - Non-modal dialog with tabbed interface
 * - Documents tab: view folder structure, add/remove adhoc docs, import/export, clear/reload
 * - Chat tab: interactive RAG query testing with results
 * 
 * Only enabled when PUBLIC_VOWEL_DEBUG_RAG=true in environment.
 * 
 * @packageDocumentation
 */

// Re-export types
export type { 
  DebugDocument, 
  ChatMessage, 
  DebugState, 
  FolderNode, 
  AdhocDocument,
  ChatRole 
} from './types';

// Re-export from prebuilt-rag for convenience
export type { SearchResult, InitializationProgress } from '../prebuilt-rag.ts';

// Re-export main initialization function
export { initializeRAGDebug, setDebugEnabled, openDialog, closeDialog } from './ui';

// Re-export utility functions that may be useful externally
export { 
  checkDebugEnabled,
  getAdhocDocuments,
  saveAdhocDocuments,
  ADHOC_DOCS_KEY 
} from './utils';

// Re-export document management
export {
  refreshDocuments,
  getIndexedDocuments,
  addAdhocDocument,
  removeAdhocDocument,
  exportDatabase,
  importDatabase,
  showClearDatabaseConfirmModal,
  clearDatabase,
  reloadDocuments,
  showAddDocumentModal
} from './documents';

// Re-export chat functions
export { addChatMessage, sendChatMessage, warmUpRAG } from './chat';

// Re-export state (for advanced usage)
export { state, debugDialog, floatingButton } from './state';

// Re-export React components
export { RAGDebugFAB, type RAGDebugFABProps } from './RAGDebugFAB';
export { DocumentsPanel, type DocumentsPanelProps } from './DocumentsPanel';
export { ReusableSpinner, type SpinnerProps as ReusableSpinnerProps } from './ReusableSpinner';
export { ChatPanel, type ChatPanelProps } from './ChatPanel';
