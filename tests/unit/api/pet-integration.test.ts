import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../../../src/app/api/pet-integration/route';
import { loadTestImage, createTestFormData, TEST_IMAGES } from '../../fixtures/test-images';

// Mock fal.ai client
vi.mock('@fal-ai/client', () => ({
  fal: {
    config: vi.fn(),
    storage: {
      upload: vi.fn()
        .mockResolvedValueOnce('https://mock-portrait-url.com/portrait.png')
        .mockResolvedValueOnce('https://mock-pet-url.com/pet.png')
    },
    subscribe: vi.fn().mockResolvedValue({
      data: {
        images: [{ url: 'https://mock-final-url.com/final.jpg' }]
      },
      requestId: 'mock-request-id'
    })
  }
}));

// Mock fetch for downloading generated images
global.fetch = vi.fn().mockResolvedValue({
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(2048))
});

describe('/api/pet-integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST - File Upload', () => {
    it('should integrate pet into MonaLisa portrait via JSON', async () => {
      // Use JSON request instead of FormData for unit testing
      const request = new NextRequest('http://localhost:3000/api/pet-integration', {
        method: 'POST',
        body: JSON.stringify({ 
          portraitUrl: 'https://example.com/portrait.jpg',
          petUrl: 'https://example.com/pet.jpg'
        }),
        headers: { 'content-type': 'application/json' }
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/jpeg');
      expect(response.headers.get('X-Generated-Image-URL')).toBeTruthy();
      const { fal } = await import('@fal-ai/client');
      expect(fal.subscribe).toHaveBeenCalledWith('fal-ai/flux-pro/kontext/max/multi', expect.any(Object));
    });

    it('should return 400 when missing portrait or pet URLs', async () => {
      const request = new NextRequest('http://localhost:3000/api/pet-integration', {
        method: 'POST',
        body: JSON.stringify({ portraitUrl: 'https://example.com/portrait.jpg' }),
        headers: { 'content-type': 'application/json' }
      });

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Both portraitUrl and petUrl are required');
    });
  });

  describe('POST - JSON Request', () => {
    it('should integrate pet using image URLs', async () => {
      const request = new NextRequest('http://localhost:3000/api/pet-integration', {
        method: 'POST',
        body: JSON.stringify({
          portraitUrl: 'https://example.com/portrait.jpg',
          petUrl: 'https://example.com/pet.jpg'
        }),
        headers: { 'content-type': 'application/json' }
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/jpeg');
    });

    it('should return 400 when missing URLs', async () => {
      const request = new NextRequest('http://localhost:3000/api/pet-integration', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'content-type': 'application/json' }
      });

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Both portraitUrl and petUrl are required');
    });
  });

  describe('Flux Pro Kontext Max Multi Integration', () => {
    it('should call multi-image endpoint with correct parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/pet-integration', {
        method: 'POST',
        body: JSON.stringify({
          portraitUrl: 'https://example.com/portrait.jpg',
          petUrl: 'https://example.com/pet.jpg'
        }),
        headers: { 'content-type': 'application/json' }
      });

      await POST(request);
      
      const { fal } = await import('@fal-ai/client');
      expect(fal.subscribe).toHaveBeenCalledWith('fal-ai/flux-pro/kontext/max/multi', 
        expect.objectContaining({
          input: expect.objectContaining({
            prompt: 'Incorporate the pet into the painting of the woman. She is holding it in her lap. Keep the painted style and likeness of the woman and pet',
            image_urls: [
              'https://example.com/portrait.jpg',
              'https://example.com/pet.jpg'
            ],
            guidance_scale: 3.5,
            num_images: 1,
            output_format: 'jpeg',
            safety_tolerance: '2',
            aspect_ratio: '2:3'
          })
        })
      );
    });
  });
});
