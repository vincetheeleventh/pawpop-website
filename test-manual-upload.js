// Test manual upload functionality
require('dotenv').config({ path: '.env.local' });

async function testManualUpload() {
  console.log('🧪 Testing Manual Upload Functionality');
  console.log('=====================================');
  
  try {
    const BASE_URL = 'http://localhost:3000';
    
    // Step 1: Create a test admin review
    console.log('📝 Step 1: Creating test admin review...');
    
    // First, let's create an artwork with source images
    const artworkResponse = await fetch(`${BASE_URL}/api/artwork/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Test Manual Upload',
        customer_email: 'test@example.com',
        pet_name: 'TestPet'
      })
    });
    
    if (!artworkResponse.ok) {
      throw new Error('Failed to create artwork');
    }
    
    const artworkData = await artworkResponse.json();
    console.log('✅ Artwork created:', artworkData.artwork.id);
    
    // Update artwork with test source images
    const updateResponse = await fetch(`${BASE_URL}/api/artwork/update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artwork_id: artworkData.artwork.id,
        source_images: {
          pet_mom_photo: 'https://example.com/pet-mom.jpg',
          pet_photo: 'https://example.com/pet.jpg'
        },
        generated_image_url: 'https://example.com/generated.jpg',
        generation_step: 'completed'
      })
    });
    
    if (!updateResponse.ok) {
      throw new Error('Failed to update artwork');
    }
    
    console.log('✅ Artwork updated with source images');
    
    // Now create admin review using the library function
    const { createAdminReview } = await import('./src/lib/admin-review.ts');
    
    const reviewId = await createAdminReview({
      artwork_id: artworkData.artwork.id,
      review_type: 'artwork_proof',
      image_url: 'https://example.com/generated.jpg',
      customer_name: 'Test Manual Upload',
      customer_email: 'test@example.com',
      pet_name: 'TestPet'
    });
    
    console.log('✅ Admin review created:', reviewId);
    
    // Step 2: Test the review API with source images
    console.log('📋 Step 2: Testing review API...');
    const reviewResponse = await fetch(`${BASE_URL}/api/admin/reviews/${reviewId}`);
    
    if (!reviewResponse.ok) {
      throw new Error('Failed to fetch review');
    }
    
    const reviewData = await reviewResponse.json();
    console.log('✅ Review data:', {
      id: reviewData.review.id,
      source_images: reviewData.review.source_images,
      manually_replaced: reviewData.review.manually_replaced
    });
    
    // Step 3: Test manual upload API (simulate file upload)
    console.log('📤 Step 3: Testing manual upload API...');
    
    // Create a test image blob
    const testImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA==';
    
    // Convert base64 to blob
    const response = await fetch(testImageData);
    const blob = await response.blob();
    
    // Create FormData
    const formData = new FormData();
    formData.append('image', blob, 'test-image.jpg');
    formData.append('reviewId', reviewId);
    formData.append('notes', 'Test manual upload');
    formData.append('reviewedBy', 'test-admin@example.com');
    
    const uploadResponse = await fetch(`${BASE_URL}/api/admin/reviews/${reviewId}/manual-upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(`Manual upload failed: ${errorData.error}`);
    }
    
    const uploadData = await uploadResponse.json();
    console.log('✅ Manual upload successful:', uploadData);
    
    // Step 4: Verify the review was updated
    console.log('🔍 Step 4: Verifying review update...');
    const updatedReviewResponse = await fetch(`${BASE_URL}/api/admin/reviews/${reviewId}`);
    
    if (updatedReviewResponse.ok) {
      const updatedReviewData = await updatedReviewResponse.json();
      console.log('✅ Updated review status:', updatedReviewData.review.status);
      console.log('✅ Manually replaced:', updatedReviewData.review.manually_replaced);
    }
    
    console.log('\n🎉 Manual upload functionality test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testManualUpload();
