// Browser Console Test for Order Items Debug
// Copy and paste this entire script into your browser console on the orders dashboard page

console.log('🚀 Starting Order Items Debug Test...');

// Test 1: Check current database state
async function checkDatabaseState() {
  console.log('\n📊 TEST 1: Checking Database State');
  console.log('================================');
  
  try {
    // Fetch orders
    const orders = await pb.collection('orders').getFullList({
      sort: '-created',
      limit: 5
    });
    console.log(`📋 Found ${orders.length} orders`);
    
    // Fetch order items
    const orderItems = await pb.collection('order_items').getFullList({
      sort: '-created',
      limit: 10
    });
    console.log(`📦 Found ${orderItems.length} order items`);
    
    // Analyze relationships
    const linkedItems = orderItems.filter(item => item.orderId && item.orderId.length > 0);
    const orphanedItems = orderItems.filter(item => !item.orderId || item.orderId.length === 0);
    
    console.log(`🔗 Linked items: ${linkedItems.length}`);
    console.log(`❌ Orphaned items: ${orphanedItems.length}`);
    
    // Show sample data
    if (orders.length > 0) {
      console.log('📋 Sample order:', {
        id: orders[0].id,
        orderNumber: orders[0].orderNumber,
        total: orders[0].total,
        created: orders[0].created
      });
    }
    
    if (orderItems.length > 0) {
      console.log('📦 Sample order item:', {
        id: orderItems[0].id,
        orderId: orderItems[0].orderId,
        products: orderItems[0].products,
        quantity: orderItems[0].quantity,
        price: orderItems[0].price
      });
    }
    
    return { orders, orderItems, linkedItems, orphanedItems };
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
    return null;
  }
}

// Test 2: Test expansion query
async function testExpansionQuery() {
  console.log('\n🔍 TEST 2: Testing Expansion Query');
  console.log('==================================');
  
  try {
    const ordersWithItems = await pb.collection('orders').getFullList({
      expand: 'order_items(orderId).products',
      sort: '-created',
      limit: 3
    });
    
    console.log(`📋 Orders fetched with expansion: ${ordersWithItems.length}`);
    
    ordersWithItems.forEach((order, index) => {
      const items = order.expand?.['order_items(orderId)'] || [];
      console.log(`Order ${index + 1} (${order.orderNumber || order.id.slice(-8)}): ${items.length} items`);
      
      if (items.length > 0) {
        console.log('  ✅ Has items:', items.map(item => ({
          quantity: item.quantity,
          price: item.price
        })));
      } else {
        console.log('  ❌ No items found');
      }
    });
    
    return ordersWithItems;
    
  } catch (error) {
    console.error('❌ Expansion query failed:', error);
    return null;
  }
}

// Test 3: Create test order with proper structure
async function createTestOrder() {
  console.log('\n🧪 TEST 3: Creating Test Order');
  console.log('==============================');
  
  try {
    // Create order
    const orderData = {
      orderNumber: `TEST-${Date.now()}`,
      customerInfo: {
        email: 'test@debug.com',
        fullName: 'Debug Test Customer',
        phone: '1234567890'
      },
      subtotal: 200,
      shipping: 25,
      total: 225,
      status: 'pending',
      paymentStatus: 'pending',
      fulfillmentStatus: 'pending',
      notes: 'Test order created by browser console debug script'
    };

    console.log('📋 Creating order...');
    const order = await pb.collection('orders').create(orderData);
    console.log('✅ Order created:', order.id);

    // Create order item with proper orderId
    const orderItemData = {
      orderId: [order.id], // This is the critical fix!
      products: ['debug_product_123'],
      quantity: 2,
      price: 100,
      selectedVariants: { 
        size: 'large', 
        color: 'blue',
        test: 'variant' 
      }
    };

    console.log('📦 Creating order item...');
    const orderItem = await pb.collection('order_items').create(orderItemData);
    console.log('✅ Order item created:', orderItem.id);

    // Test retrieval with expansion
    console.log('🔍 Testing order retrieval with expansion...');
    const testOrder = await pb.collection('orders').getOne(order.id, {
      expand: 'order_items(orderId).products'
    });
    
    const expandedItems = testOrder.expand?.['order_items(orderId)'] || [];
    console.log(`📊 Order ${testOrder.orderNumber} has ${expandedItems.length} items`);
    
    if (expandedItems.length > 0) {
      console.log('✅ SUCCESS: Order items properly linked and retrieved!');
      console.log('📦 Item details:', expandedItems[0]);
    } else {
      console.log('❌ FAILURE: Order items not found in expansion');
    }

    return { order, orderItem, testOrder, expandedItems };
    
  } catch (error) {
    console.error('❌ Test order creation failed:', error);
    return null;
  }
}

// Test 4: Attempt to fix orphaned items
async function fixOrphanedItems(dryRun = true) {
  console.log(`\n🔧 TEST 4: ${dryRun ? 'Analyzing' : 'Fixing'} Orphaned Items`);
  console.log('===============================================');
  
  try {
    const orderItems = await pb.collection('order_items').getFullList();
    const orphaned = orderItems.filter(item => !item.orderId || item.orderId.length === 0);
    
    console.log(`Found ${orphaned.length} orphaned items`);
    
    if (orphaned.length === 0) {
      console.log('✅ No orphaned items to fix!');
      return { fixed: 0, total: 0 };
    }
    
    let fixed = 0;
    
    for (const item of orphaned.slice(0, 5)) { // Limit to first 5 for safety
      console.log(`\n🔍 Analyzing orphaned item ${item.id}:`);
      console.log(`  Created: ${item.created}`);
      console.log(`  Price: ${item.price}`);
      console.log(`  Quantity: ${item.quantity}`);
      
      // Find orders created around the same time
      const itemDate = new Date(item.created);
      const startTime = new Date(itemDate.getTime() - 3600000); // 1 hour before
      const endTime = new Date(itemDate.getTime() + 3600000);   // 1 hour after
      
      const candidateOrders = await pb.collection('orders').getFullList({
        filter: `created >= "${startTime.toISOString()}" && created <= "${endTime.toISOString()}"`
      });
      
      console.log(`  Found ${candidateOrders.length} candidate orders`);
      
      if (candidateOrders.length === 1) {
        const targetOrder = candidateOrders[0];
        console.log(`  🎯 Potential match: Order ${targetOrder.orderNumber || targetOrder.id.slice(-8)}`);
        
        if (!dryRun) {
          try {
            await pb.collection('order_items').update(item.id, {
              orderId: [targetOrder.id]
            });
            console.log('  ✅ Fixed!');
            fixed++;
          } catch (error) {
            console.log('  ❌ Fix failed:', error.message);
          }
        } else {
          console.log('  📝 Would link to this order (dry run mode)');
          fixed++;
        }
      } else {
        console.log('  ⚠️ Cannot determine unique order match');
      }
    }
    
    console.log(`\n📊 Summary: ${dryRun ? 'Would fix' : 'Fixed'} ${fixed} out of ${orphaned.length} orphaned items`);
    
    return { fixed, total: orphaned.length };
    
  } catch (error) {
    console.error('❌ Orphaned items fix failed:', error);
    return null;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🎯 Running comprehensive order items debug tests...\n');
  
  // Store results
  const results = {};
  
  // Run tests
  results.databaseState = await checkDatabaseState();
  results.expansionTest = await testExpansionQuery();
  results.testOrder = await createTestOrder();
  results.orphanedAnalysis = await fixOrphanedItems(true); // Dry run
  
  // Summary
  console.log('\n📋 SUMMARY REPORT');
  console.log('=================');
  
  if (results.databaseState) {
    console.log(`📊 Database: ${results.databaseState.orders.length} orders, ${results.databaseState.orderItems.length} items`);
    console.log(`🔗 Relationships: ${results.databaseState.linkedItems.length} linked, ${results.databaseState.orphanedItems.length} orphaned`);
  }
  
  if (results.expansionTest) {
    const ordersWithItems = results.expansionTest.filter(order => 
      order.expand?.['order_items(orderId)']?.length > 0
    );
    console.log(`🔍 Expansion: ${ordersWithItems.length}/${results.expansionTest.length} orders have items`);
  }
  
  if (results.testOrder && results.testOrder.expandedItems.length > 0) {
    console.log('✅ Test Order: SUCCESS - Fix is working for new orders');
  } else if (results.testOrder) {
    console.log('❌ Test Order: FAILED - Fix not working');
  }
  
  if (results.orphanedAnalysis) {
    console.log(`🔧 Migration: Could fix ${results.orphanedAnalysis.fixed}/${results.orphanedAnalysis.total} orphaned items`);
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('==================');
  
  if (results.databaseState?.orphanedItems.length > 0) {
    console.log('1. Run migration to fix existing orphaned items');
    console.log('   Execute: fixOrphanedItems(false) // false = actual fix, not dry run');
  }
  
  if (results.testOrder?.expandedItems.length > 0) {
    console.log('2. ✅ New orders are working correctly');
  } else {
    console.log('2. ❌ New order creation needs investigation');
  }
  
  console.log('3. Monitor new orders to ensure orderId is being set correctly');
  console.log('4. Check order details modal to verify items display');
  
  // Store results globally for further inspection
  window.debugResults = results;
  console.log('\n📁 Results stored in window.debugResults for further inspection');
  
  return results;
}

// Auto-run all tests
runAllTests().then(() => {
  console.log('\n🎉 Debug tests completed! Check the summary above for results.');
});

// Additional helper functions
window.debugOrderItems = {
  checkState: checkDatabaseState,
  testExpansion: testExpansionQuery,
  createTest: createTestOrder,
  fixOrphaned: fixOrphanedItems,
  runAll: runAllTests
};

console.log('\n🛠️ Helper functions available:');
console.log('- debugOrderItems.checkState()     - Check database state');
console.log('- debugOrderItems.testExpansion()  - Test expansion query');
console.log('- debugOrderItems.createTest()     - Create test order');
console.log('- debugOrderItems.fixOrphaned()    - Fix orphaned items');
console.log('- debugOrderItems.runAll()         - Run all tests');