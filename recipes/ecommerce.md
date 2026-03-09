# E-commerce Integration Recipe

Complete patterns for building voice-powered e-commerce experiences.

## Overview

This recipe provides a comprehensive guide for integrating Vowel into e-commerce applications, covering product browsing, cart management, checkout, and more.

## Product Browsing

### Search Products

```typescript
vowel.registerAction('searchProducts', {
  description: 'Search for products',
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
    minPrice: {
      type: 'number',
      description: 'Minimum price'
    },
    maxPrice: {
      type: 'number',
      description: 'Maximum price'
    }
  }
}, async ({ query, category, minPrice, maxPrice }) => {
  const results = await searchProducts({
    query,
    category,
    priceRange: { min: minPrice, max: maxPrice }
  });

  // Navigate to results
  const params = new URLSearchParams({ q: query });
  if (category) params.set('category', category);
  if (minPrice) params.set('min', minPrice.toString());
  if (maxPrice) params.set('max', maxPrice.toString());
  
  await router.push(`/search?${params.toString()}`);

  await vowel.notifyEvent(
    `Found ${results.length} products matching "${query}"`,
    { results: results.slice(0, 5) }
  );

  return { success: true, data: results };
});
```

### Browse by Category

```typescript
vowel.registerAction('browseCategory', {
  description: 'Browse products by category',
  parameters: {
    category: {
      type: 'string',
      description: 'Product category',
      enum: ['electronics', 'clothing', 'home', 'books', 'sports'],
      required: true
    }
  }
}, async ({ category }) => {
  await router.push(`/category/${category}`);
  
  const count = await getProductCount(category);
  
  await vowel.notifyEvent(
    `Showing ${count} products in ${category}`
  );

  return { success: true };
});
```

### View Product Details

```typescript
vowel.registerAction('viewProduct', {
  description: 'View product details',
  parameters: {
    productId: {
      type: 'string',
      description: 'Product ID',
      required: true
    }
  }
}, async ({ productId }) => {
  const product = await getProduct(productId);
  
  if (!product) {
    return {
      success: false,
      error: 'Product not found'
    };
  }

  await router.push(`/product/${productId}`);

  await vowel.notifyEvent(
    `Viewing ${product.name}. Price: $${product.price}`,
    { product }
  );

  return { success: true, data: product };
});
```

### Get Product Information

```typescript
vowel.registerAction('getProductInfo', {
  description: 'Get information about current product',
  parameters: {}
}, async () => {
  const productId = getCurrentProductId();
  
  if (!productId) {
    return {
      success: false,
      error: 'Not viewing a product page'
    };
  }

  const product = await getProduct(productId);

  await vowel.notifyEvent(
    `${product.name}. Price: $${product.price}. ${product.inStock ? 'In stock' : 'Out of stock'}`,
    { product }
  );

  return { success: true, data: product };
});
```

## Cart Management

### Add to Cart

```typescript
vowel.registerAction('addToCart', {
  description: 'Add product to shopping cart',
  parameters: {
    productId: {
      type: 'string',
      description: 'Product ID',
      required: true
    },
    quantity: {
      type: 'number',
      description: 'Quantity to add',
      default: 1
    },
    size: {
      type: 'string',
      description: 'Product size (if applicable)'
    },
    color: {
      type: 'string',
      description: 'Product color (if applicable)'
    }
  }
}, async ({ productId, quantity, size, color }) => {
  const product = await getProduct(productId);
  
  if (!product) {
    return { success: false, error: 'Product not found' };
  }

  if (!product.inStock) {
    return { success: false, error: 'Product out of stock' };
  }

  // Add to cart
  await cart.add({
    productId,
    quantity,
    options: { size, color }
  });

  const cartTotal = await cart.getItemCount();

  await vowel.notifyEvent(
    `Added ${quantity} ${product.name} to cart. You now have ${cartTotal} items.`,
    { product, cartTotal }
  );

  return { success: true };
});
```

### View Cart

```typescript
vowel.registerAction('viewCart', {
  description: 'View shopping cart',
  parameters: {}
}, async () => {
  const items = await cart.getItems();
  const total = await cart.getTotal();

  await router.push('/cart');

  if (items.length === 0) {
    await vowel.notifyEvent('Your cart is empty');
  } else {
    await vowel.notifyEvent(
      `You have ${items.length} items in your cart, totaling $${total.toFixed(2)}`,
      { items, total }
    );
  }

  return { success: true, data: { items, total } };
});
```

### Update Cart Item

```typescript
vowel.registerAction('updateCartQuantity', {
  description: 'Update quantity of item in cart',
  parameters: {
    productId: {
      type: 'string',
      description: 'Product ID',
      required: true
    },
    quantity: {
      type: 'number',
      description: 'New quantity',
      required: true
    }
  }
}, async ({ productId, quantity }) => {
  if (quantity <= 0) {
    await cart.remove(productId);
    await vowel.notifyEvent('Item removed from cart');
  } else {
    await cart.updateQuantity(productId, quantity);
    await vowel.notifyEvent(`Quantity updated to ${quantity}`);
  }

  return { success: true };
});
```

### Remove from Cart

```typescript
vowel.registerAction('removeFromCart', {
  description: 'Remove item from cart',
  parameters: {
    productId: {
      type: 'string',
      description: 'Product ID',
      required: true
    }
  }
}, async ({ productId }) => {
  const product = await getProduct(productId);
  
  await cart.remove(productId);

  await vowel.notifyEvent(
    `Removed ${product.name} from cart`
  );

  return { success: true };
});
```

### Clear Cart

```typescript
vowel.registerAction('clearCart', {
  description: 'Clear all items from cart',
  parameters: {}
}, async () => {
  await cart.clear();

  await vowel.notifyEvent('Cart cleared');

  return { success: true };
});
```

## Checkout Process

### Start Checkout

```typescript
vowel.registerAction('goToCheckout', {
  description: 'Proceed to checkout',
  parameters: {}
}, async () => {
  const items = await cart.getItems();

  if (items.length === 0) {
    await vowel.notifyEvent('Your cart is empty. Add some items first.');
    await router.push('/products');
    return { success: false, error: 'Cart is empty' };
  }

  const user = getCurrentUser();
  
  if (!user) {
    await vowel.notifyEvent('Please sign in to checkout');
    await router.push('/login?redirect=/checkout');
    return { success: false, error: 'Authentication required' };
  }

  await router.push('/checkout');

  await vowel.notifyEvent(
    `Proceeding to checkout with ${items.length} items`
  );

  return { success: true };
});
```

### Apply Coupon

```typescript
vowel.registerAction('applyCoupon', {
  description: 'Apply discount coupon',
  parameters: {
    code: {
      type: 'string',
      description: 'Coupon code',
      required: true
    }
  }
}, async ({ code }) => {
  try {
    const discount = await validateAndApplyCoupon(code);

    await vowel.notifyEvent(
      `Coupon applied! You saved $${discount.amount.toFixed(2)}`,
      { discount }
    );

    return { success: true, data: discount };
  } catch (error) {
    await vowel.notifyEvent('Invalid coupon code');
    
    return {
      success: false,
      error: 'Invalid coupon code'
    };
  }
});
```

### Complete Order

```typescript
vowel.registerAction('placeOrder', {
  description: 'Place the order',
  parameters: {
    paymentMethod: {
      type: 'string',
      description: 'Payment method',
      enum: ['credit_card', 'paypal', 'apple_pay'],
      required: true
    }
  }
}, async ({ paymentMethod }) => {
  try {
    // Validate cart
    const items = await cart.getItems();
    if (items.length === 0) {
      return { success: false, error: 'Cart is empty' };
    }

    // Validate shipping address
    const shippingAddress = await getShippingAddress();
    if (!shippingAddress) {
      await vowel.notifyEvent('Please provide a shipping address');
      return { success: false, error: 'Shipping address required' };
    }

    // Process order
    await vowel.notifyEvent('Processing your order...');

    const order = await createOrder({
      items,
      shippingAddress,
      paymentMethod
    });

    // Clear cart
    await cart.clear();

    // Navigate to confirmation
    await router.push(`/order/${order.id}`);

    await vowel.notifyEvent(
      `Order placed successfully! Your order number is ${order.id}. Total: $${order.total.toFixed(2)}`,
      { order }
    );

    return { success: true, data: order };
  } catch (error) {
    await vowel.notifyEvent('Failed to place order. Please try again.');
    
    return {
      success: false,
      error: error.message
    };
  }
});
```

## Order Management

### View Order History

```typescript
vowel.registerAction('viewOrders', {
  description: 'View order history',
  parameters: {}
}, async () => {
  const user = getCurrentUser();
  
  if (!user) {
    await vowel.notifyEvent('Please sign in to view orders');
    await router.push('/login');
    return { success: false, error: 'Authentication required' };
  }

  const orders = await getUserOrders(user.id);

  await router.push('/account/orders');

  await vowel.notifyEvent(
    `You have ${orders.length} orders`,
    { orders }
  );

  return { success: true, data: orders };
});
```

### Track Order

```typescript
vowel.registerAction('trackOrder', {
  description: 'Track order status',
  parameters: {
    orderId: {
      type: 'string',
      description: 'Order ID',
      required: true
    }
  }
}, async ({ orderId }) => {
  const order = await getOrder(orderId);

  if (!order) {
    return { success: false, error: 'Order not found' };
  }

  await router.push(`/order/${orderId}`);

  await vowel.notifyEvent(
    `Order ${orderId} is ${order.status}. ${order.trackingInfo || ''}`,
    { order }
  );

  return { success: true, data: order };
});
```

## Wishlist

### Add to Wishlist

```typescript
vowel.registerAction('addToWishlist', {
  description: 'Add product to wishlist',
  parameters: {
    productId: {
      type: 'string',
      description: 'Product ID',
      required: true
    }
  }
}, async ({ productId }) => {
  const user = getCurrentUser();
  
  if (!user) {
    await vowel.notifyEvent('Please sign in to use wishlist');
    return { success: false, error: 'Authentication required' };
  }

  const product = await getProduct(productId);
  
  await wishlist.add(user.id, productId);

  await vowel.notifyEvent(
    `Added ${product.name} to your wishlist`
  );

  return { success: true };
});
```

### View Wishlist

```typescript
vowel.registerAction('viewWishlist', {
  description: 'View wishlist',
  parameters: {}
}, async () => {
  const user = getCurrentUser();
  
  if (!user) {
    await vowel.notifyEvent('Please sign in to view wishlist');
    return { success: false, error: 'Authentication required' };
  }

  const items = await wishlist.getItems(user.id);

  await router.push('/wishlist');

  await vowel.notifyEvent(
    `You have ${items.length} items in your wishlist`,
    { items }
  );

  return { success: true, data: items };
});
```

## Product Recommendations

### Get Recommendations

```typescript
vowel.registerAction('showRecommendations', {
  description: 'Show product recommendations',
  parameters: {
    based on: {
      type: 'string',
      description: 'Basis for recommendations',
      enum: ['current_product', 'cart', 'history']
    }
  }
}, async ({ basedOn }) => {
  let recommendations;

  switch (basedOn) {
    case 'current_product':
      const productId = getCurrentProductId();
      recommendations = await getRecommendations(productId);
      break;
    
    case 'cart':
      const cartItems = await cart.getItems();
      recommendations = await getCartRecommendations(cartItems);
      break;
    
    case 'history':
      const user = getCurrentUser();
      recommendations = await getPersonalizedRecommendations(user.id);
      break;
  }

  await vowel.notifyEvent(
    `Here are ${recommendations.length} recommended products`,
    { recommendations }
  );

  return { success: true, data: recommendations };
});
```

## Complete Example

```typescript
// Setup Vowel for e-commerce
import { Vowel, createDirectAdapters } from '@vowel.to/client';

const { navigationAdapter, automationAdapter } = createDirectAdapters({
  navigate: (path) => router.push(path),
  routes: [
    { path: '/', description: 'Home page' },
    { path: '/products', description: 'All products' },
    { path: '/category/:category', description: 'Category page' },
    { path: '/product/:id', description: 'Product details' },
    { path: '/cart', description: 'Shopping cart' },
    { path: '/checkout', description: 'Checkout' },
    { path: '/account', description: 'Account' },
    { path: '/orders', description: 'Order history' }
  ],
  enableAutomation: true
});

const vowel = new Vowel({
  appId: 'your-app-id',
  navigationAdapter,
  automationAdapter
});

// Register all e-commerce actions
registerProductActions(vowel);
registerCartActions(vowel);
registerCheckoutActions(vowel);
registerOrderActions(vowel);
registerWishlistActions(vowel);
```

## Best Practices

1. **Authentication** - Check user authentication for protected actions
2. **Validation** - Validate cart and inventory before checkout
3. **Feedback** - Provide clear voice feedback for all actions
4. **Error Handling** - Handle out-of-stock, invalid coupons gracefully
5. **Progress Updates** - Notify users during long operations
6. **Cart Persistence** - Save cart state across sessions
7. **Security** - Validate payment information server-side
8. **Accessibility** - Ensure voice commands are discoverable
9. **Analytics** - Track voice commerce conversions
10. **Testing** - Test complete checkout flow with voice

## Related

- [Custom Actions](./custom-actions) - Advanced action patterns
- [Navigation](./navigation) - Navigation patterns
- [Event Notifications](./event-notifications) - Voice feedback
- [API Reference](/api/) - Complete API documentation

