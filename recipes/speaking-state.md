# Speaking State Tracking Recipe

Advanced patterns for tracking and responding to voice activity states.

## Overview

Vowel provides real-time state tracking for user speech, AI thinking, and AI speech. This recipe covers patterns for building responsive UIs and logic based on voice activity.

## State Tracking

### Basic State Access

```typescript
import { useVowel } from '@vowel.to/client/react';

function VoiceStatus() {
  const { state } = useVowel();

  return (
    <div>
      <p>Connected: {state.isConnected ? 'Yes' : 'No'}</p>
      <p>User Speaking: {state.isUserSpeaking ? 'Yes' : 'No'}</p>
      <p>AI Thinking: {state.isAIThinking ? 'Yes' : 'No'}</p>
      <p>AI Speaking: {state.isAISpeaking ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

### State Subscription

```typescript
// Subscribe to state changes
const unsubscribe = vowel.onStateChange((state) => {
  console.log('State changed:', {
    isConnected: state.isConnected,
    isUserSpeaking: state.isUserSpeaking,
    isAIThinking: state.isAIThinking,
    isAISpeaking: state.isAISpeaking
  });
});

// Cleanup
unsubscribe();
```

## UI Patterns

### Visual Indicators

```tsx
function VoiceIndicator() {
  const { state } = useVowel();

  return (
    <div className="voice-indicator">
      {state.isUserSpeaking && (
        <div className="indicator listening">
          <span className="icon">🎤</span>
          <span className="text">Listening...</span>
        </div>
      )}
      
      {state.isAIThinking && (
        <div className="indicator thinking">
          <span className="icon">🤔</span>
          <span className="text">Thinking...</span>
        </div>
      )}
      
      {state.isAISpeaking && (
        <div className="indicator speaking">
          <span className="icon">🔊</span>
          <span className="text">Speaking...</span>
        </div>
      )}
    </div>
  );
}
```

### Animated Indicators

```tsx
function AnimatedVoiceIndicator() {
  const { state } = useVowel();

  return (
    <div className="voice-indicator-animated">
      {state.isUserSpeaking && (
        <div className="pulse-animation">
          <div className="pulse-ring" />
          <div className="pulse-ring" />
          <div className="pulse-ring" />
        </div>
      )}
    </div>
  );
}
```

```css
.pulse-animation {
  position: relative;
  width: 60px;
  height: 60px;
}

.pulse-ring {
  position: absolute;
  border: 3px solid #007bff;
  border-radius: 50%;
  width: 100%;
  height: 100%;
  animation: pulse 1.5s ease-out infinite;
}

.pulse-ring:nth-child(2) {
  animation-delay: 0.5s;
}

.pulse-ring:nth-child(3) {
  animation-delay: 1s;
}

@keyframes pulse {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}
```

### Transcript Display

```tsx
function LiveTranscript() {
  const { state } = useVowel();
  const [transcript, setTranscript] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = vowel.onStateChange((state) => {
      // Add user speech to transcript
      if (state.userTranscript) {
        setTranscript(prev => [...prev, `User: ${state.userTranscript}`]);
      }
      
      // Add AI response to transcript
      if (state.aiResponse) {
        setTranscript(prev => [...prev, `AI: ${state.aiResponse}`]);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <div className="transcript">
      {transcript.map((line, i) => (
        <div key={i} className="transcript-line">
          {line}
        </div>
      ))}
    </div>
  );
}
```

## Conditional Logic

### Prevent Actions During Speech

```typescript
vowel.registerAction('addToCart', {
  description: 'Add product to cart',
  parameters: {
    productId: { type: 'string', required: true }
  }
}, async ({ productId }) => {
  // Wait if AI is speaking
  if (vowel.isAISpeaking()) {
    await waitForSpeechEnd();
  }
  
  await addToCart(productId);
  
  return { success: true };
});

function waitForSpeechEnd(): Promise<void> {
  return new Promise((resolve) => {
    const checkSpeaking = () => {
      if (!vowel.isAISpeaking()) {
        resolve();
      } else {
        setTimeout(checkSpeaking, 100);
      }
    };
    checkSpeaking();
  });
}
```

### Queue Notifications

```typescript
class NotificationQueue {
  private queue: Array<{ message: string; context?: any }> = [];
  private processing = false;

  async add(message: string, context?: any) {
    this.queue.push({ message, context });
    
    if (!this.processing) {
      await this.process();
    }
  }

  private async process() {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const notification = this.queue.shift()!;
      
      // Wait for AI to finish speaking
      await this.waitForSpeechEnd();
      
      // Send notification
      await vowel.notifyEvent(notification.message, notification.context);
      
      // Wait for AI to finish speaking this notification
      await this.waitForSpeechEnd();
    }
    
    this.processing = false;
  }

  private async waitForSpeechEnd(): Promise<void> {
    return new Promise((resolve) => {
      const checkSpeaking = () => {
        if (!vowel.isAISpeaking()) {
          resolve();
        } else {
          setTimeout(checkSpeaking, 100);
        }
      };
      checkSpeaking();
    });
  }
}

// Usage
const notificationQueue = new NotificationQueue();

await notificationQueue.add('Order placed');
await notificationQueue.add('Payment processed');
await notificationQueue.add('Confirmation email sent');
```

## Analytics

### Track Voice Usage

```typescript
class VoiceAnalytics {
  private sessionStart: number = 0;
  private userSpeechCount: number = 0;
  private aiResponseCount: number = 0;

  start() {
    this.sessionStart = Date.now();
    
    vowel.onStateChange((state) => {
      if (state.isUserSpeaking) {
        this.userSpeechCount++;
      }
      
      if (state.isAISpeaking) {
        this.aiResponseCount++;
      }
    });
  }

  getStats() {
    const duration = Date.now() - this.sessionStart;
    
    return {
      sessionDuration: duration,
      userSpeechCount: this.userSpeechCount,
      aiResponseCount: this.aiResponseCount,
      averageResponseTime: duration / this.aiResponseCount
    };
  }

  async sendToAnalytics() {
    const stats = this.getStats();
    
    await fetch('/api/analytics', {
      method: 'POST',
      body: JSON.stringify({
        event: 'voice_session',
        ...stats
      })
    });
  }
}

// Usage
const analytics = new VoiceAnalytics();
analytics.start();

// Later
await analytics.sendToAnalytics();
```

### Track State Transitions

```typescript
class StateTransitionTracker {
  private transitions: Array<{
    from: string;
    to: string;
    timestamp: number;
  }> = [];
  
  private previousState: string = 'idle';

  start() {
    vowel.onStateChange((state) => {
      const currentState = this.getCurrentState(state);
      
      if (currentState !== this.previousState) {
        this.transitions.push({
          from: this.previousState,
          to: currentState,
          timestamp: Date.now()
        });
        
        this.previousState = currentState;
      }
    });
  }

  private getCurrentState(state: VoiceSessionState): string {
    if (state.isUserSpeaking) return 'user_speaking';
    if (state.isAIThinking) return 'ai_thinking';
    if (state.isAISpeaking) return 'ai_speaking';
    if (state.isConnected) return 'connected';
    return 'idle';
  }

  getTransitions() {
    return this.transitions;
  }

  getAverageThinkingTime() {
    const thinkingTransitions = this.transitions.filter(
      t => t.to === 'ai_thinking'
    );
    
    const thinkingDurations = thinkingTransitions.map((t, i) => {
      const next = this.transitions[i + 1];
      return next ? next.timestamp - t.timestamp : 0;
    });
    
    const total = thinkingDurations.reduce((sum, d) => sum + d, 0);
    return total / thinkingDurations.length;
  }
}
```

## User Experience

### Disable Input During Speech

```tsx
function SearchForm() {
  const { state } = useVowel();
  const [query, setQuery] = useState('');

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={state.isAISpeaking}
        placeholder={
          state.isAISpeaking 
            ? 'AI is speaking...' 
            : 'Search products'
        }
      />
      <button 
        type="submit"
        disabled={state.isAISpeaking}
      >
        Search
      </button>
    </form>
  );
}
```

### Show Context During Speech

```tsx
function VoiceContext() {
  const { state } = useVowel();

  if (!state.isConnected) return null;

  return (
    <div className="voice-context">
      {state.isUserSpeaking && (
        <div className="context-card">
          <h4>Listening</h4>
          <p>Speak your command...</p>
        </div>
      )}
      
      {state.isAIThinking && (
        <div className="context-card">
          <h4>Processing</h4>
          <p>Understanding your request...</p>
        </div>
      )}
      
      {state.isAISpeaking && (
        <div className="context-card">
          <h4>Speaking</h4>
          <p>Listen to the response...</p>
        </div>
      )}
    </div>
  );
}
```

## Accessibility

### Screen Reader Announcements

```tsx
function VoiceAnnouncements() {
  const { state } = useVowel();
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (state.isUserSpeaking) {
      setAnnouncement('Listening to your voice');
    } else if (state.isAIThinking) {
      setAnnouncement('Processing your request');
    } else if (state.isAISpeaking) {
      setAnnouncement('AI is speaking');
    } else {
      setAnnouncement('');
    }
  }, [state]);

  return (
    <div 
      role="status" 
      aria-live="polite" 
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}
```

## Best Practices

1. **Visual Feedback** - Always show voice activity state
2. **Prevent Conflicts** - Disable conflicting actions during speech
3. **Queue Notifications** - Avoid overlapping speech
4. **Track Analytics** - Monitor voice usage patterns
5. **Accessibility** - Provide screen reader announcements
6. **Error States** - Handle connection errors gracefully
7. **Loading States** - Show thinking/processing indicators
8. **User Guidance** - Provide context during voice interactions
9. **State Transitions** - Track and analyze state changes
10. **Performance** - Optimize state update handlers

## Related

- [Event Notifications](./event-notifications) - Programmatic voice responses
- [Vowel Client](../guide/vowel-client) - Core client API
- [React Integration](../guide/react) - React-specific patterns
- [API Reference](/api/) - Complete API documentation

