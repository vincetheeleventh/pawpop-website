import { test, expect } from '@playwright/test';

// Direct database function testing
test.describe('Database Functions Testing', () => {
  const baseURL = 'http://localhost:3000';

  test('should test get_order_with_artwork function', async ({ request }) => {
    // Create test artwork
    const artworkData = {
      original_image_url: 'https://example.com/pet.jpg',
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      pet_name: 'Buddy'
    };

    const artworkResponse = await request.post(`${baseURL}/api/artwork/create`, {
      data: artworkData
    });
    const artworkResult = await artworkResponse.json();
    expect(artworkResult.success).toBe(true);

    // Update artwork to completed status
    await request.patch(`${baseURL}/api/artwork/update`, {
      data: {
        artwork_id: artworkResult.artwork.id,
        generated_image_url: 'https://example.com/generated.jpg',
        generation_status: 'completed'
      }
    });

    // Test that artwork can be retrieved
    const statusResponse = await request.get(`${baseURL}/api/artwork/status?status=completed`);
    const statusResult = await statusResponse.json();
    expect(statusResult.success).toBe(true);
    expect(statusResult.artworks.length).toBeGreaterThan(0);
  });

  test('should handle artwork token access', async ({ request }) => {
    // Create artwork
    const artworkData = {
      original_image_url: 'https://example.com/pet.jpg',
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      pet_name: 'Buddy'
    };

    const response = await request.post(`${baseURL}/api/artwork/create`, {
      data: artworkData
    });
    const result = await response.json();
    
    expect(result.success).toBe(true);
    expect(result.access_token).toBeDefined();
    expect(result.access_token.length).toBeGreaterThan(20); // Secure token should be long
  });

  test('should validate email formats', async ({ request }) => {
    const invalidEmailData = {
      original_image_url: 'https://example.com/pet.jpg',
      customer_name: 'Test Customer',
      customer_email: 'invalid-email',
      pet_name: 'Buddy'
    };

    const response = await request.post(`${baseURL}/api/artwork/create`, {
      data: invalidEmailData
    });

    expect(response.status()).toBe(400);
    const result = await response.json();
    expect(result.success).toBe(false);
  });

  test('should handle concurrent artwork creation', async ({ request }) => {
    const artworkData = {
      original_image_url: 'https://example.com/pet.jpg',
      customer_name: 'Test Customer',
      customer_email: 'concurrent@example.com',
      pet_name: 'Buddy'
    };

    // Create multiple artworks concurrently
    const promises = Array(3).fill(0).map(() => 
      request.post(`${baseURL}/api/artwork/create`, { data: artworkData })
    );

    const responses = await Promise.all(promises);
    
    // All should succeed
    for (const response of responses) {
      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.artwork.id).toBeDefined();
    }
  });
});
