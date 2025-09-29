#!/usr/bin/env node

/**
 * Find Recent Artwork
 * Attempts to find the most recent artwork ID for testing
 */

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pawpopart.com';

async function findRecentArtwork() {
  console.log('🔍 FINDING RECENT ARTWORK FOR TESTING');
  console.log('=====================================');
  
  // Try multiple approaches to find recent artwork
  
  // Approach 1: Check admin reviews (may contain artwork IDs)
  console.log('\n📋 APPROACH 1: Check Admin Reviews');
  console.log('==================================');
  try {
    const reviewsResponse = await fetch(`${baseUrl}/api/admin/reviews`);
    console.log(`Admin reviews API status: ${reviewsResponse.status}`);
    
    if (reviewsResponse.ok) {
      const reviews = await reviewsResponse.json();
      if (reviews && reviews.length > 0) {
        console.log(`Found ${reviews.length} admin reviews`);
        
        // Get the most recent review
        const recentReview = reviews[0];
        console.log(`Most recent review ID: ${recentReview.id}`);
        console.log(`Artwork ID: ${recentReview.artwork_id}`);
        console.log(`Customer: ${recentReview.customer_email}`);
        console.log(`Status: ${recentReview.status}`);
        
        return {
          artworkId: recentReview.artwork_id,
          reviewId: recentReview.id,
          source: 'admin_reviews'
        };
      } else {
        console.log('No admin reviews found');
      }
    } else {
      console.log('Admin reviews API not accessible');
    }
  } catch (error) {
    console.log(`Admin reviews check failed: ${error.message}`);
  }
  
  // Approach 2: Try known test artwork IDs
  console.log('\n🧪 APPROACH 2: Test Known Artwork IDs');
  console.log('====================================');
  
  const knownArtworkIds = [
    '7480a324-ba9d-4d64-bb24-7200bfdf184d', // From previous testing
    'test-artwork-id',
    'demo-artwork-id'
  ];
  
  for (const artworkId of knownArtworkIds) {
    try {
      console.log(`Testing artwork ID: ${artworkId}`);
      
      // Try to upscale this artwork to see if it exists
      const upscaleResponse = await fetch(`${baseUrl}/api/upscale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artworkId })
      });
      
      console.log(`  Upscale API status: ${upscaleResponse.status}`);
      
      if (upscaleResponse.status === 404) {
        const errorData = await upscaleResponse.json();
        if (errorData.error === 'Artwork not found') {
          console.log(`  ❌ Artwork ${artworkId} not found`);
        }
      } else if (upscaleResponse.status === 400) {
        const errorData = await upscaleResponse.json();
        if (errorData.error === 'No generated image to upscale') {
          console.log(`  ✅ Artwork ${artworkId} exists but no image to upscale`);
          return {
            artworkId,
            reviewId: null,
            source: 'known_ids',
            status: 'exists_no_image'
          };
        }
      } else if (upscaleResponse.ok) {
        const upscaleData = await upscaleResponse.json();
        console.log(`  ✅ Artwork ${artworkId} exists and upscaling worked!`);
        console.log(`  Result: ${upscaleData.message || 'Success'}`);
        return {
          artworkId,
          reviewId: null,
          source: 'known_ids',
          status: 'exists_with_image'
        };
      }
    } catch (error) {
      console.log(`  Error testing ${artworkId}: ${error.message}`);
    }
  }
  
  // Approach 3: Generate a test artwork ID format
  console.log('\n🎲 APPROACH 3: Generate Test Artwork ID');
  console.log('======================================');
  
  // Generate a UUID-like test ID
  const testArtworkId = 'test-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  console.log(`Generated test artwork ID: ${testArtworkId}`);
  
  return {
    artworkId: testArtworkId,
    reviewId: null,
    source: 'generated',
    status: 'test_id'
  };
}

async function testWithArtworkId(artworkId) {
  console.log(`\n🧪 TESTING WITH ARTWORK ID: ${artworkId}`);
  console.log('==========================================');
  
  // Test 1: Upscaling API
  console.log('\n🎨 Testing Upscaling API');
  console.log('========================');
  try {
    const upscaleResponse = await fetch(`${baseUrl}/api/upscale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artworkId })
    });
    
    console.log(`Upscaling API status: ${upscaleResponse.status}`);
    const upscaleData = await upscaleResponse.json();
    console.log(`Response: ${JSON.stringify(upscaleData, null, 2)}`);
    
    if (upscaleResponse.ok) {
      console.log('✅ Upscaling API test PASSED');
      if (upscaleData.upscaled_image_url) {
        console.log(`✅ Upscaled image URL: ${upscaleData.upscaled_image_url}`);
      }
    } else {
      console.log(`⚠️ Upscaling API returned error (expected for test IDs)`);
      console.log(`   Error: ${upscaleData.error}`);
    }
  } catch (error) {
    console.log(`❌ Upscaling API test failed: ${error.message}`);
  }
  
  // Test 2: Check if this artwork has any associated data
  console.log('\n📊 Artwork Data Check');
  console.log('=====================');
  console.log(`Artwork ID: ${artworkId}`);
  console.log(`Format: ${artworkId.includes('-') ? 'UUID-like' : 'Other'}`);
  console.log(`Length: ${artworkId.length} characters`);
  
  return artworkId;
}

async function main() {
  try {
    console.log('Starting artwork search...');
    
    const result = await findRecentArtwork();
    
    if (result) {
      console.log('\n🎯 FOUND ARTWORK FOR TESTING');
      console.log('============================');
      console.log(`Artwork ID: ${result.artworkId}`);
      console.log(`Review ID: ${result.reviewId || 'N/A'}`);
      console.log(`Source: ${result.source}`);
      console.log(`Status: ${result.status || 'unknown'}`);
      
      // Test with this artwork ID
      await testWithArtworkId(result.artworkId);
      
      console.log('\n📋 USAGE INSTRUCTIONS');
      console.log('=====================');
      console.log('Use this artwork ID for testing:');
      console.log(`ARTWORK_ID="${result.artworkId}"`);
      console.log('');
      console.log('Test commands:');
      console.log(`curl -X POST "${baseUrl}/api/upscale" \\`);
      console.log(`  -H "Content-Type: application/json" \\`);
      console.log(`  -d '{"artworkId":"${result.artworkId}"}'`);
      
      if (result.reviewId) {
        console.log('');
        console.log('Admin review URL:');
        console.log(`${baseUrl}/admin/reviews/${result.reviewId}`);
      }
      
    } else {
      console.log('\n❌ NO ARTWORK FOUND');
      console.log('===================');
      console.log('Could not find any recent artwork for testing.');
      console.log('This may be normal if no recent uploads have occurred.');
    }
    
  } catch (error) {
    console.error('❌ Artwork search failed:', error);
    process.exit(1);
  }
}

// Run the search
main();
