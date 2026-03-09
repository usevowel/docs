# Custom Actions Recipe

Advanced patterns and best practices for creating custom voice actions.

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

Custom actions extend your voice agent with business-specific functionality. This recipe covers advanced patterns for building robust, user-friendly voice commands.

## Action Design Patterns

### Command Pattern

Simple, imperative actions:

```typescript
vowel.registerAction('clearCart', {
  description: 'Clear all items from shopping cart',
  parameters: {}
}, async () => {
  await cart.clear();
  return {
    success: true,
    message: 'Cart cleared'
  };
});
```

### Query Pattern

Actions that retrieve information:

```typescript
vowel.registerAction('getOrderStatus', {
  description: 'Check order status',
  parameters: {
    orderId: {
      type: 'string',
      description: 'Order ID',
      required: true
    }
  }
}, async ({ orderId }) => {
  const order = await fetchOrder(orderId);
  
  return {
    success: true,
    message: `Order ${orderId} is ${order.status}`,
    data: order
  };
});
```

### Wizard Pattern

Multi-step actions with state:

```typescript
class CheckoutWizard {
  private state = {
    step: 'shipping',
    data: {}
  };

  register(vowel: Vowel) {
    vowel.registerAction('proceedCheckout', {
      description: 'Proceed with checkout',
      parameters: {
        shippingAddress: { type: 'string' },
        paymentMethod: { type: 'string' },
        confirmOrder: { type: 'boolean' }
      }
    }, async (params) => {
      switch (this.state.step) {
        case 'shipping':
          this.state.data.shipping = params.shippingAddress;
          this.state.step = 'payment';
          return {
            success: true,
            message: 'Shipping address saved. Now provide payment method.'
          };
          
        case 'payment':
          this.state.data.payment = params.paymentMethod;
          this.state.step = 'confirm';
          return {
            success: true,
            message: 'Payment method saved. Please confirm your order.'
          };
          
        case 'confirm':
          if (params.confirmOrder) {
            const order = await placeOrder(this.state.data);
            this.reset();
            return {
              success: true,
              message: `Order placed! Order ID: ${order.id}`,
              data: order
            };
          }
          break;
      }
    });
  }

  reset() {
    this.state = { step: 'shipping', data: {} };
  }
}
```

## Parameter Validation

### Required Parameters

```typescript
vowel.registerAction('sendMessage', {
  description: 'Send a message',
  parameters: {
    recipient: {
      type: 'string',
      description: 'Recipient email',
      required: true
    },
    subject: {
      type: 'string',
      description: 'Message subject',
      required: true
    },
    body: {
      type: 'string',
      description: 'Message body',
      required: true
    }
  }
}, async ({ recipient, subject, body }) => {
  // Validate email
  if (!isValidEmail(recipient)) {
    return {
      success: false,
      error: 'Invalid email address'
    };
  }
  
  // Validate length
  if (body.length < 10) {
    return {
      success: false,
      error: 'Message body too short'
    };
  }
  
  await sendMessage({ recipient, subject, body });
  return { success: true, message: 'Message sent' };
});
```

### Enum Parameters

```typescript
vowel.registerAction('setTheme', {
  description: 'Change application theme',
  parameters: {
    theme: {
      type: 'string',
      description: 'Theme name',
      enum: ['light', 'dark', 'auto'],
      required: true
    }
  }
}, async ({ theme }) => {
  setTheme(theme);
  return {
    success: true,
    message: `Theme set to ${theme}`
  };
});
```

### Range Validation

```typescript
vowel.registerAction('setVolume', {
  description: 'Set audio volume',
  parameters: {
    level: {
      type: 'number',
      description: 'Volume level (0-100)',
      required: true
    }
  }
}, async ({ level }) => {
  // Validate range
  if (level < 0 || level > 100) {
    return {
      success: false,
      error: 'Volume must be between 0 and 100'
    };
  }
  
  setVolume(level);
  return {
    success: true,
    message: `Volume set to ${level}%`
  };
});
```

## Context-Aware Actions

### User Context

```typescript
vowel.registerAction('viewMyOrders', {
  description: 'View my order history',
  parameters: {}
}, async (params, context) => {
  const user = getCurrentUser();
  
  if (!user) {
    return {
      success: false,
      error: 'Please sign in to view orders'
    };
  }
  
  const orders = await fetchUserOrders(user.id);
  
  return {
    success: true,
    message: `You have ${orders.length} orders`,
    data: orders
  };
});
```

### Location Context

```typescript
vowel.registerAction('findNearbyStores', {
  description: 'Find stores near me',
  parameters: {
    radius: {
      type: 'number',
      description: 'Search radius in miles',
      default: 10
    }
  }
}, async ({ radius }) => {
  const location = await getUserLocation();
  
  if (!location) {
    return {
      success: false,
      error: 'Location access required'
    };
  }
  
  const stores = await findStores({
    lat: location.latitude,
    lng: location.longitude,
    radius
  });
  
  return {
    success: true,
    message: `Found ${stores.length} stores within ${radius} miles`,
    data: stores
  };
});
```

### Page Context

```typescript
vowel.registerAction('addCurrentProductToCart', {
  description: 'Add the current product to cart',
  parameters: {
    quantity: {
      type: 'number',
      description: 'Quantity to add',
      default: 1
    }
  }
}, async ({ quantity }) => {
  // Get current product from page
  const productId = getCurrentProductId();
  
  if (!productId) {
    return {
      success: false,
      error: 'Not viewing a product page'
    };
  }
  
  await addToCart(productId, quantity);
  
  return {
    success: true,
    message: `Added ${quantity} item(s) to cart`
  };
});
```

## Async Operations

### Loading States

```typescript
vowel.registerAction('generateReport', {
  description: 'Generate analytics report',
  parameters: {
    reportType: {
      type: 'string',
      description: 'Report type',
      enum: ['sales', 'traffic', 'conversions']
    }
  }
}, async ({ reportType }) => {
  // Notify start
  await vowel.notifyEvent('Generating report, please wait...');
  
  try {
    // Long-running operation
    const report = await generateReport(reportType);
    
    // Notify completion
    await vowel.notifyEvent('Report generated successfully');
    
    return {
      success: true,
      data: report
    };
  } catch (error) {
    await vowel.notifyEvent('Failed to generate report');
    
    return {
      success: false,
      error: error.message
    };
  }
});
```

### Progress Updates

```typescript
vowel.registerAction('bulkImport', {
  description: 'Import products from file',
  parameters: {
    fileUrl: {
      type: 'string',
      description: 'File URL'
    }
  }
}, async ({ fileUrl }) => {
  const items = await fetchImportFile(fileUrl);
  const total = items.length;
  let processed = 0;
  
  for (const item of items) {
    await importProduct(item);
    processed++;
    
    // Update progress every 10 items
    if (processed % 10 === 0) {
      await vowel.notifyEvent(
        `Imported ${processed} of ${total} products`
      );
    }
  }
  
  return {
    success: true,
    message: `Successfully imported ${total} products`
  };
});
```

## Error Handling

### Graceful Degradation

```typescript
vowel.registerAction('searchProducts', {
  description: 'Search for products',
  parameters: {
    query: { type: 'string', required: true }
  }
}, async ({ query }) => {
  try {
    const results = await searchAPI(query);
    
    return {
      success: true,
      message: `Found ${results.length} products`,
      data: results
    };
  } catch (error) {
    // Fallback to local search
    console.warn('API search failed, using local search', error);
    
    const results = localSearch(query);
    
    return {
      success: true,
      message: `Found ${results.length} products (offline mode)`,
      data: results
    };
  }
});
```

### User-Friendly Errors

```typescript
vowel.registerAction('processPayment', {
  description: 'Process payment',
  parameters: {
    amount: { type: 'number', required: true }
  }
}, async ({ amount }) => {
  try {
    const result = await processPayment(amount);
    return { success: true, data: result };
  } catch (error) {
    // Map technical errors to user-friendly messages
    const errorMessages = {
      'INSUFFICIENT_FUNDS': 'Insufficient funds in your account',
      'CARD_DECLINED': 'Your card was declined',
      'NETWORK_ERROR': 'Network error, please try again',
      'DEFAULT': 'Payment failed, please try again'
    };
    
    const message = errorMessages[error.code] || errorMessages.DEFAULT;
    
    return {
      success: false,
      error: message
    };
  }
});
```

## Action Composition

### Chaining Actions

```typescript
vowel.registerAction('quickCheckout', {
  description: 'Quick checkout with saved payment method',
  parameters: {}
}, async () => {
  // Validate cart
  if (cart.isEmpty()) {
    return {
      success: false,
      error: 'Cart is empty'
    };
  }
  
  // Get saved payment method
  const paymentMethod = await getSavedPaymentMethod();
  
  if (!paymentMethod) {
    return {
      success: false,
      error: 'No saved payment method'
    };
  }
  
  // Process order
  const order = await createOrder({
    items: cart.items,
    paymentMethod
  });
  
  // Clear cart
  await cart.clear();
  
  // Notify
  await vowel.notifyEvent('Order placed successfully!', {
    orderId: order.id,
    total: order.total
  });
  
  return {
    success: true,
    data: order
  };
});
```

### Conditional Actions

```typescript
vowel.registerAction('smartAddToCart', {
  description: 'Add product to cart with smart recommendations',
  parameters: {
    productId: { type: 'string', required: true }
  }
}, async ({ productId }) => {
  const product = await getProduct(productId);
  
  // Add to cart
  await cart.add(product);
  
  // Check for recommendations
  const recommendations = await getRecommendations(productId);
  
  if (recommendations.length > 0) {
    await vowel.notifyEvent(
      `Added ${product.name} to cart. Would you like to see related products?`,
      { recommendations }
    );
  } else {
    await vowel.notifyEvent(`Added ${product.name} to cart`);
  }
  
  return { success: true };
});
```

## Testing Actions

### Unit Testing

```typescript
// Extract handler for testing
const addToCartHandler = async ({ productId, quantity }) => {
  const product = await getProduct(productId);
  await cart.add(product, quantity);
  return {
    success: true,
    message: `Added ${quantity} ${product.name} to cart`
  };
};

// Test
describe('addToCart', () => {
  it('should add product to cart', async () => {
    const result = await addToCartHandler({
      productId: 'prod-123',
      quantity: 2
    });
    
    expect(result.success).toBe(true);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(2);
  });
  
  it('should handle invalid product', async () => {
    const result = await addToCartHandler({
      productId: 'invalid',
      quantity: 1
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

// Register with tested handler
vowel.registerAction('addToCart', definition, addToCartHandler);
```

## Best Practices

1. **Clear Descriptions** - Write clear, concise action and parameter descriptions
2. **Validate Input** - Always validate parameters before processing
3. **Handle Errors** - Return user-friendly error messages
4. **Provide Feedback** - Use notifyEvent for progress updates
5. **Keep Actions Focused** - One action should do one thing well
6. **Use TypeScript** - Leverage type safety
7. **Test Thoroughly** - Write unit tests for action handlers
8. **Document Parameters** - Provide detailed parameter descriptions
9. **Consider Context** - Use user, location, and page context
10. **Graceful Degradation** - Handle failures gracefully

## Related

- [Actions Guide](../guide/actions) - Core action concepts
- [Event Notifications](./event-notifications) - Programmatic voice responses
- [API Reference](/api/index/classes/Vowel#registeraction) - Complete API

