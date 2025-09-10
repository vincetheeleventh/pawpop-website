// Test script to verify email completion flow
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3002';

async function testEmailFlow() {
  console.log('🧪 Testing PawPop Email Completion Flow');
  console.log('=====================================');
  
  // Test data
  const testData = {
    customerName: 'TESTER',
    customerEmail: 'pawpopart@gmail.com',
    petMomPhotoPath: path.join(__dirname, '../public/images/e2e testing/test-petmom.png'),
    petPhotoPath: path.join(__dirname, '../public/images/e2e testing/test-pet.jpeg')
  };

  console.log('📧 Test Email:', testData.customerEmail);
  console.log('👤 Test Name:', testData.customerName);

  try {
    // Step 1: Create artwork record
    console.log('\n📝 Step 1: Creating artwork record...');
    const createResponse = await fetch(`${BASE_URL}/api/artwork/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: testData.customerName,
        customer_email: testData.customerEmail,
        original_image_url: 'test-pending'
      })
    });

    if (!createResponse.ok) {
      throw new Error(`Create artwork failed: ${createResponse.status}`);
    }

    const { artwork, access_token } = await createResponse.json();
    console.log('✅ Artwork created:', artwork.id);
    console.log('🔑 Access token:', access_token);

    // Step 2: Send initial confirmation email
    console.log('\n📧 Step 2: Sending initial confirmation email...');
    const confirmResponse = await fetch(`${BASE_URL}/api/upload/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: testData.customerName,
        customer_email: testData.customerEmail,
        uploaded_file_url: 'test-uploaded'
      })
    });

    if (!confirmResponse.ok) {
      throw new Error(`Confirmation email failed: ${confirmResponse.status}`);
    }

    console.log('✅ Initial confirmation email sent');

    // Step 3: Simulate image generation completion
    console.log('\n🎨 Step 3: Simulating image generation...');
    
    // Read test images as files for FormData
    const petMomFile = fs.readFileSync(testData.petMomPhotoPath);
    const petFile = fs.readFileSync(testData.petPhotoPath);
    
    const formData = new FormData();
    formData.append('userImage', new Blob([petMomFile], { type: 'image/png' }), 'test-petmom.png');
    formData.append('petImage', new Blob([petFile], { type: 'image/jpeg' }), 'test-pet.jpeg');

    console.log('🚀 Starting fal.ai generation...');
    const generationResponse = await fetch(`${BASE_URL}/api/monalisa-complete`, {
      method: 'POST',
      body: formData
    });

    if (!generationResponse.ok) {
      const errorText = await generationResponse.text();
      console.log('❌ Generation failed:', errorText);
      throw new Error(`Generation failed: ${generationResponse.status}`);
    }

    const generationResult = await generationResponse.json();
    console.log('✅ Generation completed');
    console.log('🖼️ Generated image URL:', generationResult.generatedImageUrl);

    // Step 4: Update artwork with generated image
    console.log('\n📝 Step 4: Updating artwork record...');
    const updateResponse = await fetch(`${BASE_URL}/api/artwork/update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artwork_id: artwork.id,
        generation_step: 'completed',
        generated_images: {
          artwork_preview: generationResult.generatedImageUrl
        },
        processing_status: {
          artwork_generation: 'completed'
        }
      })
    });

    if (!updateResponse.ok) {
      throw new Error(`Update artwork failed: ${updateResponse.status}`);
    }

    console.log('✅ Artwork updated');

    // Step 5: Send completion email
    console.log('\n📧 Step 5: Sending completion email...');
    const completionEmailResponse = await fetch(`${BASE_URL}/api/email/masterpiece-ready`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: testData.customerName,
        customerEmail: testData.customerEmail,
        artworkUrl: `${BASE_URL}/artwork/${access_token}`,
        generatedImageUrl: generationResult.generatedImageUrl
      })
    });

    if (!completionEmailResponse.ok) {
      const errorText = await completionEmailResponse.text();
      console.log('❌ Completion email failed:', errorText);
      throw new Error(`Completion email failed: ${completionEmailResponse.status}`);
    }

    console.log('✅ Completion email sent successfully!');

    // Step 6: Verify artwork page
    console.log('\n🌐 Step 6: Verifying artwork page...');
    const artworkPageResponse = await fetch(`${BASE_URL}/api/artwork/${access_token}`);
    
    if (!artworkPageResponse.ok) {
      throw new Error(`Artwork page failed: ${artworkPageResponse.status}`);
    }

    const artworkData = await artworkPageResponse.json();
    console.log('✅ Artwork page accessible');
    console.log('🎯 Status:', artworkData.artwork.generation_step);

    console.log('\n🎉 SUCCESS! Complete email flow tested');
    console.log('=====================================');
    console.log(`📧 Check ${testData.customerEmail} for emails:`);
    console.log('1. "Your masterpiece is being created! 🎨"');
    console.log('2. "Your masterpiece is ready! 🎉"');
    console.log(`🌐 Artwork page: ${BASE_URL}/artwork/${access_token}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testEmailFlow();
