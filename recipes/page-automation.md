# Page Automation Recipe

Advanced patterns for voice-controlled page interaction and DOM manipulation.

## Overview

Page automation enables voice-controlled interaction with page elements - clicking, typing, scrolling, and more. This recipe covers advanced patterns for robust page automation.

## Element Search Patterns

### Semantic Search

Search for elements using natural language:

```typescript
vowel.registerAction('clickAddToCart', {
  description: 'Click the add to cart button',
  parameters: {}
}, async () => {
  // Search for add to cart button
  const results = await automationAdapter.searchElements(
    'add to cart button',
    { limit: 1 }
  );
  
  if (results.elements.length === 0) {
    return {
      success: false,
      error: 'Add to cart button not found'
    };
  }
  
  // Click the button
  await automationAdapter.clickElement(results.elements[0].id);
  
  await vowel.notifyEvent('Added to cart');
  
  return { success: true };
});
```

### Contextual Search

Search within specific page regions:

```typescript
vowel.registerAction('clickProductInList', {
  description: 'Click a product in the list',
  parameters: {
    productName: {
      type: 'string',
      description: 'Product name',
      required: true
    }
  }
}, async ({ productName }) => {
  // First find the product list
  const listResults = await automationAdapter.searchElements(
    'product list',
    { limit: 1 }
  );
  
  if (listResults.elements.length === 0) {
    return { success: false, error: 'Product list not found' };
  }
  
  // Then search for the product within the list
  const productResults = await automationAdapter.searchElements(
    `${productName} in product list`,
    { limit: 1 }
  );
  
  if (productResults.elements.length === 0) {
    return { success: false, error: `${productName} not found` };
  }
  
  await automationAdapter.clickElement(productResults.elements[0].id);
  
  return { success: true };
});
```

## Form Automation

### Form Filling

```typescript
vowel.registerAction('fillContactForm', {
  description: 'Fill out contact form',
  parameters: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    message: { type: 'string', required: true }
  }
}, async ({ name, email, message }) => {
  // Find and fill name field
  const nameField = await automationAdapter.searchElements(
    'name input field',
    { limit: 1 }
  );
  
  if (nameField.elements.length > 0) {
    await automationAdapter.typeIntoElement(nameField.elements[0].id, name);
  }
  
  // Find and fill email field
  const emailField = await automationAdapter.searchElements(
    'email input field',
    { limit: 1 }
  );
  
  if (emailField.elements.length > 0) {
    await automationAdapter.typeIntoElement(emailField.elements[0].id, email);
  }
  
  // Find and fill message field
  const messageField = await automationAdapter.searchElements(
    'message textarea',
    { limit: 1 }
  );
  
  if (messageField.elements.length > 0) {
    await automationAdapter.typeIntoElement(messageField.elements[0].id, message);
  }
  
  await vowel.notifyEvent('Form filled. Ready to submit.');
  
  return { success: true };
});
```

### Form Submission

```typescript
vowel.registerAction('submitCurrentForm', {
  description: 'Submit the current form',
  parameters: {}
}, async () => {
  // Find submit button
  const submitButton = await automationAdapter.searchElements(
    'submit button',
    { limit: 1 }
  );
  
  if (submitButton.elements.length === 0) {
    return { success: false, error: 'Submit button not found' };
  }
  
  // Click submit
  await automationAdapter.clickElement(submitButton.elements[0].id);
  
  await vowel.notifyEvent('Form submitted');
  
  return { success: true };
});
```

## Visual Feedback

### Floating Cursor

```typescript
vowel.registerAction('highlightElement', {
  description: 'Highlight an element on the page',
  parameters: {
    elementDescription: {
      type: 'string',
      description: 'Description of element to highlight',
      required: true
    }
  }
}, async ({ elementDescription }) => {
  // Search for element
  const results = await automationAdapter.searchElements(
    elementDescription,
    { limit: 1 }
  );
  
  if (results.elements.length === 0) {
    return { success: false, error: 'Element not found' };
  }
  
  const element = results.elements[0];
  
  // Show floating cursor
  if (vowel.floatingCursor) {
    vowel.floatingCursor.show({
      x: element.bounds.x + element.bounds.width / 2,
      y: element.bounds.y + element.bounds.height / 2
    });
    
    // Hide after 3 seconds
    setTimeout(() => {
      vowel.floatingCursor?.hide();
    }, 3000);
  }
  
  return { success: true };
});
```

### Scroll to Element

```typescript
vowel.registerAction('scrollToSection', {
  description: 'Scroll to a section on the page',
  parameters: {
    sectionName: {
      type: 'string',
      description: 'Section name',
      required: true
    }
  }
}, async ({ sectionName }) => {
  // Search for section
  const results = await automationAdapter.searchElements(
    `${sectionName} section`,
    { limit: 1 }
  );
  
  if (results.elements.length === 0) {
    return { success: false, error: 'Section not found' };
  }
  
  // Scroll to section
  await automationAdapter.scrollToElement(results.elements[0].id);
  
  await vowel.notifyEvent(`Scrolled to ${sectionName}`);
  
  return { success: true };
});
```

## Complex Interactions

### Multi-Step Interaction

```typescript
vowel.registerAction('addProductAndCheckout', {
  description: 'Add product to cart and go to checkout',
  parameters: {
    productName: { type: 'string', required: true }
  }
}, async ({ productName }) => {
  // Step 1: Find product
  await vowel.notifyEvent('Finding product...');
  
  const productResults = await automationAdapter.searchElements(
    `${productName} product card`,
    { limit: 1 }
  );
  
  if (productResults.elements.length === 0) {
    return { success: false, error: 'Product not found' };
  }
  
  // Step 2: Click product
  await automationAdapter.clickElement(productResults.elements[0].id);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for page load
  
  // Step 3: Find and click add to cart
  await vowel.notifyEvent('Adding to cart...');
  
  const addToCartResults = await automationAdapter.searchElements(
    'add to cart button',
    { limit: 1 }
  );
  
  if (addToCartResults.elements.length === 0) {
    return { success: false, error: 'Add to cart button not found' };
  }
  
  await automationAdapter.clickElement(addToCartResults.elements[0].id);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Step 4: Go to checkout
  await vowel.notifyEvent('Going to checkout...');
  
  const checkoutResults = await automationAdapter.searchElements(
    'checkout button',
    { limit: 1 }
  );
  
  if (checkoutResults.elements.length > 0) {
    await automationAdapter.clickElement(checkoutResults.elements[0].id);
  }
  
  await vowel.notifyEvent('Ready for checkout');
  
  return { success: true };
});
```

### Conditional Interactions

```typescript
vowel.registerAction('smartAddToCart', {
  description: 'Add product to cart with size/color selection',
  parameters: {
    size: { type: 'string' },
    color: { type: 'string' }
  }
}, async ({ size, color }) => {
  // Select size if provided
  if (size) {
    const sizeSelector = await automationAdapter.searchElements(
      `${size} size option`,
      { limit: 1 }
    );
    
    if (sizeSelector.elements.length > 0) {
      await automationAdapter.clickElement(sizeSelector.elements[0].id);
      await vowel.notifyEvent(`Selected size ${size}`);
    }
  }
  
  // Select color if provided
  if (color) {
    const colorSelector = await automationAdapter.searchElements(
      `${color} color option`,
      { limit: 1 }
    );
    
    if (colorSelector.elements.length > 0) {
      await automationAdapter.clickElement(colorSelector.elements[0].id);
      await vowel.notifyEvent(`Selected ${color} color`);
    }
  }
  
  // Add to cart
  const addToCartButton = await automationAdapter.searchElements(
    'add to cart button',
    { limit: 1 }
  );
  
  if (addToCartButton.elements.length > 0) {
    await automationAdapter.clickElement(addToCartButton.elements[0].id);
    await vowel.notifyEvent('Added to cart');
  }
  
  return { success: true };
});
```

## Page Analysis

### Extract Page Information

```typescript
vowel.registerAction('getPageInfo', {
  description: 'Get information about the current page',
  parameters: {}
}, async () => {
  // Get page snapshot
  const snapshot = await automationAdapter.getPageSnapshot();
  
  // Parse snapshot to extract information
  const info = {
    title: document.title,
    url: window.location.href,
    hasForm: snapshot.includes('form'),
    hasCart: snapshot.includes('cart'),
    productCount: (snapshot.match(/product/gi) || []).length
  };
  
  await vowel.notifyEvent(
    `Page: ${info.title}. ${info.productCount} products found.`
  );
  
  return {
    success: true,
    data: info
  };
});
```

### Find Specific Content

```typescript
vowel.registerAction('findPrice', {
  description: 'Find the price on the current page',
  parameters: {}
}, async () => {
  // Search for price elements
  const priceResults = await automationAdapter.searchElements(
    'price',
    { limit: 5 }
  );
  
  if (priceResults.elements.length === 0) {
    return { success: false, error: 'No price found' };
  }
  
  // Extract price text
  const prices = priceResults.elements.map(el => el.text);
  
  await vowel.notifyEvent(`Found prices: ${prices.join(', ')}`);
  
  return {
    success: true,
    data: { prices }
  };
});
```

## Cross-Tab Automation

### Controlled Automation

For traditional sites with page reloads:

```typescript
// In voice agent tab
import { ControlledAutomationAdapter } from '@vowel.to/client';

const automationAdapter = new ControlledAutomationAdapter('vowel-automation');

const vowel = new Vowel({
  appId: 'your-app-id',
  automationAdapter
});

// In content tabs - handled automatically by Vowel
// Just include the controlled banner:
// <controlled-by-vowel-frame channel-name="vowel-automation" />
```

## Error Handling

### Retry Logic

```typescript
async function clickWithRetry(
  elementDescription: string,
  maxRetries = 3
): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const results = await automationAdapter.searchElements(
        elementDescription,
        { limit: 1 }
      );
      
      if (results.elements.length > 0) {
        await automationAdapter.clickElement(results.elements[0].id);
        return true;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
    }
  }
  
  return false;
}

vowel.registerAction('reliableClick', {
  description: 'Click element with retry logic',
  parameters: {
    elementDescription: { type: 'string', required: true }
  }
}, async ({ elementDescription }) => {
  const success = await clickWithRetry(elementDescription);
  
  return {
    success,
    message: success ? 'Clicked successfully' : 'Failed to click'
  };
});
```

## Best Practices

1. **Clear Descriptions** - Use descriptive element searches
2. **Visual Feedback** - Show cursor for user feedback
3. **Wait for Load** - Add delays after navigation/clicks
4. **Error Handling** - Handle missing elements gracefully
5. **Retry Logic** - Implement retries for reliability
6. **Context Awareness** - Search within specific regions
7. **Multi-Step Actions** - Break complex tasks into steps
8. **Progress Updates** - Notify users of progress
9. **Validate Results** - Check if actions succeeded
10. **Cleanup** - Clear automation state when done

## Related

- [Adapters Guide](../guide/adapters) - Automation adapter details
- [Custom Actions](./custom-actions) - Advanced action patterns
- [API Reference](/api/) - Complete API documentation

