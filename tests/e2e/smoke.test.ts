import { describe, it, expect, beforeAll } from 'vitest';
import { loadTestImage, TEST_IMAGES } from '../fixtures/test-images';

// E2E smoke tests for deployed endpoints
describe('E2E Smoke Tests', () => {
  const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

  beforeAll(() => {
    if (!process.env.FAL_KEY && !process.env.HF_TOKEN) {
      console.warn('Warning: No API credentials found. E2E tests may fail.');
    }
  });

  it('should complete MonaLisa Maker transformation', async () => {
    const imageBuffer = loadTestImage(TEST_IMAGES.USER_PHOTO);
    const formData = new FormData();
    formData.append('image', new File([new Uint8Array(imageBuffer)], 'test-user.png', { type: 'image/png' }));

    const response = await fetch(`${BASE_URL}/api/monalisa-maker`, {
      method: 'POST',
      body: formData
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/png');
    
    const imageData = await response.arrayBuffer();
    expect(imageData.byteLength).toBeGreaterThan(1000); // Reasonable image size
  }, 60000); // 60s timeout for actual API calls

  it('should complete pet integration', async () => {
    const portraitBuffer = loadTestImage(TEST_IMAGES.MONALISA_OUTPUT);
    const petBuffer = loadTestImage(TEST_IMAGES.PET_CORGI);
    
    const formData = new FormData();
    formData.append('portrait', new File([new Uint8Array(portraitBuffer)], 'portrait.png', { type: 'image/png' }));
    formData.append('pet', new File([new Uint8Array(petBuffer)], 'pet.png', { type: 'image/png' }));

    const response = await fetch(`${BASE_URL}/api/pet-integration`, {
      method: 'POST',
      body: formData
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/jpeg');
    
    const imageData = await response.arrayBuffer();
    expect(imageData.byteLength).toBeGreaterThan(1000);
  }, 90000); // 90s timeout for pet integration

  it('should complete full pipeline', async () => {
    const userBuffer = loadTestImage(TEST_IMAGES.USER_PHOTO);
    const petBuffer = loadTestImage(TEST_IMAGES.PET_CAT);
    
    const formData = new FormData();
    formData.append('userImage', new File([new Uint8Array(userBuffer)], 'user.png', { type: 'image/png' }));
    formData.append('petImage', new File([new Uint8Array(petBuffer)], 'pet.png', { type: 'image/png' }));

    const response = await fetch(`${BASE_URL}/api/monalisa-complete`, {
      method: 'POST',
      body: formData
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/jpeg');
    expect(response.headers.get('X-MonaLisa-Portrait-URL')).toBeTruthy();
    expect(response.headers.get('X-Request-ID')).toBeTruthy();
    
    const imageData = await response.arrayBuffer();
    expect(imageData.byteLength).toBeGreaterThan(1000);
  }, 120000); // 2min timeout for full pipeline

  it('should handle rate limiting gracefully', async () => {
    const imageBuffer = loadTestImage(TEST_IMAGES.USER_PHOTO);
    const formData = new FormData();
    formData.append('image', new File([new Uint8Array(imageBuffer)], 'test-user.png', { type: 'image/png' }));

    // Fire multiple concurrent requests
    const promises = Array(3).fill(0).map(() => {
      const newFormData = new FormData();
      newFormData.append('image', new File([new Uint8Array(imageBuffer)], 'test-user.png', { type: 'image/png' }));
      return fetch(`${BASE_URL}/api/monalisa-maker`, {
        method: 'POST',
        body: newFormData
      });
    });

    const responses = await Promise.all(promises);
    
    // At least one should succeed, others may be rate limited
    const successCount = responses.filter(r => r.status === 200).length;
    const rateLimitedCount = responses.filter(r => r.status === 429).length;
    
    expect(successCount + rateLimitedCount).toBe(3);
    expect(successCount).toBeGreaterThan(0);
  }, 180000); // 3min timeout for concurrent requests
});
