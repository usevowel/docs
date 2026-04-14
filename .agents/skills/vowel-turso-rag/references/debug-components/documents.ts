/**
 * @module rag-debug/documents
 * 
 * Document management for the RAG debug tool.
 * 
 * Includes folder tree rendering, adhoc document management,
 * import/export, and database clearing.
 * 
 * @packageDocumentation
 */

import type { DebugDocument, FolderNode, AdhocDocument } from './types';
import { state, debugDialog, getPrebuiltRAG, getLocalRAG } from './state';
import { ICONS } from './icons';
import { 
  escapeHtml, 
  getAdhocDocuments, 
  saveAdhocDocuments, 
  ADHOC_DOCS_KEY 
} from './utils';
import { addChatMessage } from './chat';
import { updateStatusMessage, updateProgressBar, updateStatus, updateFABProgress } from './ui';

/**
 * Get all indexed documents from the RAG system
 * Uses the prebuilt index for accurate document listing
 * 
 * @returns Promise resolving to array of debug documents
 * @public
 */
export async function getIndexedDocuments(): Promise<DebugDocument[]> {
  try {
    updateStatusMessage('Loading Turso Browser RAG...', 'loading');
    updateProgressBar(10, 'Initializing...');

    const { prebuiltRAG } = await getPrebuiltRAG();
    const localRAG = prebuiltRAG;

    await localRAG.ensureDocumentMetadataLoaded();

    updateStatusMessage('Retrieving documents...', 'loading');
    updateProgressBar(60, 'Building document list...');

    if (!localRAG.isReady()) {
      void localRAG.initialize((progress) => {
        updateFABProgress(progress.progress, progress.stage !== 'complete');
      }).catch((error) => {
        console.error('[rag-debug] Background RAG initialization failed:', error);
        updateFABProgress(0, false);
      });
    } else {
      updateFABProgress(100, false);
    }

    // Get adhoc documents from localStorage
    const adhocDocs = getAdhocDocuments();

    // Use the getDocuments() method to get accurate document list
    const documents = localRAG.getDocuments();

    // Map to DebugDocument format
    const debugDocs: DebugDocument[] = documents.map(doc => ({
      id: doc.path,
      title: doc.title,
      path: doc.path,
      category: doc.category,
      chunkCount: doc.chunkCount,
      isAdhoc: adhocDocs.some(d => d.path === doc.path),
    }));

    // Add any adhoc documents that might not be in the index yet
    for (const adhoc of adhocDocs) {
      if (!debugDocs.some(d => d.path === adhoc.path)) {
        debugDocs.push({
          id: adhoc.id,
          title: adhoc.title,
          path: adhoc.path,
          category: 'adhoc',
          chunkCount: 1,
          isAdhoc: true,
        });
      }
    }

    updateProgressBar(100);
    updateFABProgress(100, false);
    return debugDocs.sort((a, b) => a.path.localeCompare(b.path));
  } catch (error) {
    console.error('[rag-debug] Failed to get indexed documents:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    updateStatusMessage(`Error: ${errorMsg}`, 'error');
    updateFABProgress(0, false);
    updateProgressBar(0);
    return [];
  }
}

/**
 * Refresh the document tree display
 * 
 * @public
 */
export async function refreshDocuments(): Promise<void> {
  const treeContainer = debugDialog?.querySelector('#rag-debug-doc-tree');
  if (!treeContainer) return;

  state.isLoading = true;
  void updateStatus();
  updateProgressBar(0, 'Loading documents...');

  try {
    const docs = await getIndexedDocuments();
    state.documents = docs;

    if (docs.length === 0) {
      // Check if we got an error or just no docs
      const statusText = debugDialog?.querySelector('#rag-debug-status-text')?.textContent;
      if (statusText?.includes('Error')) {
        treeContainer.innerHTML = `
          <div class="rag-debug-empty">
            ${ICONS.database}
            <p>Failed to load documents. Check console for details.</p>
            <p style="font-size: 11px; margin-top: 8px;">${statusText}</p>
            <button class="rag-debug-btn" style="margin-top: 12px;" id="rag-debug-retry-rag">
              ${ICONS.refresh} Retry Loading
            </button>
          </div>
        `;
        treeContainer.querySelector('#rag-debug-retry-rag')?.addEventListener('click', () => {
          void refreshDocuments();
        });
      } else {
        treeContainer.innerHTML = `
          <div class="rag-debug-empty">
            ${ICONS.database}
            <p>No documents indexed yet. Click "Reload" to index documentation.</p>
          </div>
        `;
      }
    } else {
      // Build folder tree structure
      const tree = buildFolderTree(docs);
      treeContainer.innerHTML = renderFolderTree(tree);

      // Add click handlers for expand/collapse
      treeContainer.querySelectorAll('.rag-debug-folder-name').forEach((el) => {
        el.addEventListener('click', (e) => {
          const folder = (e.currentTarget as HTMLElement).closest('.rag-debug-folder');
          folder?.classList.toggle('expanded');
        });
      });

      updateStatusMessage(`Loaded ${docs.length} documents`, 'ready');
      updateProgressBar(100);
    }
  } catch (error) {
    console.error('[rag-debug] Failed to refresh documents:', error);
    treeContainer.innerHTML = `
      <div class="rag-debug-empty">
        ${ICONS.database}
        <p>Error loading documents</p>
        <p style="font-size: 11px; margin-top: 8px;">${error instanceof Error ? error.message : String(error)}</p>
        <button class="rag-debug-btn" style="margin-top: 12px;" id="rag-debug-retry-load">
          ${ICONS.refresh} Retry
        </button>
      </div>
    `;
    treeContainer.querySelector('#rag-debug-retry-load')?.addEventListener('click', () => {
      void refreshDocuments();
    });
    updateProgressBar(0);
  }

  state.isLoading = false;
  void updateStatus();
}

/**
 * Build a folder tree structure from flat document list
 * 
 * @param docs - Flat array of documents
 * @returns Root folder node
 * @internal
 */
function buildFolderTree(docs: DebugDocument[]): FolderNode {
  const root: FolderNode = { name: 'root', path: '', children: new Map(), files: [] };

  for (const doc of docs) {
    // Parse path like '../../content/docs/guides/index.mdx'
    const parts = doc.path.split('/').filter(p => p && p !== '..' && p !== 'src' && p !== 'content' && p !== 'docs');

    let current = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]!;
      if (!current.children.has(part)) {
        current.children.set(part, {
          name: part,
          path: [...parts.slice(0, i + 1)].join('/'),
          children: new Map(),
          files: [],
        });
      }
      current = current.children.get(part)!;
    }

    current.files.push(doc);
  }

  return root;
}

/**
 * Render the folder tree as HTML
 * 
 * @param node - Current folder node
 * @param level - Current nesting level
 * @returns HTML string
 * @internal
 */
function renderFolderTree(node: FolderNode, level = 0): string {
  if (level === 0) {
    // Root level - render children
    const children = Array.from(node.children.values());
    return `<div class="rag-debug-folder-tree">${children.map(child => renderFolderTree(child, level + 1)).join('')}</div>`;
  }

  const hasChildren = node.children.size > 0;
  const hasFiles = node.files.length > 0;

  let html = `<div class="rag-debug-folder expanded">`;

  // Folder header
  html += `
    <div class="rag-debug-folder-name">
      ${hasChildren ? ICONS['chevron-down'] : ICONS['chevron-right']}
      ${ICONS.folder}
      <span>${node.name}</span>
    </div>
  `;

  // Folder contents
  html += `<div class="rag-debug-folder-content">`;

  // Render subfolders
  for (const child of node.children.values()) {
    html += renderFolderTree(child, level + 1);
  }

  // Render files
  for (const file of node.files) {
    const fileName = file.path.split('/').pop() || file.title;
    html += `
      <div class="rag-debug-file ${file.isAdhoc ? 'adhoc' : ''}" data-path="${file.path}">
        ${ICONS.file}
        <span>${fileName}</span>
        ${file.isAdhoc ? '<span style="margin-left: 4px; color: #3b82f6;">(adhoc)</span>' : ''}
      </div>
    `;
  }

  html += `</div></div>`;

  return html;
}

/**
 * Show modal to add an adhoc document
 * 
 * @public
 */
export function showAddDocumentModal(): void {
  const modal = document.createElement('div');
  modal.className = 'rag-debug-modal-overlay';
  modal.id = 'rag-debug-add-modal';

  modal.innerHTML = `
    <div class="rag-debug-modal">
      <div class="rag-debug-modal-header">
        <h4>Add Adhoc Document</h4>
        <button class="rag-debug-close" aria-label="Close">${ICONS.close}</button>
      </div>
      <div class="rag-debug-modal-body">
        <div class="rag-debug-form-group">
          <label for="adhoc-title">Document Title</label>
          <input type="text" id="adhoc-title" placeholder="e.g., Custom Notes">
        </div>
        <div class="rag-debug-form-group">
          <label for="adhoc-path">Path (optional)</label>
          <input type="text" id="adhoc-path" placeholder="e.g., custom/notes.mdx">
        </div>
        <div class="rag-debug-form-group">
          <label for="adhoc-content">Content</label>
          <textarea id="adhoc-content" placeholder="Enter document content here..."></textarea>
        </div>
      </div>
      <div class="rag-debug-modal-footer">
        <button class="rag-debug-btn" id="adhoc-cancel">Cancel</button>
        <button class="rag-debug-btn primary" id="adhoc-save">Add Document</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Event handlers
  modal.querySelector('.rag-debug-close')?.addEventListener('click', () => modal.remove());
  modal.querySelector('#adhoc-cancel')?.addEventListener('click', () => modal.remove());

  modal.querySelector('#adhoc-save')?.addEventListener('click', async () => {
    const titleInput = modal.querySelector('#adhoc-title') as HTMLInputElement;
    const pathInput = modal.querySelector('#adhoc-path') as HTMLInputElement;
    const contentInput = modal.querySelector('#adhoc-content') as HTMLTextAreaElement;

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    let path = pathInput.value.trim();

    if (!title || !content) {
      alert('Title and content are required');
      return;
    }

    // Generate path if not provided
    if (!path) {
      path = `adhoc/${title.toLowerCase().replace(/\s+/g, '-')}.mdx`;
    }

    await addAdhocDocument(title, path, content);
    modal.remove();
    void refreshDocuments();
  });

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  // Focus title input
  setTimeout(() => {
    (modal.querySelector('#adhoc-title') as HTMLInputElement)?.focus();
  }, 100);
}

/**
 * Add an adhoc document to the index
 * 
 * @param title - Document title
 * @param path - Virtual file path
 * @param content - Document content
 * @public
 */
export async function addAdhocDocument(title: string, path: string, content: string): Promise<void> {
  try {
    const localRAG = await getLocalRAG();

    if (!localRAG.isReady()) {
      await localRAG.initialize();
    }

    // Store in localStorage for persistence
    const adhocDocs = getAdhocDocuments();
    adhocDocs.push({
      id: `adhoc-${Date.now()}`,
      title,
      path,
      content,
    });
    saveAdhocDocuments(adhocDocs);

    // Add to RAG index via the reindex mechanism
    // For now, we trigger a reindex to pick up the new document
    const { reload } = await getPrebuiltRAG();
    await reload();

    // Show success in chat
    await addChatMessage('system', `Added adhoc document: "${title}"`);
  } catch (error) {
    console.error('[rag-debug] Failed to add adhoc document:', error);
    alert('Failed to add document. See console for details.');
  }
}

/**
 * Remove an adhoc document
 * 
 * @param path - Path of the document to remove
 * @public
 */
export async function removeAdhocDocument(path: string): Promise<void> {
  try {
    const adhocDocs = getAdhocDocuments().filter(d => d.path !== path);
    saveAdhocDocuments(adhocDocs);

    // Reindex to remove
    const { reload } = await getPrebuiltRAG();
    await reload();

    await addChatMessage('system', `Removed adhoc document: "${path}"`);
    void refreshDocuments();
  } catch (error) {
    console.error('[rag-debug] Failed to remove adhoc document:', error);
  }
}

/**
 * Export the database to JSON
 * 
 * @public
 */
export async function exportDatabase(): Promise<void> {
  try {
    const localRAG = await getLocalRAG();

    if (!localRAG.isReady()) {
      await localRAG.initialize();
    }

    // Get all documents via search
    const results = await localRAG.search('documentation', 100);

    // Group by document
    const docs = new Map<string, { 
      title: string; 
      path: string; 
      category: string; 
      chunks: Array<{ text: string; index: number }> 
    }>();

    for (const result of results) {
      const path = result.metadata.path;
      if (!docs.has(path)) {
        docs.set(path, {
          title: result.metadata.title,
          path,
          category: result.metadata.category,
          chunks: [],
        });
      }
      docs.get(path)!.chunks.push({
        text: result.text,
        index: result.metadata.chunkIndex,
      });
    }

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      documents: Array.from(docs.values()),
      adhocDocuments: getAdhocDocuments(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `rag-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);

    await addChatMessage('system', 'Database exported successfully');
  } catch (error) {
    console.error('[rag-debug] Failed to export database:', error);
    alert('Failed to export database. See console for details.');
  }
}

/**
 * Import database from JSON
 * 
 * @public
 */
export function importDatabase(): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.adhocDocuments) {
        saveAdhocDocuments(data.adhocDocuments);
      }

      // Reindex to include imported documents
      const { reload } = await getPrebuiltRAG();
      await reload();

      await addChatMessage('system', `Imported ${data.adhocDocuments?.length || 0} adhoc documents`);
      void refreshDocuments();
    } catch (error) {
      console.error('[rag-debug] Failed to import database:', error);
      alert('Failed to import database. See console for details.');
    }
  };

  input.click();
}

/**
 * Show confirmation modal for clearing the database
 * 
 * @public
 */
export function showClearDatabaseConfirmModal(): void {
  const modal = document.createElement('div');
  modal.className = 'rag-debug-modal-overlay';
  modal.id = 'rag-debug-clear-confirm-modal';

  modal.innerHTML = `
    <div class="rag-debug-modal">
      <div class="rag-debug-modal-header">
        <h4>Clear Database</h4>
        <button class="rag-debug-close" aria-label="Close">${ICONS.close}</button>
      </div>
      <div class="rag-debug-modal-body">
        <p>Are you sure you want to clear the entire database?</p>
        <p class="rag-debug-warning-text">This will remove all indexed documents. Click "Reload" afterwards to reindex.</p>
      </div>
      <div class="rag-debug-modal-footer">
        <button class="rag-debug-btn" id="clear-confirm-cancel">Cancel</button>
        <button class="rag-debug-btn danger" id="clear-confirm-ok">Clear Database</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Event handlers
  const closeModal = () => modal.remove();

  modal.querySelector('.rag-debug-close')?.addEventListener('click', closeModal);
  modal.querySelector('#clear-confirm-cancel')?.addEventListener('click', closeModal);

  modal.querySelector('#clear-confirm-ok')?.addEventListener('click', async () => {
    closeModal();
    await clearDatabase();
  });

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
}

/**
 * Clear the entire database.
 * 
 * IMPORTANT: This does NOT auto-reload. The user must click "Reload" 
 * to reindex documents after clearing.
 * 
 * @public
 */
export async function clearDatabase(): Promise<void> {
  try {
    // Clear adhoc documents from localStorage
    localStorage.removeItem(ADHOC_DOCS_KEY);

    // Clear the RAG index (but don't reload)
    const localRAG = await getLocalRAG();
    await localRAG.clearIndex();

    // Clear documents from state and UI
    state.documents = [];
    const treeContainer = debugDialog?.querySelector('#rag-debug-doc-tree');
    if (treeContainer) {
      treeContainer.innerHTML = `
        <div class="rag-debug-empty">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
          <p>Database cleared. Click "Reload" to reindex documents.</p>
        </div>
      `;
    }
    updateStatusMessage('Database cleared', 'ready');
    updateProgressBar(0);

    await addChatMessage('system', 'Database cleared. Click "Reload" to reindex documents.');
  } catch (error) {
    console.error('[rag-debug] Failed to clear database:', error);
    await addChatMessage('system', 'Failed to clear database. See console for details.');
  }
}

/**
 * Reload all documents (reindex)
 * 
 * @public
 */
export async function reloadDocuments(): Promise<void> {
  try {
    state.isLoading = true;
    void updateStatus();
    updateProgressBar(0, 'Reloading documents...');
    updateFABProgress(0, true);

    const { reload } = await getPrebuiltRAG();
    await reload((progress) => {
      updateProgressBar(progress.progress, progress.message);
      updateFABProgress(progress.progress, progress.stage !== 'complete');
    });

    await addChatMessage('system', 'Documents reloaded successfully');
    updateProgressBar(100);
    updateFABProgress(100, false);
    void refreshDocuments();
  } catch (error) {
    console.error('[rag-debug] Failed to reload documents:', error);
    alert('Failed to reload documents. See console for details.');
    updateProgressBar(0);
    updateFABProgress(0, false);
  } finally {
    state.isLoading = false;
    void updateStatus();
  }
}
