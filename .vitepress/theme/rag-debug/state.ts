/**
 * @module rag-debug/state
 * 
 * Shared state management for the RAG debug tool.
 * 
 * @packageDocumentation
 */

import type { DebugState, DebugDocument, ChatMessage } from './types';

const DEFAULT_CHAT_MESSAGES: ChatMessage[] = [
  {
    role: 'system',
    content: 'Welcome to RAG Debug Chat! Type a query to test semantic search against the documentation.',
    timestamp: Date.now(),
  },
];

/**
 * Global state for the debug tool
 * @public
 */
export const state: DebugState = {
  isOpen: false,
  activeTab: 'documents',
  documents: [],
  chatMessages: DEFAULT_CHAT_MESSAGES,
  isLoading: false,
};

type UIStateListener = (uiState: Pick<DebugState, 'isOpen' | 'activeTab'>) => void;
const uiStateListeners: Set<UIStateListener> = new Set();

function getUIState(): Pick<DebugState, 'isOpen' | 'activeTab'> {
  return {
    isOpen: state.isOpen,
    activeTab: state.activeTab,
  };
}

export function subscribeToUIState(listener: UIStateListener): () => void {
  uiStateListeners.add(listener);
  listener(getUIState());

  return () => {
    uiStateListeners.delete(listener);
  };
}

export function notifyUIStateListeners(): void {
  const uiState = getUIState();
  uiStateListeners.forEach((listener) => {
    listener(uiState);
  });
}

export function setDialogOpen(isOpen: boolean): void {
  if (state.isOpen === isOpen) return;
  state.isOpen = isOpen;
  notifyUIStateListeners();
}

export function setActiveTab(activeTab: DebugState['activeTab']): void {
  if (state.activeTab === activeTab) return;
  state.activeTab = activeTab;
  notifyUIStateListeners();
}

export function appendChatMessage(message: ChatMessage): ChatMessage[] {
  state.chatMessages = [...state.chatMessages, message];
  notifyChatMessageListeners();
  return state.chatMessages;
}

export function setChatMessages(messages: ChatMessage[]): ChatMessage[] {
  state.chatMessages = [...messages];
  notifyChatMessageListeners();
  return state.chatMessages;
}

/**
 * Subscription callbacks for chat message changes
 */
type ChatMessageListener = (messages: ChatMessage[]) => void;
const chatMessageListeners: Set<ChatMessageListener> = new Set();

/**
 * Subscribe to chat message changes
 * @param listener - Callback to be called when chat messages change
 * @returns Unsubscribe function
 * @public
 */
export function subscribeToChatMessages(listener: ChatMessageListener): () => void {
  chatMessageListeners.add(listener);
  listener([...state.chatMessages]);
  
  return () => {
    chatMessageListeners.delete(listener);
  };
}

/**
 * Notify all listeners of chat message changes
 * @internal
 */
export function notifyChatMessageListeners(): void {
  chatMessageListeners.forEach(listener => {
    listener([...state.chatMessages]);
  });
}

/**
 * Reference to the dialog element
 * @public
 */
export let debugDialog: HTMLElement | null = null;

/**
 * Reference to the floating button
 * @public
 */
export let floatingButton: HTMLElement | null = null;

/**
 * Set the debug dialog element reference
 * @public
 */
export function setDebugDialog(el: HTMLElement | null): void {
  debugDialog = el;
}

/**
 * Set the floating button element reference
 * @public
 */
export function setFloatingButton(el: HTMLElement | null): void {
  floatingButton = el;
}

/**
 * Whether auto-initialization is in progress
 * @internal
 */
export let autoInitStarted = false;

/**
 * Mark that auto-initialization has started
 * @internal
 */
export function markAutoInitStarted(): void {
  autoInitStarted = true;
}

/**
 * Reference to the prebuiltRAG module for lazy loading
 * @internal
 */
let prebuiltRAGModule: typeof import('../prebuilt-rag.ts') | null = null;

/**
 * Get the prebuiltRAG module, caching the import
 * @public
 */
export async function getPrebuiltRAG(): Promise<typeof import('../prebuilt-rag.ts')> {
  if (!prebuiltRAGModule) {
    prebuiltRAGModule = await import('../prebuilt-rag.ts');
  }
  return prebuiltRAGModule;
}

/**
 * Backward compatibility alias for prebuiltRAG
 * @public
 */
export async function getLocalRAG(): Promise<typeof import('../prebuilt-rag.ts')['prebuiltRAG']> {
  const mod = await getPrebuiltRAG();
  return mod.prebuiltRAG;
}
