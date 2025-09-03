import { test, expect } from '@playwright/test';
import path from 'path';

// Test the complete upload and artwork creation flow
test.describe('Upload Flow Integration', () => {
  const baseURL = 'http://localhost:3000';

  test('should handle upload completion flow', async ({ request }) => {
    // Simulate UploadThing upload completion
    const uploadData = {
      url: 'https://utfs.io/f/test-pet-image.jpg',
      name: 'pet-photo.jpg',
      size: 1024000,
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      petName: 'Buddy'
    };

    const response = await request.post(`${baseURL}/api/upload/complete`, {
      data: uploadData
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.artwork).toBeDefined();
    expect(result.artwork.original_image_url).toBe(uploadData.url);
    expect(result.artwork.customer_email).toBe(uploadData.customerEmail);
    expect(result.artwork.pet_name).toBe(uploadData.petName);
  });

  test('should validate upload completion data', async ({ request }) => {
    const invalidUploadData = {
      url: 'https://utfs.io/f/test-pet-image.jpg',
      // Missing required fields
    };

    const response = await request.post(`${baseURL}/api/upload/complete`, {
      data: invalidUploadData
    });

    expect(response.status()).toBe(400);
    const result = await response.json();
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('should handle large file metadata', async ({ request }) => {
    const largeFileData = {
      url: 'https://utfs.io/f/large-pet-image.jpg',
      name: 'large-pet-photo.jpg',
      size: 7000000, // 7MB
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      petName: 'Large Pet'
    };

    const response = await request.post(`${baseURL}/api/upload/complete`, {
      data: largeFileData
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.artwork.original_image_url).toBe(largeFileData.url);
  });
});
