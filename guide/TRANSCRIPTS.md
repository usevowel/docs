# Transcripts Guide

This guide explains how to access and work with conversation transcripts in the Vowel client library.

## Table of Contents

- [Overview](#overview)
- [Accessing Transcripts](#accessing-transcripts)
- [Transcript Type Definition](#transcript-type-definition)
- [Common Use Cases](#common-use-cases)
- [API Reference](#api-reference)

---

## Overview

The Vowel client automatically captures and stores conversation transcripts during voice sessions. Transcripts include both user speech and AI assistant responses, making them useful for:

- Displaying conversation history in your UI
- Persisting conversations across sessions
- Analyzing conversation patterns
- Building chat interfaces
- Debugging voice interactions

---

## Accessing Transcripts

There are several ways to access transcripts from the Vowel client:

### 1. Via `getState()` Method

Get the current state snapshot, including all transcripts:

```typescript
import { Vowel } from '@vowel.to/client';

const vowel = new Vowel({
  appId: 'your-app-id',
  // ... other config
});

// Get current state
const state = vowel.getState();
console.log(state.transcripts); // VowelTranscript[]

// Access individual transcripts
state.transcripts.forEach((transcript, index) => {
  console.log(`${index + 1}. [${transcript.role}] ${transcript.text}`);
  console.log(`   Timestamp: ${transcript.timestamp}`);
});
```

### 2. Via `onStateChange()` Callback

Subscribe to state changes and access transcripts reactively:

```typescript
// Subscribe to state changes
const unsubscribe = vowel.onStateChange((state) => {
  // Access transcripts from the state object
  const transcripts = state.transcripts;
  
  // React to new transcripts
  if (transcripts.length > 0) {
    const latestTranscript = transcripts[transcripts.length - 1];
    console.log(`New ${latestTranscript.role} message: ${latestTranscript.text}`);
  }
});

// Don't forget to unsubscribe when done
// unsubscribe();
```

### 3. Via React Hook `useVowel()`

Access transcripts in React components:

```typescript
import { useVowel } from '@vowel.to/client/react';

function TranscriptPanel() {
  const { state } = useVowel();
  
  return (
    <div>
      <h2>Conversation History</h2>
      {state.transcripts.length === 0 ? (
        <p>No transcripts yet</p>
      ) : (
        <ul>
          {state.transcripts.map((transcript, index) => (
            <li key={index}>
              <strong>{transcript.role === 'user' ? 'You' : 'Assistant'}:</strong>
              {' '}
              {transcript.text}
              <br />
              <small>{transcript.timestamp.toLocaleTimeString()}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### 4. Via `exportState()` Method

Export transcripts along with other state for persistence:

```typescript
// Export state including transcripts
const exportedState = vowel.exportState({ maxTurns: 20 });
console.log(exportedState.transcripts); // VowelTranscript[]

// Save to localStorage
localStorage.setItem('vowel-conversation', JSON.stringify(exportedState));

// Later, restore from localStorage
const saved = JSON.parse(localStorage.getItem('vowel-conversation') || '{}');
if (saved.transcripts) {
  console.log(`Restoring ${saved.transcripts.length} transcript(s)`);
  await vowel.startSession({ restoreState: saved });
}
```

### 5. Via `onTranscriptEvent()` Method (Internal)

⚠️ **Note**: This method is marked as `@internal` and is intended for internal use (caption system). It provides streaming transcript events but is not part of the public API.

```typescript
// Internal API - use with caution
const unsubscribe = vowel.onTranscriptEvent((event) => {
  // event.type: 'delta' | 'done'
  // event.text: string
  // event.role: 'user' | 'assistant'
  // event.responseId?: string
  // event.itemId?: string
  
  if (event.type === 'delta') {
    console.log(`Streaming ${event.role} transcript: ${event.text}`);
  } else if (event.type === 'done') {
    console.log(`Complete ${event.role} transcript: ${event.text}`);
  }
});
```

---

## Transcript Type Definition

The `VowelTranscript` interface is exported from the package:

```typescript
import type { VowelTranscript } from '@vowel.to/client';

interface VowelTranscript {
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}
```

**Fields:**
- `role`: `"user"` for user speech, `"assistant"` for AI responses
- `text`: The transcribed text content
- `timestamp`: `Date` object indicating when the transcript was created

---

## Common Use Cases

### Displaying Conversation History

```typescript
import { useVowel } from '@vowel.to/client/react';

function ConversationHistory() {
  const { state } = useVowel();
  
  return (
    <div className="conversation-history">
      {state.transcripts.map((transcript, index) => (
        <div 
          key={index} 
          className={`message ${transcript.role}`}
        >
          <div className="role">{transcript.role === 'user' ? 'You' : 'AI'}</div>
          <div className="text">{transcript.text}</div>
          <div className="timestamp">
            {transcript.timestamp.toLocaleTimeString()}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Persisting Conversations

```typescript
// Save transcripts periodically
vowel.onStateChange((state) => {
  if (state.transcripts.length > 0) {
    const exported = vowel.exportState({ maxTurns: 50 });
    
    // Save to IndexedDB for persistence
    saveToIndexedDB('conversations', exported);
    
    // Or save to localStorage
    localStorage.setItem('vowel-conversation', JSON.stringify(exported));
  }
});

// Restore on page load
window.addEventListener('load', async () => {
  const saved = localStorage.getItem('vowel-conversation');
  if (saved) {
    const state = JSON.parse(saved);
    if (state.transcripts && state.transcripts.length > 0) {
      await vowel.startSession({ restoreState: state });
    }
  }
});
```

### Filtering Transcripts

```typescript
// Get only user transcripts
const userTranscripts = state.transcripts.filter(t => t.role === 'user');

// Get only assistant transcripts
const assistantTranscripts = state.transcripts.filter(t => t.role === 'assistant');

// Get transcripts from last 5 minutes
const recentTranscripts = state.transcripts.filter(t => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return t.timestamp > fiveMinutesAgo;
});
```

### Clearing Transcripts

```typescript
// Clear all transcripts
vowel.clearTranscripts();

// Or via React hook
const { clearTranscripts } = useVowel();
clearTranscripts();
```

### Exporting Transcripts for Analysis

```typescript
// Export transcripts as JSON
const transcripts = vowel.getState().transcripts;
const json = JSON.stringify(transcripts, null, 2);

// Export as CSV
const csv = transcripts.map(t => 
  `${t.timestamp.toISOString()},${t.role},"${t.text.replace(/"/g, '""')}"`
).join('\n');

// Export as plain text
const text = transcripts.map(t => 
  `${t.role === 'user' ? 'You' : 'Assistant'}: ${t.text}`
).join('\n\n');
```

### Building a Chat Interface

```typescript
import { useVowel } from '@vowel.to/client/react';
import { useState, useEffect } from 'react';

function ChatInterface() {
  const { state } = useVowel();
  const [messages, setMessages] = useState(state.transcripts);
  
  useEffect(() => {
    setMessages(state.transcripts);
  }, [state.transcripts]);
  
  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((transcript, index) => (
          <div 
            key={index}
            className={`message ${transcript.role}`}
          >
            <div className="avatar">
              {transcript.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="content">
              <div className="text">{transcript.text}</div>
              <div className="time">
                {transcript.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## API Reference

### Methods

#### `getState(): VoiceSessionState`

Returns the current state snapshot including transcripts.

```typescript
const state = vowel.getState();
const transcripts = state.transcripts; // VowelTranscript[]
```

#### `onStateChange(listener: (state: VoiceSessionState) => void): () => void`

Subscribe to state changes. Returns an unsubscribe function.

```typescript
const unsubscribe = vowel.onStateChange((state) => {
  console.log(state.transcripts);
});
```

#### `exportState(options?: { maxTurns?: number }): VoiceSessionState`

Export state including transcripts. Optionally limit to last N turns.

```typescript
const state = vowel.exportState({ maxTurns: 20 });
const transcripts = state.transcripts;
```

#### `clearTranscripts(): void`

Clear all transcripts from the current state.

```typescript
vowel.clearTranscripts();
```

### React Hook

#### `useVowel(): VowelContextType`

React hook that provides access to state including transcripts.

```typescript
const { state, clearTranscripts } = useVowel();
const transcripts = state.transcripts;
```

### Types

#### `VowelTranscript`

```typescript
interface VowelTranscript {
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}
```

#### `VoiceSessionState`

```typescript
interface VoiceSessionState {
  // ... other state fields
  transcripts: VowelTranscript[];
  // ... other state fields
}
```

---

## Best Practices

1. **Limit transcript history**: Use `exportState({ maxTurns: N })` to avoid storing too many transcripts
2. **Persist selectively**: Only save transcripts that are meaningful to your use case
3. **Handle timestamps**: Remember that `timestamp` is a `Date` object - serialize/deserialize appropriately when persisting
4. **Clear old transcripts**: Periodically clear transcripts to prevent memory bloat in long-running sessions
5. **Use state callbacks**: Prefer `onStateChange()` over polling `getState()` for reactive updates

---

## Related Documentation

- [Quick Reference](./QUICK_REFERENCE.md) - Quick reference for common operations
- [Pause/Resume and State Restoration](./PAUSE_RESUME_AND_STATE_RESTORATION.md) - State persistence guide

---

**Last Updated**: February 6, 2026
