#!/usr/bin/env node

/**
 * Create Test Admin Review with Environment Loading
 * Creates a test admin review for the upscaled artwork to test manual approval
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const artworkId = 'e612dbe8-b9d8-4c08-88d6-88f02fb1c258';
const upscaledImageUrl = 'https://v3b.fal.media/files/b/zebra/-15kCEUzB4Q0O3HowhBnW_ComfyUI_temp_faojk_00006_.png';

async function createTestAdminReview() {
  console.log('🧪 CREATING TEST ADMIN REVIEW');
  console.log('=============================');
  console.log(`Artwork UUID: ${artworkId}`);
  console.log(`Upscaled Image: ${upscaledImageUrl}`);
  
  // Initialize Supabase client with service role key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('\n🔧 Environment Check:');
  console.log(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'SET' : 'NOT SET'}`);
  console.log(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? 'SET' : 'NOT SET'}`);
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('\n❌ Missing Supabase environment variables');
    console.log('Please ensure your .env.local file contains:');
    console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
    console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Step 1: Verify artwork exists
    console.log('\n📋 STEP 1: Verify Artwork Exists');
    console.log('=================================');
    
    const { data: artwork, error: artworkError } = await supabase
      .from('artworks')
      .select('*')
      .eq('id', artworkId)
      .single();
    
    if (artworkError || !artwork) {
      console.log('❌ Artwork not found in database');
      console.log('   Error:', artworkError?.message || 'No data returned');
      console.log('   This UUID may not exist in your database');
      return;
    }
    
    console.log('✅ Artwork found in database');
    console.log(`   Generation Step: ${artwork.generation_step}`);
    console.log(`   Processing Status: ${JSON.stringify(artwork.processing_status || {})}`);
    console.log(`   Access Token: ${artwork.access_token}`);
    console.log(`   Generated Images: ${artwork.generated_images ? 'Available' : 'None'}`);
    
    // Step 2: Check for existing admin reviews
    console.log('\n🔍 STEP 2: Check Existing Admin Reviews');
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
    
    // Step 3: Create new admin review for high-res file
    console.log('\n🎯 STEP 3: Create High-Res Admin Review');
    console.log('=======================================');
    
    const reviewData = {
      artwork_id: artworkId,
      review_type: 'highres_file',
      status: 'pending',
      image_url: upscaledImageUrl,
      customer_name: 'Test Customer',
      customer_email: 'test@pawpopart.com',
      pet_name: 'Fluffy',
      notes: 'Test high-res review created for manual approval pipeline testing',
      created_at: new Date().toISOString(),
      metadata: {
        test_review: true,
        created_by: 'test-script',
        original_artwork_id: artworkId,
        upscaled_image_url: upscaledImageUrl,
        test_timestamp: Date.now()
      }
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
      
      // Check if it's a constraint error
      if (createError.message.includes('duplicate') || createError.message.includes('unique')) {
        console.log('   This may be due to an existing review for this artwork');
      }
      return;
    }
    
    console.log('✅ Admin review created successfully!');
    console.log(`   Review ID: ${newReview.id}`);
    console.log(`   Status: ${newReview.status}`);
    console.log(`   Type: ${newReview.review_type}`);
    console.log(`   Customer: ${newReview.customer_email}`);
    console.log(`   Image URL: ${newReview.image_url}`);
    
    // Step 4: Create test order record (needed for approval process)
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
      },
      created_at: new Date().toISOString(),
      metadata: {
        test_order: true,
        created_by: 'test-script',
        review_id: newReview.id,
        test_timestamp: Date.now()
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
    
    // Step 5: Provide testing instructions
    console.log('\n🎉 STEP 5: Manual Approval Testing Ready!');
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
    
    console.log('\n🎯 MANUAL APPROVAL TEST INSTRUCTIONS:');
    console.log('=====================================');
    console.log(`1. Visit: https://pawpopart.com/admin/reviews/${newReview.id}`);
    console.log('2. Review the high-res upscaled image');
    console.log('3. Click "Approve" button');
    console.log('4. Watch console logs for complete pipeline execution');
    
    console.log('\n🎉 EXPECTED RESULTS AFTER APPROVAL:');
    console.log('===================================');
    console.log('🎯 High-res file approved! Triggering Printify order creation...');
    console.log('📋 Review artworks data: {...}');
    console.log('🔍 Checking for missing order records...');
    if (newOrder) {
      console.log(`✅ Found existing order record: ${newOrder.id}`);
      console.log('🚀 Calling Printify API to create order...');
    } else {
      console.log('✅ Created missing order record: [order-id]');
    }
    console.log('✅ Printify order created successfully: [printify-order-id]');
    
    console.log('\n📧 EMAIL NOTIFICATIONS:');
    console.log('=======================');
    console.log('- Admin notification: High-res file approved');
    console.log('- Customer notification: Order processing update');
    
    console.log('\n📦 ORDER PROCESSING COMPLETION:');
    console.log('===============================');
    console.log('- Order status updated from "pending_review" to "processing"');
    console.log('- Printify order created with approved high-res image');
    console.log('- Complete manual approval pipeline verified');
    
    console.log('\n🚀 READY FOR COMPLETE PIPELINE TEST!');
    console.log('====================================');
    console.log('The manual approval system is now ready for end-to-end testing.');
    console.log('Click "Approve" in the admin dashboard to verify the complete flow!');
    
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
      console.log(`Review ID: ${results.reviewId}`);
      console.log(`Admin Dashboard: https://pawpopart.com/admin/reviews/${results.reviewId}`);
      if (results.existing) {
        console.log('✅ Using existing pending review - ready for approval test!');
      } else {
        console.log('✅ New test review created - ready for approval test!');
      }
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test setup failed:', error);
    process.exit(1);
  });
