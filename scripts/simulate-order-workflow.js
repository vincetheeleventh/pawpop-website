#!/usr/bin/env node

/**
 * Simulate the complete order workflow to test manual approval integration
 * 
 * This script will:
 * 1. Create a test order with physical product
 * 2. Simulate the order processing workflow
 * 3. Test the manual approval process
 * 4. Verify Printify integration
 */

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const baseUrl = 'http://localhost:3001';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function simulateOrderWorkflow() {
  console.log('🧪 SIMULATING COMPLETE ORDER WORKFLOW FOR MANUAL APPROVAL TESTING\n');

  try {
    // Step 1: Find or create test artwork
    console.log('1️⃣ SETTING UP TEST ARTWORK');
    console.log('=' .repeat(50));

    // Look for existing artwork that can be used for testing
    const { data: existingArtworks, error: artworkError } = await supabase
      .from('artworks')
      .select('*')
      .eq('generation_step', 'completed')
      .not('generated_images', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);

    if (artworkError) {
      console.error('❌ Error fetching artworks:', artworkError);
      return false;
    }

    console.log(`🎨 Found ${existingArtworks?.length || 0} completed artworks`);

    let testArtwork = null;
    if (existingArtworks && existingArtworks.length > 0) {
      testArtwork = existingArtworks[0];
      console.log(`✅ Using existing artwork: ${testArtwork.id}`);
      console.log(`   Customer: ${testArtwork.customer_name}`);
      console.log(`   Generation Step: ${testArtwork.generation_step}`);
    } else {
      console.log('❌ No completed artworks found for testing');
      console.log('💡 Please create an artwork first by:');
      console.log('   1. Going to the website and uploading a photo');
      console.log('   2. Waiting for artwork generation to complete');
      console.log('   3. Running this test script again');
      return false;
    }

    // Step 2: Create a test order for physical product
    console.log('\n2️⃣ CREATING TEST ORDER');
    console.log('=' .repeat(50));

    const testOrderData = {
      artwork_id: testArtwork.id,
      stripe_session_id: `cs_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      stripe_payment_intent_id: `pi_test_${Date.now()}`,
      product_type: 'framed_canvas', // Physical product that requires high-res review
      product_size: '16x24',
      price_cents: 7999, // $79.99
      customer_email: testArtwork.customer_email,
      customer_name: testArtwork.customer_name,
      shipping_address: {
        first_name: testArtwork.customer_name.split(' ')[0] || 'Test',
        last_name: testArtwork.customer_name.split(' ').slice(1).join(' ') || 'User',
        email: testArtwork.customer_email,
        country: 'US',
        region: 'CA',
        address1: '123 Test Street',
        city: 'San Francisco',
        zip: '94105'
      },
      order_status: 'paid'
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
    console.log(`   Customer: ${testOrder.customer_name}`);
    console.log(`   Price: $${(testOrder.price_cents / 100).toFixed(2)}`);

    // Step 3: Simulate order processing workflow
    console.log('\n3️⃣ SIMULATING ORDER PROCESSING WORKFLOW');
    console.log('=' .repeat(50));

    // First, simulate upscaling (this would normally be done by the upscale API)
    console.log('🔄 Simulating image upscaling...');
    
    // Get the artwork's generated image
    const artworkImageUrl = testArtwork.generated_images?.artwork_preview || 
                           testArtwork.generated_images?.artwork_full_res ||
                           'https://example.com/test-image.jpg';

    console.log(`📸 Using image URL: ${artworkImageUrl}`);

    // Simulate upscaling completion
    const { error: upscaleError } = await supabase
      .from('artworks')
      .update({
        processing_status: {
          ...testArtwork.processing_status,
          upscaling: 'completed'
        }
      })
      .eq('id', testArtwork.id);

    if (upscaleError) {
      console.error('❌ Error updating upscale status:', upscaleError);
    } else {
      console.log('✅ Simulated upscaling completion');
    }

    // Step 4: Create high-res file review (this is what should happen in order processing)
    console.log('\n4️⃣ CREATING HIGH-RES FILE REVIEW');
    console.log('=' .repeat(50));

    const reviewData = {
      artwork_id: testArtwork.id,
      review_type: 'highres_file',
      image_url: artworkImageUrl,
      customer_name: testArtwork.customer_name,
      customer_email: testArtwork.customer_email,
      pet_name: testArtwork.pet_name || 'Test Pet'
    };

    const { data: testReview, error: reviewError } = await supabase
      .from('admin_reviews')
      .insert(reviewData)
      .select()
      .single();

    if (reviewError) {
      console.error('❌ Error creating high-res review:', reviewError);
      return false;
    }

    console.log(`✅ Created high-res file review: ${testReview.id}`);
    console.log(`   Status: ${testReview.status}`);
    console.log(`   Image: ${testReview.image_url}`);

    // Step 5: Update order status to pending_review
    console.log('\n5️⃣ UPDATING ORDER STATUS');
    console.log('=' .repeat(50));

    const { error: statusError } = await supabase
      .from('orders')
      .update({ order_status: 'pending_review' })
      .eq('id', testOrder.id);

    if (statusError) {
      console.error('❌ Error updating order status:', statusError);
    } else {
      console.log('✅ Updated order status to pending_review');
    }

    // Add order status history
    const { error: historyError } = await supabase
      .from('order_status_history')
      .insert({
        order_id: testOrder.id,
        status: 'pending_review',
        notes: 'High-res file submitted for admin review - awaiting approval before Printify order creation (TEST SIMULATION)'
      });

    if (historyError) {
      console.error('❌ Error adding status history:', historyError);
    } else {
      console.log('✅ Added order status history');
    }

    // Step 6: Test the approval process
    console.log('\n6️⃣ TESTING APPROVAL PROCESS');
    console.log('=' .repeat(50));

    console.log('🧪 Calling approval API...');
    
    const approvalResponse = await fetch(`${baseUrl}/api/admin/reviews/${testReview.id}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'approved',
        reviewedBy: 'test-simulation',
        notes: 'Approved by workflow simulation test - testing Printify integration'
      })
    });

    const approvalResult = await approvalResponse.json();
    console.log(`📡 Approval API Response: ${approvalResponse.status}`);
    
    if (approvalResponse.ok) {
      console.log('✅ Approval API call successful');
      console.log(`📋 Result:`, approvalResult);
      
      // Wait for async processing
      console.log('⏳ Waiting 15 seconds for Printify order creation...');
      await new Promise(resolve => setTimeout(resolve, 15000));

      // Check the results
      console.log('\n7️⃣ VERIFYING RESULTS');
      console.log('=' .repeat(50));

      // Check updated order
      const { data: finalOrder, error: finalOrderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', testOrder.id)
        .single();

      if (finalOrderError) {
        console.error('❌ Error fetching final order:', finalOrderError);
      } else {
        console.log('📦 FINAL ORDER STATUS:');
        console.log(`   Order Status: ${finalOrder.order_status}`);
        console.log(`   Printify Order ID: ${finalOrder.printify_order_id || 'NOT SET'}`);
        console.log(`   Printify Status: ${finalOrder.printify_status || 'NOT SET'}`);
        console.log(`   Has Shipping Address: ${!!finalOrder.shipping_address}`);
      }

      // Check updated review
      const { data: finalReview, error: finalReviewError } = await supabase
        .from('admin_reviews')
        .select('*')
        .eq('id', testReview.id)
        .single();

      if (finalReviewError) {
        console.error('❌ Error fetching final review:', finalReviewError);
      } else {
        console.log('\n📋 FINAL REVIEW STATUS:');
        console.log(`   Status: ${finalReview.status}`);
        console.log(`   Reviewed By: ${finalReview.reviewed_by || 'NOT SET'}`);
        console.log(`   Reviewed At: ${finalReview.reviewed_at || 'NOT SET'}`);
      }

      // Check order history
      const { data: finalHistory, error: historyFetchError } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', testOrder.id)
        .order('created_at', { ascending: false });

      if (!historyFetchError && finalHistory) {
        console.log('\n📜 ORDER HISTORY:');
        finalHistory.forEach((entry, index) => {
          console.log(`   ${index + 1}. ${entry.status} - ${entry.notes || 'No notes'}`);
          console.log(`      ${new Date(entry.created_at).toLocaleString()}`);
        });
      }

      // Step 8: Evaluate success
      console.log('\n8️⃣ WORKFLOW EVALUATION');
      console.log('=' .repeat(50));

      const workflowChecks = {
        reviewCreated: !!testReview,
        reviewApproved: finalReview?.status === 'approved',
        orderStatusChanged: finalOrder?.order_status !== 'pending_review',
        printifyOrderCreated: !!finalOrder?.printify_order_id,
        shippingAddressPreserved: !!finalOrder?.shipping_address
      };

      console.log('Workflow Results:');
      Object.entries(workflowChecks).forEach(([check, passed]) => {
        console.log(`   ${passed ? '✅' : '❌'} ${check}: ${passed ? 'SUCCESS' : 'FAILED'}`);
      });

      const overallSuccess = Object.values(workflowChecks).every(Boolean);
      
      console.log(`\n🎯 OVERALL WORKFLOW TEST: ${overallSuccess ? '✅ SUCCESS' : '❌ PARTIAL SUCCESS'}`);

      if (overallSuccess) {
        console.log('\n🎉 MANUAL APPROVAL → PRINTIFY INTEGRATION IS WORKING PERFECTLY!');
        console.log('   ✅ High-res review created correctly');
        console.log('   ✅ Admin approval processed successfully');
        console.log('   ✅ Printify order created after approval');
        console.log('   ✅ Shipping address preserved from original order');
        console.log('   ✅ Order status progression tracked correctly');
      } else {
        console.log('\n⚠️  WORKFLOW PARTIALLY WORKING - SOME ISSUES FOUND');
        
        if (!workflowChecks.printifyOrderCreated) {
          console.log('❌ Printify order was not created - check createPrintifyOrderAfterApproval function');
        }
        
        if (!workflowChecks.orderStatusChanged) {
          console.log('❌ Order status was not updated after approval');
        }
      }

      return overallSuccess;

    } else {
      console.log('❌ Approval API call failed');
      console.log(`📋 Error:`, approvalResult);
      return false;
    }

  } catch (error) {
    console.error('💥 Workflow simulation failed:', error);
    return false;
  }
}

// Run the simulation
simulateOrderWorkflow()
  .then((success) => {
    console.log(`\n✨ Workflow simulation completed: ${success ? '✅ SUCCESS' : '❌ FAILURE'}`);
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Simulation crashed:', error);
    process.exit(1);
  });
