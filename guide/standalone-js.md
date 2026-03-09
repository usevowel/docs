# Standalone JavaScript Integration

Learn how to use Vowel with vanilla JavaScript without any framework.

## Overview

Vowel works perfectly with vanilla JavaScript, providing a simple API for voice-powered interactions in any web application.

## Installation

### Via NPM

```bash
npm install @vowel.to/client
```

```javascript
import { Vowel, createDirectAdapters } from '@vowel.to/client';
```

### Via CDN

```html
<script type="module">
  import { Vowel, createDirectAdapters } from 'https://unpkg.com/@vowel.to/client/dist/index.js';
</script>
```

## Quick Start

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vowel Demo</title>
</head>
<body>
  <h1>My Store</h1>
  <div id="app"></div>
  
  <button id="start-voice">Start Voice</button>
  <button id="stop-voice">Stop Voice</button>
  <div id="status"></div>

  <script type="module">
    import { Vowel, createDirectAdapters } from '@vowel.to/client';

    // Create adapters
    const { navigationAdapter, automationAdapter } = createDirectAdapters({
      navigate: (path) => {
        window.location.href = path;
      },
      routes: [
        { path: '/', description: 'Home page' },
        { path: '/products', description: 'Product catalog' },
        { path: '/cart', description: 'Shopping cart' }
      ],
      enableAutomation: true
    });

    // Create Vowel client
    const vowel = new Vowel({
      appId: 'your-app-id',
      navigationAdapter,
      automationAdapter
    });

    // Register custom actions
    vowel.registerAction('searchProducts', {
      description: 'Search for products',
      parameters: {
        query: { type: 'string', description: 'Search query' }
      }
    }, async ({ query }) => {
      console.log('Searching for:', query);
      // Your search logic
      return { success: true };
    });

    // UI elements
    const startBtn = document.getElementById('start-voice');
    const stopBtn = document.getElementById('stop-voice');
    const status = document.getElementById('status');

    // Event handlers
    startBtn.addEventListener('click', async () => {
      await vowel.startSession();
    });

    stopBtn.addEventListener('click', async () => {
      await vowel.stopSession();
    });

    // Subscribe to state changes
    vowel.onStateChange((state) => {
      status.textContent = state.isConnected ? 'Connected' : 'Disconnected';
      
      if (state.isUserSpeaking) {
        status.textContent += ' - Listening...';
      } else if (state.isAISpeaking) {
        status.textContent += ' - AI Speaking...';
      }
    });
  </script>
</body>
</html>
```

## Complete Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Voice Shopping</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .voice-controls {
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: flex;
      gap: 10px;
    }
    
    .voice-button {
      padding: 15px 30px;
      font-size: 16px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      background: #007bff;
      color: white;
    }
    
    .voice-button:hover {
      background: #0056b3;
    }
    
    .voice-button.stop {
      background: #dc3545;
    }
    
    .voice-status {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #dee2e6;
    }
    
    .voice-status.connected {
      background: #d4edda;
      border-color: #c3e6cb;
    }
    
    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
      margin-top: 40px;
    }
    
    .product-card {
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 20px;
    }
    
    .product-card button {
      width: 100%;
      padding: 10px;
      margin-top: 10px;
      border: none;
      border-radius: 4px;
      background: #28a745;
      color: white;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <h1>Voice Shopping Demo</h1>
  
  <div class="voice-status" id="status">
    Disconnected
  </div>
  
  <div class="voice-controls">
    <button class="voice-button" id="start-voice">🎤 Start Voice</button>
    <button class="voice-button stop" id="stop-voice">⏹️ Stop Voice</button>
  </div>
  
  <div id="products" class="product-grid"></div>

  <script type="module">
    import { Vowel, createDirectAdapters } from '@vowel.to/client';

    // Sample products
    const products = [
      { id: '1', name: 'Wireless Headphones', price: 99.99 },
      { id: '2', name: 'Smart Watch', price: 299.99 },
      { id: '3', name: 'Laptop Stand', price: 49.99 },
      { id: '4', name: 'USB-C Cable', price: 19.99 }
    ];

    // Shopping cart
    const cart = [];

    // Render products
    function renderProducts() {
      const container = document.getElementById('products');
      container.innerHTML = products.map(product => `
        <div class="product-card">
          <h3>${product.name}</h3>
          <p>$${product.price}</p>
          <button onclick="addToCart('${product.id}')">Add to Cart</button>
        </div>
      `).join('');
    }

    // Add to cart function
    window.addToCart = async function(productId) {
      const product = products.find(p => p.id === productId);
      if (product) {
        cart.push(product);
        await vowel.notifyEvent('Added to cart', {
          productName: product.name,
          cartTotal: cart.length
        });
      }
    };

    // Create adapters
    const { navigationAdapter, automationAdapter } = createDirectAdapters({
      navigate: (path) => {
        window.location.href = path;
      },
      routes: [
        { path: '/', description: 'Home page' },
        { path: '/products', description: 'Product catalog' },
        { path: '/cart', description: 'Shopping cart' }
      ],
      enableAutomation: true
    });

    // Create Vowel client
    const vowel = new Vowel({
      appId: 'your-app-id',
      navigationAdapter,
      automationAdapter,
      voiceConfig: {
        name: 'Puck',
        language: 'en-US'
      }
    });

    // Register custom actions
    vowel.registerAction('addToCart', {
      description: 'Add product to shopping cart',
      parameters: {
        productId: { type: 'string', description: 'Product ID' }
      }
    }, async ({ productId }) => {
      await addToCart(productId);
      return { success: true };
    });

    vowel.registerAction('viewCart', {
      description: 'View shopping cart',
      parameters: {}
    }, async () => {
      const total = cart.reduce((sum, item) => sum + item.price, 0);
      return {
        success: true,
        message: `You have ${cart.length} items totaling $${total.toFixed(2)}`,
        data: { items: cart, total }
      };
    });

    vowel.registerAction('searchProducts', {
      description: 'Search for products',
      parameters: {
        query: { type: 'string', description: 'Search query' }
      }
    }, async ({ query }) => {
      const results = products.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase())
      );
      return {
        success: true,
        message: `Found ${results.length} products`,
        data: results
      };
    });

    // UI elements
    const startBtn = document.getElementById('start-voice');
    const stopBtn = document.getElementById('stop-voice');
    const status = document.getElementById('status');

    // Event handlers
    startBtn.addEventListener('click', async () => {
      try {
        await vowel.startSession();
      } catch (error) {
        console.error('Failed to start session:', error);
        alert('Failed to start voice session. Please check your microphone permissions.');
      }
    });

    stopBtn.addEventListener('click', async () => {
      await vowel.stopSession();
    });

    // Subscribe to state changes
    vowel.onStateChange((state) => {
      if (state.isConnected) {
        status.textContent = 'Connected';
        status.classList.add('connected');
        
        if (state.isUserSpeaking) {
          status.textContent = '🎤 Listening...';
        } else if (state.isAIThinking) {
          status.textContent = '🤔 Thinking...';
        } else if (state.isAISpeaking) {
          status.textContent = '🔊 Speaking...';
        }
      } else {
        status.textContent = 'Disconnected';
        status.classList.remove('connected');
      }
      
      if (state.error) {
        status.textContent = `Error: ${state.error}`;
      }
    });

    // Initialize
    renderProducts();
  </script>
</body>
</html>
```

## Navigation

### History API

Use the History API for SPA-style navigation:

```javascript
const { navigationAdapter } = createDirectAdapters({
  navigate: (path) => {
    window.history.pushState({}, '', path);
    renderPage(path);
  },
  getCurrentPath: () => window.location.pathname,
  routes: [
    { path: '/', description: 'Home' },
    { path: '/products', description: 'Products' },
    { path: '/cart', description: 'Cart' }
  ]
});

// Handle back/forward
window.addEventListener('popstate', () => {
  renderPage(window.location.pathname);
});

function renderPage(path) {
  // Your routing logic
  switch (path) {
    case '/':
      renderHome();
      break;
    case '/products':
      renderProducts();
      break;
    case '/cart':
      renderCart();
      break;
  }
}
```

### Hash Routing

Use hash-based routing:

```javascript
const { navigationAdapter } = createDirectAdapters({
  navigate: (path) => {
    window.location.hash = path;
  },
  getCurrentPath: () => window.location.hash.slice(1) || '/',
  routes: [
    { path: '/', description: 'Home' },
    { path: '/products', description: 'Products' }
  ]
});

window.addEventListener('hashchange', () => {
  renderPage(window.location.hash.slice(1) || '/');
});
```

## Event Notifications

```javascript
// Simple notification
await vowel.notifyEvent('Welcome to our store!');

// With context
await vowel.notifyEvent('Product added to cart', {
  productName: 'Wireless Headphones',
  price: 99.99
});

// On user actions
document.getElementById('checkout-btn').addEventListener('click', async () => {
  await processCheckout();
  await vowel.notifyEvent('Order placed successfully!', {
    orderId: '12345',
    total: 299.99
  });
});
```

## State Management

```javascript
// Subscribe to state changes
const unsubscribe = vowel.onStateChange((state) => {
  updateUI(state);
});

function updateUI(state) {
  // Update UI based on state
  document.getElementById('connection-status').textContent = 
    state.isConnected ? 'Connected' : 'Disconnected';
  
  document.getElementById('user-speaking').style.display = 
    state.isUserSpeaking ? 'block' : 'none';
  
  document.getElementById('ai-speaking').style.display = 
    state.isAISpeaking ? 'block' : 'none';
}

// Cleanup
window.addEventListener('beforeunload', () => {
  unsubscribe();
  vowel.stopSession();
});
```

## Form Integration

```javascript
// Voice-enabled form
const form = document.getElementById('contact-form');

vowel.registerAction('submitContactForm', {
  description: 'Submit contact form',
  parameters: {
    name: { type: 'string', description: 'Name', required: true },
    email: { type: 'string', description: 'Email', required: true },
    message: { type: 'string', description: 'Message', required: true }
  }
}, async ({ name, email, message }) => {
  // Fill form
  form.elements['name'].value = name;
  form.elements['email'].value = email;
  form.elements['message'].value = message;
  
  // Submit
  form.submit();
  
  return { success: true, message: 'Form submitted' };
});
```

## Error Handling

```javascript
try {
  await vowel.startSession();
} catch (error) {
  console.error('Failed to start session:', error);
  
  // Show user-friendly error
  if (error.message.includes('microphone')) {
    alert('Please allow microphone access to use voice features.');
  } else {
    alert('Failed to start voice session. Please try again.');
  }
}

// Handle state errors
vowel.onStateChange((state) => {
  if (state.error) {
    console.error('Session error:', state.error);
    showErrorNotification(state.error);
  }
});
```

## Best Practices

1. **Cleanup** - Always stop session and unsubscribe on page unload
2. **Error Handling** - Handle errors gracefully with user-friendly messages
3. **State Management** - Subscribe to state changes for UI updates
4. **Navigation** - Use History API or hash routing for SPAs
5. **Event Notifications** - Provide feedback for user actions
6. **Permissions** - Request microphone permissions early
7. **Progressive Enhancement** - Ensure app works without voice

## Browser Support

Vowel requires:
- Modern browser with Web Audio API
- Microphone access
- HTTPS (required for microphone)

Check for support:

```javascript
if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
  // Vowel is supported
} else {
  console.warn('Voice features not supported in this browser');
}
```

## Related

- [Web Component](./web-component) - Web component integration
- [React](./react) - React integration
- [Adapters](./adapters) - Navigation and automation
- [API Reference](/api/) - Complete API documentation

