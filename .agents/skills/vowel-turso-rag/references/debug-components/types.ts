/**
 * @module rag-debug/types
 * 
 * Type definitions for the RAG debug tool.
 * 
 * @packageDocumentation
 */

import type { SearchResult } from '../prebuilt-rag.ts';

export type { SearchResult };

/**
 * Represents a document entry in the debug view
 * 
 * @public
 */
export interface DebugDocument {
  /** Unique document identifier */
  id: string;
  /** Display title */
  title: string;
  /** File path */
  path: string;
  /** Document category */
  category: string;
  /** Number of chunks the document is split into */
  chunkCount: number;
  /** Whether this is a user-added adhoc document */
  isAdhoc: boolean;
}

/**
 * Chat message roles
 * 
 * @public
 */
export type ChatRole = 'user' | 'assistant' | 'system';

/**
 * Chat message in the debug interface
 * 
 * @public
 */
export interface ChatMessage {
  /** Message role */
  role: ChatRole;
  /** Message content */
  content: string;
  /** Unix timestamp */
  timestamp: number;
  /** Optional search results attached to the message */
  results?: SearchResult[];
}

/**
 * Current state of the debug tool
 * 
 * @public
 */
export interface DebugState {
  /** Whether the dialog is currently open */
  isOpen: boolean;
  /** Currently active tab */
  activeTab: 'documents' | 'chat';
  /** List of documents currently in the index */
  documents: DebugDocument[];
  /** Chat message history */
  chatMessages: ChatMessage[];
  /** Whether a loading operation is in progress */
  isLoading: boolean;
}

/**
 * Folder node for the document tree view
 * 
 * @public
 */
export interface FolderNode {
  /** Folder name */
  name: string;
  /** Full path */
  path: string;
  /** Child folders */
  children: Map<string, FolderNode>;
  /** Files in this folder */
  files: DebugDocument[];
}

/**
 * Adhoc document stored in localStorage
 * 
 * @public
 */
export interface AdhocDocument {
  /** Unique identifier */
  id: string;
  /** Document title */
  title: string;
  /** Virtual file path */
  path: string;
  /** Document content */
  content: string;
}
