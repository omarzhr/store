// Test script to create an order with variants for debugging
// Run this in the browser console on the dashboard page

async function createTestOrderWithVariants() {
  console.log('🧪 Creating test order with variants...');

  try {
    // 1. Create order
    const orderData = {
      orderNumber: `TEST-VAR-${Date.now()}`,
      customerInfo: {
        email: 'variant-test@example.com',
        fullName: 'Variant Test Customer',
        phone: '1234567890'
      },
      subtotal: 150,
      shipping: 25,
      total: 175,
      status: 'pending',
      paymentStatus: 'pending',
      fulfillmentStatus: 'pending',
      notes: 'Test order created to verify variant display in order items'
    };

    console.log('📋 Creating order...');
    const order = await pb.collection('orders').create(orderData);
    console.log('✅ Order created:', order.id, order.orderNumber);

    // 2. Create order item with variants
    const orderItemData = {
      orderId: [order.id],
      products: ['test-product-with-variants'],
      quantity: 2,
      price: 75,
      selectedVariants: {
        size: 'Large',
        color: 'Red',
        material: 'Cotton',
        style: 'Premium'
      }
    };

    console.log('📦 Creating order item with variants...');
    const orderItem = await pb.collection('order_items').create(orderItemData);
    console.log('✅ Order item created:', orderItem.id);

    // 3. Create second order item with different variants
    const orderItemData2 = {
      orderId: [order.id],
      products: ['test-product-accessory'],
      quantity: 1,
      price: 75,
      selectedVariants: {
        type: 'Premium',
        finish: 'Matte Black'
      }
    };

    console.log('📦 Creating second order item...');
    const orderItem2 = await pb.collection('order_items').create(orderItemData2);
    console.log('✅ Second order item created:', orderItem2.id);

    // 4. Verify order items can be fetched
    console.log('🔍 Verifying order items retrieval...');
    const fetchedItems = await pb.collection('order_items').getFullList({
      filter: `orderId ~ "${order.id}"`
    });

    console.log(`✅ Successfully fetched ${fetchedItems.length} order items`);
    fetchedItems.forEach((item, index) => {
      console.log(`Item ${index + 1}:`, {
        id: item.id,
        orderId: item.orderId,
        products: item.products,
        quantity: item.quantity,
        price: item.price,
        selectedVariants: item.selectedVariants
      });
    });

    // 5. Test summary
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log(`✅ Order created: ${order.orderNumber} (${order.id})`);
    console.log(`✅ Order items created: ${fetchedItems.length}`);
    console.log(`✅ Variants properly stored: ${fetchedItems.every(item => item.selectedVariants)}`);
    
    // Instructions
    console.log('\n📋 NEXT STEPS');
    console.log('==============');
    console.log('1. Go to Orders dashboard');
    console.log('2. Find the test order:', order.orderNumber);
    console.log('3. Click to view order details');
    console.log('4. Go to "Items" tab');
    console.log('5. Verify that order items are displayed with variants');

    return {
      order,
      orderItems: [orderItem, orderItem2],
      fetchedItems
    };

  } catch (error) {
    console.error('❌ Test order creation failed:', error);
    throw error;
  }
}

// Auto-run the test
createTestOrderWithVariants()
  .then(result => {
    console.log('🎉 Test completed successfully!');
    window.testOrderResult = result;
  })
  .catch(error => {
    console.error('💥 Test failed:', error);
  });

// Helper function to clean up test data
async function cleanupTestOrders() {
  console.log('🧹 Cleaning up test orders...');
  
  try {
    // Find test orders
    const testOrders = await pb.collection('orders').getFullList({
      filter: 'orderNumber ~ "TEST-"'
    });

    console.log(`Found ${testOrders.length} test orders to clean up`);

    for (const order of testOrders) {
      // Delete order items first
      const orderItems = await pb.collection('order_items').getFullList({
        filter: `orderId ~ "${order.id}"`
      });

      for (const item of orderItems) {
        await pb.collection('order_items').delete(item.id);
      }

      // Delete order
      await pb.collection('orders').delete(order.id);
      console.log(`✅ Deleted test order: ${order.orderNumber}`);
    }

    console.log('🎉 Cleanup completed!');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Make cleanup function available globally
window.cleanupTestOrders = cleanupTestOrders;

console.log('🛠️ Test functions available:');
console.log('- createTestOrderWithVariants() - Create test order with variants');
console.log('- cleanupTestOrders() - Remove all test orders');