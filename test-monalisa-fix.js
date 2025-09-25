#!/usr/bin/env node

/**
 * Test script to verify the MonaLisa Maker API fix
 * This tests both valid and invalid scenarios
 */

const fs = require('fs');
const path = require('path');

async function testMonaLisaAPI() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing MonaLisa Maker API fix...\n');

  // Test 1: Valid JSON request with proper imageUrl string
  console.log('Test 1: Valid JSON request with string imageUrl');
  try {
    const response1 = await fetch(`${baseUrl}/api/monalisa-maker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=400',
        artworkId: 'test-123'
      })
    });
    
    console.log('✅ Status:', response1.status);
    if (!response1.ok) {
      const errorText = await response1.text();
      console.log('❌ Error:', errorText);
    } else {
      const result = await response1.json();
      console.log('✅ Success:', result.success ? 'Generated successfully' : 'Failed');
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Invalid JSON request with null imageUrl (should fail gracefully)
  console.log('Test 2: Invalid JSON request with null imageUrl');
  try {
    const response2 = await fetch(`${baseUrl}/api/monalisa-maker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: null,
        artworkId: 'test-456'
      })
    });
    
    console.log('✅ Status:', response2.status);
    const errorText = await response2.text();
    console.log('✅ Response:', errorText);
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Invalid JSON request with object imageUrl (should fail gracefully)
  console.log('Test 3: Invalid JSON request with object imageUrl');
  try {
    const response3 = await fetch(`${baseUrl}/api/monalisa-maker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: { url: 'https://example.com/image.jpg' }, // This is the bug scenario
        artworkId: 'test-789'
      })
    });
    
    console.log('✅ Status:', response3.status);
    const errorText = await response3.text();
    console.log('✅ Response:', errorText);
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }

  console.log('\n🎯 Test completed. The API should now properly validate imageUrl parameters.');
}

// Run the test
testMonaLisaAPI().catch(console.error);
