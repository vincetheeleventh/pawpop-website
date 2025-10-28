// Test script to send a Pop5Pack proof email
import { sendPop5PackProofEmail } from '../src/lib/email';

async function testEmail() {
  console.log('🧪 Testing Pop5Pack proof email...');
  
  const testData = {
    customerEmail: 'vincentxi717@gmail.com',
    parodyStyle: 'wizarding',
    proofImageUrl: 'https://fal.media/files/lion/example-proof-image.jpg', // Placeholder image
    artworkId: 'test_artwork_123',
  };

  console.log('📧 Sending test email with data:', testData);

  try {
    const result = await sendPop5PackProofEmail(testData);
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log('📬 Message ID:', result.messageId);
    } else {
      console.error('❌ Failed to send email:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testEmail();
