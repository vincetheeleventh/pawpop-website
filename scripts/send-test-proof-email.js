/**
 * Send test proof email for Pop5Pack
 * Usage: node scripts/send-test-proof-email.js [artworkId]
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function sendTestProofEmail(artworkId) {
  console.log('📧 Sending test proof email...\n');

  // Get artwork details
  const { data: artwork, error } = await supabase
    .from('artworks')
    .select('*')
    .eq('id', artworkId)
    .single();

  if (error || !artwork) {
    console.error('❌ Artwork not found:', artworkId);
    return;
  }

  console.log('Artwork Details:');
  console.log('  ID:', artwork.id);
  console.log('  Email:', artwork.customer_email);
  console.log('  Style:', artwork.generation_metadata?.parody_style);
  console.log('  Proof URL:', artwork.generated_images?.artwork_preview);

  // Call the email API
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  try {
    // Import the email function directly
    const { sendPop5PackProofEmail } = require('../src/lib/email.ts');
    
    const result = await sendPop5PackProofEmail({
      customerEmail: artwork.customer_email,
      parodyStyle: artwork.generation_metadata?.parody_style || 'wizarding',
      proofImageUrl: artwork.generated_images?.artwork_preview || 'https://via.placeholder.com/400x400?text=Test+Proof',
      artworkId: artwork.id,
    });

    if (result.success) {
      console.log('\n✅ Email sent successfully!');
      console.log('   Message ID:', result.messageId);
      console.log('   Recipient:', artwork.customer_email);
      console.log('\n📬 Check your inbox for the proof email!');
    } else {
      console.error('\n❌ Email failed:', result.error);
    }
  } catch (error) {
    console.error('\n❌ Error sending email:', error.message);
    console.log('\nTrying alternative method via API endpoint...');
    
    // Alternative: Call via HTTP
    const fetch = require('node-fetch');
    const response = await fetch(`${baseUrl}/api/pop5pack/send-proof-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artworkId }),
    });

    if (response.ok) {
      console.log('✅ Email sent via API');
    } else {
      console.error('❌ API call failed:', await response.text());
    }
  }
}

// Get artwork ID from command line
const artworkId = process.argv[2];

if (!artworkId) {
  console.error('❌ Usage: node scripts/send-test-proof-email.js [artworkId]');
  process.exit(1);
}

sendTestProofEmail(artworkId)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
