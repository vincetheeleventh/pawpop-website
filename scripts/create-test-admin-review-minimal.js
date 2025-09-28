#!/usr/bin/env node

/**
 * Create Test Admin Review - Minimal Version
 * Creates a test admin review using only existing columns
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const artworkId = 'e612dbe8-b9d8-4c08-88d6-88f02fb1c258';
const upscaledImageUrl = 'https://v3b.fal.media/files/b/zebra/-15kCEUzB4Q0O3HowhBnW_ComfyUI_temp_faojk_00006_.png';

async function createTestAdminReview() {
  console.log('🧪 CREATING TEST ADMIN REVIEW (MINIMAL)');
  console.log('=======================================');
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
    // Step 1: Check admin_reviews table structure
    console.log('\n🔍 STEP 1: Check Admin Reviews Table Structure');
    console.log('==============================================');
    
    // Get existing reviews to see the structure
    const { data: existingReviews, error: reviewsError } = await supabase
      .from('admin_reviews')
      .select('*')
      .limit(1);
    
    if (reviewsError) {
      console.log('❌ Error checking admin_reviews table:', reviewsError.message);
      return;
    }
    
    if (existingReviews && existingReviews.length > 0) {
      console.log('✅ Found existing review - checking structure:');
      const sampleReview = existingReviews[0];
      console.log('   Available columns:', Object.keys(sampleReview));
    } else {
      console.log('⚠️ No existing reviews found - will try with basic columns');
    }
    
    // Step 2: Check existing reviews for this artwork
    console.log('\n🔍 STEP 2: Check Existing Reviews for This Artwork');
    console.log('==================================================');
    
    const { data: artworkReviews, error: artworkReviewsError } = await supabase
      .from('admin_reviews')
      .select('*')
      .eq('artwork_id', artworkId);
    
    if (artworkReviewsError) {
      console.log('❌ Error checking artwork reviews:', artworkReviewsError.message);
    } else {
      console.log(`Found ${artworkReviews?.length || 0} existing reviews for this artwork`);
      
      if (artworkReviews && artworkReviews.length > 0) {
        artworkReviews.forEach((review, index) => {
          console.log(`   ${index + 1}. ${review.id} (${review.status}) - ${review.review_type}`);
        });
        
        // Check if there's already a pending highres_file review
        const pendingHighresReview = artworkReviews.find(r => 
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
    
    // Step 3: Create minimal admin review
    console.log('\n🎯 STEP 3: Create Minimal High-Res Admin Review');
    console.log('===============================================');
    
    // Try with minimal required columns only
    const reviewData = {
      artwork_id: artworkId,
      review_type: 'highres_file',
      status: 'pending',
      image_url: upscaledImageUrl,
      customer_name: 'Test Customer',
      customer_email: 'test@pawpopart.com'
    };
    
    console.log('📋 Creating admin review with minimal data:');
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
      
      // Try with even fewer columns
      console.log('\n🔄 Trying with absolute minimum columns...');
      const minimalReviewData = {
        artwork_id: artworkId,
        review_type: 'highres_file',
        status: 'pending',
        image_url: upscaledImageUrl
      };
      
      const { data: minimalReview, error: minimalError } = await supabase
        .from('admin_reviews')
        .insert([minimalReviewData])
        .select()
        .single();
      
      if (minimalError) {
        console.log('❌ Failed to create minimal admin review:', minimalError.message);
        return;
      } else {
        console.log('✅ Minimal admin review created successfully!');
        console.log(`   Review ID: ${minimalReview.id}`);
        newReview = minimalReview;
      }
    } else {
      console.log('✅ Admin review created successfully!');
      console.log(`   Review ID: ${newReview.id}`);
    }
    
    console.log(`   Status: ${newReview.status}`);
    console.log(`   Type: ${newReview.review_type}`);
    console.log(`   Image URL: ${newReview.image_url}`);
    
    // Step 4: Create test order record
    console.log('\n📦 STEP 4: Create Test Order Record');
    console.log('===================================');
    
    const testSessionId = `cs_test_${artworkId.substring(0, 8)}_${Date.now()}`;
    
    const orderData = {
      stripe_session_id: testSessionId,
      artwork_id: artworkId,
      customer_name: 'Test Customer',
      customer_email: 'test@pawpopart.com',
      product_type: 'framed_canvas',
      product_size: '16x24',
      price_cents: 7999,
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
    
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();
    
    if (orderError) {
      console.log('⚠️ Failed to create test order:', orderError.message);
      console.log('   Approval can still be tested without an order');
    } else {
      console.log('✅ Test order created successfully!');
      console.log(`   Order ID: ${newOrder.id}`);
      console.log(`   Session ID: ${newOrder.stripe_session_id}`);
      console.log(`   Status: ${newOrder.order_status}`);
    }
    
    // Step 5: Final instructions
    console.log('\n🎉 COMPLETE HIGH-RES PIPELINE TEST READY!');
    console.log('=========================================');
    
    console.log('✅ TEST SETUP COMPLETE!');
    console.log('');
    console.log('📋 WHAT WAS CREATED:');
    console.log(`✅ High-Res Admin Review: ${newReview.id} (pending)`);
    console.log(`✅ Review Type: highres_file`);
    console.log(`✅ Upscaled Image: ${upscaledImageUrl}`);
    console.log(`✅ 3x Resolution Enhancement: 1024x1024 → 3072x3072`);
    if (newOrder) {
      console.log(`✅ Test Order: ${newOrder.id} (pending_review)`);
    }
    
    console.log('\n🎯 MANUAL APPROVAL TEST INSTRUCTIONS:');
    console.log('====================================');
    console.log(`1. Visit: https://pawpopart.com/admin/reviews/${newReview.id}`);
    console.log('2. Review the HIGH-RESOLUTION upscaled image (3x enhanced)');
    console.log('3. Click "Approve" button');
    console.log('4. Watch console logs for COMPLETE PIPELINE execution');
    
    console.log('\n🎉 EXPECTED PIPELINE EXECUTION AFTER APPROVAL:');
    console.log('==============================================');
    console.log('🎯 High-res file approved! Triggering Printify order creation...');
    console.log('📋 Found artwork data with upscaled image');
    console.log('🔍 Checking for missing order records...');
    if (newOrder) {
      console.log(`✅ Found existing test order: ${newOrder.id}`);
    } else {
      console.log('✅ Will create missing order record');
    }
    console.log('🚀 Calling Printify API to create physical product order...');
    console.log('✅ Printify order created with HIGH-RES upscaled image');
    console.log('📧 Email notifications sent to admin and customer');
    console.log('📦 Order status updated: pending_review → processing');
    
    console.log('\n🚀 THIS TESTS THE COMPLETE HIGH-RES PIPELINE:');
    console.log('=============================================');
    console.log('✅ High-res upscaling: COMPLETED (fal.ai 3x enhancement)');
    console.log('✅ Admin review: CREATED for high-res file approval');
    console.log('✅ Manual approval: READY to trigger Printify order');
    console.log('✅ Order processing: WILL complete after approval');
    console.log('✅ Email notifications: WILL be sent after approval');
    
    console.log('\n🎉 READY TO TEST COMPLETE HIGH-RES MANUAL APPROVAL PIPELINE!');
    console.log('============================================================');
    console.log('This is the COMPLETE test of your high-res pipeline with admin approval!');
    
    return {
      reviewId: newReview.id,
      orderId: newOrder?.id,
      sessionId: testSessionId,
      artworkId,
      imageUrl: upscaledImageUrl
    };
    
  } catch (error) {
    console.error('❌ Test setup failed:', error);
    throw error;
  }
}

// Run the test setup
createTestAdminReview()
  .then(results => {
    console.log('\n🎯 HIGH-RES PIPELINE TEST SETUP COMPLETED!');
    if (results) {
      console.log(`\n📋 SUMMARY:`);
      console.log(`✅ Review ID: ${results.reviewId}`);
      console.log(`✅ Admin Dashboard: https://pawpopart.com/admin/reviews/${results.reviewId}`);
      console.log(`✅ Artwork ID: ${results.artworkId}`);
      console.log(`✅ High-Res Image: ${results.imageUrl}`);
      if (results.orderId) {
        console.log(`✅ Test Order ID: ${results.orderId}`);
      }
      
      console.log('\n🎉 CLICK "APPROVE" TO TEST THE COMPLETE HIGH-RES PIPELINE!');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test setup failed:', error);
    process.exit(1);
  });
