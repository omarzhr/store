// Test script to verify variant storage in order items
// Run this in the browser console on any page with pb available

async function testVariantStorage() {
  console.log('🧪 Testing variant storage in order items...');

  try {
    // 1. Create a test order first
    const orderData = {
      orderNumber: `VARIANT-TEST-${Date.now()}`,
      customerInfo: {
        email: 'variant-test@example.com',
        fullName: 'Variant Test Customer'
      },
      subtotal: 100,
      shipping: 0,
      total: 100,
      status: 'pending',
      paymentStatus: 'pending',
      fulfillmentStatus: 'pending',
      notes: 'Test order to verify variant storage'
    };

    console.log('📋 Creating test order...');
    const order = await pb.collection('orders').create(orderData);
    console.log('✅ Order created:', order.id);

    // 2. Create order item with different variant formats
    const testVariants = [
      {
        name: 'Object Variants',
        data: {
          size: 'Large',
          color: 'Red',
          material: 'Cotton',
          style: 'Premium'
        }
      },
      {
        name: 'String Variants',
        data: JSON.stringify({
          size: 'Medium',
          color: 'Blue',
          finish: 'Matte'
        })
      },
      {
        name: 'Simple Variants',
        data: {
          type: 'Basic',
          quantity_type: 'Single'
        }
      }
    ];

    const createdItems = [];

    for (let i = 0; i < testVariants.length; i++) {
      const variant = testVariants[i];
      
      console.log(`📦 Creating order item ${i + 1}: ${variant.name}`);
      
      const orderItemData = {
        orderId: [order.id],
        products: [`test-product-${i + 1}`],
        quantity: i + 1,
        price: 50 + (i * 10),
        selectedVariants: variant.data
      };

      console.log('📝 Order item data:', orderItemData);

      try {
        const orderItem = await pb.collection('order_items').create(orderItemData);
        console.log(`✅ Order item ${i + 1} created:`, orderItem.id);
        createdItems.push(orderItem);
      } catch (error) {
        console.error(`❌ Failed to create order item ${i + 1}:`, error);
      }
    }

    // 3. Fetch back the created items to verify storage
    console.log('\n🔍 Fetching created order items...');
    const fetchedItems = await pb.collection('order_items').getFullList({
      filter: `orderId ~ "${order.id}"`
    });

    console.log(`📦 Found ${fetchedItems.length} order items`);

    fetchedItems.forEach((item, index) => {
      console.log(`\nItem ${index + 1}:`);
      console.log('  ID:', item.id);
      console.log('  Order ID:', item.orderId);
      console.log('  Products:', item.products);
      console.log('  Quantity:', item.quantity);
      console.log('  Price:', item.price);
      console.log('  Selected Variants:', item.selectedVariants);
      console.log('  Variants Type:', typeof item.selectedVariants);
      
      if (item.selectedVariants) {
        try {
          const parsed = typeof item.selectedVariants === 'string' 
            ? JSON.parse(item.selectedVariants) 
            : item.selectedVariants;
          console.log('  Parsed Variants:', parsed);
          console.log('  Variant Keys:', Object.keys(parsed));
        } catch (e) {
          console.log('  Failed to parse variants:', e.message);
        }
      } else {
        console.log('  ⚠️ Variants are NULL/undefined');
      }
    });

    // 4. Test summary
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log(`Order ID: ${order.id}`);
    console.log(`Order Number: ${order.orderNumber}`);
    console.log(`Items Created: ${createdItems.length}/${testVariants.length}`);
    console.log(`Items Retrieved: ${fetchedItems.length}`);
    
    const itemsWithVariants = fetchedItems.filter(item => item.selectedVariants !== null);
    console.log(`Items with Variants: ${itemsWithVariants.length}`);
    
    if (itemsWithVariants.length === fetchedItems.length) {
      console.log('✅ SUCCESS: All items have variant data stored correctly');
    } else {
      console.log('❌ ISSUE: Some items missing variant data');
    }

    // Return data for further inspection
    return {
      order,
      createdItems,
      fetchedItems,
      success: itemsWithVariants.length === fetchedItems.length
    };

  } catch (error) {
    console.error('💥 Test failed:', error);
    return null;
  }
}

// Test variant parsing and display
function testVariantParsing() {
  console.log('\n🔧 Testing variant parsing logic...');

  const testCases = [
    {
      name: 'Object Variants',
      data: { size: 'Large', color: 'Red' }
    },
    {
      name: 'String Variants',
      data: '{"size":"Medium","color":"Blue"}'
    },
    {
      name: 'Null Variants',
      data: null
    },
    {
      name: 'Undefined Variants',
      data: undefined
    },
    {
      name: 'Empty Object',
      data: {}
    },
    {
      name: 'Invalid JSON String',
      data: '{invalid json}'
    }
  ];

  testCases.forEach(testCase => {
    console.log(`\nTesting: ${testCase.name}`);
    console.log('Input:', testCase.data);
    
    try {
      // Simulate the parsing logic from OrderItemsList
      if (!testCase.data) {
        console.log('Result: null (no variants)');
        return;
      }

      const variants = typeof testCase.data === 'string' 
        ? JSON.parse(testCase.data) 
        : testCase.data;

      if (typeof variants === 'object' && variants !== null) {
        const variantEntries = Object.entries(variants);
        if (variantEntries.length === 0) {
          console.log('Result: empty object (no variants to display)');
        } else {
          console.log('Result: success');
          console.log('Entries:', variantEntries);
          console.log('Display format:', variantEntries.map(([key, value]) => `${key}: ${value}`).join(', '));
        }
      } else {
        console.log('Result: not a valid object');
      }
    } catch (error) {
      console.log('Result: parsing error -', error.message);
    }
  });
}

// Cleanup function
async function cleanupVariantTest() {
  console.log('🧹 Cleaning up variant test data...');
  
  try {
    const testOrders = await pb.collection('orders').getFullList({
      filter: 'orderNumber ~ "VARIANT-TEST-"'
    });

    for (const order of testOrders) {
      // Delete order items first
      const items = await pb.collection('order_items').getFullList({
        filter: `orderId ~ "${order.id}"`
      });

      for (const item of items) {
        await pb.collection('order_items').delete(item.id);
      }

      // Delete order
      await pb.collection('orders').delete(order.id);
      console.log(`✅ Cleaned up test order: ${order.orderNumber}`);
    }

    console.log('🎉 Cleanup completed!');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Run the test automatically
console.log('🚀 Starting variant storage tests...');
testVariantStorage().then(result => {
  if (result && result.success) {
    console.log('\n🎉 Variant storage test PASSED!');
  } else if (result) {
    console.log('\n⚠️ Variant storage test had issues - check details above');
  } else {
    console.log('\n💥 Variant storage test FAILED');
  }
  
  // Run parsing test
  testVariantParsing();
  
  // Store results globally
  window.variantTestResult = result;
});

// Make functions available globally
window.testVariantStorage = testVariantStorage;
window.testVariantParsing = testVariantParsing;
window.cleanupVariantTest = cleanupVariantTest;

console.log('\n🛠️ Available functions:');
console.log('- testVariantStorage() - Test variant storage in database');
console.log('- testVariantParsing() - Test variant parsing logic');
console.log('- cleanupVariantTest() - Clean up test data');