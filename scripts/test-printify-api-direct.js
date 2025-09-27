#!/usr/bin/env node

/**
 * Direct API test for Printify integration using the manual approval workflow
 */

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const baseUrl = 'http://localhost:3000';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPrintifyViaManualApproval() {
  console.log('🧪 TESTING PRINTIFY INTEGRATION VIA MANUAL APPROVAL WORKFLOW\n');
  console.log('🎯 Using high-res test image to create real Printify order');
  console.log('📍 Strategy: Use manual approval workflow to trigger Printify creation\n');

  try {
    // Step 1: Create test artwork with high-res image
    console.log('1️⃣ CREATING TEST ARTWORK WITH HIGH-RES IMAGE');
    console.log('=' .repeat(60));

    const testImageUrl = `${baseUrl}/images/e2e%20testing/test_high_res.png`;
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

    // Step 2: Create test order
    console.log('\n2️⃣ CREATING TEST ORDER');
    console.log('=' .repeat(60));

    const testOrderData = {
      artwork_id: testArtwork.id,
      stripe_session_id: `cs_printify_test_${Date.now()}`,
      stripe_payment_intent_id: `pi_printify_test_${Date.now()}`,
      product_type: 'framed_canvas',
      product_size: '16x24', // Valid size for framed canvas
      price_cents: 8999,
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
      order_status: 'pending_review' // Start in pending_review to test manual approval
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
    console.log(`   Status: ${testOrder.order_status}`);

    // Step 3: Create high-res file review
    console.log('\n3️⃣ CREATING HIGH-RES FILE REVIEW');
    console.log('=' .repeat(60));

    const reviewData = {
      artwork_id: testArtwork.id,
      review_type: 'highres_file',
      image_url: testImageUrl,
      customer_name: testArtwork.customer_name,
      customer_email: testArtwork.customer_email,
      pet_name: testArtwork.pet_name
    };

    const { data: testReview, error: reviewError } = await supabase
      .from('admin_reviews')
      .insert(reviewData)
      .select()
      .single();

    if (reviewError) {
      console.error('❌ Error creating review:', reviewError);
      return false;
    }

    console.log(`✅ Created high-res review: ${testReview.id}`);
    console.log(`   Image URL: ${testReview.image_url}`);

    // Step 4: Approve the review to trigger Printify order creation
    console.log('\n4️⃣ APPROVING REVIEW TO TRIGGER PRINTIFY ORDER');
    console.log('=' .repeat(60));

    console.log('🚀 Calling admin approval API...');
    
    const approvalResponse = await fetch(`${baseUrl}/api/admin/reviews/${testReview.id}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'approved',
        reviewedBy: 'printify-test-script',
        notes: 'Approved for Printify integration testing - should create actual Printify product and order'
      })
    });

    if (!approvalResponse.ok) {
      const errorText = await approvalResponse.text();
      console.error('❌ Approval API failed:', errorText);
      return false;
    }

    const approvalResult = await approvalResponse.json();
    console.log('✅ Review approved successfully');
    console.log(`   Result: ${JSON.stringify(approvalResult)}`);

    // Step 5: Wait and check results
    console.log('\n5️⃣ WAITING FOR PRINTIFY ORDER CREATION');
    console.log('=' .repeat(60));

    console.log('⏳ Waiting 20 seconds for Printify order creation...');
    await new Promise(resolve => setTimeout(resolve, 20000));

    // Check updated order
    const { data: finalOrder, error: finalOrderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', testOrder.id)
      .single();

    if (finalOrderError) {
      console.error('❌ Error fetching final order:', finalOrderError);
      return false;
    }

    console.log('\n📦 FINAL ORDER STATUS:');
    console.log(`   Order Status: ${finalOrder.order_status}`);
    console.log(`   Printify Order ID: ${finalOrder.printify_order_id || 'NOT SET'}`);
    console.log(`   Printify Status: ${finalOrder.printify_status || 'NOT SET'}`);

    // Check order history
    const { data: history, error: historyError } = await supabase
      .from('order_status_history')
      .select('*')
      .eq('order_id', testOrder.id)
      .order('created_at', { ascending: false });

    if (!historyError && history) {
      console.log('\n📜 ORDER HISTORY:');
      history.forEach((entry, index) => {
        console.log(`   ${index + 1}. ${entry.status} - ${entry.notes || 'No notes'}`);
        console.log(`      ${new Date(entry.created_at).toLocaleString()}`);
      });
    }

    // Step 6: Results analysis
    console.log('\n6️⃣ RESULTS ANALYSIS');
    console.log('=' .repeat(60));

    const success = !!(finalOrder.printify_order_id);
    
    if (success) {
      console.log('🎉 SUCCESS! PRINTIFY ORDER CREATED!');
      console.log(`   ✅ Printify Order ID: ${finalOrder.printify_order_id}`);
      console.log(`   ✅ Order Status: ${finalOrder.order_status}`);
      console.log(`   ✅ Printify Status: ${finalOrder.printify_status}`);
      
      console.log('\n📋 CHECK YOUR PRINTIFY DASHBOARD:');
      console.log('   1. Go to https://printify.com/app/orders');
      console.log(`   2. Look for order ID: ${finalOrder.printify_order_id}`);
      console.log(`   3. External ID should be: ${finalOrder.stripe_session_id}`);
      console.log('   4. Product should be created in Products section');
      
    } else {
      console.log('❌ PRINTIFY ORDER NOT CREATED');
      console.log('   Check the order history above for error details');
      
      if (history && history.length > 0) {
        const lastEntry = history[0];
        if (lastEntry.status === 'failed') {
          console.log(`   Last error: ${lastEntry.notes}`);
        }
      }
    }

    return success;

  } catch (error) {
    console.error('💥 Test failed with error:', error);
    return false;
  }
}

// Run the test
testPrintifyViaManualApproval()
  .then((success) => {
    if (success) {
      console.log('\n🎉 PRINTIFY INTEGRATION TEST SUCCESSFUL!');
      console.log('   A real Printify product and order should now exist in your dashboard.');
    } else {
      console.log('\n❌ PRINTIFY INTEGRATION TEST FAILED');
      console.log('   Check the error messages and order history above.');
    }
    console.log(`\n✨ Test completed: ${success ? '✅ SUCCESS' : '❌ FAILURE'}`);
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Test crashed:', error);
    process.exit(1);
  });
