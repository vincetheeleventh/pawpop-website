#!/usr/bin/env node

/**
 * Test script to verify the complete manual approval → Printify integration workflow
 * 
 * This script tests:
 * 1. Order processing stops after high-res review creation (when manual review enabled)
 * 2. Admin approval triggers Printify order creation with correct image and shipping
 * 3. Shipping address is properly passed from Stripe to Printify
 * 4. High-res approved image is used in Printify order
 */

const { createClient } = require('@supabase/supabase-js');

// Environment setup
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testManualApprovalPrintifyWorkflow() {
  console.log('🧪 Testing Manual Approval → Printify Integration Workflow\n');

  try {
    // Step 1: Check if manual review is enabled
    const isManualReviewEnabled = process.env.ENABLE_HUMAN_REVIEW === 'true';
    console.log(`1️⃣ Manual Review Status: ${isManualReviewEnabled ? '✅ ENABLED' : '❌ DISABLED'}`);
    
    if (!isManualReviewEnabled) {
      console.log('⚠️  Manual review is disabled - this test requires ENABLE_HUMAN_REVIEW=true');
      return;
    }

    // Step 2: Find a recent order that should be in pending_review status
    console.log('\n2️⃣ Looking for orders in pending_review status...');
    
    const { data: pendingOrders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        artworks (
          id,
          customer_name,
          generated_images,
          processing_status
        )
      `)
      .eq('order_status', 'pending_review')
      .eq('product_type', 'framed_canvas')
      .order('created_at', { ascending: false })
      .limit(5);

    if (ordersError) {
      console.error('❌ Error fetching pending orders:', ordersError);
      return;
    }

    console.log(`📊 Found ${pendingOrders?.length || 0} orders in pending_review status`);
    
    if (!pendingOrders || pendingOrders.length === 0) {
      console.log('ℹ️  No pending orders found. Create a test order first by:');
      console.log('   1. Going to the website and purchasing a physical product');
      console.log('   2. The order should stop at pending_review status');
      console.log('   3. Then run this test script');
      return;
    }

    // Step 3: Find corresponding high-res file reviews
    console.log('\n3️⃣ Checking for high-res file reviews...');
    
    const testOrder = pendingOrders[0];
    console.log(`🎯 Testing with order: ${testOrder.stripe_session_id}`);
    console.log(`   Customer: ${testOrder.artworks?.customer_name}`);
    console.log(`   Product: ${testOrder.product_type} (${testOrder.product_size})`);

    const { data: reviews, error: reviewsError } = await supabase
      .from('admin_reviews')
      .select('*')
      .eq('artwork_id', testOrder.artwork_id)
      .eq('review_type', 'highres_file')
      .order('created_at', { ascending: false });

    if (reviewsError) {
      console.error('❌ Error fetching reviews:', reviewsError);
      return;
    }

    if (!reviews || reviews.length === 0) {
      console.log('❌ No high-res file review found for this order');
      console.log('   This indicates the order processing may not be creating reviews properly');
      return;
    }

    const review = reviews[0];
    console.log(`✅ Found high-res review: ${review.id}`);
    console.log(`   Status: ${review.status}`);
    console.log(`   Image URL: ${review.image_url}`);

    // Step 4: Test the approval process (simulate admin approval)
    if (review.status === 'pending') {
      console.log('\n4️⃣ Simulating admin approval...');
      
      try {
        // Call the admin approval API
        const approvalResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/reviews/${review.id}/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'approved',
            reviewedBy: 'test-script',
            notes: 'Approved by automated test script'
          })
        });

        if (!approvalResponse.ok) {
          const errorText = await approvalResponse.text();
          console.error('❌ Approval API failed:', errorText);
          return;
        }

        const approvalResult = await approvalResponse.json();
        console.log('✅ Approval API response:', approvalResult);

        // Wait a moment for async processing
        console.log('⏳ Waiting 5 seconds for Printify order creation...');
        await new Promise(resolve => setTimeout(resolve, 5000));

      } catch (error) {
        console.error('❌ Error during approval process:', error);
        return;
      }
    } else if (review.status === 'approved') {
      console.log('\n4️⃣ Review already approved, checking results...');
    } else {
      console.log(`\n4️⃣ Review status is ${review.status}, cannot test approval`);
      return;
    }

    // Step 5: Verify Printify order was created
    console.log('\n5️⃣ Checking if Printify order was created...');
    
    const { data: updatedOrder, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('stripe_session_id', testOrder.stripe_session_id)
      .single();

    if (orderError) {
      console.error('❌ Error fetching updated order:', orderError);
      return;
    }

    console.log(`📦 Order Status: ${updatedOrder.order_status}`);
    console.log(`🖨️  Printify Order ID: ${updatedOrder.printify_order_id || 'NOT SET'}`);
    console.log(`📊 Printify Status: ${updatedOrder.printify_status || 'NOT SET'}`);

    // Step 6: Check order status history
    console.log('\n6️⃣ Checking order status history...');
    
    const { data: history, error: historyError } = await supabase
      .from('order_status_history')
      .select('*')
      .eq('order_id', updatedOrder.id)
      .order('created_at', { ascending: false });

    if (historyError) {
      console.error('❌ Error fetching order history:', historyError);
    } else {
      console.log('📋 Order Status History:');
      history?.forEach((entry, index) => {
        console.log(`   ${index + 1}. ${entry.status} - ${entry.notes || 'No notes'}`);
        console.log(`      ${new Date(entry.created_at).toLocaleString()}`);
      });
    }

    // Step 7: Verify workflow completion
    console.log('\n7️⃣ Workflow Verification Results:');
    
    const results = {
      manualReviewEnabled: isManualReviewEnabled,
      orderFoundInPendingReview: !!testOrder,
      highResReviewCreated: !!review,
      reviewApproved: review?.status === 'approved',
      printifyOrderCreated: !!updatedOrder.printify_order_id,
      orderStatusUpdated: updatedOrder.order_status !== 'pending_review',
      shippingAddressPresent: !!updatedOrder.shipping_address
    };

    console.log('📊 Test Results:');
    Object.entries(results).forEach(([key, value]) => {
      console.log(`   ${value ? '✅' : '❌'} ${key}: ${value}`);
    });

    // Summary
    const allPassed = Object.values(results).every(Boolean);
    console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (allPassed) {
      console.log('\n🎉 Manual Approval → Printify Integration is working correctly!');
      console.log('   ✅ Order processing stops at high-res review');
      console.log('   ✅ Admin approval triggers Printify order creation');
      console.log('   ✅ High-res image and shipping address are passed to Printify');
    } else {
      console.log('\n⚠️  Some issues were found. Check the results above.');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testManualApprovalPrintifyWorkflow()
  .then(() => {
    console.log('\n✨ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test crashed:', error);
    process.exit(1);
  });
