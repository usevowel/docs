/**
 * @module rag-debug/styles
 * 
 * CSS styles for the RAG debug tool UI.
 * 
 * The documents panel uses a flex layout where:
 * - Toolbar stays fixed at the top
 * - Document tree is scrollable
 * 
 * @packageDocumentation
 */

/**
 * CSS styles string for the debug tool.
 * Injected into the document head on initialization.
 * 
 * @public
 */
export const DEBUG_STYLES = `
  /* Floating Action Button */
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
    pointer-events: auto;
  }

  .rag-debug-fab:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
  }

  .rag-debug-fab:active {
    transform: translateY(0) scale(0.95);
  }

  .rag-debug-fab svg {
    width: 24px;
    height: 24px;
    color: white;
  }

  /* Non-Modal Dialog */
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

  .rag-debug-dialog.hidden {
    display: none;
  }

  /* Dialog Header */
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

  .rag-debug-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .rag-debug-close {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }

  .rag-debug-close:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  /* Tab Navigation */
  .rag-debug-tabs {
    display: flex;
    border-bottom: 1px solid var(--vp-c-divider, #e2e8f0);
    background: var(--vp-c-bg-soft, #f8fafc);
    flex-shrink: 0;
  }

  .rag-debug-tab {
    flex: 1;
    padding: 12px 16px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: var(--vp-c-text-2, #64748b);
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .rag-debug-tab:hover {
    color: var(--vp-c-text-1, #334155);
    background: rgba(59, 130, 246, 0.05);
  }

  .rag-debug-tab.active {
    color: #3b82f6;
    border-bottom: 2px solid #3b82f6;
    background: var(--vp-c-bg, white);
  }

  /* Tab Content - Flex container for panels */
  .rag-debug-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  /* Panel base */
  .rag-debug-panel {
    flex: 1;
    overflow: hidden;
    display: none;
    flex-direction: column;
    min-height: 0;
  }

  .rag-debug-panel.active {
    display: flex;
  }

  /* Documents Panel - Fixed toolbar, scrollable tree */
  .rag-debug-documents-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  /* Toolbar - Fixed at top */
  .rag-debug-toolbar {
    display: flex;
    gap: 8px;
    padding: 16px;
    padding-bottom: 12px;
    flex-wrap: wrap;
    flex-shrink: 0;
    border-bottom: 1px solid var(--vp-c-divider, #e2e8f0);
    background: var(--vp-c-bg, white);
  }

  .rag-debug-btn {
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid var(--vp-c-divider, #e2e8f0);
    background: var(--vp-c-bg, white);
    color: var(--vp-c-text-1, #334155);
    font-size: 13px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
  }

  .rag-debug-btn:hover {
    background: var(--vp-c-bg-soft, #f8fafc);
    border-color: var(--vp-c-divider, #cbd5e1);
  }

  .rag-debug-btn.primary {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }

  .rag-debug-btn.primary:hover {
    background: #2563eb;
  }

  .rag-debug-btn.danger {
    background: #ef4444;
    color: white;
    border-color: #ef4444;
  }

  .rag-debug-btn.danger:hover {
    background: #dc2626;
    border-color: #dc2626;
  }

  .rag-debug-warning-text {
    color: #dc2626;
    font-size: 0.9em;
    margin-top: 8px;
  }

  .rag-debug-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Document Tree - Scrollable area */
  .rag-debug-tree-scroll {
    flex: 1;
    overflow: auto;
    padding: 12px 16px;
    min-height: 0;
  }

  .rag-debug-tree {
    border: 1px solid var(--vp-c-divider, #e2e8f0);
    border-radius: 8px;
    overflow: hidden;
  }

  .rag-debug-tree-header {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 80px;
    gap: 12px;
    padding: 10px 12px;
    background: var(--vp-c-bg-soft, #f8fafc);
    border-bottom: 1px solid var(--vp-c-divider, #e2e8f0);
    font-size: 12px;
    font-weight: 600;
    color: var(--vp-c-text-2, #475569);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .rag-debug-tree-item {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 80px;
    gap: 12px;
    padding: 12px;
    border-bottom: 1px solid var(--vp-c-divider, #e2e8f0);
    align-items: center;
    transition: background 0.2s;
  }

  .rag-debug-tree-item:last-child {
    border-bottom: none;
  }

  .rag-debug-tree-item:hover {
    background: var(--vp-c-bg-soft, #f8fafc);
  }

  .rag-debug-tree-item.adhoc {
    background: rgba(59, 130, 246, 0.05);
  }

  .rag-debug-tree-item.adhoc:hover {
    background: rgba(59, 130, 246, 0.1);
  }

  .rag-debug-doc-path {
    font-family: monospace;
    font-size: 12px;
    color: var(--vp-c-text-1, #334155);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .rag-debug-doc-path svg {
    color: var(--vp-c-text-2, #64748b);
    flex-shrink: 0;
  }

  .rag-debug-doc-category {
    font-size: 12px;
    color: var(--vp-c-text-2, #64748b);
  }

  .rag-debug-doc-chunks {
    font-size: 12px;
    color: var(--vp-c-text-2, #64748b);
    font-variant-numeric: tabular-nums;
  }

  .rag-debug-doc-actions {
    display: flex;
    gap: 4px;
    justify-content: flex-end;
  }

  .rag-debug-icon-btn {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--vp-c-text-2, #64748b);
    transition: all 0.2s;
  }

  .rag-debug-icon-btn:hover {
    background: var(--vp-c-divider, #e2e8f0);
    color: var(--vp-c-text-1, #334155);
  }

  .rag-debug-icon-btn.danger:hover {
    background: #fef2f2;
    color: #ef4444;
  }

  /* Folder Tree View */
  .rag-debug-folder-tree {
    font-family: monospace;
    font-size: 13px;
  }

  .rag-debug-folder {
    margin-left: 16px;
  }

  .rag-debug-folder:first-child {
    margin-left: 0;
  }

  .rag-debug-folder-name {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 0;
    color: var(--vp-c-text-1, #334155);
    cursor: pointer;
    user-select: none;
  }

  .rag-debug-folder-name:hover {
    color: #3b82f6;
  }

  .rag-debug-folder-content {
    display: none;
  }

  .rag-debug-folder.expanded > .rag-debug-folder-content {
    display: block;
  }

  .rag-debug-file {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 0 4px 22px;
    color: var(--vp-c-text-2, #475569);
  }

  .rag-debug-file:hover {
    color: #3b82f6;
  }

  .rag-debug-file svg {
    color: var(--vp-c-text-2, #64748b);
  }

  /* Chat Panel */
  .rag-debug-chat {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 400px;
  }

  .rag-debug-chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .rag-debug-message {
    max-width: 85%;
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 14px;
    line-height: 1.5;
  }

  .rag-debug-message.user {
    align-self: flex-end;
    background: #3b82f6;
    color: white;
    border-bottom-right-radius: 4px;
  }

  .rag-debug-message.assistant {
    align-self: flex-start;
    background: var(--vp-c-bg-soft, #f8fafc);
    color: var(--vp-c-text-1, #334155);
    border: 1px solid var(--vp-c-divider, #e2e8f0);
    border-bottom-left-radius: 4px;
  }

  .rag-debug-message.system {
    align-self: center;
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
    font-size: 12px;
    padding: 8px 12px;
  }

  .rag-debug-message-content {
    display: block;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .rag-debug-message.user .rag-debug-message-content {
    color: white;
  }

  .rag-debug-message.assistant .rag-debug-message-content {
    color: var(--vp-c-text-1, #334155);
  }

  .rag-debug-message-time {
    font-size: 11px;
    opacity: 0.7;
    margin-top: 4px;
  }

  /* Search Results in Chat */
  .rag-debug-results {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--vp-c-divider, #e2e8f0);
  }

  .rag-debug-results-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--vp-c-text-2, #64748b);
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Collapsible File Result Item */
  .rag-debug-result-file {
    background: var(--vp-c-bg, white);
    border: 1px solid var(--vp-c-divider, #e2e8f0);
    border-radius: 6px;
    margin-bottom: 8px;
    overflow: hidden;
  }

  .rag-debug-result-file-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    cursor: pointer;
    background: var(--vp-c-bg-soft, #f8fafc);
    transition: background 0.2s;
    user-select: none;
  }

  .rag-debug-result-file-header:hover {
    background: var(--vp-c-divider, #e2e8f0);
  }

  .rag-debug-result-file.expanded .rag-debug-result-file-header {
    background: rgba(59, 130, 246, 0.1);
  }

  .rag-debug-result-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    color: var(--vp-c-text-2, #64748b);
    transition: transform 0.2s;
    flex-shrink: 0;
  }

  .rag-debug-result-file.expanded .rag-debug-result-toggle {
    transform: rotate(90deg);
  }

  .rag-debug-result-toggle svg {
    width: 16px;
    height: 16px;
  }

  .rag-debug-result-file-info {
    flex: 1;
    min-width: 0;
  }

  .rag-debug-result-file-name {
    font-weight: 600;
    font-size: 13px;
    color: var(--vp-c-text-1, #334155);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .rag-debug-result-file-path {
    font-size: 11px;
    color: var(--vp-c-text-2, #64748b);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: monospace;
    margin-top: 2px;
  }

  .rag-debug-result-file-score {
    font-size: 11px;
    padding: 2px 6px;
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
    border-radius: 4px;
    font-variant-numeric: tabular-nums;
    font-weight: 500;
    flex-shrink: 0;
  }

  /* Expanded content area */
  .rag-debug-result-file-content {
    display: none;
    padding: 12px;
    background: var(--vp-c-bg, white);
    border-top: 1px solid var(--vp-c-divider, #e2e8f0);
    max-height: 300px;
    overflow-y: auto;
  }

  .rag-debug-result-file.expanded .rag-debug-result-file-content {
    display: block;
  }

  /* Individual chunks within a file */
  .rag-debug-result-chunk {
    margin-bottom: 12px;
    padding: 10px;
    background: var(--vp-c-bg-soft, #f8fafc);
    border-radius: 4px;
    border-left: 3px solid #3b82f6;
  }

  .rag-debug-result-chunk:last-child {
    margin-bottom: 0;
  }

  .rag-debug-result-chunk-header {
    font-size: 11px;
    font-weight: 600;
    color: var(--vp-c-text-2, #64748b);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .rag-debug-result-chunk-text {
    font-size: 13px;
    color: var(--vp-c-text-1, #334155);
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* Full document markdown rendering */
  .rag-debug-result-full-doc {
    font-size: 13px;
    line-height: 1.6;
    color: var(--vp-c-text-1, #334155);
    max-height: 400px;
    overflow-y: auto;
    padding: 16px;
    background: var(--vp-c-bg, white);
    border-radius: 4px;
  }

  .rag-debug-result-full-doc h1,
  .rag-debug-result-full-doc h2,
  .rag-debug-result-full-doc h3 {
    margin-top: 16px;
    margin-bottom: 12px;
    font-weight: 600;
    color: var(--vp-c-text-1, #334155);
    line-height: 1.3;
  }

  .rag-debug-result-full-doc h1 {
    font-size: 18px;
    border-bottom: 1px solid var(--vp-c-divider, #e2e8f0);
    padding-bottom: 8px;
  }

  .rag-debug-result-full-doc h2 {
    font-size: 16px;
    border-bottom: 1px solid var(--vp-c-divider, #e2e8f0);
    padding-bottom: 6px;
  }

  .rag-debug-result-full-doc h3 {
    font-size: 14px;
  }

  .rag-debug-result-full-doc p {
    margin-bottom: 12px;
  }

  .rag-debug-result-full-doc strong {
    font-weight: 600;
  }

  .rag-debug-result-full-doc em {
    font-style: italic;
  }

  .rag-debug-result-full-doc code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    background: var(--vp-c-bg-soft, #f8fafc);
    padding: 2px 6px;
    border-radius: 3px;
    color: #c2416c;
  }

  .rag-debug-result-full-doc pre {
    background: var(--vp-c-bg-soft, #f8fafc);
    padding: 12px;
    border-radius: 6px;
    overflow-x: auto;
    margin-bottom: 12px;
  }

  .rag-debug-result-full-doc pre code {
    background: none;
    padding: 0;
    color: var(--vp-c-text-1, #334155);
  }

  .rag-debug-result-full-doc ul,
  .rag-debug-result-full-doc ol {
    margin-bottom: 12px;
    padding-left: 24px;
  }

  .rag-debug-result-full-doc li {
    margin-bottom: 4px;
  }

  .rag-debug-result-full-doc a {
    color: #3b82f6;
    text-decoration: none;
  }

  .rag-debug-result-full-doc a:hover {
    text-decoration: underline;
  }

  .rag-debug-result-full-doc blockquote {
    border-left: 3px solid var(--vp-c-divider, #e2e8f0);
    padding-left: 12px;
    margin-bottom: 12px;
    color: var(--vp-c-text-2, #64748b);
    font-style: italic;
  }

  .rag-debug-result-full-doc hr {
    border: none;
    border-top: 1px solid var(--vp-c-divider, #e2e8f0);
    margin: 16px 0;
  }

  /* Chunk highlighting */
  .rag-debug-chunk-highlight {
    background: linear-gradient(120deg, #fef3c7 0%, #fde68a 100%);
    padding: 2px 4px;
    border-radius: 3px;
    border-left: 3px solid #f59e0b;
    animation: highlightPulse 2s ease-in-out;
  }

  @keyframes highlightPulse {
    0%, 100% { background-color: #fef3c7; }
    50% { background-color: #fde68a; }
  }

  .rag-debug-chunk-highlight:hover {
    background: #fcd34d;
  }

  /* Legacy styles (kept for backwards compatibility) */
  .rag-debug-result-item {
    padding: 8px 12px;
    background: var(--vp-c-bg, white);
    border: 1px solid var(--vp-c-divider, #e2e8f0);
    border-radius: 6px;
    margin-bottom: 8px;
    font-size: 13px;
  }

  .rag-debug-result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .rag-debug-result-title {
    font-weight: 600;
    color: var(--vp-c-text-1, #334155);
  }

  .rag-debug-result-score {
    font-size: 11px;
    padding: 2px 6px;
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
    border-radius: 4px;
    font-variant-numeric: tabular-nums;
  }

  .rag-debug-result-path {
    font-size: 11px;
    color: var(--vp-c-text-2, #64748b);
    margin-bottom: 4px;
  }

  .rag-debug-result-text {
    color: var(--vp-c-text-2, #475569);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Chat Input */
  .rag-debug-chat-input {
    display: flex;
    gap: 8px;
    padding: 16px;
    border-top: 1px solid var(--vp-c-divider, #e2e8f0);
    background: var(--vp-c-bg, white);
    flex-shrink: 0;
  }

  .rag-debug-chat-input input {
    flex: 1;
    padding: 10px 14px;
    border: 1px solid var(--vp-c-divider, #e2e8f0);
    border-radius: 8px;
    font-size: 14px;
    background: var(--vp-c-bg, white);
    color: var(--vp-c-text-1, #334155);
  }

  .rag-debug-chat-input input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .rag-debug-chat-input button {
    padding: 10px 16px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: background 0.2s;
  }

  .rag-debug-chat-input button:hover {
    background: #2563eb;
  }

  .rag-debug-chat-input button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Status Bar */
  .rag-debug-status {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px 16px;
    background: var(--vp-c-bg-soft, #f8fafc);
    border-top: 1px solid var(--vp-c-divider, #e2e8f0);
    font-size: 12px;
    color: var(--vp-c-text-2, #64748b);
    flex-shrink: 0;
  }

  .rag-debug-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
  }

  .rag-debug-status-dot.error {
    background: #ef4444;
  }

  .rag-debug-status-dot.loading {
    background: #f59e0b;
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* Progress Bar */
  .rag-debug-progress-container {
    flex: 1;
    max-width: 200px;
    height: 6px;
    background: var(--vp-c-divider, #e2e8f0);
    border-radius: 3px;
    overflow: hidden;
  }

  .rag-debug-progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
    border-radius: 3px;
    transition: width 0.3s ease;
    width: 0%;
  }

  .rag-debug-progress-text {
    font-size: 11px;
    min-width: 40px;
    text-align: right;
  }

  /* Floating Action Button Loading State */
  .rag-debug-fab.loading {
    background: linear-gradient(135deg, #4b5563 0%, #6b7280 100%);
    cursor: wait;
  }

  .rag-debug-fab.loading svg {
    animation: spin 1.5s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .rag-debug-fab-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 0 0 24px 24px;
    overflow: hidden;
  }

  .rag-debug-fab-progress-bar {
    height: 100%;
    background: #22c55e;
    transition: width 0.3s ease;
    width: 0%;
  }

  /* Modal for Add Document */
  .rag-debug-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  }

  .rag-debug-modal {
    background: var(--vp-c-bg, white);
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .rag-debug-modal-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--vp-c-divider, #e2e8f0);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .rag-debug-modal-header h4 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }

  .rag-debug-modal-body {
    padding: 20px;
    overflow-y: auto;
  }

  .rag-debug-form-group {
    margin-bottom: 16px;
  }

  .rag-debug-form-group label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: var(--vp-c-text-1, #334155);
    margin-bottom: 6px;
  }

  .rag-debug-form-group input,
  .rag-debug-form-group textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--vp-c-divider, #e2e8f0);
    border-radius: 6px;
    font-size: 14px;
    background: var(--vp-c-bg, white);
    color: var(--vp-c-text-1, #334155);
    font-family: inherit;
  }

  .rag-debug-form-group textarea {
    min-height: 150px;
    resize: vertical;
    font-family: monospace;
    font-size: 13px;
  }

  .rag-debug-form-group input:focus,
  .rag-debug-form-group textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .rag-debug-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 16px 20px;
    border-top: 1px solid var(--vp-c-divider, #e2e8f0);
    background: var(--vp-c-bg-soft, #f8fafc);
  }

  /* Empty State */
  .rag-debug-empty {
    text-align: center;
    padding: 40px 20px;
    color: var(--vp-c-text-2, #64748b);
  }

  .rag-debug-empty svg {
    margin-bottom: 12px;
    color: var(--vp-c-text-3, #cbd5e1);
  }

  .rag-debug-empty p {
    margin: 0;
    font-size: 14px;
  }

  /* Scrollbar styling */
  .rag-debug-dialog ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .rag-debug-dialog ::-webkit-scrollbar-track {
    background: transparent;
  }

  .rag-debug-dialog ::-webkit-scrollbar-thumb {
    background: var(--vp-c-divider, #e2e8f0);
    border-radius: 4px;
  }

  .rag-debug-dialog ::-webkit-scrollbar-thumb:hover {
    background: var(--vp-c-text-3, #cbd5e1);
  }
`;
