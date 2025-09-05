require('dotenv').config();

// Test configuration
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

/**
 * Test the overlay API endpoint
 */
async function testOverlay() {
  try {
    console.log(`Testing overlay API at ${BASE_URL}/api/overlay`);
    
    const response = await fetch(`${BASE_URL}/api/overlay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        monaUrl: '/images/monalisa.png',
        headUrl: 'https://via.placeholder.com/400x400/FF0000/FFFFFF?text=Test+Face',
        fit: 'width',
        scale: 1.0
      })
    });
    
    console.log('Status:', response.status);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${error}`);
    }
    
    const blob = await response.blob();
    console.log('Success! Blob size:', blob.size);
    return true;
    
  } catch (error) {
    console.error('Test failed:', error.message);
    return false;
  }
}

// Run the test
(async () => {
  const success = await testOverlay();
  process.exit(success ? 0 : 1);
})();
