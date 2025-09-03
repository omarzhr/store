// Test script to verify cart-to-order variant conversion
// Run this in the browser console on the checkout page

async function testCartToOrderVariants() {
  console.log('🛒➡️📦 Testing Cart to Order Variant Conversion...');

  try {
    // 1. Clear existing cart first
    console.log('🧹 Cleaning up existing cart...');
    const existingCart = await pb.collection('cartes').getFullList();
    for (const item of existingCart) {
      await pb.collection('cartes').delete(item.id);
    }

    // 2. Create cart items with variants
    console.log('🛒 Creating cart items with variants...');
    
    const cartItems = [
      {
        productId: ['test-product-1'],
        productName: 'Test Product 1',
        quantity: 2,
        price: 50,
        inStock: true,
        selected_variants: {
          size: 'Large',
          color: 'Red',
          material: 'Cotton'
        },
        variantPrice: 50,
        variantSku: 'test-1-size-large-color-red'
      },
      {
        productId: ['test-product-2'],
        productName: 'Test Product 2',
        quantity: 1,
        price: 75,
        inStock: true,
        selected_variants: {
          type: 'Premium',
          finish: 'Matte',
          size: 'Medium'
        },
        variantPrice: 75,
        variantSku: 'test-2-type-premium-finish-matte'
      }
    ];

    const createdCartItems = [];
    
    for (let i = 0; i < cartItems.length; i++) {
      const cartData = cartItems[i];
      console.log(`🛒 Creating cart item ${i + 1}:`, cartData);
      
      const cartItem = await pb.collection('cartes').create(cartData);
      createdCartItems.push(cartItem);
      console.log(`✅ Cart item ${i + 1} created:`, cartItem.id);
    }

    // 3. Verify cart items have variants
    console.log('\n🔍 Verifying cart items...');
    const fetchedCartItems = await pb.collection('cartes').getFullList();
    
    fetchedCartItems.forEach((item, index) => {
      console.log(`Cart Item ${index + 1}:`);
      console.log('  ID:', item.id);
      console.log('  Product:', item.productName);
      console.log('  Variants:', item.selected_variants);
      console.log('  Has Variants:', !!item.selected_variants);
    });

    // 4. Create test order
    console.log('\n📋 Creating test order...');
    const orderData = {
      orderNumber: `CART-TEST-${Date.now()}`,
      customerInfo: {
        email: 'cart-test@example.com',
        fullName: 'Cart Test Customer'
      },
      subtotal: 175,
      shipping: 25,
      total: 200,
      status: 'pending',
      paymentStatus: 'pending',
      fulfillmentStatus: 'pending',
      notes: 'Test order to verify cart-to-order variant conversion'
    };

    const order = await pb.collection('orders').create(orderData);
    console.log('✅ Order created:', order.id);

    // 5. Convert cart items to order items (simulate checkout flow)
    console.log('\n🔄 Converting cart items to order items...');
    const createdOrderItems = [];

    for (const cartItem of fetchedCartItems) {
      const productId = Array.isArray(cartItem.productId) ? cartItem.productId[0] : cartItem.productId;
      
      console.log('🔄 Converting cart item to order item:', {
        cartItemId: cartItem.id,
        productId: productId,
        quantity: cartItem.quantity,
        price: cartItem.price,
        cartVariants: cartItem.selected_variants,
        variantType: typeof cartItem.selected_variants,
        hasVariants: !!cartItem.selected_variants
      });
      
      const orderItemData = {
        orderId: [order.id],
        products: productId ? [productId] : undefined,
        quantity: cartItem.quantity || 1,
        price: cartItem.price || 0,
        selectedVariants: cartItem.selected_variants || null
      };

      console.log('📦 Order item data to be created:', orderItemData);

      const orderItem = await pb.collection('order_items').create(orderItemData);
      createdOrderItems.push(orderItem);
      console.log('✅ Order item created:', orderItem.id);
    }

    // 6. Verify order items have variants
    console.log('\n🔍 Verifying order items...');
    const fetchedOrderItems = await pb.collection('order_items').getFullList({
      filter: `orderId ~ "${order.id}"`
    });

    fetchedOrderItems.forEach((item, index) => {
      console.log(`\nOrder Item ${index + 1}:`);
      console.log('  ID:', item.id);
      console.log('  Order ID:', item.orderId);
      console.log('  Products:', item.products);
      console.log('  Quantity:', item.quantity);
      console.log('  Price:', item.price);
      console.log('  Selected Variants:', item.selectedVariants);
      console.log('  Has Variants:', !!item.selectedVariants);
      
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
      }
    });

    // 7. Test summary
    console.log('\n📊 CONVERSION TEST SUMMARY');
    console.log('==========================');
    console.log(`Cart Items Created: ${createdCartItems.length}`);
    console.log(`Order Items Created: ${createdOrderItems.length}`);
    console.log(`Order Items Retrieved: ${fetchedOrderItems.length}`);
    
    const cartItemsWithVariants = fetchedCartItems.filter(item => item.selected_variants);
    const orderItemsWithVariants = fetchedOrderItems.filter(item => item.selectedVariants);
    
    console.log(`Cart Items with Variants: ${cartItemsWithVariants.length}`);
    console.log(`Order Items with Variants: ${orderItemsWithVariants.length}`);
    
    // Check if conversion preserved variants
    const conversionSuccess = (
      cartItemsWithVariants.length === orderItemsWithVariants.length &&
      orderItemsWithVariants.length === fetchedOrderItems.length
    );
    
    if (conversionSuccess) {
      console.log('✅ SUCCESS: All variants converted from cart to order items!');
    } else {
      console.log('❌ ISSUE: Some variants were lost during conversion');
      console.log(`Expected: ${cartItemsWithVariants.length}, Got: ${orderItemsWithVariants.length}`);
    }

    // 8. Test order details display
    console.log('\n🖥️ Testing Order Details Display...');
    try {
      // Simulate the OrderItemsList component query
      const orderItemsForDisplay = await pb.collection('order_items').getFullList({
        filter: `orderId ~ "${order.id}"`
      });

      console.log('Order items for display:', orderItemsForDisplay.length);
      orderItemsForDisplay.forEach((item, index) => {
        console.log(`Display Item ${index + 1}:`);
        console.log('  Would show product:', item.products?.[0] || 'Unknown');
        console.log('  Would show quantity:', item.quantity);
        console.log('  Would show price:', item.price);
        
        if (item.selectedVariants) {
          const variants = typeof item.selectedVariants === 'string' 
            ? JSON.parse(item.selectedVariants) 
            : item.selectedVariants;
          
          if (typeof variants === 'object' && variants !== null) {
            const variantEntries = Object.entries(variants);
            console.log('  Would show variants as badges:', 
              variantEntries.map(([key, value]) => `${key}: ${value}`).join(', ')
            );
          }
        } else {
          console.log('  Would show: No variants');
        }
      });
    } catch (error) {
      console.log('❌ Order display test failed:', error);
    }

    // Return data for further inspection
    return {
      order,
      cartItems: fetchedCartItems,
      orderItems: fetchedOrderItems,
      conversionSuccess,
      orderItemsWithVariants: orderItemsWithVariants.length,
      expectedVariants: cartItemsWithVariants.length
    };

  } catch (error) {
    console.error('💥 Test failed:', error);
    return null;
  }
}

// Cleanup function
async function cleanupCartOrderTest() {
  console.log('🧹 Cleaning up cart-to-order test data...');
  
  try {
    // Clean up test orders
    const testOrders = await pb.collection('orders').getFullList({
      filter: 'orderNumber ~ "CART-TEST-"'
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

    // Clean up test cart items
    const testCartItems = await pb.collection('cartes').getFullList({
      filter: 'productName ~ "Test Product"'
    });

    for (const item of testCartItems) {
      await pb.collection('cartes').delete(item.id);
    }

    console.log('🎉 Cleanup completed!');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Auto-run the test
console.log('🚀 Starting cart-to-order variant conversion test...');
testCartToOrderVariants().then(result => {
  if (result && result.conversionSuccess) {
    console.log('\n🎉 Cart-to-Order variant conversion test PASSED!');
    console.log('✅ Variants are properly preserved during checkout');
  } else if (result) {
    console.log('\n⚠️ Cart-to-Order variant conversion test had issues');
    console.log(`Expected ${result.expectedVariants} variants, got ${result.orderItemsWithVariants}`);
  } else {
    console.log('\n💥 Cart-to-Order variant conversion test FAILED');
  }
  
  // Store results globally
  window.cartOrderTestResult = result;
});

// Make functions available globally
window.testCartToOrderVariants = testCartToOrderVariants;
window.cleanupCartOrderTest = cleanupCartOrderTest;

console.log('\n🛠️ Available functions:');
console.log('- testCartToOrderVariants() - Test cart to order variant conversion');
console.log('- cleanupCartOrderTest() - Clean up test data');
console.log('\n📋 Instructions:');
console.log('1. Add items to cart with variants selected');
console.log('2. Go through checkout process');
console.log('3. Check order details to verify variants are displayed');
console.log('4. Or run this test script to simulate the entire flow');