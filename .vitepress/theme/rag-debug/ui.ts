/**
 * @module rag-debug/ui
 * 
 * UI creation and management for the RAG debug tool.
 * 
 * Handles DOM creation, event listeners, and UI updates.
 * 
 * @packageDocumentation
 */

import type { PrebuiltRAG, InitializationProgress } from '../prebuilt-rag.ts';
import { state, debugDialog, floatingButton, setDebugDialog, setFloatingButton, getPrebuiltRAG, getLocalRAG, markAutoInitStarted, autoInitStarted } from './state';
import { ICONS } from './icons';
import { DEBUG_STYLES } from './styles';
import { checkDebugEnabled } from './utils';
import { addChatMessage } from './chat';
import {
  refreshDocuments,
  showAddDocumentModal,
  showClearDatabaseConfirmModal,
  reloadDocuments
} from './documents';

/**
 * Make the dialog draggable by its header
 * @internal
 */
function makeDialogDraggable(dialog: HTMLElement): void {
  const header = dialog.querySelector('#rag-debug-header') as HTMLElement;
  if (!header) return;

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initialLeft = 0;
  let initialTop = 0;

  header.style.cursor = 'move';

  header.addEventListener('mousedown', (e: MouseEvent) => {
    // Don't drag if clicking close button
    if ((e.target as HTMLElement).closest('.rag-debug-close')) return;

    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;

    // Get current position from computed style
    const rect = dialog.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;

    // Change to absolute positioning for dragging
    dialog.style.position = 'fixed';
    dialog.style.left = `${initialLeft}px`;
    dialog.style.top = `${initialTop}px`;
    dialog.style.bottom = 'auto';
    dialog.style.margin = '0';

    e.preventDefault();
  });

  document.addEventListener('mousemove', (e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    dialog.style.left = `${initialLeft + deltaX}px`;
    dialog.style.top = `${initialTop + deltaY}px`;
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
}

/**
 * Inject styles into the document
 * @internal
 */
export function injectStyles(): void {
  if (document.getElementById('rag-debug-styles')) return;

  const style = document.createElement('style');
  style.id = 'rag-debug-styles';
  style.textContent = DEBUG_STYLES;
  document.head.appendChild(style);
}

/**
 * Create the floating action button
 * @internal
 */
export function createFloatingButton(): HTMLElement {
  const btn = document.createElement('button');
  btn.className = 'rag-debug-fab';
  btn.id = 'rag-debug-fab';
  btn.innerHTML = ICONS.lab;
  btn.title = 'Open RAG Debug Tool';
  btn.setAttribute('aria-label', 'Open RAG Debug Tool');
  btn.addEventListener('click', toggleDialog);
  return btn;
}

/**
 * Update the floating action button loading state
 * 
 * @param progress - Loading progress (0-100)
 * @param isLoading - Whether loading is in progress
 * @public
 */
export function updateFABProgress(progress: number, isLoading: boolean): void {
  const btn = document.getElementById('rag-debug-fab');
  if (!btn) return;

  if (isLoading) {
    btn.classList.add('loading');
    // Update icon to loading spinner if not already loading
    if (!btn.querySelector('.rag-debug-fab-progress')) {
      btn.innerHTML = `${ICONS.loading}<div class="rag-debug-fab-progress"><div class="rag-debug-fab-progress-bar"></div></div>`;
    }
    // Update progress bar
    const progressBar = btn.querySelector('.rag-debug-fab-progress-bar') as HTMLElement;
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
    btn.title = `Loading RAG... ${Math.round(progress)}%`;
  } else {
    btn.classList.remove('loading');
    btn.innerHTML = ICONS.lab;
    btn.title = 'Open RAG Debug Tool';
  }
}

/**
 * Create the debug dialog with tabbed interface
 * 
 * Documents panel has:
 * - Fixed toolbar at top with action buttons
 * - Scrollable tree view below
 * 
 * @internal
 */
export function createDialog(): HTMLElement {
  const dialog = document.createElement('div');
  dialog.className = 'rag-debug-dialog hidden';
  dialog.id = 'rag-debug-dialog';

  dialog.innerHTML = `
    <div class="rag-debug-header" id="rag-debug-header">
      <h3>${ICONS.lab} In-browser RAG</h3>
      <button class="rag-debug-close" aria-label="Close">${ICONS.close}</button>
    </div>

    <div class="rag-debug-tabs">
      <button class="rag-debug-tab active" data-tab="documents">
        ${ICONS.documents} Documents
      </button>
      <button class="rag-debug-tab" data-tab="chat">
        ${ICONS.chat} Chat
      </button>
    </div>

    <div class="rag-debug-content">
      <!-- Documents Panel -->
      <div class="rag-debug-panel active" id="rag-debug-documents-panel">
        <div class="rag-debug-documents-container">
          <!-- Fixed toolbar -->
          <div class="rag-debug-toolbar">
            <button class="rag-debug-btn primary" id="rag-debug-add-doc">
              ${ICONS.plus} Add Document
            </button>
            <button class="rag-debug-btn danger" id="rag-debug-clear">
              ${ICONS.trash} Clear DB
            </button>
            <button class="rag-debug-btn" id="rag-debug-reload">
              ${ICONS.refresh} Refresh
            </button>
          </div>
          <!-- Scrollable tree area -->
          <div class="rag-debug-tree-scroll">
            <div class="rag-debug-tree" id="rag-debug-doc-tree">
              <div class="rag-debug-empty">
                ${ICONS.database}
                <p>Loading documents...</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chat Panel -->
      <div class="rag-debug-panel" id="rag-debug-chat-panel">
        <div class="rag-debug-chat">
          <div class="rag-debug-chat-messages" id="rag-debug-chat-messages">
            <div class="rag-debug-message system">
              <div class="rag-debug-message-content">
                Welcome to RAG Debug Chat! Type a query to test semantic search against the documentation.
              </div>
            </div>
          </div>
          <div class="rag-debug-chat-input">
            <input
              type="text"
              id="rag-debug-chat-input"
              placeholder="Enter a query to search documentation..."
              autocomplete="off"
            />
            <button id="rag-debug-chat-send" disabled>
              ${ICONS.send} Send
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="rag-debug-status">
      <span class="rag-debug-status-dot" id="rag-debug-status-dot"></span>
      <span id="rag-debug-status-text">Initializing...</span>
      <div class="rag-debug-progress-container" id="rag-debug-progress-container" style="display: none;">
        <div class="rag-debug-progress-bar" id="rag-debug-progress-bar"></div>
      </div>
      <span class="rag-debug-progress-text" id="rag-debug-progress-text"></span>
      <span id="rag-debug-index-size"></span>
    </div>
  `;

  // Event listeners
  dialog.querySelector('.rag-debug-close')?.addEventListener('click', closeDialog);

  dialog.querySelectorAll('.rag-debug-tab').forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.getAttribute('data-tab') as 'documents' | 'chat'));
  });

  // Document toolbar buttons
  dialog.querySelector('#rag-debug-add-doc')?.addEventListener('click', showAddDocumentModal);
  dialog.querySelector('#rag-debug-clear')?.addEventListener('click', showClearDatabaseConfirmModal);
  dialog.querySelector('#rag-debug-reload')?.addEventListener('click', reloadDocuments);

  // Make dialog draggable via header
  makeDialogDraggable(dialog);

  // Chat input
  const chatInput = dialog.querySelector('#rag-debug-chat-input') as HTMLInputElement;
  const chatSend = dialog.querySelector('#rag-debug-chat-send') as HTMLButtonElement;

  chatInput?.addEventListener('input', () => {
    chatSend.disabled = chatInput.value.trim() === '';
  });

  chatInput?.addEventListener('keypress', (e) => {
    const value = chatInput.value.trim();
    console.log('[rag-debug] Enter pressed, value:', value);
    if (e.key === 'Enter' && value) {
      void import('./chat').then(({ sendChatMessage }) => {
        console.log('[rag-debug] Sending from Enter:', value);
        sendChatMessage(value);
      });
      chatInput.value = '';
      chatSend.disabled = true;
    }
  });

  chatSend?.addEventListener('click', () => {
    const value = chatInput.value.trim();
    console.log('[rag-debug] Send clicked, value:', value);
    if (value) {
      void import('./chat').then(({ sendChatMessage }) => {
        console.log('[rag-debug] Sending from button:', value);
        sendChatMessage(value);
      });
      chatInput.value = '';
      chatSend.disabled = true;
    }
  });

  return dialog;
}

/**
 * Toggle the debug dialog visibility
 * @public
 */
export function toggleDialog(): void {
  if (state.isOpen) {
    closeDialog();
  } else {
    openDialog();
  }
}

/**
 * Open the debug dialog
 * @public
 */
export function openDialog(): void {
  if (!debugDialog) return;

  debugDialog.classList.remove('hidden');
  state.isOpen = true;

  // Refresh data
  void refreshDocuments();
  void updateStatus();

  // Focus chat input if on chat tab
  if (state.activeTab === 'chat') {
    setTimeout(() => {
      const input = debugDialog?.querySelector('#rag-debug-chat-input') as HTMLInputElement;
      input?.focus();
    }, 100);
  }
}

/**
 * Close the debug dialog
 * @public
 */
export function closeDialog(): void {
  if (!debugDialog) return;

  debugDialog.classList.add('hidden');
  state.isOpen = false;
}

/**
 * Switch between tabs
 * 
 * @param tab - Tab to switch to ('documents' or 'chat')
 * @public
 */
export function switchTab(tab: 'documents' | 'chat'): void {
  state.activeTab = tab;

  // Update tab buttons
  debugDialog?.querySelectorAll('.rag-debug-tab').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
  });

  // Update panels
  debugDialog?.querySelectorAll('.rag-debug-panel').forEach((panel) => {
    const isTarget = (panel.id === `rag-debug-${tab}-panel`);
    panel.classList.toggle('active', isTarget);
  });

  // Focus input when switching to chat
  if (tab === 'chat') {
    setTimeout(() => {
      const input = debugDialog?.querySelector('#rag-debug-chat-input') as HTMLInputElement;
      input?.focus();
    }, 100);
  }
}

/**
 * Update status bar with custom message
 * 
 * @param message - Status message to display
 * @param type - Status type ('loading', 'error', 'ready')
 * @public
 */
export function updateStatusMessage(message: string, type: 'loading' | 'error' | 'ready'): void {
  const dot = debugDialog?.querySelector('#rag-debug-status-dot');
  const text = debugDialog?.querySelector('#rag-debug-status-text');

  if (!dot || !text) return;

  text.textContent = message;

  switch (type) {
    case 'loading':
      dot.className = 'rag-debug-status-dot loading';
      break;
    case 'error':
      dot.className = 'rag-debug-status-dot error';
      break;
    case 'ready':
      dot.className = 'rag-debug-status-dot';
      break;
  }
}

/**
 * Update progress bar in the status bar
 * 
 * @param progress - Progress percentage (0-100)
 * @param message - Optional message to display
 * @public
 */
export function updateProgressBar(progress: number, message?: string): void {
  const progressContainer = debugDialog?.querySelector('#rag-debug-progress-container') as HTMLElement;
  const progressBar = debugDialog?.querySelector('#rag-debug-progress-bar') as HTMLElement;
  const progressText = debugDialog?.querySelector('#rag-debug-progress-text') as HTMLElement;
  const statusText = debugDialog?.querySelector('#rag-debug-status-text');

  if (!progressContainer || !progressBar || !progressText) return;

  if (progress > 0 && progress < 100) {
    progressContainer.style.display = 'block';
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${Math.round(progress)}%`;
  } else {
    progressContainer.style.display = 'none';
    progressText.textContent = '';
  }

  if (message && statusText) {
    statusText.textContent = message;
  }
}

/**
 * Update the status bar with current RAG state
 * @public
 */
export async function updateStatus(): Promise<void> {
  const dot = debugDialog?.querySelector('#rag-debug-status-dot');
  const text = debugDialog?.querySelector('#rag-debug-status-text');
  const sizeEl = debugDialog?.querySelector('#rag-debug-index-size');

  if (!dot || !text) return;

  // Check global initialization state
  const { getInitializationState } = await getPrebuiltRAG();
  const initState = getInitializationState();

  if (state.isLoading || initState.isInitializing) {
    dot.className = 'rag-debug-status-dot loading';
    text.textContent = initState.message || 'Loading...';
    if (initState.progress > 0 && initState.progress < 100) {
      updateProgressBar(initState.progress);
    }
    return;
  }

  try {
    const localRAG = await getLocalRAG();

    if (!localRAG.isReady()) {
      dot.className = 'rag-debug-status-dot error';
      text.textContent = initState.error || 'RAG not initialized';
      updateProgressBar(0);
      return;
    }

    const size = await localRAG.getIndexSize();
    dot.className = 'rag-debug-status-dot';
    text.textContent = 'RAG Ready';
    if (sizeEl) {
      sizeEl.textContent = `| ${size} chunks indexed`;
    }
    updateProgressBar(100);
  } catch (error) {
    dot.className = 'rag-debug-status-dot error';
    text.textContent = 'RAG Error';
    updateProgressBar(0);
    console.error('[rag-debug] Status update failed:', error);
  }
}

/**
 * Initialize the RAG debug tool
 * Only runs if PUBLIC_VOWEL_DEBUG_RAG is enabled
 * @public
 */
export function initializeRAGDebug(): void {
  // Check if debug mode is enabled
  const isDebugEnabled = checkDebugEnabled();
  if (!isDebugEnabled) {
    console.log('[rag-debug] Debug mode not enabled. Set PUBLIC_VOWEL_DEBUG_RAG=true to enable.');
    return;
  }

  // Check if already initialized (elements exist in DOM)
  if (document.getElementById('rag-debug-fab') || document.getElementById('rag-debug-dialog')) {
    console.log('[rag-debug] Already initialized, skipping...');
    return;
  }

  console.log('[rag-debug] Initializing RAG debug tool...');

  // Inject styles
  injectStyles();

  // Create button and dialog
  const fab = createFloatingButton();
  const dialog = createDialog();

  setFloatingButton(fab);
  setDebugDialog(dialog);

  // Append to body
  document.body.appendChild(fab);
  document.body.appendChild(dialog);

  // Restore active tab state
  if (state.activeTab) {
    switchTab(state.activeTab);
  }

  // Subscribe to initialization state changes for UI updates
  getPrebuiltRAG().then(({ subscribeToInitializationState }) => {
    subscribeToInitializationState((initState) => {
      updateFABProgress(initState.progress, initState.isInitializing && initState.stage !== 'complete');
    });
  });

  // Auto-initialize RAG on page load (non-blocking)
  if (!autoInitStarted) {
    markAutoInitStarted();
    console.log('[rag-debug] Auto-initializing RAG on page load...');

    // Show loading state on FAB
    updateFABProgress(0, true);

    // Initialize RAG with progress updates
    getLocalRAG().then((localRAG: PrebuiltRAG) => {
      localRAG.initialize((progress: InitializationProgress) => {
        updateFABProgress(progress.progress, progress.stage !== 'complete');
        console.log(`[rag-debug] RAG loading: ${progress.progress}% - ${progress.message}`);
      }).then(() => {
        console.log('[rag-debug] RAG auto-initialization complete');
        updateFABProgress(100, false);
        // Refresh the document list if dialog is open
        if (state.isOpen) {
          void refreshDocuments();
        }
      }).catch((error: unknown) => {
        console.error('[rag-debug] RAG auto-initialization failed:', error);
        updateFABProgress(0, false);
      });
    });
  }

  // Initial status update
  void updateStatus();

  console.log('[rag-debug] RAG debug tool initialized. Click the lab icon in the bottom left to open.');
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

// Make available globally
if (typeof window !== 'undefined') {
  (window as typeof window & {
    __ragDebug?: {
      initialize: typeof initializeRAGDebug;
      setEnabled: typeof setDebugEnabled;
      open: typeof openDialog;
      close: typeof closeDialog;
    };
  }).__ragDebug = {
    initialize: initializeRAGDebug,
    setEnabled: setDebugEnabled,
    open: openDialog,
    close: closeDialog,
  };
}
