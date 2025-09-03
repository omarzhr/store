# Order Items Investigation - Quick Diagnostic Script

## Overview
This document provides a step-by-step investigation to diagnose and fix the "No order items found" issue in order details.

## Quick Diagnostic Steps

### Step 1: Check Database Directly
Run these queries in your PocketBase admin panel:

```sql
-- Check all orders
SELECT id, orderNumber, total, created FROM orders ORDER BY created DESC LIMIT 10;

-- Check all order items
SELECT id, orderId, products, quantity, price, created FROM order_items ORDER BY created DESC LIMIT 10;

-- Check order-item relationships
SELECT 
  o.orderNumber,
  o.total,
  oi.id as item_id,
  oi.orderId,
  oi.quantity,
  oi.price
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.orderId
ORDER BY o.created DESC LIMIT 10;
```

### Step 2: JavaScript Console Test
Run this in your browser console on the orders dashboard:

```javascript
// Test order items fetch
async function debugOrderItems() {
  console.log('🔍 Starting order items debug...');
  
  try {
    // Fetch orders
    const orders = await pb.collection('orders').getFullList({
      sort: '-created'
    });
    console.log('📋 Orders found:', orders.length);
    console.log('📋 First order:', orders[0]);

    // Fetch order items
    const orderItems = await pb.collection('order_items').getFullList({
      sort: '-created'
    });
    console.log('📦 Order items found:', orderItems.length);
    console.log('📦 First order item:', orderItems[0]);

    // Test expansion
    const ordersWithItems = await pb.collection('orders').getFullList({
      expand: 'order_items(orderId).products',
      sort: '-created'
    });
    console.log('🔗 Orders with expansion:', ordersWithItems.length);
    console.log('🔗 First expanded order:', ordersWithItems[0]);

    // Analyze relationships
    const linkedItems = orderItems.filter(item => item.orderId && item.orderId.length > 0);
    const orphanedItems = orderItems.filter(item => !item.orderId || item.orderId.length === 0);
    
    console.log('📊 Statistics:');
    console.log('  - Total orders:', orders.length);
    console.log('  - Total order items:', orderItems.length);
    console.log('  - Linked order items:', linkedItems.length);
    console.log('  - Orphaned order items:', orphanedItems.length);

    if (orphanedItems.length > 0) {
      console.log('⚠️ Found orphaned items:', orphanedItems);
    }

    return {
      orders,
      orderItems,
      ordersWithItems,
      stats: {
        totalOrders: orders.length,
        totalOrderItems: orderItems.length,
        linkedItems: linkedItems.length,
        orphanedItems: orphanedItems.length
      }
    };
  } catch (error) {
    console.error('❌ Debug failed:', error);
    return null;
  }
}

// Run the debug
debugOrderItems().then(result => {
  if (result) {
    console.log('✅ Debug completed. Check results above.');
    window.debugResult = result; // Store for further inspection
  }
});
```

### Step 3: Create Test Order
Run this to create a properly structured test order:

```javascript
async function createTestOrder() {
  console.log('🧪 Creating test order...');
  
  try {
    // 1. Create order
    const orderData = {
      orderNumber: `TEST-${Date.now()}`,
      customerInfo: {
        email: 'test@example.com',
        fullName: 'Test Customer'
      },
      subtotal: 100,
      shipping: 25,
      total: 125,
      status: 'pending',
      paymentStatus: 'pending',
      fulfillmentStatus: 'pending',
      notes: 'Test order for debugging'
    };

    const order = await pb.collection('orders').create(orderData);
    console.log('✅ Order created:', order.id);

    // 2. Create order item with proper orderId
    const orderItemData = {
      orderId: [order.id], // This is the key fix!
      products: ['test_product'],
      quantity: 2,
      price: 50,
      selectedVariants: { size: 'large' }
    };

    const orderItem = await pb.collection('order_items').create(orderItemData);
    console.log('✅ Order item created:', orderItem.id);

    // 3. Test retrieval with expansion
    const testOrder = await pb.collection('orders').getOne(order.id, {
      expand: 'order_items(orderId).products'
    });
    
    console.log('🔍 Test order with items:', testOrder);
    console.log('📦 Expanded items:', testOrder.expand);

    return { order, orderItem, testOrder };
  } catch (error) {
    console.error('❌ Test order creation failed:', error);
    return null;
  }
}

// Run the test
createTestOrder();
```

## Common Issues and Solutions

### Issue 1: Missing orderId Field
**Symptom**: Order items exist but don't appear in order details
**Cause**: Order items created without `orderId` field
**Solution**: Update order item creation to include `orderId: [order.id]`

### Issue 2: Wrong Expansion Syntax
**Symptom**: Expansion query fails or returns empty
**Cause**: Incorrect PocketBase expansion syntax
**Solution**: Use `order_items(orderId).products` format

### Issue 3: Data Type Mismatch
**Symptom**: orderId field has wrong type
**Cause**: orderId should be array of strings, not single string
**Solution**: Use `[order.id]` not `order.id`

## Quick Fixes

### Fix 1: Update Checkout Form (Already Done)
```typescript
// In CheckoutForm component
const orderItemData: Partial<OrderItemsRecord> = {
  orderId: [order.id], // ← This is the key fix
  products: [product.id],
  quantity: quantity,
  price: totalPrice,
  selectedVariants: Object.keys(selectedVariants).length > 0 ? selectedVariants : null
}
```

### Fix 2: Migrate Existing Orphaned Items
```javascript
async function migrateOrphanedItems() {
  console.log('🔧 Migrating orphaned items...');
  
  const orderItems = await pb.collection('order_items').getFullList();
  const orphaned = orderItems.filter(item => !item.orderId || item.orderId.length === 0);
  
  console.log(`Found ${orphaned.length} orphaned items`);
  
  for (const item of orphaned) {
    // Try to find matching order by date/amount
    const orders = await pb.collection('orders').getFullList({
      filter: `created >= "${item.created.split('T')[0]}" && created < "${new Date(new Date(item.created).getTime() + 86400000).toISOString().split('T')[0]}"`
    });
    
    if (orders.length === 1) {
      await pb.collection('order_items').update(item.id, {
        orderId: [orders[0].id]
      });
      console.log(`✅ Migrated item ${item.id} to order ${orders[0].id}`);
    }
  }
}
```

## Verification Steps

1. **Check New Orders**: Create a new order through the checkout form
2. **Verify Database**: Check that order item has `orderId` field populated
3. **Test Expansion**: Verify order details modal shows items correctly
4. **Monitor Logs**: Check browser console for any expansion errors

## Expected Results

### Before Fix
- ❌ "No order items found" in order details
- ❌ Order items exist but aren't linked
- ❌ Expansion query returns empty array

### After Fix
- ✅ Order items appear in order details modal
- ✅ Product information, quantities, and variants displayed
- ✅ Order summary calculations match item totals
- ✅ Expansion query returns populated data

## Migration Script for Existing Data

If you need to fix existing orders, run this migration:

```javascript
async function fullMigration() {
  console.log('🚀 Starting full migration...');
  
  // Get all orders and items
  const orders = await pb.collection('orders').getFullList({ sort: 'created' });
  const orderItems = await pb.collection('order_items').getFullList({ sort: 'created' });
  
  // Find orphaned items
  const orphaned = orderItems.filter(item => !item.orderId || item.orderId.length === 0);
  
  console.log(`Orders: ${orders.length}, Items: ${orderItems.length}, Orphaned: ${orphaned.length}`);
  
  let migrated = 0;
  
  for (const item of orphaned) {
    // Find closest order by time
    const itemTime = new Date(item.created).getTime();
    let closestOrder = null;
    let minTimeDiff = Infinity;
    
    for (const order of orders) {
      const orderTime = new Date(order.created).getTime();
      const timeDiff = Math.abs(orderTime - itemTime);
      
      if (timeDiff < minTimeDiff && timeDiff < 3600000) { // Within 1 hour
        minTimeDiff = timeDiff;
        closestOrder = order;
      }
    }
    
    if (closestOrder) {
      try {
        await pb.collection('order_items').update(item.id, {
          orderId: [closestOrder.id]
        });
        migrated++;
        console.log(`✅ Linked item ${item.id} to order ${closestOrder.orderNumber}`);
      } catch (error) {
        console.error(`❌ Failed to migrate item ${item.id}:`, error);
      }
    }
  }
  
  console.log(`✅ Migration completed. Migrated ${migrated} items.`);
}
```

## Next Steps

1. Run the diagnostic script to understand current state
2. Create a test order to verify the fix works for new orders
3. Decide whether to migrate existing orphaned order items
4. Monitor new orders to ensure the fix is working
5. Update any other order creation flows if needed

This investigation should help identify exactly what's causing the "No order items found" issue and provide the tools to fix it.