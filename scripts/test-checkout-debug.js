// Test script to debug checkout API issues
const testCheckoutAPI = async () => {
  const testData = {
    artworkId: 'test-artwork-123',
    productType: 'art_print',
    size: '16x24',
    customerEmail: 'test@example.com',
    customerName: 'Test User',
    petName: 'Buddy',
    imageUrl: 'https://example.com/test-image.jpg',
    frameUpgrade: false,
    quantity: 1,
    shippingMethodId: 1,
    testMode: true
  };

  try {
    console.log('🧪 Testing checkout API with data:', testData);
    
    const response = await fetch('http://localhost:3000/api/checkout/artwork', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success response:', data);
    } else {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
    }
  } catch (error) {
    console.error('🚨 Network error:', error);
  }
};

// Run the test
testCheckoutAPI();
