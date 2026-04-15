/**
 * @module rag-debug/RAGDebugTool
 * 
 * Main orchestrator component for the RAG debug tool.
 * 
 * Combines FAB, Dialog, DocumentsPanel, ChatPanel, and StatusBar
 * into a unified React interface.
 * 
 * Manages:
 * - Dialog open/close state
 * - Active tab state
 * - RAG initialization and state subscriptions
 * - Business logic integration via existing modules
 * 
 * @packageDocumentation
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

// Components
import { RAGDebugFAB } from './RAGDebugFAB';
import { RAGDebugDialog } from './RAGDebugDialog';
import { DocumentsPanel } from './DocumentsPanel';
import { ChatPanel } from './ChatPanel';

// Types
import type { DebugDocument, ChatMessage } from './types';
import type { InitializationProgress } from '../prebuilt-rag';

import { 
  getPrebuiltRAG, 
  markAutoInitStarted, 
  autoInitStarted,
  subscribeToChatMessages
} from './state';
import { 
  refreshDocuments, 
  showAddDocumentModal, 
  showClearDatabaseConfirmModal,
  getIndexedDocuments 
} from './documents';
import { sendChatMessage, warmUpRAG } from './chat';
import { checkDebugEnabled } from './utils';

/**
 * Status type for the status bar
 */
type StatusType = 'loading' | 'error' | 'ready';

/**
 * Interface for initialization state
 */
interface InitializationState {
  isInitializing: boolean;
  progress: number;
  message: string;
  error?: string;
  stage?: string;
}

/**
 * Main RAG Debug Tool component
 * 
 * This is the root component that orchestrates all RAG debug functionality:
 * - Floating action button (FAB)
 * - Draggable dialog with tabs
 * - Documents panel with folder tree
 * - Chat panel with search results
 * - Status bar with progress
 * 
 * Integrates with existing vanilla JS modules via callbacks and state bridging.
 * 
 * @example
 * ```tsx
 * // In a Vue component, mount like this:
 * import { createRoot } from 'react-dom/client';
 * import { createElement } from 'react';
 * import { RAGDebugTool } from './rag-debug/RAGDebugTool';
 * 
 * const container = document.getElementById('rag-debug-root');
 * const root = createRoot(container);
 * root.render(createElement(RAGDebugTool));
 * ```
 * 
 * @public
 */
export function RAGDebugTool(): React.ReactElement | null {
  // Check if debug mode is enabled
  const isDebugEnabled = checkDebugEnabled();
  if (!isDebugEnabled) {
    console.log('[RAGDebug] Debug mode not enabled. Set PUBLIC_VOWEL_DEBUG_RAG=true to enable.');
    return null;
  }

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'documents' | 'chat'>('documents');
  const [documents, setDocuments] = useState<DebugDocument[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'system',
      content: 'Welcome to RAG Debug Chat! Type a query to test semantic search against the documentation.',
      timestamp: Date.now(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Initializing...');
  const [statusType, setStatusType] = useState<StatusType>('loading');
  const [chunkCount, setChunkCount] = useState<number | undefined>(undefined);

  // Ref for tracking initialization
  const isInitialized = useRef(false);

  /**
   * Initialize RAG on mount
   */
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const initializeRAG = async () => {
      console.log('[RAGDebug] Initializing RAG...');
      setStatusType('loading');
      setStatusMessage('Loading Turso Browser RAG...');
      setProgress(5);

      try {
        const { prebuiltRAG, subscribeToInitializationState } = await getPrebuiltRAG();
        
        // Subscribe to initialization state changes
        subscribeToInitializationState((initState: InitializationState) => {
          setProgress(initState.progress);
          setStatusMessage(initState.message || 'Loading...');
          
          if (initState.error) {
            setStatusType('error');
            setStatusMessage(`Error: ${initState.error}`);
          } else if (initState.isInitializing) {
            setStatusType('loading');
          }
        });

        // Check if RAG is ready
        if (!prebuiltRAG.isReady()) {
          // Initialize RAG with progress updates
          setProgress(10);
          setStatusMessage('Initializing Turso Browser RAG...');

          await prebuiltRAG.initialize((progressCallback: InitializationProgress) => {
            setProgress(progressCallback.progress);
            setStatusMessage(progressCallback.message || 'Loading...');
          });
        }

        setStatusMessage('Warming up model...');
        await warmUpRAG();

        setProgress(100);
        setStatusType('ready');
        setStatusMessage('Turso Browser RAG Ready');
        
        // Get index size
        const size = await prebuiltRAG.getIndexSize();
        setChunkCount(size);

        // Load documents
        setIsLoading(false);
        const docs = await getIndexedDocuments();
        setDocuments(docs);

        console.log('[RAGDebug] RAG initialized successfully');
      } catch (error) {
        console.error('[RAGDebug] RAG initialization failed:', error);
        setStatusType('error');
        setStatusMessage(`Error: ${error instanceof Error ? error.message : 'Initialization failed'}`);
        setIsLoading(false);
      }
    };

    // Auto-initialize RAG on page load (non-blocking)
    if (!autoInitStarted) {
      markAutoInitStarted();
      initializeRAG();
    }

    return () => {
      // Cleanup if needed
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToChatMessages((messages) => {
      setChatMessages(messages);
    });
    
    return unsubscribe;
  }, []);

  /**
   * Handle FAB click
   */
  const handleFABClick = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  /**
   * Handle dialog close
   */
  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    
    if (open) {
      // Refresh data when opening
      refreshDocuments().then((docs) => {
        setDocuments(docs);
      });
    }
  }, []);

  /**
   * Handle tab change
   */
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as 'documents' | 'chat');
  }, []);

  /**
   * Handle refresh documents
   */
  const handleRefreshDocuments = useCallback(async () => {
    setIsLoading(true);
    setStatusType('loading');
    setStatusMessage('Loading documents...');

    try {
      const docs = await refreshDocuments();
      setDocuments(docs);
      
      const size = docs.reduce((acc, doc) => acc + doc.chunkCount, 0);
      setChunkCount(size);
      
      setStatusType('ready');
      setStatusMessage(`Loaded ${docs.length} documents`);
    } catch (error) {
      setStatusType('error');
      setStatusMessage(`Error: ${error instanceof Error ? error.message : 'Failed to load'}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Handle add document
   */
  const handleAddDocument = useCallback(() => {
    showAddDocumentModal();
  }, []);

  /**
   * Handle clear database
   */
  const handleClearDatabase = useCallback(() => {
    showClearDatabaseConfirmModal();
  }, []);

  const handleSendMessage = useCallback(async (message: string) => {
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, userMessage]);

    const loadingMessage: ChatMessage = {
      role: 'system',
      content: 'Loading Turso Browser RAG and searching...',
      timestamp: Date.now() + 1,
    };
    setChatMessages((prev) => [...prev, loadingMessage]);

    try {
      const response = await sendChatMessage(message);
      setChatMessages((prev) => {
        const withoutLoading = prev.filter((m) => m !== loadingMessage);
        if (response) {
          return [...withoutLoading, response];
        }
        return withoutLoading;
      });
    } catch (error) {
      setChatMessages((prev) => [
        ...prev.filter((m) => m !== loadingMessage),
        {
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Search failed'}`,
          timestamp: Date.now(),
        },
      ]);
    }
  }, []);

  /**
   * Check if FAB should be disabled
   */
  const isFABDisabled = statusType === 'error' || (statusType === 'loading' && progress < 100);

  return (
    <>
      {/* Inject styles */}
      <style>{`
        @keyframes rag-debug-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes rag-debug-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        /* FAB Styles */
        .rag-debug-fab {
          position: fixed;
          bottom: 20px;
          left: 20px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
          transition: all 0.3s ease;
          z-index: 9998;
        }
        
        .rag-debug-fab:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
        }
        
        .rag-debug-fab:active:not(:disabled) {
          transform: scale(0.95);
        }
        
        .rag-debug-fab:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .rag-debug-fab svg {
          width: 24px;
          height: 24px;
          color: white;
        }
        
        .rag-debug-fab.loading {
          cursor: wait;
        }
        
        /* Dialog Styles */
        .rag-debug-dialog {
          position: fixed;
          bottom: 80px;
          left: 20px;
          width: 600px;
          max-width: calc(100vw - 40px);
          max-height: 70vh;
          background: var(--vp-c-bg, white);
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
          z-index: 9997;
          overflow: hidden;
          border: 1px solid var(--vp-c-divider, #e2e8f0);
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
        }
        
        .rag-debug-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          flex-shrink: 0;
          cursor: grab;
          user-select: none;
        }
        
        .rag-debug-header:active {
          cursor: grabbing;
        }
        
        .rag-debug-title {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .rag-debug-close {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background 0.2s;
        }
        
        .rag-debug-close:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        /* Tabs */
        .rag-debug-tabs {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
        }
        
        .rag-debug-tabs-list {
          display: flex;
          border-bottom: 1px solid var(--vp-c-divider);
          background: var(--vp-c-bg-soft, #f8fafc);
        }
        
        .rag-debug-tab-trigger {
          flex: 1;
          padding: 12px 16px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: var(--vp-c-text-2);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
          border-bottom: 2px solid transparent;
        }
        
        .rag-debug-tab-trigger:hover {
          background: var(--vp-c-bg);
        }
        
        .rag-debug-tab-trigger[data-state="active"] {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }
        
        .rag-debug-tab-content {
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }
        
        /* Status Bar */
        .rag-debug-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: var(--vp-c-bg-soft, #f8fafc);
          border-top: 1px solid var(--vp-c-divider, #e2e8f0);
          font-size: 12px;
          font-family: system-ui, -apple-system, sans-serif;
          flex-shrink: 0;
        }
        
        .rag-debug-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          flex-shrink: 0;
        }
        
        .rag-debug-status-dot.loading {
          background: #f59e0b;
          animation: rag-debug-pulse 1.5s ease-in-out infinite;
        }
        
        .rag-debug-status-dot.error {
          background: #ef4444;
        }
        
        /* Progress */
        .rag-debug-progress-container {
          flex: 1;
          height: 4px;
          background: var(--vp-c-divider);
          border-radius: 2px;
          overflow: hidden;
        }
        
        .rag-debug-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
          transition: width 0.3s ease;
        }
        
        .rag-debug-progress-text {
          font-size: 11px;
          color: var(--vp-c-text-2);
          min-width: 35px;
        }
      `}</style>

      {/* Floating Action Button */}
      <RAGDebugFAB
        isLoading={statusType === 'loading'}
        progress={progress}
        disabled={isFABDisabled}
        onClick={handleFABClick}
      />

      <RAGDebugDialog
        open={isOpen}
        onOpenChange={handleOpenChange}
        statusMessage={statusMessage}
        statusType={statusType}
        progress={progress}
        chunkCount={chunkCount}
      >
        {{
          documentsPanel: (
            <DocumentsPanel
              documents={documents}
              onRefresh={handleRefreshDocuments}
              onAddDocument={handleAddDocument}
              onClearDatabase={handleClearDatabase}
              isLoading={isLoading}
            />
          ),
          chatPanel: (
            <ChatPanel
              messages={chatMessages}
              onSendMessage={handleSendMessage}
            />
          ),
        }}
      </RAGDebugDialog>
    </>
  );
}

export default RAGDebugTool;
