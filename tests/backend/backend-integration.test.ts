import { test, expect } from '@playwright/test';

// Backend Integration Tests for PawPop
test.describe('Backend API Integration', () => {
  const baseURL = 'http://localhost:3000';
  
  test('should create artwork via API', async ({ request }) => {
    const artworkData = {
      original_image_url: 'https://example.com/pet.jpg',
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      pet_name: 'Buddy'
    };

    const response = await request.post(`${baseURL}/api/artwork/create`, {
      data: artworkData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.artwork).toBeDefined();
    expect(result.access_token).toBeDefined();
    expect(result.artwork.customer_email).toBe(artworkData.customer_email);
    expect(result.artwork.generation_status).toBe('pending');
  });

  test('should update artwork status', async ({ request }) => {
    // First create an artwork
    const artworkData = {
      original_image_url: 'https://example.com/pet.jpg',
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      pet_name: 'Buddy'
    };

    const createResponse = await request.post(`${baseURL}/api/artwork/create`, {
      data: artworkData
    });
    const createResult = await createResponse.json();
    const artworkId = createResult.artwork.id;

    // Update the artwork
    const updateData = {
      artwork_id: artworkId,
      generated_image_url: 'https://example.com/generated.jpg',
      generation_status: 'completed'
    };

    const updateResponse = await request.patch(`${baseURL}/api/artwork/update`, {
      data: updateData
    });

    expect(updateResponse.status()).toBe(200);
    const updateResult = await updateResponse.json();
    expect(updateResult.success).toBe(true);
    expect(updateResult.artwork.generation_status).toBe('completed');
    expect(updateResult.artwork.generated_image_url).toBe(updateData.generated_image_url);
  });

  test('should fetch artworks by status', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/artwork/status?status=pending`);
    
    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(Array.isArray(result.artworks)).toBe(true);
  });

  test('should handle invalid artwork creation', async ({ request }) => {
    const invalidData = {
      customer_name: 'Test Customer'
      // Missing required fields
    };

    const response = await request.post(`${baseURL}/api/artwork/create`, {
      data: invalidData
    });

    expect(response.status()).toBe(400);
    const result = await response.json();
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

test.describe('Database Functions', () => {
  test('should test order with artwork function', async ({ request }) => {
    // Create artwork first
    const artworkData = {
      original_image_url: 'https://example.com/pet.jpg',
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      pet_name: 'Buddy'
    };

    const artworkResponse = await request.post('http://localhost:3000/api/artwork/create', {
      data: artworkData
    });
    const artworkResult = await artworkResponse.json();
    
    // Note: This would require creating an order endpoint to fully test
    // For now, we verify the artwork was created successfully
    expect(artworkResult.success).toBe(true);
    expect(artworkResult.artwork.id).toBeDefined();
  });
});
