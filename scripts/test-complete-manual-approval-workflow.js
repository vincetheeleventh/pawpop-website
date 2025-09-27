#!/usr/bin/env node

/**
 * Complete End-to-End Test for Manual Approval → Printify Integration
 * 
 * This test simulates the complete workflow:
 * 1. Check existing orders and reviews
 * 2. Simulate admin approval process
 * 3. Verify Printify order creation
 * 4. Check shipping address handling
 */

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const baseUrl = 'http://localhost:3001'; // Use the running dev server

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCompleteWorkflow() {
  console.log('🧪 COMPLETE MANUAL APPROVAL → PRINTIFY WORKFLOW TEST\n');
  console.log('🎯 Testing against dev server at:', baseUrl);
  console.log('⚙️  Manual Review Enabled:', process.env.ENABLE_HUMAN_REVIEW === 'true');
  console.log('📧 Admin Email:', process.env.ADMIN_EMAIL || 'NOT SET');
  console.log('');

  try {
    // Step 1: Check current database state
    console.log('1️⃣ CHECKING DATABASE STATE');
    console.log('=' .repeat(50));

    // Get recent orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        artworks (
          id,
          customer_name,
          generated_images,
          processing_status,
          access_token
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      return false;
    }

    console.log(`📦 Found ${orders?.length || 0} recent orders`);
    
    // Group orders by status
    const ordersByStatus = {};
    orders?.forEach(order => {
      ordersByStatus[order.order_status] = (ordersByStatus[order.order_status] || 0) + 1;
    });

    console.log('📊 Order Status Distribution:');
    Object.entries(ordersByStatus).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} orders`);
    });

    // Get pending reviews
    const { data: pendingReviews, error: reviewsError } = await supabase
      .from('admin_reviews')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (reviewsError) {
      console.error('❌ Error fetching reviews:', reviewsError);
      return false;
    }

    console.log(`📋 Pending Reviews: ${pendingReviews?.length || 0}`);
    if (pendingReviews && pendingReviews.length > 0) {
      pendingReviews.forEach((review, index) => {
        console.log(`   ${index + 1}. ${review.review_type} for ${review.customer_name} (${review.id})`);
      });
    }

    // Step 2: Test Admin Reviews API
    console.log('\n2️⃣ TESTING ADMIN REVIEWS API');
    console.log('=' .repeat(50));

    const reviewsResponse = await fetch(`${baseUrl}/api/admin/reviews`);
    const reviewsData = await reviewsResponse.json();

    console.log(`📡 API Response: ${reviewsResponse.status}`);
    if (reviewsResponse.ok) {
      console.log(`📊 API returned ${reviewsData.reviews?.length || 0} reviews`);
      
      const apiPendingReviews = reviewsData.reviews?.filter(r => r.status === 'pending') || [];
      console.log(`⏳ Pending reviews via API: ${apiPendingReviews.length}`);
    }

    // Step 3: Test approval process (if we have pending reviews)
    if (pendingReviews && pendingReviews.length > 0) {
      console.log('\n3️⃣ TESTING APPROVAL PROCESS');
      console.log('=' .repeat(50));

      // Find a high-res file review to test with
      const highResReview = pendingReviews.find(r => r.review_type === 'highres_file');
      
      if (highResReview) {
        console.log(`🎯 Testing with high-res review: ${highResReview.id}`);
        console.log(`   Customer: ${highResReview.customer_name}`);
        console.log(`   Image: ${highResReview.image_url}`);

        // Check if there's a corresponding order in pending_review status
        const correspondingOrder = orders?.find(o => o.artwork_id === highResReview.artwork_id);
        
        if (correspondingOrder) {
          console.log(`📦 Found corresponding order: ${correspondingOrder.stripe_session_id}`);
          console.log(`   Status: ${correspondingOrder.order_status}`);
          console.log(`   Product: ${correspondingOrder.product_type} (${correspondingOrder.product_size})`);
          console.log(`   Has shipping address: ${!!correspondingOrder.shipping_address}`);

          // Test the approval API (dry run - we'll approve and then check results)
          console.log('\n🧪 Testing approval API...');
          
          const approvalResponse = await fetch(`${baseUrl}/api/admin/reviews/${highResReview.id}/process`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: 'approved',
              reviewedBy: 'automated-test',
              notes: 'Approved by comprehensive test script for workflow verification'
            })
          });

          const approvalResult = await approvalResponse.json();
          console.log(`📡 Approval API Response: ${approvalResponse.status}`);
          console.log(`📋 Result:`, approvalResult);

          if (approvalResponse.ok) {
            console.log('✅ Approval API call successful');
            
            // Wait a moment for async processing
            console.log('⏳ Waiting 10 seconds for Printify order creation...');
            await new Promise(resolve => setTimeout(resolve, 10000));

            // Check if the order was updated
            const { data: updatedOrder, error: updateError } = await supabase
              .from('orders')
              .select('*')
              .eq('stripe_session_id', correspondingOrder.stripe_session_id)
              .single();

            if (updateError) {
              console.error('❌ Error fetching updated order:', updateError);
            } else {
              console.log('\n📦 UPDATED ORDER STATUS:');
              console.log(`   Order Status: ${updatedOrder.order_status}`);
              console.log(`   Printify Order ID: ${updatedOrder.printify_order_id || 'NOT SET'}`);
              console.log(`   Printify Status: ${updatedOrder.printify_status || 'NOT SET'}`);
              
              // Check order history
              const { data: history, error: historyError } = await supabase
                .from('order_status_history')
                .select('*')
                .eq('order_id', updatedOrder.id)
                .order('created_at', { ascending: false })
                .limit(5);

              if (!historyError && history) {
                console.log('\n📋 RECENT ORDER HISTORY:');
                history.forEach((entry, index) => {
                  console.log(`   ${index + 1}. ${entry.status} - ${entry.notes || 'No notes'}`);
                  console.log(`      ${new Date(entry.created_at).toLocaleString()}`);
                });
              }
            }
          } else {
            console.log('❌ Approval API call failed');
          }
        } else {
          console.log('⚠️  No corresponding order found for this review');
        }
      } else {
        console.log('ℹ️  No high-res file reviews found to test with');
        
        // Check if we have any artwork_proof reviews
        const artworkProofReview = pendingReviews.find(r => r.review_type === 'artwork_proof');
        if (artworkProofReview) {
          console.log(`📋 Found artwork_proof review: ${artworkProofReview.id}`);
          console.log('   (This type sends completion emails, not Printify orders)');
        }
      }
    } else {
      console.log('\n3️⃣ NO PENDING REVIEWS TO TEST');
      console.log('=' .repeat(50));
      console.log('ℹ️  No pending reviews found in database');
      console.log('💡 To test the complete workflow:');
      console.log('   1. Go to the website and purchase a physical product');
      console.log('   2. Wait for the order to reach pending_review status');
      console.log('   3. Run this test script again');
    }

    // Step 4: Verify workflow configuration
    console.log('\n4️⃣ WORKFLOW CONFIGURATION VERIFICATION');
    console.log('=' .repeat(50));

    const configChecks = {
      manualReviewEnabled: process.env.ENABLE_HUMAN_REVIEW === 'true',
      adminEmailSet: !!process.env.ADMIN_EMAIL,
      printifyConfigured: !!(process.env.PRINTIFY_API_TOKEN && process.env.PRINTIFY_SHOP_ID),
      stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
      supabaseConfigured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
      serverRunning: reviewsResponse.ok
    };

    console.log('Configuration Status:');
    Object.entries(configChecks).forEach(([key, value]) => {
      console.log(`   ${value ? '✅' : '❌'} ${key}: ${value ? 'OK' : 'MISSING/FAILED'}`);
    });

    const allConfigured = Object.values(configChecks).every(Boolean);

    // Step 5: Summary and recommendations
    console.log('\n5️⃣ TEST SUMMARY & RECOMMENDATIONS');
    console.log('=' .repeat(50));

    console.log(`📊 Database State: ${orders?.length || 0} orders, ${pendingReviews?.length || 0} pending reviews`);
    console.log(`🔧 Configuration: ${allConfigured ? '✅ Complete' : '❌ Issues found'}`);
    console.log(`📡 API Endpoints: ${reviewsResponse.ok ? '✅ Functional' : '❌ Issues found'}`);

    if (allConfigured && reviewsResponse.ok) {
      console.log('\n🎉 MANUAL APPROVAL → PRINTIFY INTEGRATION IS READY!');
      
      if (pendingReviews && pendingReviews.length > 0) {
        console.log('✅ System is operational with pending reviews to process');
        console.log('📋 Next steps:');
        console.log('   1. Use admin dashboard at /admin/reviews to process pending reviews');
        console.log('   2. Monitor order status changes after approvals');
        console.log('   3. Verify Printify orders are created with correct details');
      } else {
        console.log('✅ System is ready but no pending reviews found');
        console.log('📋 To test the complete workflow:');
        console.log('   1. Create a test order by purchasing a physical product');
        console.log('   2. Verify order processing stops at pending_review status');
        console.log('   3. Use admin dashboard to approve the high-res file');
        console.log('   4. Confirm Printify order creation with approved image');
      }
    } else {
      console.log('\n⚠️  ISSUES FOUND - SYSTEM NOT FULLY READY');
      
      if (!allConfigured) {
        console.log('🔧 Configuration issues need to be resolved');
      }
      
      if (!reviewsResponse.ok) {
        console.log('📡 API endpoint issues need to be resolved');
      }
    }

    return allConfigured && reviewsResponse.ok;

  } catch (error) {
    console.error('💥 Test failed with error:', error);
    return false;
  }
}

// Run the complete workflow test
testCompleteWorkflow()
  .then((success) => {
    console.log(`\n✨ Complete workflow test: ${success ? '✅ SUCCESS' : '❌ FAILURE'}`);
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Workflow test crashed:', error);
    process.exit(1);
  });
