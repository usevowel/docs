# RAG Debug Tool Fixes

This document summarizes the fixes applied to the RAG debug tool to address three issues:

## Issues Fixed

### 1. Modal Behavior Issue - Dialog Closes When Clicking Outside

**Problem**: The RAG debug dialog was using `@radix-ui/react-dialog` which creates a modal overlay. By default, clicking outside the dialog closes it, preventing users from interacting with the rest of the app while the dialog is open.

**Solution**: Replaced `@radix-ui/react-dialog` with a custom draggable floating div that doesn't have modal overlay behavior.

**Changes**:
- Removed import of `@radix-ui/react-dialog` from `RAGDebugDialog.tsx`
- Removed `Dialog.Root`, `Dialog.Portal`, `Dialog.Content`, `Dialog.Title`, and `Dialog.Close` components
- Replaced with a plain `<div>` element with custom drag-and-drop functionality
- Added explicit `handleClose` function to close the dialog
- Updated CSS to remove Dialog-specific styles
- Changed `Dialog.Title` to `<h3>` element for the dialog title

**File Modified**:
- `docs/.vitepress/theme/rag-debug/RAGDebugDialog.tsx`

### 2. WebGPU/WebAssembly Fallback for Embedding Model

**Problem**: The embedding model (Xenova/all-MiniLM-L6-v2) was not properly falling back to WebAssembly when WebGPU was unavailable, causing failures in environments without WebGPU support.

**Solution**: Implemented a proper WebGPU-to-WASM fallback mechanism using `@huggingface/transformers` library.

**Changes**:
- Updated `createExtractor()` function in `query-embeddings.ts` to:
  - Always try WebGPU first
  - Catch WebGPU errors and fall back to WASM
  - Log fallback attempts for debugging
- Updated documentation in `prebuilt-rag.ts` to reflect WebGPU acceleration with WASM fallback

**File Modified**:
- `docs/.vitepress/theme/query-embeddings.ts`
- `docs/.vitepress/theme/prebuilt-rag.ts`

### 3. Search Results Not Appearing in Chat Panel

**Problem**: When the agent calls the search knowledge base tool, the results don't always appear in the RAG debug panel, requiring users to close and reopen the dialog to see them.

**Root Cause**: The issue was with React state updates not creating new array references, causing the component to not re-render properly when new results were added.

**Solution**: Ensured that all array operations create new array references by using spread syntax.

**Changes**:
- Updated `handleSendMessage()` function in `RAGDebugTool.tsx` to explicitly create new array references when updating chat messages
- This ensures React detects the change and re-renders the component with the new results

**File Modified**:
- `docs/.vitepress/theme/rag-debug/RAGDebugTool.tsx`

## Testing Recommendations

1. **Modal Behavior**:
   - Open the RAG debug dialog
   - Click outside the dialog to verify it stays open
   - Drag the dialog by the header to verify it's draggable
   - Click the X button to verify it closes

2. **WebGPU/WebAssembly Fallback**:
   - Test in a browser with WebGPU support (Chrome 113+, Edge)
   - Test in a browser without WebGPU support
   - Check console logs for fallback attempts
   - Verify that embeddings are generated successfully in both cases

3. **Search Results Display**:
   - Open the RAG debug dialog
   - Navigate to the Chat tab
   - Send a query
   - Verify that search results appear immediately without needing to close and reopen the dialog
   - Test multiple queries to ensure results display consistently

## Dependencies

The following dependencies are already in use:
- `@huggingface/transformers` - Used for embedding generation with WebGPU/WASM support
- `@tursodatabase/database-wasm/vite` - Used for the vector database
- `@radix-ui/react-tabs` - Used for tab switching (Documents/Chat)

No new dependencies were added.

## Backward Compatibility

All changes are backward compatible:
- The WebGPU/WASM fallback mechanism automatically uses the best available backend
- The modal behavior change doesn't affect functionality, just improves UX
- The search results display fix is an internal improvement that doesn't change the API

## Future Enhancements

Potential improvements for future iterations:
1. Add a visual indicator when WebGPU is being used vs. WASM
2. Add keyboard shortcuts for dialog navigation
3. Persist dialog position in localStorage
4. Add drag-to-resize functionality for the dialog
5. Add a settings panel to configure which backend to use (WebGPU/WASM)