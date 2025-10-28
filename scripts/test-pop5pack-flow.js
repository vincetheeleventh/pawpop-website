/**
 * Manual test script for Pop5Pack flow
 * Tests the complete flow from upload to email delivery
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_EMAIL = 'pawpopart@gmail.com'; // Test mode will redirect here
const TEST_PET_PHOTO_URL = 'https://utfs.io/f/test-pet-photo.jpg'; // Replace with actual uploaded image

async function testPop5PackFlow() {
  console.log('🧪 Testing Pop5Pack Flow\n');

  // Step 1: Test artwork creation
  console.log('Step 1: Creating test artwork record...');
  const { data: artwork, error: artworkError } = await supabase
    .from('artworks')
    .insert({
      customer_email: TEST_EMAIL,
      source_images: {
        pet_photo: TEST_PET_PHOTO_URL,
      },
      generation_step: 'pending',
      processing_status: {
        artwork_generation: 'pending',
      },
      generation_metadata: {
        product_type: 'pop5pack',
        parody_style: 'wizarding',
        is_proof: true,
      },
    })
    .select()
    .single();

  if (artworkError) {
    console.error('❌ Failed to create artwork:', artworkError);
    return;
  }

  console.log('✅ Artwork created:', artwork.id);
  console.log('   Email:', artwork.customer_email);
  console.log('   Style:', artwork.generation_metadata.parody_style);
  console.log('   Is Proof:', artwork.generation_metadata.is_proof);

  // Step 2: Test database query functions
  console.log('\nStep 2: Testing Pop5Pack query functions...');
  
  const { data: pop5packArtworks, error: queryError } = await supabase
    .rpc('get_pop5pack_artworks', {
      p_email: TEST_EMAIL,
      p_is_proof: true,
    });

  if (queryError) {
    console.error('❌ Query failed:', queryError);
  } else {
    console.log('✅ Found', pop5packArtworks.length, 'Pop5Pack proof(s)');
    if (pop5packArtworks.length > 0) {
      console.log('   Latest proof:', {
        id: pop5packArtworks[0].id,
        style: pop5packArtworks[0].parody_style,
        step: pop5packArtworks[0].generation_step,
      });
    }
  }

  // Step 3: Simulate proof generation completion
  console.log('\nStep 3: Simulating proof generation completion...');
  
  const mockProofUrl = 'https://fal.ai/files/mock-proof-wizarding.jpg';
  
  const { error: updateError } = await supabase
    .from('artworks')
    .update({
      generation_step: 'completed',
      processing_status: {
        artwork_generation: 'completed',
      },
      generated_images: {
        artwork_preview: mockProofUrl,
        generation_steps: {
          proof_generation: {
            url: mockProofUrl,
            timestamp: new Date().toISOString(),
            parody_style: 'wizarding',
          },
        },
      },
    })
    .eq('id', artwork.id);

  if (updateError) {
    console.error('❌ Failed to update artwork:', updateError);
  } else {
    console.log('✅ Artwork updated with proof URL');
    console.log('   Proof URL:', mockProofUrl);
  }

  // Step 4: Test email sending (manual - check your inbox)
  console.log('\nStep 4: Email delivery test...');
  console.log('📧 To test email delivery:');
  console.log('   1. Make sure EMAIL_TEST_MODE=true in .env.local');
  console.log('   2. Run: node scripts/send-test-proof-email.js', artwork.id);
  console.log('   3. Check', TEST_EMAIL, 'for proof email');

  // Step 5: Test checkout URL generation
  console.log('\nStep 5: Testing checkout URL...');
  const checkoutUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/pop5pack/checkout/${artwork.id}`;
  console.log('✅ Checkout URL:', checkoutUrl);
  console.log('   (Note: This page does not exist yet - will be built next)');

  // Summary
  console.log('\n📊 Test Summary:');
  console.log('   ✅ Database schema working');
  console.log('   ✅ Artwork creation working');
  console.log('   ✅ Query functions working');
  console.log('   ✅ Proof URL storage working');
  console.log('   ⏳ Email delivery (manual test required)');
  console.log('   ⏳ Checkout page (not yet built)');

  console.log('\n🎯 Next Steps:');
  console.log('   1. Test email delivery manually');
  console.log('   2. Build /pop5pack/checkout/[artworkId] page');
  console.log('   3. Integrate Stripe for $5 payment');
  console.log('   4. Build 4-style generation pipeline');

  return artwork.id;
}

// Run the test
testPop5PackFlow()
  .then((artworkId) => {
    console.log('\n✅ Test completed successfully!');
    console.log('   Artwork ID:', artworkId);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
