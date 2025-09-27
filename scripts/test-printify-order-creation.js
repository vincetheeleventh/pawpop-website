#!/usr/bin/env node

/**
 * Comprehensive test for Printify order creation using high-res test image
 * This will create actual products and orders in Printify dashboard
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const baseUrl = 'http://localhost:3001';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPrintifyOrderCreation() {
  console.log('🧪 TESTING PRINTIFY ORDER CREATION WITH HIGH-RES IMAGE\n');
  console.log('🎯 Using test image: /public/images/e2e testing/test_high_res.png');
  console.log('📍 Target: Create actual Printify product and order\n');

  try {
    // Step 1: Create test artwork with high-res image
    console.log('1️⃣ CREATING TEST ARTWORK WITH HIGH-RES IMAGE');
    console.log('=' .repeat(60));

    const testImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/images/e2e testing/test_high_res.png`;
    console.log(`📸 Test image URL: ${testImageUrl}`);

    const testArtworkData = {
      customer_name: 'Printify Test User',
      customer_email: 'printify-test@pawpopart.com',
      pet_name: 'Test Pet',
      generation_step: 'completed',
      source_images: {
        pet_photo: testImageUrl,
        pet_mom_photo: testImageUrl,
        uploadthing_keys: {}
      },
      generated_images: {
        monalisa_base: testImageUrl,
        artwork_preview: testImageUrl,
        artwork_full_res: testImageUrl,
        generation_steps: []
      },
      delivery_images: {
        digital_download: testImageUrl,
        print_ready: testImageUrl,
        mockups: {}
      },
      processing_status: {
        artwork_generation: 'completed',
        upscaling: 'completed',
        mockup_generation: 'completed'
      },
      generation_metadata: {
        test: true,
        created_for: 'printify_integration_test'
      }
    };

    const { data: testArtwork, error: artworkError } = await supabase
      .from('artworks')
      .insert(testArtworkData)
      .select()
      .single();

    if (artworkError) {
      console.error('❌ Error creating test artwork:', artworkError);
      return false;
    }

    console.log(`✅ Created test artwork: ${testArtwork.id}`);
    console.log(`   Customer: ${testArtwork.customer_name}`);
    console.log(`   High-res image: ${testArtwork.generated_images.artwork_full_res}`);

    // Step 2: Create test order for framed canvas
    console.log('\n2️⃣ CREATING TEST ORDER FOR FRAMED CANVAS');
    console.log('=' .repeat(60));

    const testOrderData = {
      artwork_id: testArtwork.id,
      stripe_session_id: `cs_printify_test_${Date.now()}`,
      stripe_payment_intent_id: `pi_printify_test_${Date.now()}`,
      product_type: 'framed_canvas',
      product_size: '16x24', // Valid size for framed canvas
      price_cents: 8999, // $89.99
      customer_email: testArtwork.customer_email,
      customer_name: testArtwork.customer_name,
      shipping_address: {
        first_name: 'Printify',
        last_name: 'Test',
        email: testArtwork.customer_email,
        country: 'US',
        region: 'CA',
        address1: '123 Printify Test Street',
        city: 'San Francisco',
        zip: '94105'
      },
      order_status: 'paid' // Start as paid to trigger processing
    };

    const { data: testOrder, error: orderError } = await supabase
      .from('orders')
      .insert(testOrderData)
      .select()
      .single();

    if (orderError) {
      console.error('❌ Error creating test order:', orderError);
      return false;
    }

    console.log(`✅ Created test order: ${testOrder.stripe_session_id}`);
    console.log(`   Product: ${testOrder.product_type} (${testOrder.product_size})`);
    console.log(`   Price: $${(testOrder.price_cents / 100).toFixed(2)}`);
    console.log(`   Shipping: ${testOrder.shipping_address.address1}, ${testOrder.shipping_address.city}`);

    // Step 3: Test direct Printify product creation
    console.log('\n3️⃣ TESTING DIRECT PRINTIFY PRODUCT CREATION');
    console.log('=' .repeat(60));

    try {
      console.log('🔧 Calling getOrCreatePrintifyProduct...');
      
      // Import the function dynamically
      const { getOrCreatePrintifyProduct } = await import('../src/lib/printify-products.js');
      const { ProductType } = await import('../src/lib/printify.js');

      const productResult = await getOrCreatePrintifyProduct(
        ProductType.CANVAS_FRAMED,
        testOrder.product_size,
        testImageUrl,
        testOrder.shipping_address.country,
        testOrder.customer_name,
        testArtwork.pet_name
      );

      console.log('✅ Printify product created successfully!');
      console.log(`   Product ID: ${productResult.productId}`);
      console.log(`   Variant ID: ${productResult.variantId}`);

      // Step 4: Test Printify order creation
      console.log('\n4️⃣ TESTING PRINTIFY ORDER CREATION');
      console.log('=' .repeat(60));

      const { createPrintifyOrder } = await import('../src/lib/printify.js');
      
      const shopId = process.env.PRINTIFY_SHOP_ID;
      if (!shopId) {
        throw new Error('PRINTIFY_SHOP_ID not configured');
      }

      const orderData = {
        external_id: testOrder.stripe_session_id,
        label: `PawPop Test Order - ${testOrder.customer_name} (${testArtwork.pet_name})`,
        line_items: [
          {
            product_id: productResult.productId,
            variant_id: productResult.variantId,
            quantity: 1,
            print_areas: {
              front: testImageUrl
            }
          }
        ],
        shipping_method: 1, // Standard shipping
        send_shipping_notification: true,
        address_to: {
          first_name: testOrder.shipping_address.first_name,
          last_name: testOrder.shipping_address.last_name,
          email: testOrder.shipping_address.email,
          country: testOrder.shipping_address.country,
          region: testOrder.shipping_address.region,
          address1: testOrder.shipping_address.address1,
          city: testOrder.shipping_address.city,
          zip: testOrder.shipping_address.zip
        }
      };

      console.log('🚀 Creating Printify order...');
      console.log(`   Shop ID: ${shopId}`);
      console.log(`   Product ID: ${productResult.productId}`);
      console.log(`   Variant ID: ${productResult.variantId}`);

      const printifyOrder = await createPrintifyOrder(shopId, orderData);
      
      console.log('🎉 PRINTIFY ORDER CREATED SUCCESSFULLY!');
      console.log(`   Printify Order ID: ${printifyOrder.id}`);
      console.log(`   Status: ${printifyOrder.status}`);
      console.log(`   External ID: ${printifyOrder.external_id}`);

      // Step 5: Update database with Printify details
      console.log('\n5️⃣ UPDATING DATABASE WITH PRINTIFY DETAILS');
      console.log('=' .repeat(60));

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          printify_order_id: printifyOrder.id,
          printify_status: printifyOrder.status,
          order_status: 'processing'
        })
        .eq('id', testOrder.id);

      if (updateError) {
        console.error('❌ Error updating order with Printify details:', updateError);
      } else {
        console.log('✅ Database updated with Printify order details');
      }

      // Step 6: Add order status history
      const { error: historyError } = await supabase
        .from('order_status_history')
        .insert({
          order_id: testOrder.id,
          status: 'processing',
          notes: `Printify order created successfully: ${printifyOrder.id} (TEST)`
        });

      if (historyError) {
        console.error('❌ Error adding status history:', historyError);
      } else {
        console.log('✅ Order status history updated');
      }

      // Step 7: Verification and summary
      console.log('\n6️⃣ VERIFICATION AND SUMMARY');
      console.log('=' .repeat(60));

      console.log('🎯 TEST RESULTS:');
      console.log(`   ✅ Test artwork created: ${testArtwork.id}`);
      console.log(`   ✅ Test order created: ${testOrder.stripe_session_id}`);
      console.log(`   ✅ Printify product created: ${productResult.productId}`);
      console.log(`   ✅ Printify order created: ${printifyOrder.id}`);
      console.log(`   ✅ Database updated with Printify details`);

      console.log('\n📋 PRINTIFY DASHBOARD CHECK:');
      console.log('   1. Go to your Printify dashboard');
      console.log('   2. Check "Products" section for new product');
      console.log('   3. Check "Orders" section for new order');
      console.log(`   4. Look for order with External ID: ${testOrder.stripe_session_id}`);

      console.log('\n🔗 USEFUL LINKS:');
      console.log('   Printify Dashboard: https://printify.com/app/');
      console.log('   Products: https://printify.com/app/products');
      console.log('   Orders: https://printify.com/app/orders');

      return true;

    } catch (printifyError) {
      console.error('❌ Printify integration error:', printifyError);
      console.error('   Error details:', printifyError.message);
      
      if (printifyError.message.includes('400')) {
        console.log('\n🔧 DEBUGGING PRINTIFY ERROR:');
        console.log('   This might be a configuration issue with:');
        console.log('   - Blueprint ID or Print Provider ID');
        console.log('   - Variant IDs for the product');
        console.log('   - Image format or size requirements');
        console.log('   - Missing required fields in the request');
      }
      
      return false;
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error);
    return false;
  }
}

// Run the test
testPrintifyOrderCreation()
  .then((success) => {
    if (success) {
      console.log('\n🎉 PRINTIFY ORDER CREATION TEST SUCCESSFUL!');
      console.log('   Check your Printify dashboard for the new product and order.');
    } else {
      console.log('\n❌ PRINTIFY ORDER CREATION TEST FAILED');
      console.log('   Check the error messages above for debugging information.');
    }
    console.log(`\n✨ Test completed: ${success ? '✅ SUCCESS' : '❌ FAILURE'}`);
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Test crashed:', error);
    process.exit(1);
  });
