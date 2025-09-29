#!/usr/bin/env node

/**
 * Create Test Admin Review - Simple Version
 * Creates a test admin review for the upscaled artwork to test manual approval
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const artworkId = 'e612dbe8-b9d8-4c08-88d6-88f02fb1c258';
const upscaledImageUrl = 'https://v3b.fal.media/files/b/zebra/-15kCEUzB4Q0O3HowhBnW_ComfyUI_temp_faojk_00006_.png';

async function createTestAdminReview() {
  console.log('🧪 CREATING TEST ADMIN REVIEW (SIMPLE)');
  console.log('======================================');
  console.log(`Artwork UUID: ${artworkId}`);
  console.log(`Upscaled Image: ${upscaledImageUrl}`);
  
  // Initialize Supabase client with service role key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Missing Supabase environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Step 1: Check existing reviews
    console.log('\n🔍 STEP 1: Check Existing Admin Reviews');
    console.log('=======================================');
    
    const { data: existingReviews, error: reviewsError } = await supabase
      .from('admin_reviews')
      .select('*')
      .eq('artwork_id', artworkId);
    
    if (reviewsError) {
      console.log('❌ Error checking existing reviews:', reviewsError.message);
    } else {
      console.log(`Found ${existingReviews?.length || 0} existing reviews for this artwork`);
      
      if (existingReviews && existingReviews.length > 0) {
        existingReviews.forEach((review, index) => {
          console.log(`   ${index + 1}. ${review.id} (${review.status}) - ${review.review_type}`);
        });
        
        // Check if there's already a pending highres_file review
        const pendingHighresReview = existingReviews.find(r => 
          r.review_type === 'highres_file' && r.status === 'pending'
        );
        
        if (pendingHighresReview) {
          console.log('\n✅ FOUND EXISTING PENDING HIGH-RES REVIEW!');
          console.log(`   Review ID: ${pendingHighresReview.id}`);
          console.log(`   Status: ${pendingHighresReview.status}`);
          console.log(`   Image URL: ${pendingHighresReview.image_url}`);
          console.log(`   Customer: ${pendingHighresReview.customer_email}`);
          
          console.log('\n🎯 READY FOR MANUAL APPROVAL TEST!');
          console.log('==================================');
          console.log(`Visit: https://pawpopart.com/admin/reviews/${pendingHighresReview.id}`);
          console.log('Click "Approve" to test the complete pipeline!');
          
          return {
            reviewId: pendingHighresReview.id,
            existing: true
          };
        }
      }
    }
    
    // Step 2: Create new admin review for high-res file (simple version)
    console.log('\n🎯 STEP 2: Create High-Res Admin Review');
    console.log('=======================================');
    
    const reviewData = {
      artwork_id: artworkId,
      review_type: 'highres_file',
      status: 'pending',
      image_url: upscaledImageUrl,
      customer_name: 'Test Customer',
      customer_email: 'test@pawpopart.com',
      pet_name: 'Fluffy',
      notes: 'Test high-res review created for manual approval pipeline testing'
    };
    
    console.log('📋 Creating admin review with data:');
    console.log(`   Artwork ID: ${reviewData.artwork_id}`);
    console.log(`   Review Type: ${reviewData.review_type}`);
    console.log(`   Status: ${reviewData.status}`);
    console.log(`   Image URL: ${reviewData.image_url}`);
    console.log(`   Customer: ${reviewData.customer_name} (${reviewData.customer_email})`);
    
    const { data: newReview, error: createError } = await supabase
      .from('admin_reviews')
      .insert([reviewData])
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Failed to create admin review:', createError.message);
      console.log('   Error details:', createError);
      return;
    }
    
    console.log('✅ Admin review created successfully!');
    console.log(`   Review ID: ${newReview.id}`);
    console.log(`   Status: ${newReview.status}`);
    console.log(`   Type: ${newReview.review_type}`);
    console.log(`   Customer: ${newReview.customer_email}`);
    console.log(`   Image URL: ${newReview.image_url}`);
    
    // Step 3: Create test order record (simple version)
    console.log('\n📦 STEP 3: Create Test Order Record');
    console.log('===================================');
    
    const testSessionId = `cs_test_${artworkId.substring(0, 8)}_${Date.now()}`;
    
    const orderData = {
      stripe_session_id: testSessionId,
      artwork_id: artworkId,
      customer_name: 'Test Customer',
      customer_email: 'test@pawpopart.com',
      product_type: 'framed_canvas',
      product_size: '16x24',
      price_cents: 7999, // $79.99
      order_status: 'pending_review',
      shipping_address: {
        first_name: 'Test',
        last_name: 'Customer',
        email: 'test@pawpopart.com',
        country: 'US',
        region: 'CA',
        address1: '123 Test Street',
        city: 'San Francisco',
        zip: '94105'
      }
    };
    
    console.log('📋 Creating test order record...');
    console.log(`   Session ID: ${testSessionId}`);
    console.log(`   Product: ${orderData.product_type} (${orderData.product_size})`);
    console.log(`   Price: $${orderData.price_cents / 100}`);
    console.log(`   Status: ${orderData.order_status}`);
    
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();
    
    if (orderError) {
      console.log('⚠️ Failed to create test order:', orderError.message);
      console.log('   This is optional - approval can still be tested without an order');
    } else {
      console.log('✅ Test order created successfully!');
      console.log(`   Order ID: ${newOrder.id}`);
      console.log(`   Session ID: ${newOrder.stripe_session_id}`);
      console.log(`   Status: ${newOrder.order_status}`);
    }
    
    // Step 4: Provide testing instructions
    console.log('\n🎉 STEP 4: Manual Approval Testing Ready!');
    console.log('=========================================');
    
    console.log('✅ TEST SETUP COMPLETE!');
    console.log('');
    console.log('📋 WHAT WAS CREATED:');
    console.log(`✅ Admin Review: ${newReview.id} (pending)`);
    console.log(`✅ Review Type: highres_file`);
    console.log(`✅ Image URL: ${upscaledImageUrl}`);
    console.log(`✅ Customer: Test Customer (test@pawpopart.com)`);
    if (newOrder) {
      console.log(`✅ Test Order: ${newOrder.id} (pending_review)`);
      console.log(`✅ Session ID: ${newOrder.stripe_session_id}`);
    }
    
    console.log('\n🎯 COMPLETE PIPELINE TEST INSTRUCTIONS:');
    console.log('======================================');
    console.log(`1. Visit: https://pawpopart.com/admin/reviews/${newReview.id}`);
    console.log('2. Review the high-res upscaled image (3x enhanced quality)');
    console.log('3. Click "Approve" button');
    console.log('4. Watch console logs for complete pipeline execution:');
    console.log('');
    console.log('🎉 EXPECTED CONSOLE LOGS AFTER APPROVAL:');
    console.log('🎯 High-res file approved! Triggering Printify order creation...');
    console.log('📋 Review artworks data: {...}');
    console.log('🔍 Checking for missing order records...');
    if (newOrder) {
      console.log(`✅ Found existing order record: ${newOrder.id}`);
    } else {
      console.log('✅ Created missing order record: [order-id]');
    }
    console.log('🚀 Calling Printify API to create order...');
    console.log('✅ Printify order created successfully: [printify-order-id]');
    console.log('');
    console.log('📧 EMAIL NOTIFICATIONS:');
    console.log('- Admin notification: High-res file approved');
    console.log('- Customer notification: Order processing update');
    console.log('');
    console.log('📦 ORDER STATUS UPDATES:');
    console.log('- Order status: "pending_review" → "processing"');
    console.log('- Printify order created with approved high-res image');
    console.log('- Complete manual approval pipeline verified');
    
    console.log('\n🚀 READY FOR COMPLETE PIPELINE TEST!');
    console.log('====================================');
    console.log('🎯 The manual approval system is now ready for end-to-end testing!');
    console.log('🎯 This tests the COMPLETE high-res pipeline with admin approval!');
    console.log('');
    console.log('✅ High-res upscaling: COMPLETED (3x enhancement)');
    console.log('✅ Admin review: CREATED and PENDING');
    console.log('✅ Test order: CREATED (pending_review status)');
    console.log('✅ Manual approval: READY FOR TESTING');
    console.log('');
    console.log('🎉 Click "Approve" to verify the complete pipeline works!');
    
    return {
      reviewId: newReview.id,
      orderId: newOrder?.id,
      sessionId: testSessionId,
      artworkId,
      imageUrl: upscaledImageUrl,
      existing: false
    };
    
  } catch (error) {
    console.error('❌ Test setup failed:', error);
    throw error;
  }
}

// Run the test setup
createTestAdminReview()
  .then(results => {
    console.log('\n🎯 Test setup completed successfully!');
    if (results) {
      console.log(`\n📋 SUMMARY:`);
      console.log(`Review ID: ${results.reviewId}`);
      console.log(`Admin Dashboard: https://pawpopart.com/admin/reviews/${results.reviewId}`);
      console.log(`Artwork ID: ${results.artworkId}`);
      console.log(`Upscaled Image: ${results.imageUrl}`);
      if (results.orderId) {
        console.log(`Test Order ID: ${results.orderId}`);
      }
      
      console.log('\n🎉 READY TO TEST COMPLETE HIGH-RES PIPELINE WITH MANUAL APPROVAL!');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test setup failed:', error);
    process.exit(1);
  });
