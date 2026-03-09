# Actions

Actions are custom voice commands that you define for your application. They allow the AI to perform business logic specific to your app.

## ⚠️ CRITICAL: Action Registration Timing

**All custom actions MUST be registered BEFORE starting the voice session!**

```typescript
// ✅ CORRECT - Register actions before starting session
vowel.registerAction('addToCart', definition, handler);
vowel.registerAction('searchProducts', definition, handler);
await vowel.startSession();

// ❌ WRONG - Registering actions after session starts has NO EFFECT
await vowel.startSession();
vowel.registerAction('addToCart', definition, handler);  // Too late! Won't work!
```

**Why?** Tool definitions are sent to the server during session initialization. Actions registered after `startSession()` are not sent to the AI and will never be called.

**Best Practice:** Always register all actions immediately after creating the Vowel client and before calling `startSession()`.

## Overview

When you register an action, the AI can:
- Understand when to call it based on user voice input
- Extract parameters from natural language
- Execute your handler function
- Return results to continue the conversation

## Basic Action Registration

```typescript
import { vowel } from './vowel.client';

vowel.registerAction('addToCart', {
  description: 'Add product to shopping cart',
  parameters: {
    productId: {
      type: 'string',
      description: 'Product ID'
    },
    quantity: {
      type: 'number',
      description: 'Quantity to add',
      default: 1
    }
  }
}, async ({ productId, quantity }) => {
  // Your business logic
  await addProductToCart(productId, quantity);
  
  return {
    success: true,
    message: `Added ${quantity} item(s) to cart`
  };
});
```

## Action Definition

### VowelAction Interface

```typescript
interface VowelAction {
  description: string;
  parameters: {
    [key: string]: VowelActionParameter;
  };
}

interface VowelActionParameter {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required?: boolean;
  default?: any;
  enum?: any[];
}
```

### Parameter Types

Actions support multiple parameter types:

```typescript
vowel.registerAction('createEvent', {
  description: 'Create a calendar event',
  parameters: {
    // String parameter
    title: {
      type: 'string',
      description: 'Event title',
      required: true
    },
    
    // Number parameter
    duration: {
      type: 'number',
      description: 'Duration in minutes',
      default: 60
    },
    
    // Boolean parameter
    allDay: {
      type: 'boolean',
      description: 'Is this an all-day event?',
      default: false
    },
    
    // Enum parameter
    priority: {
      type: 'string',
      description: 'Event priority',
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    
    // Array parameter
    attendees: {
      type: 'array',
      description: 'List of attendee email addresses'
    },
    
    // Object parameter
    location: {
      type: 'object',
      description: 'Event location details'
    }
  }
}, async (params) => {
  await createCalendarEvent(params);
  return { success: true };
});
```

## Action Handler

The action handler receives parameters and returns a result:

```typescript
type ActionHandler<T = any> = (
  params: T,
  context?: ToolContext
) => Promise<VowelToolResult> | VowelToolResult;

interface VowelToolResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}
```

### Basic Handler

```typescript
vowel.registerAction('getWeather', {
  description: 'Get current weather for a location',
  parameters: {
    city: {
      type: 'string',
      description: 'City name',
      required: true
    }
  }
}, async ({ city }) => {
  const weather = await fetchWeather(city);
  
  return {
    success: true,
    message: `The weather in ${city} is ${weather.condition}`,
    data: weather
  };
});
```

### Error Handling

```typescript
vowel.registerAction('processPayment', {
  description: 'Process payment for order',
  parameters: {
    orderId: {
      type: 'string',
      description: 'Order ID',
      required: true
    }
  }
}, async ({ orderId }) => {
  try {
    const result = await processPayment(orderId);
    
    return {
      success: true,
      message: 'Payment processed successfully',
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Payment processing failed'
    };
  }
});
```

## Common Action Patterns

### Search Action

```typescript
vowel.registerAction('searchProducts', {
  description: 'Search for products in the catalog',
  parameters: {
    query: {
      type: 'string',
      description: 'Search query',
      required: true
    },
    category: {
      type: 'string',
      description: 'Product category filter'
    },
    maxResults: {
      type: 'number',
      description: 'Maximum number of results',
      default: 10
    }
  }
}, async ({ query, category, maxResults }) => {
  const results = await searchProducts({
    query,
    category,
    limit: maxResults
  });
  
  return {
    success: true,
    message: `Found ${results.length} products`,
    data: results
  };
});
```

### CRUD Operations

```typescript
// Create
vowel.registerAction('createTask', {
  description: 'Create a new task',
  parameters: {
    title: { type: 'string', description: 'Task title', required: true },
    description: { type: 'string', description: 'Task description' },
    dueDate: { type: 'string', description: 'Due date (ISO format)' }
  }
}, async (params) => {
  const task = await createTask(params);
  return { success: true, data: task };
});

// Read
vowel.registerAction('getTask', {
  description: 'Get task details',
  parameters: {
    taskId: { type: 'string', description: 'Task ID', required: true }
  }
}, async ({ taskId }) => {
  const task = await getTask(taskId);
  return { success: true, data: task };
});

// Update
vowel.registerAction('updateTask', {
  description: 'Update task details',
  parameters: {
    taskId: { type: 'string', description: 'Task ID', required: true },
    title: { type: 'string', description: 'New title' },
    completed: { type: 'boolean', description: 'Mark as completed' }
  }
}, async ({ taskId, ...updates }) => {
  const task = await updateTask(taskId, updates);
  return { success: true, data: task };
});

// Delete
vowel.registerAction('deleteTask', {
  description: 'Delete a task',
  parameters: {
    taskId: { type: 'string', description: 'Task ID', required: true }
  }
}, async ({ taskId }) => {
  await deleteTask(taskId);
  return { success: true, message: 'Task deleted' };
});
```

### Cart Management

```typescript
vowel.registerAction('addToCart', {
  description: 'Add product to shopping cart',
  parameters: {
    productId: { type: 'string', required: true },
    quantity: { type: 'number', default: 1 }
  }
}, async ({ productId, quantity }) => {
  await cart.add(productId, quantity);
  return { success: true, message: `Added ${quantity} item(s) to cart` };
});

vowel.registerAction('removeFromCart', {
  description: 'Remove product from cart',
  parameters: {
    productId: { type: 'string', required: true }
  }
}, async ({ productId }) => {
  await cart.remove(productId);
  return { success: true, message: 'Removed from cart' };
});

vowel.registerAction('viewCart', {
  description: 'View shopping cart contents',
  parameters: {}
}, async () => {
  const items = await cart.getItems();
  const total = await cart.getTotal();
  
  return {
    success: true,
    message: `You have ${items.length} items totaling $${total}`,
    data: { items, total }
  };
});
```

### Form Submission

```typescript
vowel.registerAction('submitContactForm', {
  description: 'Submit contact form',
  parameters: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    message: { type: 'string', required: true }
  }
}, async ({ name, email, message }) => {
  await submitContactForm({ name, email, message });
  
  return {
    success: true,
    message: 'Thank you! Your message has been sent.'
  };
});
```

## Built-in Actions

Vowel automatically registers actions when you provide adapters:

### From NavigationAdapter

- `navigate_to_page` - Navigate to any route

### From AutomationAdapter

- `search_page_elements` - Search for elements
- `get_page_snapshot` - Get page structure
- `click_element` - Click any element
- `type_into_element` - Type into inputs
- `focus_element` - Focus an element
- `scroll_to_element` - Scroll to element
- `press_key` - Press keyboard keys

You don't need to register these manually - they work automatically!

## Action Context

Handlers receive an optional context parameter:

```typescript
interface ToolContext {
  sessionId: string;
  timestamp: number;
  // Additional context from the session
}

vowel.registerAction('logActivity', {
  description: 'Log user activity',
  parameters: {
    activity: { type: 'string', required: true }
  }
}, async ({ activity }, context) => {
  console.log('Session:', context?.sessionId);
  console.log('Timestamp:', context?.timestamp);
  
  await logActivity(activity, context);
  return { success: true };
});
```

## TypeScript Support

Use generics for type-safe parameters:

```typescript
interface AddToCartParams {
  productId: string;
  quantity: number;
}

vowel.registerAction<AddToCartParams>('addToCart', {
  description: 'Add product to cart',
  parameters: {
    productId: { type: 'string', required: true },
    quantity: { type: 'number', default: 1 }
  }
}, async (params) => {
  // params is typed as AddToCartParams
  const { productId, quantity } = params;
  
  await addToCart(productId, quantity);
  return { success: true };
});
```

## Best Practices

1. **Clear Descriptions** - Write clear, concise descriptions for actions and parameters
2. **Validate Input** - Always validate parameters in your handler
3. **Handle Errors** - Return proper error messages for failures
4. **Return Useful Data** - Include relevant data in the response
5. **Keep Handlers Fast** - Avoid long-running operations
6. **Use TypeScript** - Leverage type safety for parameters
7. **Test Actions** - Test action handlers independently
8. **Document Parameters** - Provide detailed parameter descriptions

## Testing Actions

Test action handlers independently:

```typescript
// Extract handler for testing
const addToCartHandler = async ({ productId, quantity }) => {
  await cart.add(productId, quantity);
  return { success: true };
};

// Test
describe('addToCart', () => {
  it('should add product to cart', async () => {
    const result = await addToCartHandler({
      productId: 'prod-123',
      quantity: 2
    });
    
    expect(result.success).toBe(true);
    expect(cart.items).toContain('prod-123');
  });
});

// Register with tested handler
vowel.registerAction('addToCart', definition, addToCartHandler);
```

## Related

- [Vowel Client](./vowel-client) - Core client API
- [Adapters](./adapters) - Built-in actions from adapters
- [Custom Actions Recipe](../recipes/custom-actions) - Advanced patterns
- [API Reference](/api/index/classes/Vowel#registeraction) - Complete API

