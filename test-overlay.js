// Quick test for overlay API
const testOverlay = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/overlay', {
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
      console.log('Error:', error);
    } else {
      console.log('Success! Blob size:', (await response.blob()).size);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
};

testOverlay();
