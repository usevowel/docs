# Debug Components

The bundled debug source tree is copied from the VowelDocs Turso Browser RAG debug panel. Use it as reference material or as a starting point when the target project wants a dev-only RAG inspector.

Open only the files needed for the task.

## File Map

| File | Use when |
| --- | --- |
| `debug-components/index.ts` | Need exports, public API, or the debug feature overview. |
| `debug-components/ui.ts` | Need the floating action button, dialog shell, tabs, toolbar buttons, progress bar, open/close/toggle logic, keyboard handlers, or initialization flow. |
| `debug-components/styles.ts` | Need the CSS for FAB, buttons, tabs, dialog, tree, chat, messages, modals, loading states, and responsive behavior. |
| `debug-components/documents.ts` | Need document tree rendering, add/remove ad hoc docs, import/export, clear/reload, or folder hierarchy behavior. |
| `debug-components/chat.ts` | Need debug chat behavior that sends a query to RAG and renders result snippets. |
| `debug-components/state.ts` | Need shared debug state, lazy loading of the RAG runtime, or module-level references. |
| `debug-components/types.ts` | Need `DebugDocument`, `ChatMessage`, `DebugState`, `FolderNode`, or ad hoc document types. |
| `debug-components/icons.ts` | Need inline icon SVG strings. |
| `debug-components/utils.ts` | Need feature flag checks, localStorage helpers, URL/path helpers, or formatting helpers. |

## Component Responsibilities

- FAB: `createFloatingButton()` and `updateFABProgress()` in `ui.ts`; `.rag-debug-fab` styles in `styles.ts`.
- Dialog shell: `createDialog()` in `ui.ts`; header, close button, non-modal layout, and draggable behavior.
- Tabs: tab buttons and panel switching in `ui.ts`; `.rag-debug-tabs`, `.rag-debug-tab`, `.rag-debug-panel` in `styles.ts`.
- Buttons: toolbar and danger/primary variants in `ui.ts` and `styles.ts`.
- Tree: document grouping and rendering in `documents.ts`; `.rag-debug-tree*` styles in `styles.ts`.
- Chat: `addChatMessage()` and `sendChatMessage()` in `chat.ts`; `.rag-debug-chat*` and message/result styles in `styles.ts`.
- Modals: add-document and clear-confirm flows in `documents.ts`; modal styles in `styles.ts`.
- Progress/status: initialization state subscription from the RAG runtime plus status dot/progress bar updates in `ui.ts`.

## Integration Notes

Keep the debug tool development-only. The original source expects an environment flag equivalent to `PUBLIC_VOWEL_DEBUG_RAG=true`; adapt the flag to the host app.

The debug UI is DOM-based so it can be dropped into VitePress and other non-React shells. In React apps, either wrap it in a small effect that initializes/disposes the DOM tool or port the visual structure into React components while preserving the runtime API.

If copying this source tree, adapt relative imports. The skill includes `references/prebuilt-rag.ts` as a compatibility copy for the original `../prebuilt-rag.ts` imports, `references/query-embeddings.ts` so that compatibility copy resolves its local import, and `references/source/query-embeddings.ts` for the embedding provider used by the source runtime.

Do not ship destructive controls such as clear database, import database, or reload index to production unless the app explicitly requires an admin/debug mode.
