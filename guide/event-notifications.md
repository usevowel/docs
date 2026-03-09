# Event Notifications

Event notifications allow you to programmatically trigger AI voice responses for application events, without requiring user voice input.

## Overview

Use event notifications to make the AI speak about:
- Order confirmations
- Timer expiry
- New messages
- System alerts
- Status updates
- Form submissions
- Any application event

## Basic Usage

```typescript
import { vowel } from './vowel.client';

// Simple notification
await vowel.notifyEvent('Order placed successfully!');

// Notification with context
await vowel.notifyEvent('New message received', {
  from: 'John Doe',
  preview: 'Hey, are you available?',
  timestamp: new Date().toISOString()
});
```

## API

### notifyEvent Method

```typescript
vowel.notifyEvent(
  message: string,
  context?: Record<string, any>
): Promise<void>
```

**Parameters:**
- `message` - The message for the AI to speak about
- `context` - Optional context object with additional information

The AI will use both the message and context to generate a natural response.

## Common Patterns

### Order Confirmation

```typescript
async function handleOrderPlaced(order: Order) {
  await processOrder(order);
  
  await vowel.notifyEvent('Your order has been placed successfully!', {
    orderId: order.id,
    total: order.total,
    estimatedDelivery: order.estimatedDelivery,
    items: order.items.map(i => i.name)
  });
}
```

### Timer Expiry

```typescript
class VoiceTimer {
  private timerId: number | null = null;
  
  start(minutes: number) {
    this.timerId = setTimeout(async () => {
      await vowel.notifyEvent(`Your ${minutes}-minute timer has expired`);
    }, minutes * 60 * 1000);
  }
  
  cancel() {
    if (this.timerId) {
      clearTimeout(this.timerId);
    }
  }
}

// Usage
const timer = new VoiceTimer();
timer.start(5); // 5-minute timer
```

### New Message Notification

```typescript
// WebSocket listener
socket.on('new-message', async (message) => {
  await vowel.notifyEvent('You have a new message', {
    from: message.sender.name,
    preview: message.text.substring(0, 50),
    timestamp: message.timestamp
  });
});
```

### Shopping Cart Updates

```typescript
async function addToCart(product: Product, quantity: number) {
  cart.add(product, quantity);
  
  await vowel.notifyEvent('Item added to cart', {
    productName: product.name,
    quantity,
    cartTotal: cart.items.length,
    subtotal: cart.getSubtotal()
  });
}
```

### Form Submission

```typescript
async function handleFormSubmit(formData: FormData) {
  try {
    await submitForm(formData);
    
    await vowel.notifyEvent('Form submitted successfully!', {
      formType: 'contact',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    await vowel.notifyEvent('Form submission failed', {
      error: error.message
    });
  }
}
```

### System Alerts

```typescript
// Monitor system status
async function checkSystemHealth() {
  const health = await getSystemHealth();
  
  if (health.status === 'degraded') {
    await vowel.notifyEvent('System performance is degraded', {
      affectedServices: health.affectedServices,
      severity: 'warning'
    });
  }
}
```

## Advanced Patterns

### Debounced Notifications

Prevent notification spam:

```typescript
import { debounce } from 'lodash';

const notifyCartUpdate = debounce(async (cart: Cart) => {
  await vowel.notifyEvent('Cart updated', {
    itemCount: cart.items.length,
    total: cart.getTotal()
  });
}, 1000); // Wait 1 second after last update

// Usage
function updateCart(product: Product) {
  cart.add(product);
  notifyCartUpdate(cart);
}
```

### Conditional Notifications

Only notify based on user preferences:

```typescript
async function notifyIfEnabled(event: string, context?: any) {
  const preferences = await getUserPreferences();
  
  if (preferences.voiceNotifications) {
    await vowel.notifyEvent(event, context);
  }
}

// Usage
await notifyIfEnabled('Order placed', { orderId: '12345' });
```

### Priority Notifications

Handle urgent vs. non-urgent notifications:

```typescript
enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

async function notify(
  message: string,
  priority: NotificationPriority,
  context?: any
) {
  const prefixes = {
    [NotificationPriority.LOW]: '',
    [NotificationPriority.NORMAL]: '',
    [NotificationPriority.HIGH]: 'Important: ',
    [NotificationPriority.URGENT]: 'Urgent: '
  };
  
  await vowel.notifyEvent(prefixes[priority] + message, {
    ...context,
    priority
  });
}

// Usage
await notify('System maintenance in 5 minutes', NotificationPriority.HIGH);
await notify('Critical error occurred', NotificationPriority.URGENT);
```

### Queued Notifications

Queue notifications to prevent overlapping speech:

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
      await vowel.notifyEvent(notification.message, notification.context);
      
      // Wait for AI to finish speaking
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
await notificationQueue.add('First notification');
await notificationQueue.add('Second notification');
await notificationQueue.add('Third notification');
```

## React Integration

### Hook for Event Notifications

```tsx
import { useVowel } from '@vowel.to/client/react';
import { useCallback } from 'react';

export function useVoiceNotification() {
  const { client } = useVowel();
  
  const notify = useCallback(async (message: string, context?: any) => {
    if (client.state.isConnected) {
      await client.notifyEvent(message, context);
    }
  }, [client]);
  
  return { notify };
}

// Usage in component
function OrderConfirmation({ order }: { order: Order }) {
  const { notify } = useVoiceNotification();
  
  useEffect(() => {
    notify('Order confirmed!', {
      orderId: order.id,
      total: order.total
    });
  }, [order, notify]);
  
  return <div>Order #{order.id} confirmed!</div>;
}
```

### Component-Based Notifications

```tsx
function NotificationTrigger({ message, context }: {
  message: string;
  context?: any;
}) {
  const { notify } = useVoiceNotification();
  
  useEffect(() => {
    notify(message, context);
  }, [message, context, notify]);
  
  return null;
}

// Usage
<NotificationTrigger 
  message="Welcome to our store!" 
  context={{ userName: user.name }}
/>
```

## Error Handling

Always handle errors when sending notifications:

```typescript
async function safeNotify(message: string, context?: any) {
  try {
    await vowel.notifyEvent(message, context);
  } catch (error) {
    console.error('Failed to send voice notification:', error);
    
    // Fallback to visual notification
    showToast(message);
  }
}
```

## Best Practices

1. **Keep Messages Concise** - Voice notifications should be brief and clear
2. **Provide Context** - Include relevant data in the context object
3. **Don't Spam** - Use debouncing for frequent events
4. **Check Connection** - Verify session is active before notifying
5. **Handle Errors** - Always have a fallback for failed notifications
6. **Respect Preferences** - Allow users to disable voice notifications
7. **Test Notifications** - Test with actual voice output
8. **Consider Timing** - Don't interrupt important user actions

## When to Use Event Notifications

**Good Use Cases:**
- ✅ Order confirmations
- ✅ Timer/alarm expiry
- ✅ Important system alerts
- ✅ New message arrivals
- ✅ Task completions
- ✅ Status changes

**Avoid:**
- ❌ Every button click
- ❌ Frequent updates (use debouncing)
- ❌ Non-critical information
- ❌ During user speech input

## Related

- [Vowel Client](./vowel-client) - Core client API
- [Event Notifications Recipe](../recipes/event-notifications) - Advanced patterns
- [Speaking State Recipe](../recipes/speaking-state) - Track when AI is speaking
- [API Reference](/api/index/classes/Vowel#notifyevent) - Complete API

